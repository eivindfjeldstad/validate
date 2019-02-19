/**
 * Custom errors.
 *
 * @private
 */

export default class ValidationError extends Error {
  constructor(message, path, type) {
    super(message);

    Object.defineProperty(this, 'path', {
      enumerable: false,
      configurable: true,
      writable: true,
      value: path
    });
    Object.defineProperty(this, 'type', {
      enumerable: false,
      configurable: true,
      writable: true,
      value: type
    });

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ValidationError);
    }
  }
}
