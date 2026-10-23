const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const allowed = new Set(['index.html', 'styles.css', 'app.js', 'data.js', 'documents.js', 'study-export.js', 'redesign.css', 'assets/fonts/fonts.css', 'assets/fonts/dm-sans-latin.woff2', 'assets/fonts/dm-sans-latin-ext.woff2', 'assets/fonts/sora-latin.woff2', 'assets/fonts/sora-latin-ext.woff2']);
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.woff2': 'font/woff2' };
const port = Number(process.env.HUB_LC_PORT || 4173);
const server = http.createServer((req, res) => {
  let file;
  try { file = decodeURIComponent(new URL(req.url, 'http://localhost').pathname).slice(1) || 'index.html'; }
  catch { res.writeHead(400); return res.end(); }
  if (!allowed.has(file)) { res.writeHead(404); return res.end('Não encontrado'); }
  if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405); return res.end(); }
  res.setHeader('Content-Type', mime[path.extname(file)]);
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  if (req.method === 'HEAD') return res.end();
  fs.createReadStream(path.join(root, file)).pipe(res);
});
server.on('error', err => { console.error('Não foi possível iniciar o Hub LC:', err.message); process.exitCode = 1; });
server.listen(port, '127.0.0.1', () => console.log(`Hub LC disponível em http://127.0.0.1:${port}`));
