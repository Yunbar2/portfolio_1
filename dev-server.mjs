import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname } from 'node:path';

const host = '127.0.0.1';
const port = Number(process.argv[2] ?? 5180);
const publicDirectory = new URL('./public/', import.meta.url);
const contentTypes = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.woff2', 'font/woff2'],
  ['.txt', 'text/plain; charset=utf-8'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.png', 'image/png'],
  ['.webp', 'image/webp'],
  ['.svg', 'image/svg+xml'],
  ['.pdf', 'application/pdf'],
]);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('Provide a port between 1 and 65535.');
}

const server = createServer(async (request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD' }).end();
    return;
  }

  try {
    const url = new URL(request.url, 'http://localhost');
    const pathname = decodeURIComponent(url.pathname);
    const filename = pathname === '/' ? 'index.html' : pathname.slice(1);
    const segments = filename.split('/');
    if (segments.some(segment => !segment || segment.startsWith('.') || /[\\:\x00-\x1f]/.test(segment))) {
      response.writeHead(404).end('Not found');
      return;
    }

    const file = new URL(segments.map(encodeURIComponent).join('/'), publicDirectory);
    const contents = await readFile(file);
    response.writeHead(200, {
      'Content-Type': contentTypes.get(extname(filename).toLowerCase()) ?? 'application/octet-stream',
      'Content-Length': contents.length,
      'Cache-Control': 'no-store',
    });
    response.end(request.method === 'HEAD' ? undefined : contents);
  } catch (error) {
    const status = error instanceof URIError || error instanceof TypeError ? 400 : 404;
    response.writeHead(status).end(status === 400 ? 'Invalid request' : 'Not found');
  }
});

server.on('error', error => {
  console.error(error.code === 'EADDRINUSE'
    ? `Port ${port} is already in use. Choose another with npm run dev -- ${port + 1}.`
    : error.message);
  process.exitCode = 1;
});

server.listen(port, host, () => {
  console.log(`Portfolio is running at http://${host}:${port}/`);
});
