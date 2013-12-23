var Property = require('../lib/property');

describe('Property', function () {
  it('should have a name', function () {
    var prop = new Property('test');
    prop.name.should.eql('test');
  });
  
  describe('.use()', function () {
    it('should work', function () {
      var prop = new Property();
      prop.use(function () { return false; });
      prop.validate(1).should.match(/failed/);
    })
    
    it('should return an error message', function () {
      var prop = new Property();
      prop.use(function () { return false; }, 'fail');
      prop.validate(1).should.eql('fail');
    })
    
    it('should support chaining', function () {
      var prop = new Property();
      prop.use(function () {}).should.eql(prop);
    });
  })
  
  describe('.required()', function () {
    it('should work', function () {
      var prop = new Property();
      prop.required();
      prop.validate(null).should.match(/failed/);
      prop.validate(100).should.eql(false);
    })
    
    it('should return an error message', function () {
      var prop = new Property();
      prop.required('fail');
      prop.validate(null).should.eql('fail');
    })
  })
  
  describe('.type()', function () {
    it('should work', function () {
      var prop = new Property();
      prop.type('string');
      prop.validate(1).should.match(/failed/);
      prop.validate('test').should.eql(false);
      prop.validate(null).should.eql(false);
    })
    
    it('should have an `is` property', function () {
      var prop = new Property();
      prop.type('string');
      prop.is.should.eql('string');
    })
    
    it('should return an error message', function () {
      var prop = new Property();
      prop.type('string', 'fail');
      prop.validate(1).should.eql('fail');
    })
  })
  
  describe('.match()', function () {
    it('should work', function () {
      var prop = new Property();
      prop.match(/^abc$/);
      prop.validate('cab').should.match(/failed/);
      prop.validate('abc').should.eql(false);
      prop.validate(null).should.eql(false);
    })
    
    it('should return an error message', function () {
      var prop = new Property();
      prop.match(/^abc$/, 'fail');
      prop.validate('cab').should.eql('fail');
    })
  })
  
  describe('.message()', function () {
    it('should work', function () {
      var prop = new Property();
      prop.message('fail');
      prop.use(function (val) { return val });
      prop.validate(false).should.eql('fail');
      prop.validate(true).should.eql(false);
    })
  })
  
  describe('.validate()', function () {
    it('should work', function () {
      var prop = new Property();
      prop.required();
      prop.match(/^abc$/);
      prop.validate(null).should.match(/failed/);
      prop.validate('abc').should.eql(false);
      prop.validate('cab').should.match(/failed/);
    });
  });
  
})