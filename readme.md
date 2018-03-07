# validate
Validate object properties in javascript.

[![npm version](http://img.shields.io/npm/v/validate.svg?style=flat)](https://npmjs.org/package/validate)
[![Build Status](http://img.shields.io/travis/eivindfjeldstad/validate.svg?style=flat)](https://travis-ci.org/eivindfjeldstad/validate)

## Example
```js
var schema = require('validate');
var user = schema({
  username: {
    type: 'string',
    required: true,
    length: { min: 3, max: 32 }
  },
  name: {
    type: 'string',
    required: true
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
  }
});

var errors = user.validate(obj);
```

You can also specify your own error messages by using an array:
```js
var post = schema({
  title: {
    type: 'string',
    required: [true, 'Title is required.'],
    length: [{ min: 1, max: 255 }, 'Title must be between 1 and 255 characters']
  }
  content: {
    type: 'string',
    required: [true, 'Content is required.']
  }
});

var errors = user.validate(obj);
```

Each error has a `.path`, describing the full path of the property that failed validation,
and a `.message` property.

```js
errors[0].path //=> 'address.street'
errors[0].message //=> 'Street is required.'
```

You can also add paths to a schema by using the chainable API
```js
user
  .path('username')
  .type('string')
  .required(true, 'Username is required')
  .match(/[a-z]{2,16}/, 'Username must be 2-16 chars');

user
  .path('address.zip')
  .type('string')
  .required(true, 'Zip is required')
  .match(/[0-9]+/, 'Zip must be valid')
```

## Typecasting
Values can be automatically typecasted before validation.
To enable typecasting, pass an options object to the schema constructor with `typecast` set to `true`.

```js
var user = schema({ name: 'string', age: 'number' }, { typecast: true });
```

You can override this setting by passing options to `.validate()`
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

  Validate given object. Returns an array of errors.

### Schema#assert(obj, [opts])

  Validate given object and throw if the validation fails.

### Property#use(fn, [msg])

  Use the given validation function with and optional error message.
  `fn` should accept a value and return `true` if the value is considered valid.

### Property#type(name, [msg])

  Property should be of type `name`.

### Property#required(bool, [msg])

  Property is required.

### Property#match(regexp, [msg])

  Property should match given `regexp`.

### Property#length(obj, [msg])

  Property length should be between `obj.min` and `obj.max`.

### Property#each(fn, [msg])

  Validate each value in array against given function `fn`.

### Property#message(msg)

  Set default error message for property.

## Licence
MIT
