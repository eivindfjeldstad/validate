var validate = require('./')
  , Validator = validate.Validator
  , assert = require('assert');

var tests = module.exports = {
  'test max': function () {
    assert(Validator.prototype.max.call(null, 2, 1));
    assert(!Validator.prototype.max.call(null, 2, 3));
  },
  
  'test min': function () {
    assert(Validator.prototype.min.call(null, 2, 3));
    assert(!Validator.prototype.min.call(null, 2, 1));
  },
  
  'test len': function () {
    assert(Validator.prototype.len.call(null, 2, 'ab'));
    assert(!Validator.prototype.len.call(null, 2, 'a'));
  },
  
  'test minLen': function () {
    assert(Validator.prototype.minLen.call(null, 2, 'abc'));
    assert(!Validator.prototype.minLen.call(null, 2, 'a'));
  },
  
  'test maxLen': function () {
    assert(Validator.prototype.maxLen.call(null, 3, 'ab'));
    assert(!Validator.prototype.maxLen.call(null, 3, 'abcd'));
  },
  
  'test type': function () {
    assert(Validator.prototype.type.call(null, 'string', '2'));
    assert(!Validator.prototype.type.call(null, 'string', 2));
  },
  
  'test type email': function () {
    assert(Validator.prototype.type.call(null, 'email', 'test@test.com'));
    assert(!Validator.prototype.type.call(null, 'email', 'testtest.com'));
  },
  
  'test type url': function () {
    assert(Validator.prototype.type.call(null, 'url', 'http://www.test.com'));
    assert(!Validator.prototype.type.call(null, 'url', 'test'));
  },
  
  'test type hex': function () {
    assert(Validator.prototype.type.call(null, 'hex', '#fefefe'));
    assert(!Validator.prototype.type.call(null, 'hex', '#fzfefe'));
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
    
    assert.deepEqual(validate(schema, { test: 3 }), {
      test: 3
    });
    assert.equal(validate(schema, { test: 1 }).length, 1);
  },
  
  'test nested': function () {
    var schema = { test: { nested: { max: 3 } } };
    
    assert.deepEqual(validate(schema, { test: { nested: 2 } }), {
      test: {
        nested: 2
      }
    });
    assert.equal(validate(schema, { test: { nested: 5 } }).length, 1);
  },
  
  'test array': function () {
    var schema = { 
      test: { 
        values: {
          type: 'number'
        },
        type: 'array'
      } 
    };
    
    assert.deepEqual(validate(schema, { test: [3, 2, 1] }), {
      test: [3,2,1]
    });
    assert.equal(validate(schema, { test: [3, 'b', 'a'] }).length, 2);
  },
  
  'test message': function () {
    var schema = { test: { required: true, message: 'test' } };
    
    assert.equal(validate(schema, {})[0].message, 'test');
  },
  
  'test null': function () {
    var schema = {};

    assert.equal(validate(schema, null)[0].message, 'The data is malformed');
  },

  'test integration': function () {
    var schema = {
        name    : { type: 'string', required: true }
      , email   : { type: 'email', required: true, message: "Invalid email" }
      , number  : { type: 'number', min: 1, max: 99 }
      , address : {
          street    : { type: 'string' }
        , city      : { type: 'string', required: true }
        , zip       : { type: 'string', length: 8, message: "Invalid zip" }
      }
      , array   : { type: 'array', minLen: 2, values: { type: 'number' } }
    };

    assert.deepEqual(validate(schema, {
      name: "foo",
      email: "foo@bar.com",
      number: 50,
      address: {
        street: "foos",
        city: "baz",
        deepNotPresent: true
      },
      array: [1, 2, 3],
      notPresent: true
    }), {
      name: "foo",
      email: "foo@bar.com",
      number: 50,
      address: {
        street: "foos",
        city: "baz",
      },
      array: [1, 2, 3]
    });
  },

  'test arrays': function () {
    var schema = {
        name: { type: 'array', len: 2, values: { type: 'string' } }
      , foos: { type: 'array', minLen: 1, values: { type: 'string' } }
      , bars: { type: 'array', maxLen: 3, values: { type: 'string' } }
    };

    assert.deepEqual(validate(schema, {
        name: ["foo", "bar"]
      , foos: ["foo"]
      , bars: ["bar", "bar", "bar"]
    }), {
        name: ["foo", "bar"]
      , foos: ["foo"]
      , bars: ["bar", "bar", "bar"]
    });

    assert.equal(validate(schema, {
        name: ["foo"]
      , foos: []
      , bars: ["foo", "bar", "baz", "bar"]
    }).length, 3);
  },
  
  'test object in array': function () {
    var schema1 = { a: { type: 'string' } }
      , schema2 = { b: { type: 'array', values: schema1 } }
      , values = { b: [{ a: 'test1' }, { a: 'test2' }] };
      
    assert.deepEqual(validate(schema2, values), values);
    assert.equal(validate(schema2, { 
      b: [{ a: 2 }, { a: 'test' }] 
    }).length, 1);
  },

  'test conversion of fields': function () {
    var schema1 = { a: { type: 'number', convert: increment } }
      , schema2 = { a: { type: 'array', values: schema1 } }
      , schema3 = { a: { b: schema1 } }
      , schema4 = { a: { type: 'array', values: { 
          type: 'number', convert: increment } } 
        };

    assert.deepEqual(validate(schema1, { a: 4 }), { a: 5 });
    assert.deepEqual(validate(schema2, { a: [{ a: 4 }] }), { a: [{ a: 5 }] });
    assert.deepEqual(validate(schema3, { 
      a: { b: { a: 4 } } 
    }), { a: { b: { a: 5 } } })
    assert.deepEqual(validate(schema4, { a: [4] }), { a: [5] })

    function increment(x) { return x + 1; }
  }
};

for (var t in tests)
  tests[t]();
  
console.log('Completed');