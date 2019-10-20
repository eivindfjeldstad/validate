import dot from '@eivifj/dot';
import typecast from 'typecast';
import Property from './property';
import Messages from './messages';
import Validators from './validators';
import ValidationError from './error';
import { walk, enumerate, join, assign } from './utils';

/**
 * A Schema defines the structure that objects should be validated against.
 *
 * @example
 * const post = new Schema({
 *   title: {
 *     type: String,
 *     required: true,
 *     length: { min: 1, max: 255 }
 *   },
 *   content: {
 *     type: String,
 *     required: true
 *   },
 *   published: {
 *     type: Date,
 *     required: true
 *   },
 *   keywords: [{ type: String }]
 * })
 *
 * @example
 * const author = new Schema({
 *   name: {
 *     type: String,
 *     required: true
 *   },
 *   email: {
 *     type: String,
 *     required: true
 *   },
 *   posts: [post]
 * })
 *
 * @param {Object} [obj] - schema definition
 * @param {Object} [opts] - options
 * @param {Boolean} [opts.typecast=false] - typecast values before validation
 * @param {Boolean} [opts.strip=true] - strip properties not defined in the schema
 * @param {Boolean} [opts.strict=false] - validation fails when object contains properties not defined in the schema
 */

export default class Schema {
  constructor(obj = {}, opts = {}) {
    this.opts = opts;
    this.hooks = [];
    this.props = {};
    this.messages = Object.assign({}, Messages);
    this.validators = Object.assign({}, Validators);
    this.typecasters = Object.assign({}, typecast);
    Object.keys(obj).forEach(k => this.path(k, obj[k]));
  }

  /**
   * Create or update `path` with given `rules`.
   *
   * @example
   * const schema = new Schema()
   * schema.path('name.first', { type: String })
   * schema.path('name.last').type(String).required()
   *
   * @param {String} path - full path using dot-notation
   * @param {Object|Array|String|Schema|Property} [rules] - rules to apply
   * @return {Property}
   */

  path(path, rules) {
    const parts = path.split('.');
    const suffix = parts.pop();
    const prefix = parts.join('.');

    // Make sure full path is created
    if (prefix) {
      this.path(prefix);
    }

    // Array index placeholder
    if (suffix === '$') {
      this.path(prefix).type(Array);
    }

    // Nested schema
    if (rules instanceof Schema) {
      rules.hook((k, v) => this.path(join(k, path), v));
      return this.path(path, rules.props);
    }

    // Return early when given a `Property`
    if (rules instanceof Property) {
      this.props[path] = rules;
      // Notify parents if mounted
      this.propagate(path, rules);
      return rules;
    }

    const prop = this.props[path] || new Property(path, this);

    this.props[path] = prop;
    // Notify parents if mounted
    this.propagate(path, prop);

    // No rules?
    if (!rules) return prop;

    // type shorthand
    // `{ name: String }`
    if (typeof rules == 'string' || typeof rules == 'function') {
      prop.type(rules);
      return prop;
    }

    // Allow arrays to be defined implicitly:
    // `{ keywords: [String] }`
    // `{ keyVal: [[String, Number]] }`
    if (Array.isArray(rules)) {
      prop.type(Array);

      if (rules.length === 1) {
        prop.each(rules[0]);
      } else {
        prop.elements(rules);
      }

      return prop;
    }

    const keys = Object.keys(rules);
    let nested = false;

    // Check for nested objects
    for (const key of keys) {
      if (typeof prop[key] == 'function') continue;
      prop.type(Object);
      nested = true;
      break;
    }

    keys.forEach(key => {
      const rule = rules[key];

      if (nested) {
        return this.path(join(key, path), rule);
      }

      prop[key](rule);
    });

    return prop;
  }

  /**
   * Typecast given `obj`.
   *
   * @param {Object} obj - the object to typecast
   * @return {Schema}
   * @private
   */

  typecast(obj) {
    for (const [path, prop] of Object.entries(this.props)) {
      enumerate(path, obj, (key, value) => {
        if (value == null) return;
        const cast = prop.typecast(value);
        if (cast === value) return;
        dot.set(obj, key, cast);
      });
    }

    return this;
  }

