function validate (schema, values) {
  var validator = new Validator(schema, values).run();
  return validator.errors.length ? validator.errors : null;
};

validate.re = {
    email : /^([a-z0-9_\.-]+)@([\da-z\.-]+)\.([a-z\.]{2,6})$/
  , url   : /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/
  , hex   : /^#?([a-f0-9]{6}|[a-f0-9]{3})$/
};

validate.Validator = Validator;

function Validator (schema, values) {
  this.values = values;
  this.schema = schema;
  this.errors = [];
}

Validator.prototype.walk = function (schemas, values) {
  schemas = schemas || this.schema;
  values = values || this.values;
  
  Object.keys(schemas).forEach(function (key) {
    var value = values[key]
      , schema = schemas[key];
    
    // Nested object
    if (Object.prototype.toString.call(value) === '[object Object]')
      return this.walk(schema, value);

    if (!Array.isArray(value))
      return this.validate(schema, value);
      
    for (var i = 0; i < value.length; i++)
      this.validate(schema, value[i]);
  }.bind(this));
  
  return this;
};

Validator.prototype.run = Validator.prototype.walk;

Validator.prototype.validate = function (schema, value) {
  Object.keys(schema).forEach(function (key) {
    
    if (!this[key] || !schema[key] || (!value && !schema.required)) return;
    
    if (!this[key](schema[key], value)) {
      this.errors.push(new Error(schema.message || 'Invalid'));
    }
  }.bind(this));
};

Validator.prototype.max = function (num, value) {
  return value <= num;
};

Validator.prototype.min = function (num, value) {
  return value >= num;
};

Validator.prototype.len = function (num, value) {
  return value.length === num;
};

Validator.prototype.minLen = function (num, value) {
  return value.length >= num;
};

Validator.prototype.maxLen = function (num, value) {
  return value.length <= num;
};

Validator.prototype.match = function (re, value) {
  return re.test(value);
};

Validator.prototype.type = function (type, value) {
  switch (type) {
    case 'email':
      return validate.re.email.test(value);
    case 'url':
      return validate.re.url.test(value);
    case 'hex':
      return validate.re.hex.test(value);
    case 'date':
      return value instanceof Date;
    default:
      return typeof value === type;
  }
};

Validator.prototype.required = function (bool, value) {
  return !!value;
};

module.exports = validate;