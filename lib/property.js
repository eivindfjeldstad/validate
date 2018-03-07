var typecast = require('typecast');
var typeOf = require('component-type');

/**
 * Expose Property
 */

module.exports = Property;

/**
 * Property constructor
 *
 * @param {String} name
 * @param {Object} [opts]
 * @api public
 */

function Property (name, schema) {
  this.fns = [];
  this.name = name;
  this.schema = schema;
  this._type = undefined;
  this.msg = 'validation failed for path ' + name;
}

Property.prototype = {

  /**
   * Validate with given `fn` and optional `msg`
   *
   * @param {Function} fn
   * @param {String} [msg]
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
   * @param {String} [msg]
   * @return {Property}
   * @api public
   */

  required: function (bool, msg) {
    if ('string' == typeof bool) msg = bool;
    return this.use(required(bool), msg);
  },

  /**
   * Is of type `name`
   *
   * @param {String} name
   * @param {String} [msg]
   * @return {Property}
   * @api public
   */

  type: function (name, msg) {
    this._type = name;
    return this.use(type(name), msg);
  },

  /**
   * Is of length
   *
   * @param {Object} obj
   * @param {String} [msg]
   * @return {Property}
   * @api public
   */

  length: function (obj, msg) {
    return this.use(length(obj), msg);
  },

  /**
   * Matches given `regexp`
   *
   * @param {RegExp} regexp
   * @param {String} [msg]
   * @return {Property}
   * @api public
   */

  match: function (regexp, msg) {
    return this.use(match(regexp), msg);
  },

  /**
   * Validate each value in array against given function `fn`
   *
   * @param {Function} fn
   * @param {String} [msg]
   * @return {Property}
   * @api public
   */

  each: function (fn, msg) {
    return this.use(each(fn), msg);
  },

  /**
   * Get schema path
   *
   * @param {String} path
   * @param {Object} [rules]
   * @return {Path}
   * @api public
   */

  path: function (path, rules) {
    return this.schema(path, rules);
  },

  /**
   * Set default error message
   *
   * @param {String} msg
   * @return {Property}
   * @api public
   */

  message: function (msg) {
    return this.msg = msg;
  },

  /**
   * Typecast given value
   *
   * @param {Mixed} val
   * @return {Mixed}
   * @api public
   */

  typecast: function (val) {
    return typecast(val, this._type);
  },

  /**
   * Validate given `value`
   *
   * @param {Mixed} value
   * @param {Object} [ctx]
   * @return {String|Boolean}
   * @api public
   */

  validate: function (value, ctx) {
    var fns = this.fns;

    for (var i = 0; i < fns.length; i++) {
      var fn = fns[i];
      var valid = fn[0].call(ctx, value);
      if (!valid) return error(this, fn[1]);
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

function required (bool) {
  return function (value) {
    return bool === false || !!value;
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
 * Validate length
 *
 * @param {object} obj
 * @return {Function}
 * @api private
 */

function length (obj) {
  return function (value) {
    if (value == null) return true;
    if (obj.min && value.length < obj.min) return false;
    if (obj.max && value.length > obj.max) return false;
    return true;
  }
}

/**
 * Validate values
 *
 * @param {String} name
 * @return {Function}
 * @api private
 */

function each (fn) {
  return function (arr) {
    if (arr == null) return true;
    if (!Array.isArray(arr)) return false;

    for (var i = 0; i < arr.length; i++) {
      if (!fn(arr[i])) return false;
    }

    return true;
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
 * Create an error
 *
 * @param {Property} prop
 * @param {String} msg
 * @return {Error}
 * @api private
 */


function error (prop, msg) {
  var err = new Error(msg || prop.msg);
  err.path = prop.name;
  return err;
}
