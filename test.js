var validate = require('./')
  , Validator = validate.Validator
  , assert = require('assert');

var tests = module.exports = {
  'test type': function () {
    assert(Validator.prototype.type.call(null, 'string', '2'));
    assert(!Validator.prototype.type.call(null, 'string', 2));
  },
  
  'test max': function () {
    assert(Validator.prototype.max.call(null, 2, 1));
    assert(!Validator.prototype.max.call(null, 2, 3));
  },
  
  'test min': function () {
    assert(Validator.prototype.min.call(null, 2, 3));
    assert(!Validator.prototype.min.call(null, 2, 1));
  },
  
  'test email': function () {
    assert(Validator.prototype.email.call(null, true, 'test@test.com'));
    assert(!Validator.prototype.email.call(null, true, 'testtest.com'));
  },
  
  'test url': function () {
    assert(Validator.prototype.url.call(null, true, 'http://www.test.com'));
    assert(!Validator.prototype.url.call(null, true, 'test'));
  },
  
  'test required': function () {
    assert(Validator.prototype.required.call(null, true, 'test'));
    assert(!Validator.prototype.required.call(null, true, ''));
  },
  
  'test match': function () {
    assert(Validator.prototype.match.call(null, (/[a-z]/), 'test'));
    assert(!Validator.prototype.match.call(null, (/[a-z]/), 1));
  },
  
  'test validate': function () {
    var schema = { test: { min: 2 } };
    
    assert(!validate(schema, { test: 3 }));
    assert.equal(validate(schema, { test: 1 }).length, 1);
  },
  
  'test nested': function () {
    var schema = { test: { nested: { max: 3 } } };
    
    assert(!validate(schema, { test: { nested: 2 } }));
    assert.equal(validate(schema, { test: { nested: 5 } }).length, 1);
  },
  
  'test array': function () {
    var schema = { test: { type: 'number' } };
    
    assert(!validate(schema, { test: [3, 2, 1] }));
    assert.equal(validate(schema, { test: [3, 'b', 'a'] }).length, 2);
  },
  
  'test message': function () {
    var schema = { test: { required: true, message: 'test' } };
    
    assert.equal(validate(schema, {})[0].message, 'test');
  }
};

for (var t in tests)
  tests[t]();
  
console.log('Completed');