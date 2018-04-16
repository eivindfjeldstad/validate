/**
 * Custom errors.
 *
 * @private
 */

class ValidationError extends Error {
  constructor(message, path) {
    super(message);
    Object.defineProperty(this, 'path', {
      enumerable: false,
      configurable: true,
      writable: true,
      value: path
    })
  }
}

module.exports = ValidationError;
