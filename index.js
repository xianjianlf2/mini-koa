const Application = require('./src/application');
const Router = require('./src/router');
const { Readable } = require('stream');

const app = new Application();
const router = new Router();
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
      ctx.body = `step9 ok: ${ctx.state.message}
method: ${ctx.method}
url: ${ctx.url}
path: ${ctx.path}
route: ${ctx.state.route}
host: ${ctx.get('host') || '(none)'}
trace: ${ctx.state.trace.join(' -> ')}`;
    }

    if (ctx.state.view === 'json') {
      ctx.body = {
        step: 'step9',
        route: ctx.state.route,
        method: ctx.method,
        path: ctx.path,
        params: ctx.params,
        query: ctx.query,
        trace: ctx.state.trace,
        ...ctx.state.payload
      };
    }

    if (ctx.state.view === 'buffer') {
      ctx.type = 'application/octet-stream';
      ctx.body = Buffer.from(`step9 buffer body\nroute: ${ctx.state.route}\ntrace: ${ctx.state.trace.join(' -> ')}\n`);
    }

    if (ctx.state.view === 'stream') {
      ctx.type = 'text/plain; charset=utf-8';
      ctx.body = Readable.from([
        'step9 stream body\n',
        `route: ${ctx.state.route}\n`,
        `trace: ${ctx.state.trace.join(' -> ')}\n`
      ]);
    }

    if (ctx.state.view === 'empty') {
      ctx.status = 204;
      ctx.body = null;
    }
  } catch (error) {
    ctx.state.trace.push('outer: catch');
    ctx.status = error.status || 500;
    ctx.body = `step9 error handled.
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

router.get('/', async (ctx) => {
  ctx.state.view = 'text';
  ctx.state.message = '现在请求已经能先交给路由，再分发到具体处理函数。';
});

router.get('/articles/:id', async (ctx) => {
  ctx.state.view = 'json';
  ctx.state.payload = {
    id: ctx.params.id
  };
});

router.get('/headers', async (ctx) => {
  ctx.set('X-Mini-Koa', 'step9');
  ctx.state.view = 'text';
  ctx.state.message = '这里演示了路由层里设置响应头。';
});

router.get('/buffer', async (ctx) => {
  ctx.state.view = 'buffer';
});

router.get('/stream', async (ctx) => {
  ctx.state.view = 'stream';
});

router.get('/empty', async (ctx) => {
  ctx.state.view = 'empty';
});

router.get('/slow', async (ctx) => {
  await new Promise((resolve) => setTimeout(resolve, 80));
  ctx.state.view = 'text';
  ctx.state.message = `这是路由层里的异步处理。query: ${JSON.stringify(ctx.query)}`;
});

router.get('/error', async (ctx) => {
  ctx.throw(500, '你访问了 /error，这里故意抛出了一个错误。');
});

router.post('/submit', async (ctx) => {
  ctx.status = 201;
  ctx.state.view = 'json';
  ctx.state.payload = {
    message: '这里演示了按请求方法分发。'
  };
});

app.use(router.routes());

app.listen(port, () => {
  console.log(`step9 server is running at http://127.0.0.1:${port}`);
});
