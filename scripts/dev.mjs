// Máy chủ phát triển dùng chung hàm HTTP và lõi C++ với bản triển khai.
import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { Readable } from 'node:stream';
import { fileURLToPath } from 'node:url';
import { resolve, sep, extname } from 'node:path';
import { handleStore } from '../api/store.js';

const base = fileURLToPath(new URL('../public', import.meta.url));
const port = Number(process.env.PORT || 4173);
const origin = `http://localhost:${port}`;
const mime = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4', '.ttf': 'font/ttf'
};

const server = createServer(async (request, res) => {
  try {
    const requestOrigin = `http://${request.headers.host || `localhost:${port}`}`;
    const url = new URL(request.url, requestOrigin);
    if (url.pathname === '/api/store') {
      const hasBody = !['GET', 'HEAD'].includes(request.method);
      const webRequest = new Request(url, {
        method: request.method, headers: request.headers,
        ...(hasBody ? { body: Readable.toWeb(request), duplex: 'half' } : {})
      });
      const reply = await handleStore(webRequest);
      res.writeHead(reply.status, Object.fromEntries(reply.headers));
      Readable.fromWeb(reply.body).pipe(res);
      return;
    }

    if (!['GET', 'HEAD'].includes(request.method)) {
      res.writeHead(405, { Allow: 'GET, HEAD' }).end();
      return;
    }
    let path = decodeURIComponent(url.pathname).replace(/\/$/, '') || '/index';
    if (!extname(path)) path += '.html';
    const file = resolve(base, '.' + path);
    if (!file.startsWith(base + sep)) throw new Error('Invalid path');
    const info = await stat(file);
    if (!info.isFile()) throw new Error('Not a file');

    const headers = { 'Content-Type': mime[extname(file)] || 'application/octet-stream' };
    let start = 0;
    let end = info.size - 1;
    const range = extname(file) === '.mp4' && /^bytes=(\d+)-(\d*)$/.exec(request.headers.range || '');
    if (range) {
      start = Number(range[1]);
      end = range[2] ? Math.min(end, Number(range[2])) : end;
      if (start > end) {
        res.writeHead(416, { 'Content-Range': `bytes */${info.size}` }).end();
        return;
      }
      headers['Content-Range'] = `bytes ${start}-${end}/${info.size}`;
    }
    if (extname(file) === '.mp4') headers['Accept-Ranges'] = 'bytes';
    headers['Content-Length'] = end - start + 1;
    res.writeHead(range ? 206 : 200, headers);
    if (request.method === 'HEAD') res.end();
    else createReadStream(file, { start, end }).pipe(res);
  } catch {
    if (!res.headersSent) res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Không tìm thấy trang.');
  }
});

server.listen(port, 'localhost', () => console.log(`Forma đang chạy tại ${origin}`));
