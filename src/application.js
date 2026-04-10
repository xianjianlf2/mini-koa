const http = require('http');
const context = require('./context');
const request = require('./request');
const response = require('./response');

class Application {
  constructor() {
    this.middlewares = [];
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
      .then(() => {
        if (!res.writableEnded) {
          this.respond(ctx);
        }
      })
      .catch((error) => {
        console.error(error);
        if (!res.writableEnded) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
          res.end('server error');
        }
      });
  }

  createContext(req, res) {
    const ctx = Object.create(this.context);
    const request = (ctx.request = Object.create(this.request));
    const response = (ctx.response = Object.create(this.response));

    ctx.app = request.app = response.app = this;
    ctx.req = request.req = req;
    ctx.res = response.res = res;
    request.ctx = response.ctx = ctx;
    request.response = response;
    response.request = request;

    return ctx;
  }

  respond(ctx) {
    const { res } = ctx;
    const body = ctx.body;

    if (body == null) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end('default response: ctx.body 还没有被赋值。');
      return;
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end(body);
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
