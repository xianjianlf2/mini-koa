const Application = require('./src/application');

const app = new Application();
const port = 3000;

app.use(async (ctx, next) => {
  ctx.state.trace = ['outer: start'];
  const start = Date.now();

  try {
    await next();
    ctx.state.trace.push('outer: end');
    ctx.set('X-Response-Time', `${Date.now() - start}ms`);

    if (ctx.state.view === 'text') {
      ctx.type = 'text/plain; charset=utf-8';
      ctx.body = `step7 ok: ${ctx.state.message}
method: ${ctx.method}
url: ${ctx.url}
path: ${ctx.path}
querystring: ${ctx.querystring || '(empty)'}
host: ${ctx.get('host') || '(none)'}
trace: ${ctx.state.trace.join(' -> ')}`;
    }

    if (ctx.state.view === 'json') {
      ctx.body = {
        step: 'step7',
        method: ctx.method,
        url: ctx.url,
        path: ctx.path,
        querystring: ctx.querystring,
        query: ctx.query,
        host: ctx.get('host'),
        trace: ctx.state.trace
      };
    }
  } catch (error) {
    ctx.state.trace.push('outer: catch');
    ctx.status = error.status || 500;
    ctx.body = `step7 error handled.
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
  ctx.state.trace.push(`route: ${ctx.path}`);

  if (ctx.path === '/') {
    ctx.state.view = 'text';
    ctx.state.message = '现在 ctx 已经能更自然地代理请求和返回信息。';
    return;
  }

  if (ctx.path === '/query') {
    ctx.state.view = 'json';
    return;
  }

  if (ctx.path === '/headers') {
    ctx.set('X-Mini-Koa', 'step7');
    ctx.type = 'text/plain; charset=utf-8';
    ctx.state.view = 'text';
    ctx.state.message = '这里演示了自定义响应头和响应类型。';
    return;
  }

  if (ctx.path === '/slow') {
    await new Promise((resolve) => setTimeout(resolve, 80));
    ctx.state.view = 'text';
    ctx.state.message = '这是异步返回，而且依然能通过 ctx.path 和 ctx.query 取信息。';
    return;
  }

  if (ctx.path === '/error') {
    ctx.throw(500, '你访问了 /error，这里故意抛出了一个错误。');
  }
});

app.listen(port, () => {
  console.log(`step7 server is running at http://127.0.0.1:${port}`);
});
