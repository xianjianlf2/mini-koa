const http = require('http');

class Application {
  constructor() {
    this.middleware = null;
  }

  use(fn) {
    if (typeof fn !== 'function') {
      throw new TypeError('middleware must be a function');
    }

    this.middleware = fn;
    return this;
  }

  listen(...args) {
    const server = http.createServer(this.handleRequest.bind(this));
    return server.listen(...args);
  }

  handleRequest(req, res) {
    console.log(`[app] ${req.method} ${req.url}`);

    if (this.middleware) {
      return this.middleware(req, res);
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('default response: 你还没有通过 use 注册处理函数。');
  }
}

module.exports = Application;
