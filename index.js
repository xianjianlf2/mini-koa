const Application = require('./src/application');

const app = new Application();
const port = 3000;

app.use(async (ctx, next) => {
  ctx.state.trace = ['outer: start'];

  try {
    await next();
    ctx.state.trace.push('outer: end');

    if (ctx.page) {
      ctx.body = `step6 ok: ${ctx.message}
method: ${ctx.method}
url: ${ctx.url}
trace: ${ctx.state.trace.join(' -> ')}
page: ${ctx.page}`;
    }
  } catch (error) {
    ctx.state.trace.push('outer: catch');
    ctx.status = error.status || 500;
    ctx.body = `step6 error handled.
status: ${ctx.status}
message: ${error.message}
trace: ${ctx.state.trace.join(' -> ')}`;
  }
});

app.use(async (ctx, next) => {
  ctx.state.trace.push('async middleware: before wait');
  await new Promise((resolve) => setTimeout(resolve, 30));
  await next();
  ctx.state.trace.push('async middleware: after wait');
});

app.use(async (ctx) => {
  ctx.state.trace.push(`route: ${ctx.url}`);

  if (ctx.url === '/') {
    ctx.page = 'home';
    ctx.message = '这是正常返回。';
    return;
  }

  if (ctx.url === '/slow') {
    await new Promise((resolve) => setTimeout(resolve, 80));
    ctx.page = 'slow';
    ctx.message = '这是异步返回。';
    return;
  }

  if (ctx.url === '/error') {
    ctx.throw(500, '你访问了 /error，这里故意抛出了一个错误。');
  }
});

app.listen(port, () => {
  console.log(`step6 server is running at http://127.0.0.1:${port}`);
});
