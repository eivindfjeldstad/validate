# validate
Validate object properties in javascript.

[![Build Status](https://travis-ci.org/eivindfjeldstad/validate.svg?branch=master)](https://travis-ci.org/eivindfjeldstad/validate)

## Example
```js
var schema = require('validate');
var user = schema({
  name: {
    type: 'string',
    required: true,
    message: 'name is required'
  },
  email: {
    type: 'string',
    required: true,
    match: /+\@.+\..+/,
    message: 'email must be valid'
  },
  address: {
    street: {
      type: 'string',
      required: true
    },
    city: {
      type: 'string',
      required: true
    }
  },
});
  
var errors = user.validate(obj);
```

You can also add paths to a schema by using the chainable API 
```js
user
  .path('username')
  .type('string')
  .required()
  .match(/[a-z]{2,16}/)
  .message('username must be 2-16 chars');

user
  .path('address.zip')
  .type('string')
  .required()
  .match(/[0-9]+/)
  .message('zip is required');
```

## Typecasting
Values can be automatically typecasted before validation.
To enable typecasting, pass an options object to the schema constructor with `typecast` set to `true`.
You can override this setting by passing options to ```.validate()```

```js
var user = schema({
  name: { type: 'string' },
  age: { type: 'number' }
}, { typecast: true });
```

To override
```js
user.validate(obj, { typecast: false });
```

## Property stripping
By default, all values not defined in the schema will be stripped from the object.
Set `.strip = false` on the options object to disable this behavior.

## API
### schema(paths, [opts])

  Creates a new `Schema` with the given paths.

### Schema#path(path, [rules])

  Add path to schema with optional rules. Returns a `Property`.

### Schema#validate(obj, [opts])

  Validate given object. Returns an object containing an array of error messages,
  `.errors`, and the accepted object, `.accepted`.
  
### Schema#assert(obj, [opts])

  Validate given object and throw if the validation fails. Returns the accepted object.

### Property#use(fn, [msg])

  Use the given validation function with and optional error message.
  `fn` should accept a value and return `true` if the value is considered valid.

### Property#type(name, [msg])

  Property should be of type `name`.

### Property#required(bool, [msg])

  Property is required.

### Property#match(regexp, [msg])

  Proprety should match given `regexp`.
  
### Property#message(msg)

  Set default error message for property.

## Licence
MIT

