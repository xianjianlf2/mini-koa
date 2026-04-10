const request = {
  get url() {
    return this.req.url;
  },

  get method() {
    return this.req.method;
  }
};

module.exports = request;
