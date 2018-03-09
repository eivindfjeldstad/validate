const Property = require('./property');
const typeOf = require('component-type');
const dot = require('eivindfjeldstad-dot');

class Schema {
  /**
   * Schema constructor
   *
   * @param {Object} [obj]
   * @param {Object} [opts]
   * @api public
   */

  constructor(obj, opts) {
    obj = obj || {};
    this.props = {};
    this.opts = opts || {};
    for (let key in obj) {
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

  path(path, rules) {
    let nested = false;
    const prop = this.props[path] || new Property(path, this);
    this.props[path] = prop;

    // no rules?
    if (!rules) return prop;

    // type shorthand
    if (typeof rules == 'string') {
      prop.type(rules);
      return prop;
    }

    // check if nested
    for (const key in rules) {
      if (!rules.hasOwnProperty(key)) continue;
      if ('function' == typeof prop[key]) continue;
      nested = true;
      break;
    }

    for (const key in rules) {
      if (!rules.hasOwnProperty(key)) continue;

      if (nested) {
        this.path(join(key, path), rules[key]);
        continue;
      }

      let rule = rules[key];
      if (!Array.isArray(rule)) rule = [rule];
      prop[key].apply(prop, rule);
    }

    return prop;
  }

  /**
   * Typecast given `obj`
   *
   * @param {Object} obj
   * @api public
   */

  typecast(obj) {
    for (const key in this.props) {
      const prop = this.props[key];
      const value = dot.get(obj, key);
      if (value == null) continue;
      dot.set(obj, key, prop.typecast(value));
    }
  }

  /**
   * Strip all keys not in the schema
   *
   * @param {Object} obj
   * @param {String} [prefix]
   * @api public
   */

  strip(obj, prefix) {
    for (const key in obj) {
      const path = join(key, prefix);

      if (!obj.hasOwnProperty(key)) continue;

      if (!this.props[path]) {
        delete obj[key];
        continue;
      }

      if (typeOf(obj[key]) == 'object') {
        this.strip(obj[key], path);
      }
    }
  }

  /**
   * Validate given `obj`
   *
   * @param {Object} obj
   * @param {Object} [opts]
   * @return {Array}
   * @api public
   */

  validate(obj, opts) {
    const errors = [];
    opts = opts || this.opts;

    if (opts.typecast) this.typecast(obj);
    if (opts.strip !== false) this.strip(obj);

    for (const key in this.props) {
      const prop = this.props[key];
      const value = dot.get(obj, key);
      const err = prop.validate(value, obj);
      if (err) errors.push(err);
    }

    return errors;
  }

  /**
   * Assert that given `obj` is valid
   *
   * @param {Object} obj
   * @param {Object} [opts]
   * @api public
   */

  assert(obj, opts) {
    const errors = this.validate(obj, opts);
    if (errors.length > 0) throw errors[0];
  }
}

/**
 * Expose schema
 */

module.exports = Schema;

/**
 * Join `path` with `prefix`
 */

function join (path, prefix) {
  return prefix
    ? prefix + '.' + path
    : path;
}
