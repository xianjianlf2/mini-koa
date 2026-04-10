const http = require('http');

const server = http.createServer((req, res) => {
  console.log(`[step1] ${req.method} ${req.url}`);

  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.end('step1 ok: Node 已经收到了请求，也成功把响应返回出去了。');
});

const port = 3000;

server.listen(port, () => {
  console.log(`step1 server is running at http://127.0.0.1:${port}`);
});
