function validate (schema, values, messages) {
  var validator = new Validator(schema, values).run();
  if (messages && messages.defaultMessage) {
    validator.defaultMessage = messages.defaultMessage;
  }
  if (messages && messages.malformedMessage) {
    validator.malformedMessage = messages.malformedMessage;
  }
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

  if (Object.prototype.toString.call(values) !== '[object Object]') {
    this.errors.push(new Error(this.malformedMessage));
    return this;
  }
  
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

    if (schema.arrayMinLen || schema.arrayMaxLen 
      || schema.arrayLen || schema.array
    ) {
      var arraySchema = {
          arrayMinLen: schema.arrayMinLen
        , arrayMaxLen: schema.arrayMaxLen
        , arrayLen: schema.arrayLen
        , array: schema.array
      };

      schema = Object.create(schema);
      schema.arrayMinLen = null;
      schema.arrayMaxLen = null;
      schema.arrayLen = null;
      schema.array = null;

      allValid = this.validate(arraySchema, value) && allValid;
    }

    for (var i = 0; i < value.length; i++) {
      var item = value[i]
      if (Object.prototype.toString.call(item) === '[object Object]') {
        var object = {};
        allValid = this.walk(schema, item, object) && allValid;
        value[i] = object;
      } else {
        allValid = this.validate(schema, item) && allValid;  
      }
    }

    if (allValid) accepted[key] = value;
  }, this);
  
  return this;
};

Validator.prototype.run = Validator.prototype.walk;

Validator.prototype.validate = function (schema, value) {
  if (!value && !schema.required) return true;
  
  for (var key in schema) {
    if (!this[key] || !schema[key] || key === "message") continue;
    
    if (!this[key](schema[key], value)) {
      this.errors.push(new Error(schema.message || this.defaultMessage));
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


Validator.prototype.defaultMessage = "A validation error occurred";

Validator.prototype.malformedMessage = "The data is malformed";

Validator.prototype.array = function (bool, value) {
  return Array.isArray(value);
};

Validator.prototype.arrayMinLen = Validator.prototype.minLen;

Validator.prototype.arrayMaxLen = Validator.prototype.maxLen;

Validator.prototype.arrayLen = Validator.prototype.len

module.exports = validate;