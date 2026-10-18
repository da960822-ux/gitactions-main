import { createServer, request as httpRequest } from 'node:http';
import { pathToFileURL } from 'node:url';

export async function startLocalGateway() {
  const cors = { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET,POST,PATCH,DELETE,OPTIONS', 'access-control-allow-headers': 'authorization,x-client-info,apikey,content-type,x-supabase-api-version,prefer,accept,accept-profile,content-profile' };
  const routes = pathname => pathname.startsWith('/auth/v1') ? [55433, pathname.slice(8)] : pathname.startsWith('/rest/v1') ? [55434, pathname.slice(8)] : pathname.startsWith('/realtime/v1') ? [55436, `/socket${pathname.slice(12)}`] : [55435, pathname];
  const gateway = createServer((req, res) => {
    if (req.method === 'OPTIONS') { res.writeHead(204, cors); res.end(); return; }
    const [port, path] = routes(req.url);
    const upstream = httpRequest({ hostname: '127.0.0.1', port, path: path || '/', method: req.method, headers: { ...req.headers, host: port === 55436 ? 'realtime-dev.supabase-realtime' : req.headers.host } }, response => {
      res.writeHead(response.statusCode, { ...response.headers, ...cors }); response.pipe(res);
    });
    upstream.on('error', () => { res.writeHead(502); res.end('local service starting'); }); req.pipe(upstream);
  });
  gateway.on('upgrade', (req, socket, head) => {
    const [port, path] = routes(req.url);
    const upstream = httpRequest({ hostname: '127.0.0.1', port, path, headers: { ...req.headers, host: 'realtime-dev.supabase-realtime' } });
    upstream.on('upgrade', (response, target, initial) => {
      socket.write(`HTTP/1.1 101 Switching Protocols\r\n${Object.entries(response.headers).map(([key, value]) => `${key}: ${value}`).join('\r\n')}\r\n\r\n`);
      if (head.length) target.write(head); if (initial.length) socket.write(initial); socket.pipe(target).pipe(socket);
    });
    upstream.on('response', response => { socket.end(`HTTP/1.1 ${response.statusCode} Rejected\r\n\r\n`); });
    upstream.on('error', () => socket.destroy()); upstream.end();
  });
  await new Promise(done => gateway.listen(55431, '0.0.0.0', done));
  return gateway;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await startLocalGateway(); console.log('Local Supabase QA gateway ready on 55431');
}
