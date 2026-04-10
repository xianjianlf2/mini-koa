function parseUrl(req) {
  return new URL(req.url, 'http://localhost');
}

const request = {
  // "req" is the raw Node request object.
  // It gets attached in application.createContext(...), not in this file.
  get url() {
    return this.req.url;
  },

  get method() {
    return this.req.method;
  },

  get path() {
    return parseUrl(this.req).pathname;
  },

  get querystring() {
    return parseUrl(this.req).search.slice(1);
  },

  get query() {
    const query = {};
    for (const [key, value] of parseUrl(this.req).searchParams.entries()) {
      query[key] = value;
    }
    return query;
  },

  get header() {
    return this.req.headers;
  },

  get(field) {
    return this.req.headers[field.toLowerCase()] || '';
  }
};

module.exports = request;
