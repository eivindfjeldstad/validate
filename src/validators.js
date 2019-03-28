import typeOf from 'component-type';

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
   * @param {String|Function} name name of the type or a constructor
   * @return {Boolean}
   */

  type(value, ctx, name) {
    if (typeof name == 'function') {
      return value.constructor === name;
    }

    return typeOf(value) === name;
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
   */

  length(value, ctx, len) {
    if (typeof len == 'number') {
      return value.length === len;
    }
    let { min, max } = len;
    if (min && value.length < min) return false;
    if (max && value.length > max) return false;
    return true;
  },

  /**
   * Validates size.
   *
   * @param {Number} value the number being validated
   * @param {Object} ctx the object being validated
   * @param {Object|Number} size object with .min and/or .max props or a number
   * @param {String|Number} [size.min] - minimum size
   * @param {String|Number} [size.max] - maximum size
   * @return {Boolean}
   */

  size(value, ctx, size) {
    if (typeof size == 'number') {
      return value === size;
    }
    let { min, max } = size;
    if (parseInt(min) != null && value < min) return false;
    if (parseInt(max) != null && value > max) return false;
    return true;
  },

  /**
   * Validates enums.
   *
   * @param {String} value the string being validated
   * @param {Object} ctx the object being validated
   * @param {Array} enums array with allowed values
   * @return {Boolean}
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
   */

  match(value, ctx, regexp) {
    return regexp.test(value);
  }
};

export default Validators;
