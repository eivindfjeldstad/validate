# validate
Validate object properties in javascript.

[![Build Status](https://travis-ci.org/eivindfjeldstad/validate.png?branch=master)](https://travis-ci.org/eivindfjeldstad/validate)

## Example
```js
var validate = require('validate');
var user = validate();

user
  .path('username')
  .type('string')
  .required()
  .match(/[a-z]{2,16}/)
  .message('username must be 2-16 chars');

user
  .path('name.first')
  .type('string')
  .required()
  .message('first name is required');
  
user
  .path('name.last')
  .type('string')
  .required()
  .message('last name is required');
  
var res = user.validate(obj);

res.errors; // array of errors or null
res.accepted; // the accepted object
```

You can also define a schema by passing an object
```js
var user = validate({
  name: { type: 'string', required: true },
  age: { type: 'number' }
});

// add another path
user.path('email', { 
  type: 'string',
  required: true,
  message: 'email is required'
});
```
## API
TODO

## Licence
MIT

