# Validate
Validate object properties in javascript

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
    , zip       : { type: 'string', length: 8, message: "Invalid zip" }
  }
  , array   : { type: 'number' }
};

var errors = validate(schema, { /* data to validate */ });

```

