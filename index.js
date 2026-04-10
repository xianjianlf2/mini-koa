const Application = require('./src/application');

const app = new Application();
const port = 3000;

app.use((req, res) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');

  if (req.url === '/') {
    res.statusCode = 200;
    return res.end('step3 ok: 现在应用已经能接收一个函数，这个函数可以决定首页返回什么。');
  }

  if (req.url === '/about') {
    res.statusCode = 200;
    return res.end('step3 ok: 同一个处理函数里，也可以按不同地址给出不同结果。');
  }

  res.statusCode = 404;
  return res.end(`step3 ok: 暂时还没有处理 ${req.url} 这个地址。`);
});

app.listen(port, () => {
  console.log(`step3 server is running at http://127.0.0.1:${port}`);
});
