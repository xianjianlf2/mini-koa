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
  }
};

module.exports = context;
