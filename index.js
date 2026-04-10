const Application = require('./src/application');

const app = new Application();
const port = 3000;

app.use(async (ctx, next) => {
  ctx.trace = ['1 start'];
  await next();
  ctx.trace.push('1 end');
  ctx.body = `step5 ok: 现在中间件拿到的是统一的 ctx 对象。
method: ${ctx.method}
url: ${ctx.url}
trace: ${ctx.trace.join(' -> ')}
page: ${ctx.page}`;
});

app.use(async (ctx, next) => {
  ctx.trace.push('2 start');
  await next();
  ctx.trace.push('2 end');
});

app.use(async (ctx, next) => {
  ctx.trace.push('3 start');
  await next();
  ctx.trace.push('3 end');
});

app.use(async (ctx, next) => {
  ctx.trace.push('4 start');
  await next();
  ctx.trace.push('4 end');
});

app.use(async (ctx) => {
  ctx.trace.push('5');
  ctx.trace.push(`route: ${ctx.url}`);

  if (ctx.url === '/') {
    ctx.page = 'home';
    return;
  }

  if (ctx.url === '/about') {
    ctx.page = 'about';
    return;
  }

  ctx.page = 'not-found-yet';
});

app.listen(port, () => {
  console.log(`step5 server is running at http://127.0.0.1:${port}`);
});
