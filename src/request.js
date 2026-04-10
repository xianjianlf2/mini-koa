const request = {
  // "req" is the raw Node request object.
  // It gets attached in application.createContext(...), not in this file.
  get url() {
    return this.req.url;
  },

  get method() {
    return this.req.method;
  }
};

module.exports = request;
