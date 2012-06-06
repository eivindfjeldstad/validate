function validate (schema, values, options) {
  var validator;
  
  options = options || validate.options;
  validator = new Validator(schema, values, options).run();
  
  return validator.errors.length 
    ? validator.errors
    : validator.accepted;
}

validate.re = {
    email : /^([a-z0-9_\.-]+)@([\da-z\.-]+)\.([a-z\.]{2,6})$/
  , url   : /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/
  , hex   : /^#?([a-f0-9]{6}|[a-f0-9]{3})$/
};

validate.Validator = Validator;

function Validator (schema, object, options) {
  this.object = object;
  this.accepted = {};
  this.schema = schema;
  this.errors = [];
  
  for (var o in options)
    this[o] = options[o];
}

// Default message
Validator.prototype.defaultMessage = 'A validation error occured';

// Malformed data
Validator.prototype.malformedMessage = 'The data is malformed';

Validator.prototype.walk = function (schema, object, accepted) {
  schema = schema || this.schema;
  object = object || this.object;
  accepted = accepted || this.accepted;

  if (!isObject(object)) {
    this.errors.push(new Error(this.malformedMessage));
    return this;
  }
  
  Object.keys(schema).forEach(function (key) {
    var args = schema[key]
      , fields = object[key];

    if (isObject(fields)) {
      accepted[key] = {};
      return this.walk(args, fields, accepted[key]);
    }
    
    if (!Array.isArray(fields)) {
      if (!this.cast && this.validate(args, fields) && fields)
        accepted[key] = fields;
      
      if (this.cast || args.cast)
        this.typecast(args, object, key, accepted);
        
      return;
    }
    
    if (!this.validate(args, fields)) return;

    accepted[key] = [];
    
    fields.forEach(function (value, index) {
      var schema = args.values;

      if (isObject(value)) {
        accepted[key][index] = {};
        return this.walk(schema, value, accepted[key][index]);
      }
      
      if (!this.cast && this.validate(schema, value))
        accepted[key][index] = value;
      
      if (this.cast || schema.cast)
        this.typecast(schema, fields, index, accepted[key]);
    }, this);
  }, this);
  
  return this;
}

Validator.prototype.run = Validator.prototype.walk;

Validator.prototype.validate = function (schema, value, ignore) {
  var message = schema.message || this.defaultMessage
    , skip = false
    , valid = true;

  if (!value && !schema.required) return true;
  
  for (var key in schema) {
    skip = ['message', 'cast', 'values'].indexOf(key) >= 0;
    valid = this[key] && this[key](schema[key], value);
    
    if (skip || valid) continue;
    
    if (!ignore)
      this.errors.push(new Error(message));
      
    return false;
  }

  return true;
};

Validator.prototype.typecast = function (schema, parent, key, accepted) {
  var value = parent[key]
    , temp = {}
    , field = {}
    , message = schema.message || this.defaultMessage
    , type = schema.cast || schema.type;
  
  if (!value && this.validate(schema, value, true))
    return accepted[key] = value;
  
  if (isObject(type)) {
    if (!type.type)
      throw new Error('Typecasting requires a type');
      
    field[key] = type;
    
    this.typecast(type, parent, key, temp);
    return this.walk(field, temp, accepted);
  }

  switch (type) {
    case undefined:
      break;
    case 'number':
      value = parseInt(value, 10);
      if (!isNaN(value)) break;
      return this.errors.push(new Error(message));
    case 'email':
    case 'url':
    case 'hex':
    case 'string':
      value = value.toString();
      break;
    case 'date':
      value = new Date(value);
      if (!isNaN(value.getTime())) break;
      return this.errors.push(new Error(message))
    case 'regexp':
      value = new RegExp(value);
      break;
    case 'boolean':
      value = value && value !== 'false';
      break;
    default:
      value = type.call(this, value);
  }
  
  if (!this.cast || this.validate(schema, value))
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
    case 'regexp':
      return value instanceof RegExp;
    case 'array':
      return Array.isArray(value);
    default:
      return typeof value === type;
  }
};

Validator.prototype.custom = function (fn, value) {
  return fn.call(this, value);
};

Validator.prototype.required = function (bool, value) {
  return !!value;
};

function isObject (obj) {
  return Object.prototype.toString.call(obj) === '[object Object]';
}

module.exports = validate;