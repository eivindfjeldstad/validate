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
    this._queue = [];
    this._schema = schema;
    this._type = null;
    this.messages = schema.messages();
    this.validators = schema.validators();
  }

  /**
   * Mount given `schema` on current path.
   *
   * @example
   * const user = new Schema({ email: 'string' });
   * prop.schema(user);
   *
   * @param {Schema} schema - the schema to mount
   * @return {Property}
   */

  schema(schema) {
    this._schema.path(this.name, schema);
    return this;
  }

  /**
   * Validate with given `fn` and optional `message`.
   *
   * @example
   * prop.use(val => val == 2);
   *
   * @param {Function} fn - validation function to call
   * @param {Function|String} [message] - error message to use
   * @return {Property}
   */

  use(fn, message) {
    return this._register('use', [fn], message);
  }

  /**
   * Registers a validator that checks for presence.
   *
   * @example
   * prop.required()
   *
   * @param {Boolean} [bool] - `true` if required, `false` otherwise
   * @param {Function|String} [message] - error message to use
   * @return {Property}
   */

  required(bool = true, message) {
    return this._register('required', [bool], message);
  }

  /**
   * Registers a validator that checks if a value is of a given `type`
   *
   * @example
   * prop.type('string')
   *
   * @param {String} type - type to check for
   * @param {Function|String} [message] - error message to use
   * @return {Property}
   */

  type(type, message) {
    this._type = type;
    return this._register('type', [type], message);
  }

  /**
   * Registers a validator that checks length.
   *
   * @example
   * prop.length({ min: 8, max: 255 })
   *
   * @param {Object} rules - object with `.min` and `.max` properties
   * @param {Number} rules.min - minimum length
   * @param {Number} rules.max - maximum length
   * @param {Function|String} [message] - error message to use
   * @return {Property}
   */

  length(rules, message) {
    return this._register('length', [rules], message);
  }

  /**
   * Registers a validator that checks if a value matches given `regexp`.
   *
   * @example
   * prop.match(/some\sregular\sexpression/)
   *
   * @param {RegExp} regexp - regular expression to match
   * @param {Function|String} [message] - error message to use
   * @return {Property}
   */

  match(regexp, message) {
    return this._register('match', [regexp], message);
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
   * @param {Function|String} [message] - error message to use
   * @return {Property}
   */

  each(rules) {
    this._schema.path(`${this.name}.$`, rules);
    return this;
  }

  /**
   * Proxy method for schema path. Allows chaining properties together.
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
    const queue = this._queue;

    for (let [name, args, message] of queue) {
      const validator = this.validators[name];
      const valid = validator.call(ctx, value, ctx, ...args);
      if (!valid) return this._error(name, args, message, path);
    }

    return false;
  }

  /**
   * Register validator
   *
   * @param {String} name
   * @param {Array} [args]
   * @param {Function|String} message
   * @return {Property}
   * @private
   */

  _register(name, args, message) {
    this._queue.push([name, args, message]);
    return this;
  }

  /**
   * Create an error
   *
   * @param {Property} prop
   * @param {String} message
   * @param {Array} args
   * @return {Error}
   * @private
   */

  _error(validator, args, message = this.messages[validator], path) {
    if (typeof message == 'function') {
      message = message(path, ...args)
    }
    const err = new Error(message);
    err.path = path;
    return err;
  }
}

module.exports = Property;
