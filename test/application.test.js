const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const { Readable } = require('stream');

const Application = require('../src/application');

// --- tiny HTTP client against an app listening on an ephemeral port ---
let server;
let port;

function request(method, path, headers) {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port, method, path, headers }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () =>
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: Buffer.concat(chunks)
        })
      );
    });
    req.on('error', reject);
    req.end();
  });
}

// One app wired with branches keyed off the request path.
function buildApp() {
  const app = new Application();

  // outer middleware records onion order into a response header
  app.use(async (ctx, next) => {
    ctx.state.trace = ['outer-in'];
    await next();
    ctx.state.trace.push('outer-out');
    ctx.set('X-Trace', ctx.state.trace.join(','));
  });

  app.use(async (ctx) => {
    ctx.state.trace.push('inner');
    switch (ctx.path) {
      case '/text':
        ctx.body = 'hello';
        return;
      case '/json':
        ctx.body = { ok: true };
        return;
      case '/buffer':
        ctx.body = Buffer.from('buf');
        return;
      case '/stream':
        ctx.body = Readable.from(['a', 'b', 'c']);
        return;
      case '/empty':
        ctx.status = 204;
        return;
      case '/async':
        await new Promise((r) => setTimeout(r, 5));
        ctx.body = 'later';
        return;
      case '/boom':
        throw new Error('kaboom');
      case '/custom-404':
        // explicitly return 404 WITH a body — must stay 404 (regression test)
        ctx.status = 404;
        ctx.body = 'nothing here';
        return;
      default:
        return; // no body, no status -> default 404
    }
  });

  return app;
}

before(async () => {
  server = buildApp().listen(0);
  await new Promise((r) => server.once('listening', r));
  port = server.address().port;
});

after(() => server.close());

test('string body -> 200 text/plain', async () => {
  const res = await request('GET', '/text');
  assert.equal(res.status, 200);
  assert.match(res.headers['content-type'], /text\/plain/);
  assert.equal(res.body.toString(), 'hello');
});

test('object body -> 200 json', async () => {
  const res = await request('GET', '/json');
  assert.equal(res.status, 200);
  assert.match(res.headers['content-type'], /application\/json/);
  assert.deepEqual(JSON.parse(res.body.toString()), { ok: true });
});

test('buffer body', async () => {
  const res = await request('GET', '/buffer');
  assert.equal(res.status, 200);
  assert.equal(res.body.toString(), 'buf');
});

test('stream body', async () => {
  const res = await request('GET', '/stream');
  assert.equal(res.status, 200);
  assert.equal(res.body.toString(), 'abc');
});

test('204 has empty body and no content-type', async () => {
  const res = await request('GET', '/empty');
  assert.equal(res.status, 204);
  assert.equal(res.body.length, 0);
  assert.equal(res.headers['content-type'], undefined);
});

test('async middleware resolves before respond', async () => {
  const res = await request('GET', '/async');
  assert.equal(res.status, 200);
  assert.equal(res.body.toString(), 'later');
});

test('thrown error -> 500', async () => {
  const res = await request('GET', '/boom');
  assert.equal(res.status, 500);
  assert.match(res.body.toString(), /kaboom/);
});

test('no body, no status -> default 404', async () => {
  const res = await request('GET', '/missing');
  assert.equal(res.status, 404);
});

test('regression: explicit 404 with a body stays 404', async () => {
  const res = await request('GET', '/custom-404');
  assert.equal(res.status, 404);
  assert.equal(res.body.toString(), 'nothing here');
});

test('onion model: outer wraps inner', async () => {
  const res = await request('GET', '/text');
  assert.equal(res.headers['x-trace'], 'outer-in,inner,outer-out');
});

test('use() rejects non-functions', () => {
  assert.throws(() => new Application().use('nope'), TypeError);
});
