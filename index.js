function validate (schema, values, messages) {
  var validator = new Validator(schema, values);
  
  if (messages) {
    for (var m in messages)
      validator[m] = messages[m];
  }
  
  validator.run();
  return validator.errors.length ? validator.errors : validator.accepted;
};

validate.re = {
    email : /^([a-z0-9_\.-]+)@([\da-z\.-]+)\.([a-z\.]{2,6})$/
  , url   : /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/
  , hex   : /^#?([a-f0-9]{6}|[a-f0-9]{3})$/
};

validate.Validator = Validator;

function Validator (schema, values) {
  this._values = values;
  this.accepted = {};
  this.schema = schema;
  this.errors = [];
}

// Default messages
Validator.prototype.defaultMessage = 'A validation error occured';

Validator.prototype.malformedMessage = 'The data is malformed';

Validator.prototype.walk = function (schemas, values, accepted) {
  schemas = schemas || this.schema;
  values = values || this._values;
  accepted = accepted || this.accepted;
  
  if (!isObject(values)) {
    this.errors.push(new Error(this.malformedMessage));	
    return this;
  }

  Object.keys(schemas).forEach(function (key) {
    var value = values[key]
      , schema = schemas[key];

    // Nested object
    if (isObject(value)) {
      accepted[key] = {};
      return this.walk(schema, value, accepted[key]);
    }
    
    if (!Array.isArray(value)) {
      if (this.validate(schema, value) && value)
        if (schema.cast)
          this.typecast(schema.cast, values, key, accepted);
        else
          accepted[key] = value;

      return;
    }

    if (!this.validate(schema, value)) return;
    
    accepted[key] = [];
    
    value.forEach(function (field, index) {
      accepted[key][index] = {};
      
      if (isObject(field))
        return this.walk(schema.values, field, accepted[key][index]);
      
      if (this.validate(schema.values, field)) {
        if (schema.values.cast)
          return this.typecast(schema.values.cast, value, index, accepted[key]);
  
        accepted[key][index] = field;
      }
    }, this);
  }, this);
  
  return this;
};

Validator.prototype.run = Validator.prototype.walk;

Validator.prototype.validate = function (schema, value) {
  if (!value && !schema.required) return true;
  
  for (var key in schema) {
    if (!this[key] || !schema[key] || key === 'message' || key === 'cast') continue;
    
    if (!this[key](schema[key], value)) {
      this.errors.push(new Error(schema.message || this.defaultMessage));
      return false;
    }
  }

  return true;
};

Validator.prototype.typecast = function (type, parent, key, accepted) {
  var value = parent[key]
    , temp = {}
    , schema = {};

  if (typeof type === 'function')
    return accepted[key] = type.call(this, value);
  
  if (isObject(type)) {
    if (!type.type)
      throw new Error('Typecasting requires a type');
      
    schema[key] = type; 
    
    this.typecast(type.type, parent, key, temp);
    return this.walk(schema, temp, accepted);
  }

  switch (type) {
    case 'number':
      value = parseInt(value, 10);
      if (isNaN(value))
        this.errors.push(new Error('blah'));
  }

  return accepted[key] = value;
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
    case 'array':
      return Array.isArray(value);
    default:
      return typeof value === type;
  }
};

Validator.prototype.required = function (bool, value) {
  return !!value;
};

function isObject (obj) {
  return Object.prototype.toString.call(obj) === '[object Object]';
}

module.exports = validate;