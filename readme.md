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
  , array   : { type: 'array', minLen: 1, values: {
                type: 'number'
            } 
  }
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

