#!/usr/bin/env node
// Renders a scene folder to mp4, frame by frame, in headless Chromium.
//
//   node record.mjs <scene-dir>                     full video -> <scene-dir>/<name>.mp4
//   node record.mjs <scene-dir> --stills 0,6,12     single frames -> <scene-dir>/out/still-*.jpg
//   node record.mjs <scene-dir> --seq 12,6          6 consecutive frames from 12 s, plus a contact sheet
//
// The scene folder needs main.js (bundled with esbuild) whose page sets
// window.__frame(t) -> JPEG data URL, window.__size = [w, h], window.__dur, window.__ready.
// Optional <scene-dir>/audio.json: [{ "file": "assets/audio/waves.ogg", "volume": 0.14, "start": 30,
//   "delay": 0, "length": 7, "loop": false }] mixed under the picture with fades.
// Env: PLAYWRIGHT_CORE=<path to playwright-core>, FFMPEG=<path>, FPS=30, CRF=18.
import { createRequire } from 'node:module';
import { spawn, execFileSync } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const dir = path.resolve(process.argv[2] || '.');
if (!fs.existsSync(path.join(dir, 'main.js'))) { console.error(`no main.js in ${dir}`); process.exit(1); }
const name = path.basename(dir);
const FPS = +(process.env.FPS || 30), CRF = process.env.CRF || '18';
const FFMPEG = process.env.FFMPEG || ['/opt/homebrew/bin/ffmpeg', '/usr/local/bin/ffmpeg', '/usr/bin/ffmpeg'].find(f => fs.existsSync(f)) || 'ffmpeg';
const OUT = path.join(dir, 'out');
fs.mkdirSync(OUT, { recursive: true });

const req = createRequire(path.join(dir, 'x.js'));
const resolveFrom = (id) => { try { return req.resolve(id); } catch { return null; } };
const pwPath = process.env.PLAYWRIGHT_CORE || resolveFrom('playwright-core');
if (!pwPath) { console.error('playwright-core not found: npm i -D playwright-core && npx playwright-core install chromium, or set PLAYWRIGHT_CORE'); process.exit(1); }
const { chromium } = createRequire(import.meta.url)(pwPath);
const esbuild = req(resolveFrom('esbuild') ? 'esbuild' : (() => { console.error('esbuild not found: npm i -D esbuild'); process.exit(1); })());

fs.mkdirSync(path.join(dir, 'build'), { recursive: true });
await esbuild.build({ entryPoints: [path.join(dir, 'main.js')], bundle: true, format: 'esm', outfile: path.join(dir, 'build/main.js'), logLevel: 'warning' });
if (!fs.existsSync(path.join(dir, 'index.html'))) fs.writeFileSync(path.join(dir, 'index.html'), `<!doctype html><meta charset="utf-8"><title>${name}</title><style>html,body{margin:0;background:#000}canvas{display:block}</style><script type="module" src="./build/main.js"></script>`);

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.png': 'image/png', '.glb': 'model/gltf-binary', '.json': 'application/json', '.hdr': 'application/octet-stream' };
const server = http.createServer((q, res) => {
  const p = path.join(dir, decodeURIComponent(q.url.split('?')[0]).replace(/^\/$/, '/index.html'));
  if (!p.startsWith(dir) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
}).listen(0, '127.0.0.1');
await new Promise(r => server.once('listening', r));

const browser = await chromium.launch({ headless: true, args: ['--use-angle=metal', '--ignore-gpu-blocklist', '--enable-webgl'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 1440 } });
page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') console.log('[page]', m.text().slice(0, 400)); });
page.on('pageerror', e => console.log('[pageerror]', e.message));
await page.goto(`http://127.0.0.1:${server.address().port}/`);
await page.waitForFunction(() => window.__ready || window.__error, null, { timeout: 300000 });
const err = await page.evaluate(() => window.__error);
if (err) { console.error(err); await browser.close(); server.close(); process.exit(1); }
const [w, h] = await page.evaluate(() => window.__size || [1440, 1440]);
await page.setViewportSize({ width: w, height: h });

const grab = async (t, q) => Buffer.from((await page.evaluate(([t, q]) => window.__frame(t, q), [t, q])).split(',')[1], 'base64');
const arg = (n) => { const i = process.argv.indexOf(n); return i < 0 ? null : process.argv[i + 1]; };

if (arg('--stills')) {
  for (const s of arg('--stills').split(',')) { const f = path.join(OUT, `still-${s}.jpg`); fs.writeFileSync(f, await grab(+s, .92)); console.log(f); }
} else if (arg('--seq')) {
  const [s, n] = arg('--seq').split(',').map(Number);
  for (let i = 0; i < n; i++) fs.writeFileSync(path.join(OUT, `seq-${i}.jpg`), await grab(s + i / FPS, .92));
  const cols = Math.min(3, n), rows = Math.ceil(n / cols);
  execFileSync(FFMPEG, ['-v', 'error', '-y', '-framerate', '1', '-i', path.join(OUT, 'seq-%d.jpg'), '-vf', `crop=iw/2:ih/2:iw/4:ih/4,scale=480:-1,tile=${cols}x${rows}`, '-frames:v', '1', path.join(OUT, 'seq-sheet.jpg')]);
  console.log(path.join(OUT, 'seq-sheet.jpg'));
} else {
  const dur = await page.evaluate(() => window.__dur), total = Math.round(dur * FPS);
  const silent = path.join(OUT, 'silent.mp4');
  const ff = spawn(FFMPEG, ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', CRF, '-pix_fmt', 'yuv420p', silent], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let f = 0; f < total; f++) {
    const buf = await grab(f / FPS, .95);
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (f % 90 === 0) console.log(`${f}/${total} ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  const final = path.join(dir, `${name}.mp4`);
  const audioCfg = path.join(dir, 'audio.json');
  if (fs.existsSync(audioCfg)) {
    const tracks = JSON.parse(fs.readFileSync(audioCfg, 'utf8'));
    const inputs = [], chains = [];
    tracks.forEach((a, i) => {
      if (a.loop) inputs.push('-stream_loop', '-1');
      if (a.start) inputs.push('-ss', String(a.start));
      inputs.push('-i', path.join(dir, a.file));
      const len = Math.min(a.length ?? dur, dur - (a.delay || 0)), fade = Math.min(2.5, len / 3);
      const d = Math.round((a.delay || 0) * 1000);
      chains.push(`[${i + 1}:a]atrim=0:${len},asetpts=N/SR/TB,volume=${a.volume ?? .14},afade=t=in:d=${Math.min(1.5, len / 4)},afade=t=out:st=${len - fade}:d=${fade}${d ? `,adelay=${d}|${d}` : ''}[a${i}]`);
    });
    const mix = `${tracks.map((_, i) => `[a${i}]`).join('')}amix=inputs=${tracks.length}:duration=longest:normalize=0,apad,atrim=0:${dur},alimiter=limit=0.95[a]`;
    execFileSync(FFMPEG, ['-v', 'error', '-y', '-i', silent, ...inputs, '-filter_complex', chains.join(';') + ';' + mix,
      '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', '-shortest', final], { stdio: 'inherit' });
  } else {
    fs.copyFileSync(silent, final);
  }
  console.log('done', final);
}
await browser.close();
server.close();
