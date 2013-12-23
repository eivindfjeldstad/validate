# validate
Validate object properties in javascript.

[![Build Status](https://travis-ci.org/eivindfjeldstad/validate.png?branch=master)](https://travis-ci.org/eivindfjeldstad/validate)

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
  
var res = user.validate(obj);
res.errors; // array of error messages
res.accepted; // the accepted object
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

