const http = require('http');

class Application {
  listen(...args) {
    const server = http.createServer(this.handleRequest.bind(this));
    return server.listen(...args);
  }

  handleRequest(req, res) {
    console.log(`[step2] ${req.method} ${req.url}`);

    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('step2 ok: 现在“启动服务”已经被收进 Application 这个对象里了。');
  }
}

module.exports = Application;
