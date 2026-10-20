// Local dev server: serves public/ and runs the api/ handlers with a minimal
// Vercel-style req/res shim. Use it when `vercel dev` isn't available.
//   node scripts/dev.mjs [port]
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(fileURLToPath(import.meta.url), '..', '..');
const publicDir = join(root, 'public');
const port = Number(process.argv[2] || process.env.PORT || 3210);

const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
};

async function runApi(name, req, res, url) {
  const file = join(root, 'api', `${name}.js`);
  // Cache-bust so edits to a handler apply without restarting.
  const mod = await import(`${pathToFileURL(file).href}?t=${Date.now()}`);
  req.query = Object.fromEntries(url.searchParams);
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (body) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(body));
  };
  await mod.default(req, res);
}

createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  try {
    const api = url.pathname.match(/^\/api\/([\w-]+)\/?$/);
    if (api) return await runApi(api[1], req, res, url);

    const rel = normalize(decodeURIComponent(url.pathname)).replace(/^([/\\]|\.\.)+/, '');
    const file = join(publicDir, rel || 'index.html');
    if (!file.startsWith(publicDir)) throw Object.assign(new Error('Forbidden'), { code: 'ENOENT' });
    const body = await readFile(extname(file) ? file : join(file, 'index.html'));
    res.writeHead(200, {
      'Content-Type': types[extname(file) || '.html'] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    res.end(body);
  } catch (err) {
    const missing = err.code === 'ENOENT' || err.code === 'ERR_MODULE_NOT_FOUND';
    if (!missing) console.error(err);
    res.statusCode = missing ? 404 : 500;
    res.end(missing ? 'Not found' : 'Server error');
  }
}).listen(port, () => console.log(`Dev server on http://localhost:${port}`));
