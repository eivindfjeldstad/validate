const typeOf = require('component-type');
const typecast = require('typecast');

/**
 * A property instance gets returned whenever you call `schema.path()`.
 * Properties are also created internally when an object is passed to the Schema constructor.
 *
 * @param {String} name - the name of the property
 * @param {Schema} schema - parent schema
 */

class Property {
  constructor(name, schema) {
    this.name = name;
    this.registry = {};
    this._schema = schema;
    this._type = null;
    this.messages = schema.messages;
    this.validators = schema.validators;
  }

  /**
   * Mount given `schema` on current path.
   *
   * @example
   * const user = new Schema({ email: 'string' })
   * prop.schema(user)
   *
   * @param {Schema} schema - the schema to mount
   * @return {Property}
   */

  schema(schema) {
    this._schema.path(this.name, schema);
    return this;
  }

  /**
   * Validate using named functions from the given object.
   * Error messages can be defined by providing an object with
   * named error messages/generators to `schema.message()`
   *
   * The message generator receives the value being validated,
   * the object it belongs to and any additional arguments.
   *
   * @example
   * const schema = new Schema()
   * const prop = schema.path('some.path')
   *
   * schema.message({
   *   binary: (path, ctx) => `${path} must be binary.`,
   *   bits: (path, ctx, bits) => `${path} must be ${bits}-bit`
   * })
   *
   * prop.use({
   *   binary: (val, ctx) => /^[01]+$/i.test(val),
   *   bits: [(val, ctx, bits) => val.length == bits, 32]
   * })
   *
   * @param {Object} fns - object with named validation functions to call
   * @return {Property}
   */

  use(fns) {
    Object.keys(fns).forEach(name => {
      let arr = fns[name];
      if (!Array.isArray(arr)) arr = [arr];
      const fn = arr.shift();
      this._register(name, arr, fn);
    })

    return this;
  }

  /**
   * Registers a validator that checks for presence.
   *
   * @example
   * prop.required()
   *
   * @param {Boolean} [bool] - `true` if required, `false` otherwise
   * @return {Property}
   */

  required(bool = true) {
    return this._register('required', [bool]);
  }

  /**
   * Registers a validator that checks if a value is of a given `type`
   *
   * @example
   * prop.type('string')
   *
   * @param {String} type - type to check for
   * @return {Property}
   */

  type(type) {
    this._type = type;
    return this._register('type', [type]);
  }

  /**
   * Registers a validator that checks length.
   *
   * @example
   * prop.length({ min: 8, max: 255 })
   * prop.length(10)
   *
   * @param {Object|Number} rules - object with `.min` and `.max` properties or a number
   * @param {Number} rules.min - minimum length
   * @param {Number} rules.max - maximum length
   * @return {Property}
   */

  length(rules) {
    return this._register('length', [rules]);
  }

  /**
   * Registers a validator for enums.
   *
   * @example
   * prop.enum(['cat', 'dog'])
   *
   * @param {Array} rules - allowed values
   * @return {Property}
   */

  enum(enums) {
    return this._register('enum', [enums]);
  }

  /**
   * Registers a validator that checks if a value matches given `regexp`.
   *
   * @example
   * prop.match(/some\sregular\sexpression/)
   *
   * @param {RegExp} regexp - regular expression to match
   * @return {Property}
   */

  match(regexp) {
    return this._register('match', [regexp]);
  }

  /**
   * Registers a validator that checks each value in an array against given `rules`.
   *
   * @example
   * prop.each({ type: 'string' })
   * prop.each([{ type: 'number' }])
   * prop.each({ things: [{ type: 'string' }]})
   * prop.each(schema)
   *
   * @param {Array|Object|Schema|Property} rules - rules to use
   * @return {Property}
   */

  each(rules) {
    this._schema.path(`${this.name}.$`, rules);
    return this;
  }

  /**
   * Registers paths for array elements on the parent schema, with given array of rules.
   *
   * @example
   * prop.elements([{ type: 'string' }, { type: 'number' }])
   *
   * @param {Array} arr - array of rules to use
   * @return {Property}
   */

  elements(arr) {
    arr.forEach((rules, i) => {
      this._schema.path(`${this.name}.${i}`, rules);
    });
    return this;
  }

  /**
   * Proxy method for schema path. Makes chaining properties together easier.
   *
   * @example
   * schema
   *   .path('name')
   *     .type('string')
   *     .required()
   *   .path('email')
   *     .type('string')
   *     .required()
   *
   */

  path(...args) {
    return this._schema.path(...args);
  }

  /**
   * Typecast given `value`
   *
   * @example
   * prop.type('string')
   * prop.typecast(123) // => '123'
   *
   * @param {Mixed} value - value to typecast
   * @return {Mixed}
   */

  typecast(value) {
    if (!this._type) return value;
    return typecast(value, this._type);
  }

  /**
   * Validate given `value`
   *
   * @example
   * prop.type('number')
   * assert(prop.validate(2) == false)
   * assert(prop.validate('hello world') instanceof Error)
   *
   * @param {Mixed} value - value to validate
   * @param {Object} ctx - the object containing the value
   * @param {String} [path] - path of the value being validated
   * @return {Error|Boolean}
   */

  validate(value, ctx, path = this.name) {
    const types = Object.keys(this.registry);
    const done = {};
    let error;

    // Required first
    if (error = this._run('required', value, ctx, path)) {
      return error;
    }

    // No need to continue if value is null-ish
    if (value == null) return false;

    // Run type second
    if (error = this._run('type', value, ctx, path)) {
      return error;
    }

    // Make sure required and run are not executed again
    done.required = true;
    done.type = true;

    // Run the rest
    for (let type of types) {
      if (done[type]) continue;
      if (error = this._run(type, value, ctx, path)) {
        return error;
      }
    }

    return false;
  }

  /**
   * Run validator of given `type`
   *
   * @param {String} type - type of validator
   * @param {Mixed} value - value to validate
   * @param {Object} ctx - the object containing the value
   * @param {String} path - path of the value being validated
   * @return {Error}
   * @private
   */

  _run(type, value, ctx, path) {
    if (!this.registry[type]) return;
    const {args, fn} = this.registry[type];
    let validator = fn || this.validators[type];
    let valid = validator(value, ctx, ...args, path);
    if (!valid) return this._error(type, ctx, args, path);
  }

  /**
   * Register validator
   *
   * @param {String} type - type of validator
   * @param {Array} args - argument to pass to validator
   * @param {Function} [fn] - custom validation function to call
   * @return {Property}
   * @private
   */

  _register(type, args, fn) {
    this.registry[type] = { args, fn }
    return this;
  }

  /**
   * Create an error
   *
   * @param {String} type - type of validator
   * @param {Object} ctx - the object containing the value
   * @param {Array} args - arguments to pass
   * @param {String} path - path of the value being validated
   * @return {Error}
   * @private
   */

  _error(type, ctx, args, path) {
    let message = this.messages[type] || this.messages.default;

    if (typeof message == 'function') {
      message = message(path, ctx, ...args);
    }

    const err = new Error(message);
    err.path = path;
    return err;
  }
}

module.exports = Property;
