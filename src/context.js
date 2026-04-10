const context = {
  // ctx is the top-level entry used by middleware.
  // It forwards request-side data to ctx.request, and response-side data to ctx.response.
  get url() {
    return this.request.url;
  },

  get method() {
    return this.request.method;
  },

  get path() {
    return this.request.path;
  },

  get querystring() {
    return this.request.querystring;
  },

  get query() {
    return this.request.query;
  },

  get header() {
    return this.request.header;
  },

  get body() {
    return this.response.body;
  },

  set body(value) {
    this.response.body = value;
  },

  get status() {
    return this.response.status;
  },

  set status(value) {
    this.response.status = value;
  },

  get type() {
    return this.response.type;
  },

  set type(value) {
    this.response.type = value;
  },

  get(field) {
    return this.request.get(field);
  },

  set(field, value) {
    this.response.set(field, value);
    return this;
  },

  throw(status, message) {
    const error = new Error(message);
    error.status = status;
    throw error;
  }
};

module.exports = context;
