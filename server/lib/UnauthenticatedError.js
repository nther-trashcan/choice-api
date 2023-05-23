function UnauthenticatedError(message) {
    Error.captureStackTrace(this);
    this.name = 'UnauthenticatedError';
    this.message = message || 'Authorization Required';
    this.code = 'AUTHORIZATION_REQUIRED';
    this.status = 401;
  }
  UnauthenticatedError.prototype = Object.create(Error.prototype);
  
  module.exports = UnauthenticatedError;
  