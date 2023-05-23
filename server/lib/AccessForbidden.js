function AccessForbidden(message) {
    Error.captureStackTrace(this);
    this.name = 'AccessForbidden';
    this.message = message || 'Access Forbidden';
    this.code = 'ACCESSFORBIDDEN';
    this.status = 403;
  }
  AccessForbidden.prototype = Object.create(Error.prototype);
  
  module.exports = AccessForbidden;
  