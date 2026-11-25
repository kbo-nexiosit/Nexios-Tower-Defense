// Tiny static server for the laptop fallback: `node serve.mjs` → http://localhost:8080
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const root = new URL('.', import.meta.url).pathname;
const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css',
  '.webp': 'image/webp', '.png': 'image/png', '.json': 'application/json', '.svg': 'image/svg+xml' };
const port = Number(process.env.PORT) || 8080;

http.createServer(async (req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  const file = normalize(join(root, url.endsWith('/') ? url + 'index.html' : url));
  if (!file.startsWith(root)) { res.writeHead(403).end(); return; }
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(body);
  } catch { res.writeHead(404).end('Not found'); }
}).listen(port, () => console.log(`Upside Defense on http://localhost:${port}`));
