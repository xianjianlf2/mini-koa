const http = require('http');

class Application {
  constructor() {
    this.middlewares = [];
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

    const fn = this.compose(this.middlewares);

    return Promise.resolve(fn(req, res))
      .then(() => {
        if (!res.writableEnded) {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
          res.end('default response: 这一轮中间件没有真正返回内容。');
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

  compose(middlewares) {
    return function run(req, res) {
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

        return Promise.resolve(fn(req, res, () => dispatch(i + 1)));
      }

      return dispatch(0);
    };
  }
}

module.exports = Application;
