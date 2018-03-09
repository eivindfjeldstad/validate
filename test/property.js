const Property = require('../lib/property');
const Schema = require('../lib/schema');

describe('Property', () => {
  it('should have a name', () => {
    const prop = new Property('test', new Schema());
    prop.name.should.eql('test');
  });

  describe('.use()', () => {
    it('should work', () => {
      const prop = new Property('test', new Schema());
      prop.use(() => false);
      prop.validate(1).should.be.an.instanceOf(Error);
    })

    it('should return an error message', () => {
      const prop = new Property('test', new Schema());
      prop.use(() => false, 'fail');
      prop.validate(1).message.should.eql('fail');
    })

    it('should support chaining', () => {
      const prop = new Property('test', new Schema());
      prop.use(() => {}).should.eql(prop)
    });
  })

  describe('.required()', () => {
    it('should work', () => {
      const prop = new Property('test', new Schema());
      prop.required();
      prop.validate(null).should.be.an.instanceOf(Error);
      prop.validate(100).should.eql(false);
    })

    it('should respect boolean argument', () => {
      const prop = new Property('test', new Schema());
      prop.required(false);
      prop.validate(null).should.eql(false);
    })

    it('should return an error with a message', () => {
      const prop = new Property('test', new Schema());
      prop.required('fail');
      prop.validate(null).message.should.eql('fail');
    })
  })

  describe('.type()', () => {
    it('should work', () => {
      const prop = new Property('test', new Schema());
      prop.type('string');
      prop.validate(1).message.should.match(/failed/);
      prop.validate('test').should.eql(false);
      prop.validate(null).should.eql(false);
    })

    it('should have a `_type` property', () => {
      const prop = new Property('test', new Schema());
      prop.type('string');
      prop._type.should.eql('string');
    })

    it('should produce an error with a message', () => {
      const prop = new Property('test', new Schema());
      prop.type('string', 'fail');
      prop.validate(1).message.should.eql('fail');
    })
  })

  describe('.match()', () => {
    it('should work', () => {
      const prop = new Property('test', new Schema());
      prop.match(/^abc$/);
      prop.validate('cab').should.be.an.instanceOf(Error);
      prop.validate('abc').should.eql(false);
      prop.validate(null).should.eql(false);
    })

    it('should produce an error with a message', () => {
      const prop = new Property('test', new Schema());
      prop.match(/^abc$/, 'fail');
      prop.validate('cab').message.should.eql('fail');
    })
  })

  describe('.length()', () => {
    it('should work', () => {
      const prop = new Property('test', new Schema());
      prop.length({ min: 2, max: 3 });
      prop.validate('abcd').should.be.an.instanceOf(Error);
      prop.validate('a').should.be.an.instanceOf(Error);
      prop.validate('abc').should.eql(false);
      prop.validate(null).should.eql(false);
    })

    it('should produce an error with a message', () => {
      const prop = new Property('test', new Schema());
      prop.length({ max: 1 }, 'fail');
      prop.validate('cab').message.should.eql('fail');
    })
  })

  describe('.each()', () => {
    it('should work', () => {
      const prop = new Property('test', new Schema());
      prop.each((val) => {
        return typeof val == 'string';
      });
      prop.validate(['abc', 2]).should.be.an.instanceOf(Error);
      prop.validate(['abc', 'efg']).should.eql(false);
    })
  })

  describe('.message()', () => {
    it('should work', () => {
      const prop = new Property('test', new Schema());
      prop.message('fail');
      prop.use((val) => val);
      prop.validate(false).message.should.equal('fail');
      prop.validate(true).should.eql(false);
    })
  })

  describe('.typecast()', () => {
    it('should work', () => {
      const prop = new Property();
      prop.type('string');
      prop.typecast(123).should.eql('123');
    })
  })

  describe('.validate()', () => {
    it('should work', () => {
      const prop = new Property();
      prop.required();
      prop.match(/^abc$/);
      prop.validate(null).should.be.an.instanceOf(Error);
      prop.validate('abc').should.eql(false);
      prop.validate('cab').should.be.an.instanceOf(Error);
    });

    it('errors should have a .path', () => {
      const prop = new Property('some.path');
      prop.required();
      prop.validate(null).path.should.equal('some.path');
    })

    it('should accept a context', () => {
      let obj;
      const prop = new Property();
      const ctx = { hello: 'world' };
      prop.use(function () { obj = this; });
      prop.validate('abc', ctx);
      obj.should.equal(ctx);
    });
  });
})
