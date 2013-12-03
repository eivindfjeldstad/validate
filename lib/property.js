try {
  var typeOf = require('type');
} catch (e) {
  var typeOf = require('component-type');
}

/**
 * Property constructor
 *
 * @param {String} name
 * @param {Object} [opts]
 * @api public
 */

function Property (name) {
  this.fns = [];
  this.is = undefined;
  this.name = name;
  this.msg = 'validation failed for path ' + name;
}

Property.prototype = {
  
  /**
   * Validate with given `fn` and optional `msg`
   *
   * @param {Function} fn
   * @param {String} msg
   * @return {Property}
   * @api public
   */
  
  use: function (fn, msg) {
    this.fns.push([fn, msg]);
    return this;
  },
  
  /**
   * Is required
   *
   * @param {Boolean} [bool]
   * @param {String} [message]
   * @return {Property}
   * @api public
   */
  
  required: function (bool, msg) {
    if ('string' == typeof bool) msg = bool;
    return this.use(required(), msg);
  },
  
  /**
   * Is of type `name`
   *
   * @param {String} name
   * @param {String} msg
   * @return {Property}
   * @api public
   */
  
  type: function (name, msg) {
    this.is = name;
    return this.use(type(name), msg);
  },
  
  /**
   * Matches given `regexp`
   *
   * @param {RegExp} regexp
   * @param {String} msg
   * @return {Property}
   * @api public
   */
  
  match: function (regexp, msg) {
    return this.use(match(regexp), msg);
  },
  
  /**
   * Set default error message
   *
   * @param {RegExp} regexp
   * @param {String} msg
   * @return {Property}
   * @api public
   */
  
  message: function (msg) {
    return this.msg = msg;
  },
  
  /**
   * Validate given `value` and return errors
   *
   * @param {Mixed} value
   * @return {String|Boolean}
   * @api public
   */
  
  validate: function (value) {
    var fns = this.fns;
    for (var i = 0; i < fns.length; i++) {
      var fn = fns[i];
      if (fn[0](value)) continue;
      return fn[1] || this.msg;
    }
    return false;
  }
};

/**
 * Validate presence
 *
 * @return {Function}
 * @api private
 */

function required () {
  return function (value) {
    return !!value;
  }
}

/**
 * Validate type
 *
 * @param {String} name
 * @return {Function}
 * @api private
 */

function type (name) {
  return function (value) {
    return value == null || typeOf(value) == name;
  }
}

/**
 * Match given `regexp`
 *
 * @param {RegExp} regexp
 * @return {Function}
 * @api private
 */

function match (regexp) {
  return function (value) {
    return value == null || regexp.test(value);
  }
}

/**
 * Expose Property
 */

module.exports = Property;