# Validate
Validate object properties in javascript.
[![build status](https://secure.travis-ci.org/eivindfjeldstad/validate.png)](http://travis-ci.org/eivindfjeldstad/validate)

## Example
```js
var validate = require('validate');
var user = validate();

user
  .path('username')
  .type('string')
  .required()
  .match(/[a-z]{6,12}/);

user
  .path('name.first')
  .type('string')
  .required();
  
user
  .path('name.last')
  .type('string')
  .required();
  
var errors = user.validate({
  username: 'fjodor',
  name: {
    first: 'Fjodor',
    last: 'Dostojevskij'
  }
});
```
## API
TODO

## Licence
MIT

