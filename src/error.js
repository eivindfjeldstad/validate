/**
 * Custom errors.
 *
 * @private
 */

export default class ValidationError extends Error {
  constructor(message, path) {
    super(message);

    defineProp(this, 'path', path);
    defineProp(this, 'expose', true);
    defineProp(this, 'status', 400);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ValidationError);
    }
  }
}

const defineProp = (obj, prop, val) => {
  Object.defineProperty(obj, prop, {
    enumerable: false,
    configurable: true,
    writable: true,
    value: val
  });
};