  /**
   * Strip all keys not defined in the schema
   *
   * @param {Object} obj - the object to strip
   * @param {String} [prefix]
   * @return {Schema}
   * @private
   */

  strip(obj) {
    walk(obj, (path, prop) => {
      if (this.props[prop]) return true;
      dot.delete(obj, path);
      return false;
    });

    return this;
  }

  /**
   * Create errors for all properties that are not defined in the schema
   *
   * @param {Object} obj - the object to check
   * @return {Schema}
   * @private
   */

  enforce(obj) {
    const errors = [];

    walk(obj, (path, prop) => {
      if (this.props[prop]) return true;
      const error = new ValidationError(Messages.illegal(path), path);
      errors.push(error);
      return false;
    });

    return errors;
  }

  /**
   * Validate given `obj`.
   *
   * @example
   * const schema = new Schema({ name: { required: true }})
   * const errors = schema.validate({})
   * assert(errors.length == 1)
   * assert(errors[0].message == 'name is required')
   * assert(errors[0].path == 'name')
   *
   * @param {Object} obj - the object to validate
   * @param {Object} [opts] - options, see [Schema](#schema-1)
   * @return {Array}
   */

  validate(obj, opts = {}) {
    opts = Object.assign(this.opts, opts);

    const errors = [];

    if (opts.typecast) {
      this.typecast(obj);
    }

    if (opts.strict) {
      errors.push(...this.enforce(obj));
    }

    if (opts.strip !== false) {
      this.strip(obj);
    }

    for (const [path, prop] of Object.entries(this.props)) {
      enumerate(path, obj, (key, value) => {
        const err = prop.validate(value, obj, key);
        if (err) errors.push(err);
      });
    }

    return errors;
  }

  /**
   * Assert that given `obj` is valid.
   *
   * @example
   * const schema = new Schema({ name: String })
   * schema.assert({ name: 1 }) // Throws an error
   *
   * @param {Object} obj
   * @param {Object} [opts]
   */

  assert(obj, opts) {
    const [err] = this.validate(obj, opts);
    if (err) throw err;
  }

  /**
   * Override default error messages.
   *
   * @example
   * const hex = (val) => /^0x[0-9a-f]+$/.test(val)
   * schema.path('some.path').use({ hex })
   * schema.message('hex', path => `${path} must be hexadecimal`)
   *
   * @example
   * schema.message({ hex: path => `${path} must be hexadecimal` })
   *
   * @param {String|Object} name - name of the validator or an object with name-message pairs
   * @param {String|Function} [message] - the message or message generator to use
   * @return {Schema}
   */

  message(name, message) {
    assign(name, message, this.messages);
    return this;
  }

  /**
   * Override default validators.
   *
   * @example
   * schema.validator('required', val => val != null)
   *
   * @example
   * schema.validator({ required: val => val != null })
   *
   * @param {String|Object} name - name of the validator or an object with name-function pairs
   * @param {Function} [fn] - the function to use
   * @return {Schema}
   */

  validator(name, fn) {
    assign(name, fn, this.validators);
    return this;
  }

  /**
   * Override default typecasters.
   *
   * @example
   * schema.typecaster('SomeClass', val => new SomeClass(val))
   *
   * @example
   * schema.typecaster({ SomeClass: val => new SomeClass(val) })
   *
   * @param {String|Object} name - name of the validator or an object with name-function pairs
   * @param {Function} [fn] - the function to use
   * @return {Schema}
   */

  typecaster(name, fn) {
    assign(name, fn, this.typecasters);
    return this;
  }

  /**
   * Accepts a function that is called whenever new props are added.
   *
   * @param {Function} fn - the function to call
   * @return {Schema}
   * @private
   */

  hook(fn) {
    this.hooks.push(fn);
    return this;
  }

  /**
   * Notify all subscribers that a property has been added.
   *
   * @param {String} path - the path of the property
   * @param {Property} prop - the new property
   * @return {Schema}
   * @private
   */

  propagate(path, prop) {
    this.hooks.forEach(fn => fn(path, prop));
    return this;
  }
}

// Export ValidationError
Schema.ValidationError = ValidationError;
