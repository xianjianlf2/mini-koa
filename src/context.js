const context = {
  get url() {
    return this.request.url;
  },

  get method() {
    return this.request.method;
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

  throw(status, message) {
    const error = new Error(message);
    error.status = status;
    throw error;
  }
};

module.exports = context;
