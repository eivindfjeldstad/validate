const typeOf = require('component-type');

/**
 * Default validators.
 *
 * @private
 */

const Validators = {
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
    return typeOf(value) == name;
  },

  /**
   * Validates length.
   *
   * @param {String} value the string being validated
   * @param {Object} ctx the object being validated
   * @param {Object|Number} rules object with .min and/or .max props or a number
   * @param {Number} [rules.min] - minimum length
   * @param {Number} [rules.max] - maximum length
   * @return {Boolean}
   * @api public
   */

  length(value, ctx, len) {
    if (typeof len == 'number') {
      return value.length == len;
    }
    let {min, max} = len;
    if (min && value.length < min) return false;
    if (max && value.length > max) return false;
    return true;
  },

  /**
   * Validates enums.
   *
   * @param {String} value the string being validated
   * @param {Object} ctx the object being validated
   * @param {Array} enums array with allowed values
   * @return {Boolean}
   * @api public
   */

  enum(value, ctx, enums) {
    return enums.includes(value);
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
    return regexp.test(value);
  }
}

module.exports = Validators;
