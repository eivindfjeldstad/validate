function validate (schema, values) {
  var validator = new Validator(schema, values).run();
  return validator.errors.length ? validator.errors : validator.accepted;
};

validate.re = {
    email : /^([a-z0-9_\.-]+)@([\da-z\.-]+)\.([a-z\.]{2,6})$/
  , url   : /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/
  , hex   : /^#?([a-f0-9]{6}|[a-f0-9]{3})$/
};

validate.Validator = Validator;

function Validator (schema, values) {
  this.values = values;
  this.accepted = {};
  this.schema = schema;
  this.errors = [];
}

Validator.prototype.walk = function (schemas, values, accepted) {
  schemas = schemas || this.schema;
  values = values || this.values;
  accepted = accepted || this.accepted;
  
  Object.keys(schemas).forEach(function (key) {
    var value = values[key]
      , schema = schemas[key]
      , allValid = true;
    
    // Nested object
    if (Object.prototype.toString.call(value) === '[object Object]') {
      accepted[key] = {}
      return this.walk(schema, value, accepted[key]);
    }

    if (!Array.isArray(value)) {
      if (this.validate(schema, value) && value !== undefined)
        accepted[key] = value;
        
      return;
    }

    for (var i = 0; i < value.length; i++)
      allValid = this.validate(schema, value[i]) && allValid;

    if (allValid) accepted[key] = value;
  }, this);
  
  return this;
};

Validator.prototype.run = Validator.prototype.walk;

Validator.prototype.validate = function (schema, value) {
  if (!value && !schema.required) return true;
  
  for (var key in schema) {
    if (key === "message") continue;

    if (!this[key] || !schema[key]) return false;
    
    if (!this[key](schema[key], value)) {
      this.errors.push(new Error(schema.message || 'Invalid'));
      return false;
    }
  }

  return true;
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