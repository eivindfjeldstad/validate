var Property = require('../lib/property');
var Schema = require('../lib/schema');

describe('Property', function () {
  it('should have a name', function () {
    var prop = new Property('test', Schema());
    prop.name.should.eql('test');
  });

  describe('.use()', function () {
    it('should work', function () {
      var prop = new Property('test', Schema());
      prop.use(function () { return false; });
      prop.validate(1).should.be.an.instanceOf(Error);
    })

    it('should return an error message', function () {
      var prop = new Property('test', Schema());
      prop.use(function () { return false; }, 'fail');
      prop.validate(1).message.should.eql('fail');
    })

    it('should support chaining', function () {
      var prop = new Property('test', Schema());
      prop.use(function () {}).should.eql(prop);
    });
  })

  describe('.required()', function () {
    it('should work', function () {
      var prop = new Property('test', Schema());
      prop.required();
      prop.validate(null).should.be.an.instanceOf(Error);
      prop.validate(100).should.eql(false);
    })

    it('should respect boolean argument', function () {
      var prop = new Property('test', Schema());
      prop.required(false);
      prop.validate(null).should.eql(false);
    })

    it('should return an error with a message', function () {
      var prop = new Property('test', Schema());
      prop.required('fail');
      prop.validate(null).message.should.eql('fail');
    })
  })

  describe('.type()', function () {
    it('should work', function () {
      var prop = new Property('test', Schema());
      prop.type('string');
      prop.validate(1).should.match(/failed/);
      prop.validate('test').should.eql(false);
      prop.validate(null).should.eql(false);
    })

    it('should have a `_type` property', function () {
      var prop = new Property('test', Schema());
      prop.type('string');
      prop._type.should.eql('string');
    })

    it('should produce an error with a message', function () {
      var prop = new Property('test', Schema());
      prop.type('string', 'fail');
      prop.validate(1).message.should.eql('fail');
    })
  })

  describe('.match()', function () {
    it('should work', function () {
      var prop = new Property('test', Schema());
      prop.match(/^abc$/);
      prop.validate('cab').should.be.an.instanceOf(Error);
      prop.validate('abc').should.eql(false);
      prop.validate(null).should.eql(false);
    })

    it('should produce an error with a message', function () {
      var prop = new Property('test', Schema());
      prop.match(/^abc$/, 'fail');
      prop.validate('cab').message.should.eql('fail');
    })
  })

  describe('.each()', function () {
    it('should work', function () {
      var prop = new Property('test', Schema());
      prop.each(function (val) {
        return typeof val == 'string';
      });
      prop.validate(['abc', 2]).should.be.an.instanceOf(Error);
      prop.validate(['abc', 'efg']).should.eql(false);
    })
  })

  describe('.message()', function () {
    it('should work', function () {
      var prop = new Property('test', Schema());
      prop.message('fail');
      prop.use(function (val) { return val });
      prop.validate(false).message.should.equal('fail');
      prop.validate(true).should.eql(false);
    })
  })

  describe('.typecast()', function () {
    it('should work', function () {
      var prop = new Property();
      prop.type('string');
      prop.typecast(123).should.eql('123');
    })
  })

  describe('.validate()', function () {
    it('should work', function () {
      var prop = new Property();
      prop.required();
      prop.match(/^abc$/);
      prop.validate(null).should.be.an.instanceOf(Error);
      prop.validate('abc').should.eql(false);
      prop.validate('cab').should.be.an.instanceOf(Error);
    });

    it('errors should have a .path', function () {
      var prop = new Property('some.path');
      prop.required();
      prop.validate(null).path.should.equal('some.path');
    })

    it('should accept a context', function () {
      var obj;
      var prop = new Property();
      var ctx = { hello: 'world' };
      prop.use(function () { obj = this; });
      prop.validate('abc', ctx);
      obj.should.equal(ctx);
    });
  });
})
