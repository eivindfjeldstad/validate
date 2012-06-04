# Validate
Validate object properties in javascript.

## Use
```javascript
var validate = require('validate');

var schema = {
    name    : { type: 'string', required: true }
  , email   : { type: 'email', required: true, message: "Invalid email" }
  , number  : { type: 'number', min: 1, max: 99 }
  , address : {
      street    : { type: 'string' }
    , city      : { type: 'string', required: true }
    , zip       : { type: 'string', len: 8, message: "Invalid zip" }
  }
  , array   : { type: 'array', minLen: 1, values: { type: 'number' } }
};

var data = validate(schema, { /* data to validate */ });

if (Array.isArray(data)) {
  // Handle errors
} else {
  db.insert(data, function (err) {
    // blah blah
  });
}
```
## Typecasting
You can either set ```options.cast = true```:
```javascript
var schema = { 
  test: { type: 'number', max: 5 }
};

var data = { test: '2' }; // test is a string

data = validate(schema, data, { cast: true });
console.log(typeof data.test); // number
```
Or you can specify a cast property on the schema

```javascript
var schema = {
  test: { type: 'string', cast: 'number' }
};

var data = validate(schema, { test: '2' });
console.log(typeof data.test); // number
```
This allows you to do validation on both the raw and the casted value
```javascript
var schema = {
  test: { type: 'string', len: '2', cast: { type: 'number', max: 10 } };
};
```
The cast property can also be a custom function: ```cast: function (a) {}```

## Licence
MIT

