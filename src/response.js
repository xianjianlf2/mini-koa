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
  }
};

module.exports = response;
