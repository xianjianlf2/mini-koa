const response = {
  get body() {
    return this._body;
  },

  set body(value) {
    this._body = value;
  },

  get status() {
    return this._status;
  },

  set status(value) {
    this._status = value;
  },

  get type() {
    return this.res.getHeader('Content-Type');
  },

  set type(value) {
    this.res.setHeader('Content-Type', value);
  },

  set(field, value) {
    this.res.setHeader(field, value);
  }
};

module.exports = response;
