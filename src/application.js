const http = require('http');
const context = require('./context');
const request = require('./request');
const response = require('./response');

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

    if (body == null) {
      res.statusCode = ctx.status || 404;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end(`default response: ${ctx.method} ${ctx.url} 暂时没有返回内容。`);
      return;
    }

    res.statusCode = ctx.status || 200;

    if (typeof body === 'object') {
      if (!ctx.type) {
        ctx.type = 'application/json; charset=utf-8';
      }
      res.end(JSON.stringify(body, null, 2));
      return;
    }

    if (!ctx.type) {
      ctx.type = 'text/plain; charset=utf-8';
    }
    res.end(String(body));
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
