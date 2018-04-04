const Property = require('./property');
const typeOf = require('component-type');
const dot = require('eivindfjeldstad-dot');

const Messages = require('./messages');
const Validators = require('./validators');

/**
 * A Schema defines the structure that objects should be validated against.
 *
 * @example
 * const post = new Schema({
 *   title: {
 *     type: 'string',
 *     required: true,
 *     length: { min: 1, max: 255 }
 *   },
 *   content: {
 *     type: 'string',
 *     required: true
 *   },
 *   published: {
 *     type: 'date',
 *     required: true
 *   },
 *   keywords: [{ type: 'string' }]
 * })
 *
 * @example
 * const author = new Schema({
 *   name: {
 *     type: 'string',
 *     required: true
 *   },
 *   email: {
 *     type: 'string',
 *     required: true
 *   },
 *   posts: [post]
 * })
 *
 * @param {Object} [obj] - schema definition
 * @param {Object} [opts] - options
 * @param {Boolean} [opts.typecast=false] - typecast values before validation
 * @param {Boolean} [opts.strip=true] - strip properties not defined in the schema
 */

class Schema {
  constructor(obj = {}, opts = {}) {
    this.opts = opts;
    this.hooks = [];
    this.props = {};
    this.messages = Object.assign({}, Messages);
    this.validators = Object.assign({}, Validators);
    Object.keys(obj).forEach(k => this.path(k, obj[k]));
  }

  /**
   * Create or update `path` with given `rules`.
   *
   * @example
   * const schema = new Schema()
   * schema.path('name.first', { type: 'string' })
   * schema.path('name.last').type('string').required()
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
    if (suffix == '$') {
      this.path(prefix).type('array');
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
    // `{ name: 'string' }`
    if (typeof rules == 'string') {
      prop.type(rules);
      return prop;
    }

    // Allow arrays to be passed implicitly:
    // `{ keywords: [{ type: 'string' }]}`
    if (Array.isArray(rules)) {
      return this.path(join('$', path), rules[0]);
    }

    let nested = false;

    // Check for nested objects
    for (const key in rules) {
      if (!rules.hasOwnProperty(key)) continue;
      if ('function' == typeof prop[key]) continue;
      nested = true;
      break;
    }

    Object.keys(rules).forEach(key => {
      let rule = rules[key];

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
   * @param {Object} [props]
   * @return {Object}
   * @private
   */

  typecast(obj, props = this.generateProps(obj)) {
    // Count how many objects are typecasted
    let counter = 0;

    Object.keys(props).forEach(key => {
      const prop = props[key];
      const value = dot.get(obj, key);

      if (value == null) return;

      const cast = prop.typecast(value);

      if (cast === value) return;

      dot.set(obj, key, cast);
      counter++;
    });

    if (counter > 0) {
      // Make another pass in case there are generated array elements
      // E.g. '"1","2","3"' => ["1","2","3"] => [1, 2, 3]
      return this.typecast(obj);
    }

    return props;
  }

  /**
   * Strip all keys not defined in the schema
   *
   * @param {Object} obj - the object to strip
   * @param {Object} [props]
   * @param {String} [prefix]
   * @private
   */

  strip(obj, props = this.generateProps(obj), prefix) {
    Object.keys(obj).forEach(key => {
      const path = join(key, prefix);

      if (!props[path]) {
        // Don't strip array elements (#37)
        if (Array.isArray(obj)) return;
        delete obj[key];
        return;
      }

      if (['object', 'array'].includes(typeOf(obj[key]))) {
        this.strip(obj[key], props, path);
      }
    });
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

    // Generate props object and/or typecast
    // This object includes paths for all array elements.
    const props = opts.typecast
      ? this.typecast(obj)
      : this.generateProps(obj);


    if (opts.strip !== false) {
      // Pass in props to avoid regenerating
      this.strip(obj, props);
    }

    // Validate using the generated `props` object.
    Object.keys(props).forEach(path => {
      const value = dot.get(obj, path);
      const prop = props[path];
      const err = prop.validate(value, obj, path);
      if (err) errors.push(err);
    });

    return errors;
  }

  /**
   * Generate props for each valid path in the given object.
   *
   * @param {Object} obj
   * @return {Object}
   * @private
   */

  generateProps(obj) {
    const props = {};

    Object.keys(this.props).forEach(key => {
      // Generate all valid paths, including array elements
      const paths = generatePaths(key, obj);
      // Aassign the original `Property` object to the generated paths.
      // E.g. some.path.1.in.an.array => some.path.$.in.an.array
      Object.keys(paths).forEach(p => props[p] = this.props[paths[p]]);
    })

    return props;
  }

  /**
   * Assert that given `obj` is valid.
   *
   * @example
   * const schema = new Schema({ name: 'string' })
   * schema.assert({ name: 1 }) // => Throws an error
   *
   * @param {Object} obj
   * @param {Object} [opts]
   */

  assert(obj, opts) {
    const errors = this.validate(obj, opts);
    if (errors.length > 0) throw errors[0];
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
    if (typeof name == 'string') {
      this.messages[name] = message;
      return this;
    }

    Object.keys(name).forEach(k => this.messages[k] = name[k]);
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
    if (typeof name == 'string') {
      this.validators[name] = fn;
      return this;
    }

    Object.keys(name).forEach(k => this.validators[k] = name[k]);
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
    this.hooks.forEach(fn => fn(path, prop))
    return this;
  }
}

// Expose schema
module.exports = Schema;

/**
 * Join `path` with `prefix`
 *
 * @private
 */

function join (path, prefix) {
  return prefix
    ? `${prefix}.${path}`
    : path;
}

/**
 * Generate paths
 *
 * @private
 */

function generatePaths (path, obj, prefix = '', map={}) {
  const prev = map[prefix] || '';

  // Return early if there are no arrays
  if (!path.includes('.$')) {
    map[prefix + path] = prev + path;
    return map;
  }

  // Split by arrays
  const parts = path.split('.$');
  const first = parts.shift();
  const arr = dot.get(obj, prefix + first);

  if (!Array.isArray(arr)) {
    return map;
  }

  arr.forEach((val, i) => {
    const newPath = join(i, prefix + first);
    map[newPath] = join('$', prev + first);
    generatePaths(parts.join('.$'), obj, newPath, map);
  });

  return map;
}
