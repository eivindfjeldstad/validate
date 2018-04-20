/**
 * Custom errors.
 *
 * @private
 */

export default class ValidationError extends Error {
  constructor(message, path) {
    super(message);

    Object.defineProperty(this, 'path', {
      enumerable: false,
      configurable: true,
      writable: true,
      value: path
    });

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ValidationError);
    }
  }
}
