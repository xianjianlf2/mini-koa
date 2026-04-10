function pathToRegExp(path) {
  const keys = [];
  const pattern = path
    .split('/')
    .map((segment) => {
      if (!segment) {
        return '';
      }

      if (segment.startsWith(':')) {
        keys.push(segment.slice(1));
        return '([^/]+)';
      }

      return segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    })
    .join('/');

  return {
    keys,
    regexp: new RegExp(`^${pattern || '/'}$`)
  };
}

class Router {
  constructor() {
    this.stack = [];
  }

  register(method, path, handler) {
    const { keys, regexp } = pathToRegExp(path);
    this.stack.push({
      method,
      path,
      handler,
      keys,
      regexp
    });
    return this;
  }

  get(path, handler) {
    return this.register('GET', path, handler);
  }

  post(path, handler) {
    return this.register('POST', path, handler);
  }

  routes() {
    return async (ctx, next) => {
      const pathname = ctx.path;
      const pathMatched = [];

      for (const route of this.stack) {
        const matched = pathname.match(route.regexp);
        if (!matched) {
          continue;
        }

        pathMatched.push(route);

        if (route.method !== ctx.method) {
          continue;
        }

        ctx.params = route.keys.reduce((params, key, index) => {
          params[key] = matched[index + 1];
          return params;
        }, {});

        ctx.state.route = `${route.method} ${route.path}`;
        if (ctx.state.trace) {
          ctx.state.trace.push(`route middleware: ${ctx.state.route}`);
        }
        return route.handler(ctx, next);
      }

      if (pathMatched.length > 0) {
        ctx.status = 405;
        ctx.body = {
          step: 'step9',
          error: 'Method Not Allowed',
          method: ctx.method,
          path: ctx.path,
          allowed: pathMatched.map((route) => route.method)
        };
        return;
      }

      return next();
    };
  }
}

module.exports = Router;
