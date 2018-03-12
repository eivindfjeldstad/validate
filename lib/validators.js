const typeOf = require('component-type');

/**
 * Default validators.
 *
 * @private
 */

const Validators = {
  /**
   * Uses the given `fn` as a validation function
   *
   * @param {Mixed} value - the value being validated
   * @param {Object} ctx - the object being validated
   * @param {Function} fn - function to call
   * @return {Boolean}
   * @api public
   */

  use(value, ctx, fn) {
    return fn.call(ctx, value, ctx);
  },

  /**
   * Validates presence.
   *
   * @param {Mixed} value - the value being validated
   * @param {Object} ctx - the object being validated
   * @param {Bolean} required
   * @return {Boolean}
   * @api public
   */

  required(value, ctx, required) {
    if (required === false) return true;
    return value != null && value !== '';
  },

  /**
   * Validates type.
   *
   * @param {Mixed} value - the value being validated
   * @param {Object} ctx - the object being validated
   * @param {String} name name of the type
   * @return {Boolean}
   * @api public
   */

  type(value, ctx, name) {
    return value == null || typeOf(value) == name;
  },

  /**
   * Validates length.
   *
   * @param {String} value the string being validated
   * @param {Object} ctx the object being validated
   * @param {Object} rules object with .min and/or .max props.
   * @param {Number} [rules.min] - minimum length
   * @param {Number} [rules.max] - maximum length
   * @return {Boolean}
   * @api public
   */

  length(value, ctx, rules) {
    let {min, max} = rules;
    if (value == null) return true;
    if (min && value.length < min) return false;
    if (max && value.length > max) return false;
    return true;
  },

  /**
   * Validates against given `regexp`.
   *
   * @param {String} value the string beign validated
   * @param {Object} ctx the object being validated
   * @param {RegExp} regexp the regexp to validate against
   * @return {Boolean}
   * @api public
   */

  match(value, ctx, regexp) {
    return value == null || regexp.test(value);
  }
}

module.exports = Validators;
