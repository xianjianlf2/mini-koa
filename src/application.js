const http = require('http');
const { Readable } = require('stream');
const context = require('./context');
const request = require('./request');
const response = require('./response');

const EMPTY_STATUS_CODES = new Set([204, 205, 304]);

class Application {
  constructor() {
    this.middlewares = [];
    // These three prototypes act like templates.
    // Each incoming request will create fresh ctx/request/response objects from them.
    this.context = Object.create(context);
    this.request = Object.create(request);
    this.response = Object.create(response);
  }

  use(fn) {
    if (typeof fn !== 'function') {
      throw new TypeError('middleware must be a function');
    }

    this.middlewares.push(fn);
    return this;
  }

  listen(...args) {
    const server = http.createServer(this.handleRequest.bind(this));
    return server.listen(...args);
  }

  handleRequest(req, res) {
    console.log(`[app] ${req.method} ${req.url}`);

    const ctx = this.createContext(req, res);
    const fn = this.compose(this.middlewares);

    return Promise.resolve(fn(ctx))
      .then(() => this.respond(ctx))
      .catch((error) => {
        this.handleError(error, ctx);
      });
  }

  createContext(req, res) {
    const ctx = Object.create(this.context);
    const request = (ctx.request = Object.create(this.request));
    const response = (ctx.response = Object.create(this.response));

    // Bind the raw Node objects onto our wrapper objects.
    // That is why request.js can read this.req.url and this.req.method.
    ctx.app = request.app = response.app = this;
    ctx.req = request.req = req;
    ctx.res = response.res = res;
    ctx.state = {};
    ctx.params = {};

    // Link the wrappers back to each other so ctx/request/response
    // can proxy properties across the whole chain.
    request.ctx = response.ctx = ctx;
    request.response = response;
    response.request = request;
    response._body = null;
    response._status = null;

    return ctx;
  }

  handleError(error, ctx) {
    console.error(error);

    if (ctx.res.writableEnded) {
      return;
    }

    ctx.status = error.status || 500;
    ctx.res.statusCode = ctx.status;
    ctx.res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    ctx.res.end(`server error: ${error.message}`);
  }

  respond(ctx) {
    const { res } = ctx;
    const body = ctx.body;
    const status = ctx.status || 404;

    if (EMPTY_STATUS_CODES.has(status)) {
      ctx.remove('Content-Type');
      ctx.remove('Content-Length');
      res.statusCode = status;
      res.end();
      return;
    }

    if (body == null) {
      res.statusCode = status;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end(`default response: ${ctx.method} ${ctx.url} 暂时没有返回内容。`);
      return;
    }

    res.statusCode = status === 404 ? 200 : status;

    if (Buffer.isBuffer(body)) {
      if (!ctx.type) {
        ctx.type = 'application/octet-stream';
      }
      res.setHeader('Content-Length', body.length);
      res.end(body);
      return;
    }

    if (body instanceof Readable) {
      if (!ctx.type) {
        ctx.type = 'application/octet-stream';
      }
      body.pipe(res);
      return;
    }

    if (typeof body === 'object') {
      if (!ctx.type) {
        ctx.type = 'application/json; charset=utf-8';
      }
      const json = JSON.stringify(body, null, 2);
      res.setHeader('Content-Length', Buffer.byteLength(json));
      res.end(json);
      return;
    }

    if (!ctx.type) {
      ctx.type = 'text/plain; charset=utf-8';
    }
    const text = String(body);
    res.setHeader('Content-Length', Buffer.byteLength(text));
    res.end(text);
  }

  compose(middlewares) {
    return function run(ctx) {
      let index = -1;

      function dispatch(i) {
        if (i <= index) {
          return Promise.reject(new Error('next() called multiple times'));
        }

        index = i;

        const fn = middlewares[i];
        if (!fn) {
          return Promise.resolve();
        }

        return Promise.resolve(fn(ctx, () => dispatch(i + 1)));
      }

      return dispatch(0);
    };
  }
}

module.exports = Application;
