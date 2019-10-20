import ValidationError from './error';
import { join } from './utils';

/**
 * A property instance gets returned whenever you call `schema.path()`.
 * Properties are also created internally when an object is passed to the Schema constructor.
 *
 * @param {String} name - the name of the property
 * @param {Schema} schema - parent schema
 */

export default class Property {
  constructor(name, schema) {
    this.name = name;
    this.registry = {};
    this._schema = schema;
    this._type = null;
    this.messages = {};
  }

  /**
   * Registers messages.
   *
   * @example
   * prop.message('something is wrong')
   * prop.message({ required: 'thing is required.' })
   *
   * @param {Object|String} messages
   * @return {Property}
   */

  message(messages) {
    if (typeof messages == 'string') {
      messages = { default: messages };
    }

    const entries = Object.entries(messages);

    for (const [key, val] of entries) {
      this.messages[key] = val;
    }

    return this;
  }

  /**
   * Mount given `schema` on current path.
   *
   * @example
   * const user = new Schema({ email: String })
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
    });

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
   * prop.type(String)
   *
   * @example
   * prop.type('string')
   *
   * @param {String|Function} type - type to check for
   * @return {Property}
   */

  type(type) {
    this._type = type;
    return this._register('type', [type]);
  }

  /**
   * Convenience method for setting type to `String`
   *
   * @example
   * prop.string()
   *
   * @return {Property}
   */

  string() {
    return this.type(String);
  }

  /**
   * Convenience method for setting type to `Number`
   *
   * @example
   * prop.number()
   *
   * @return {Property}
   */

  number() {
    return this.type(Number);
  }

  /**
   * Convenience method for setting type to `Array`
   *
   * @example
   * prop.array()
   *
   * @return {Property}
   */

  array() {
    return this.type(Array);
  }

  /**
   * Convenience method for setting type to `Date`
   *
   * @example
   * prop.date()
   *
   * @return {Property}
   */

  date() {
    return this.type(Date);
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
   * Registers a validator that checks size.
   *
   * @example
   * prop.size({ min: 8, max: 255 })
   * prop.size(10)
   *
   * @param {Object|Number} rules - object with `.min` and `.max` properties or a number
   * @param {Number} rules.min - minimum size
   * @param {Number} rules.max - maximum size
   * @return {Property}
   */

  size(rules) {
    return this._register('size', [rules]);
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
   * prop.each({ type: String })
   * prop.each([{ type: Number }])
   * prop.each({ things: [{ type: String }]})
   * prop.each(schema)
   *
   * @param {Array|Object|Schema|Property} rules - rules to use
   * @return {Property}
   */

  each(rules) {
    this._schema.path(join('$', this.name), rules);
    return this;
  }

  /**
   * Registers paths for array elements on the parent schema, with given array of rules.
   *
   * @example
   * prop.elements([{ type: String }, { type: Number }])
   *
   * @param {Array} arr - array of rules to use
   * @return {Property}
   */

  elements(arr) {
    arr.forEach((rules, i) => {
      this._schema.path(join(i, this.name), rules);
    });
    return this;
  }

  /**
   * Registers all properties from the given object as nested properties
   *
   * @example
   * prop.properties({
   *   name: String,
   *   email: String
   * })
   *
   * @param {Object} props - properties with rules
   * @return {Property}
   */

  properties(props) {
    for (const [prop, rule] of Object.entries(props)) {
      this._schema.path(join(prop, this.name), rule);
    }
    return this;
  }

  /**
   * Proxy method for schema path. Makes chaining properties together easier.
   *
   * @example
   * schema
   *   .path('name').type(String).required()
   *   .path('email').type(String).required()
   *
   */

  path(...args) {
    return this._schema.path(...args);
  }

  /**
   * Typecast given `value`
   *
   * @example
   * prop.type(String)
   * prop.typecast(123) // => '123'
   *
   * @param {Mixed} value - value to typecast
   * @return {Mixed}
   */

  typecast(value) {
    const schema = this._schema;
    let type = this._type;

    if (!type) return value;

    if (typeof type == 'function') {
      type = type.name;
    }

    const cast = schema.typecasters[type] ||
      schema.typecasters[type.toLowerCase()];

    if (typeof cast != 'function') {
      throw new Error(`Typecasting failed: No typecaster defined for ${type}.`);
    }

    return cast(value);
  }

  /**
   * Validate given `value`
   *
   * @example
   * prop.type(Number)
   * assert(prop.validate(2) == null)
   * assert(prop.validate('hello world') instanceof Error)
   *
   * @param {Mixed} value - value to validate
   * @param {Object} ctx - the object containing the value
   * @param {String} [path] - path of the value being validated
   * @return {ValidationError}
   */

  validate(value, ctx, path = this.name) {
    const types = Object.keys(this.registry);

    for (const type of types) {
      const err = this._run(type, value, ctx, path);
      if (err) return err;
    }

    return null;
  }

  /**
   * Run validator of given `type`
   *
   * @param {String} type - type of validator
   * @param {Mixed} value - value to validate
   * @param {Object} ctx - the object containing the value
   * @param {String} path - path of the value being validated
   * @return {ValidationError}
   * @private
   */

  _run(type, value, ctx, path) {
    if (!this.registry[type]) return;
    const schema = this._schema;
    const { args, fn } = this.registry[type];
    const validator = fn || schema.validators[type];
    const valid = validator(value, ctx, ...args, path);
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
    this.registry[type] = { args, fn };
    return this;
  }

  /**
   * Create an error
   *
   * @param {String} type - type of validator
   * @param {Object} ctx - the object containing the value
   * @param {Array} args - arguments to pass
   * @param {String} path - path of the value being validated
   * @return {ValidationError}
   * @private
   */

  _error(type, ctx, args, path) {
    const schema = this._schema;

    let message = this.messages[type] ||
      this.messages.default ||
      schema.messages[type] ||
      schema.messages.default;

    if (typeof message == 'function') {
      message = message(path, ctx, ...args);
    }

    return new ValidationError(message, path);
  }
}
