var Property = require('./property');
var typeOf = require('component-type');
var dot = require('eivindfjeldstad-dot');

/**
 * Expose schema
 */

module.exports = Schema;

/**
 * Schema constructor
 *
 * @param {Object} [obj]
 * @param {Object} [opts]
 * @api public
 */

function Schema (obj, opts) {
  if (!(this instanceof Schema)) return new Schema(obj, opts);
  obj = obj || {};
  this.props = {};
  this.opts = opts || {};
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
  var prop = this.props[path] || new Property(path, this);
  this.props[path] = prop;

  // no rules?
  if (!rules) return prop;

  // type shorthand
  if (typeof rules == 'string') {
    prop.type(rules);
    return prop;
  }

  // check if nested
  for (var key in rules) {
    if (!rules.hasOwnProperty(key)) continue;
    if ('function' == typeof prop[key]) continue;
    nested = true;
    break;
  }

  for (var key in rules) {
    if (!rules.hasOwnProperty(key)) continue;

    if (nested) {
      this.path(join(key, path), rules[key]);
      continue;
    }

    var rule = rules[key];
    if (!Array.isArray(rule)) rule = [rule];
    prop[key].apply(prop, rule);
  }

  return prop;
};

/**
 * Typecast given `obj`
 *
 * @param {Object} obj
 * @api public
 */

Schema.prototype.typecast = function (obj) {
  for (var key in this.props) {
    var prop = this.props[key];
    var value = dot.get(obj, key);
    if (value == null) continue;
    dot.set(obj, key, prop.typecast(value));
  }
};

/**
 * Strip all keys not in the schema
 *
 * @param {Object} obj
 * @param {String} [prefix]
 * @api public
 */

Schema.prototype.strip = function (obj, prefix) {
  for (var key in obj) {
    var path = join(key, prefix);

    if (!obj.hasOwnProperty(key)) continue;

    if (!this.props[path]) {
      delete obj[key];
      continue;
    }

    if (typeOf(obj[key]) == 'object') {
      this.strip(obj[key], path);
    }
  }
};

/**
 * Validate given `obj`
 *
 * @param {Object} obj
 * @param {Object} [opts]
 * @return {Array}
 * @api public
 */

Schema.prototype.validate = function (obj, opts) {
  var errors = [];
  opts = opts || this.opts;

  if (opts.typecast) this.typecast(obj);
  if (opts.strip !== false) this.strip(obj);

  for (var key in this.props) {
    var prop = this.props[key];
    var value = dot.get(obj, key);
    var err = prop.validate(value, obj);
    if (err) errors.push(err);
  }

  return errors;
};

/**
 * Assert that given `obj` is valid
 *
 * @param {Object} obj
 * @param {Object} [opts]
 * @api public
 */

Schema.prototype.assert = function (obj, opts) {
  var errors = this.validate(obj, opts);
  if (errors.length > 0) throw errors[0];
};

/**
 * Join `path` with `prefix`
 */

function join (path, prefix) {
  return prefix
    ? prefix + '.' + path
    : path;
}
