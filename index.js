const Application = require('./src/application');

const app = new Application();
const port = 3000;

app.use(async (req, res, next) => {
  req.steps = ['1 start'];
  await next();
  req.steps.push('1 end');

  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.end(`step4 ok: 这是一个最直观的洋葱模型例子。

执行顺序:
${req.steps.join(' -> ')}

逐行展开:
${req.steps.join('\n')}`);
});

app.use(async (req, res, next) => {
  req.steps.push('2 start');
  await next();
  req.steps.push('2 end');
});

app.use(async (req, res, next) => {
  req.steps.push('3 start');
  await next();
  req.steps.push('3 end');
});

app.use(async (req, res, next) => {
  req.steps.push('4 start');
  await next();
  req.steps.push('4 end');
});

app.use(async (req) => {
  req.steps.push('5');
  req.steps.push(`route: ${req.url}`);
});

app.listen(port, () => {
  console.log(`step4 server is running at http://127.0.0.1:${port}`);
});
