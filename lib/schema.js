var Property = require('./property');
var upcast = require('upcast');

try {
  var dot = require('dot');
} catch (e) {
  var dot = require('eivindfjeldstad-dot');
}

/**
 * Schema constructor
 *
 * @param {Object} [obj]
 * @api public
 */

function Schema (obj, opts) {
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
 * @param {String} path
 * @param {Object} [rules]
 * @return {Property}
 * @api public
 */

Schema.prototype.validate = function (obj, opts) {
  var errors = [];
  opts = opts || this.opts;
  
  for (var key in this.props) {
    var prop = this.props[key];
    var value = dot.get(obj, key);
    
    // typecast
    if (opts.typecast) {
      value = upcast.to(value, prop.is);
      dot.set(obj, key, value);
    }
    
    var err = prop.validate(value);
    if (err) errors.push(err);
  }
  
  return errors.length
    ? errors
    : null;
};

/**
 * Expose schema
 */

module.exports = Schema;