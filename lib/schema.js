var Property = require('./property');
var typecast = require('typecast');
var assert = require('assert');

try {
  var dot = require('dot');
} catch (e) {
  var dot = require('eivindfjeldstad-dot');
}

/**
 * Schema constructor
 *
 * @param {Object} [obj]
 * @param {Object} [opts]
 * @api public
 */

function Schema (obj, opts) {
  if (!(this instanceof Schema))
    return new Schema(obj, opts);
  
  obj = obj || {};
  this.opts = opts || {};
  this.props = {};
  for (var key in obj) {
    if (!obj.hasOwnProperty(key)) continue;
    this.path(key, obj[key]);
  }
}

/**
 * Add given `path` to schema with optional `rules`
 *
 * @param {String} path
 * @param {Object} [rules]
 * @return {Property}
 * @api public
 */

Schema.prototype.path = function (path, rules) {
  var nested = false;
  var prop = this.props[path] || new Property(path);
  this.props[path] = prop;
  
  // no rules?
  if (!rules) return prop;
  
  // check if nested
  for (var key in rules) {
    if (!rules.hasOwnProperty(key)) continue;
    if ('function' != typeof prop[key]) {
      nested = true;
      break;
    }
  }
  
  for (var key in rules) {
    if (!rules.hasOwnProperty(key)) continue;
    // nested
    if (nested) {
      this.path(path + '.' + key, rules[key]);
    } else {
      var rule = rules[key];
      if (!Array.isArray(rule)) rule = [rule];
      prop[key].apply(prop, rule);
    }
  }
  
  return prop;
};

/**
 * Validate given `obj`
 *
 * @param {Object} obj
 * @param {Object} [opts]
 * @return {Object}
 * @api public
 */

Schema.prototype.validate = function (obj, opts) {
  opts = opts || this.opts;
  var accepted = {};
  var errors = [];
  
  for (var key in this.props) {
    var prop = this.props[key];
    var value = dot.get(obj, key);
    // typecast
    if (opts.typecast) value = typecast(value, prop.is);
    var err = prop.validate(value);
    // error
    if (err) {
      errors.push(err);
    } else {
      dot.set(accepted, key, value); 
    }
  }
  
  // return accepted object and errors
  return {
    accepted: accepted,
    errors: errors
  };
};

/**
 * Assert that given `obj` is valid
 *
 * @param {Object} obj
 * @param {Object} [opts]
 * @return {Object}
 * @api public
 */

Schema.prototype.assert = function (obj, opts) {
  var res = this.validate(obj, opts);
  assert(res.errors.length == 0, res.errors[0]);
  return res.accepted;
};

/**
 * Expose schema
 */

module.exports = Schema;