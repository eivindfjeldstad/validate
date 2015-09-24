var Schema = require('../lib/schema');
var Property = require('../lib/property');

describe('Schema', function () {
  describe('when given an object', function () {
    it('should create properties', function () {
      var schema = new Schema({ name: { type: 'string' }});
      schema.props.should.have.property('name');
    })

    it('should create nested properties', function () {
      var schema = new Schema({
        name: {
          first: { type: 'string' },
          last: { type: 'string' }
        }
      });
      schema.props.should.have.property('name');
      schema.props.should.have.property('name.first');
      schema.props.should.have.property('name.last');
    });

    it('should pass full path to properties', function () {
      var schema = new Schema({
        name: {
          first: { type: 'string' },
          last: { type: 'string' }
        }
      });
      schema.props['name'].name.should.equal('name');
      schema.props['name.first'].name.should.equal('name.first');
      schema.props['name.last'].name.should.equal('name.last');
    })
  })

  describe('.path()', function () {
    describe('when given a path and an object', function () {
      it('should create properties', function () {
        var schema = new Schema();
        schema.path('name', { type: 'string' });
        schema.props.should.have.property('name');
      })

      it('should support nested properties', function () {
        var schema = new Schema();
        schema.path('name', { first: { type: 'string' }});
        schema.props.should.have.property('name.first');
      })

      it('should register validators', function () {
        var schema = new Schema();
        schema.path('name', { first: { required: true }});
        schema.validate({}).should.have.length(1);
      })

      it('should return a Property', function () {
        var schema = new Schema();
        schema.path('name', { type: 'string' })
          .should.be.instanceOf(Property)
          .and.have.property('name', 'name');
      })
    })
  })

  describe('.strip()', function () {
    it('should delete all keys not in the schema', function () {
      var obj = { name: 'name', age: 23 };
      var schema = new Schema({ name: { type: 'string' }});
      schema.strip(obj);
      obj.should.not.have.property('age');
      obj.should.have.property('name', 'name');
    });

    it('should work with nested objects', function () {
      var obj = { name: { first: 'first', last: 'last' }};
      var schema = new Schema({ name: { first: { type: 'string' }}});
      schema.strip(obj);
      obj.should.have.property('name');
      obj.name.should.have.property('first');
      obj.name.should.not.have.property('last');
    });
  });

  describe('.validate()', function () {
    it('should return an array of errors', function () {
      var schema = new Schema({ name: { type: 'string' }});
      var res = schema.validate({ name: 123 });
      res.should.be.an.Array.and.have.length(1);
    })

    it('should delete all keys not in the schema', function () {
      var obj = { name: 'name', age: 23 };
      var schema = new Schema({ name: { type: 'string' }});
      var res = schema.validate(obj);
      obj.should.not.have.property('age');
      obj.should.have.property('name', 'name');
    });

    describe('with strip disabled', function () {
      it('should not delete any keys', function () {
        var obj = { name: 'name', age: 23 };
        var schema = new Schema({ name: { type: 'string' }});
        var res = schema.validate(obj, { strip: false });
        obj.should.have.property('age', 23);
      });
    });

    describe('with typecasting enabled', function () {
      it('should typecast before validation', function () {
        var schema = new Schema({ name: { type: 'string' }});
        var res = schema.validate({ name: 123 }, { typecast: true });
        res.should.have.length(0);
      });

      it('should not typecast undefineds', function () {
        var schema = new Schema({ name: { type: 'string' }});
        (function () {
          schema.validate({}, { typecast: true });
        }).should.not.throw();
      });
    });
  });

  describe('.assert()', function () {
    it('should throw if validation fails', function () {
      var schema = new Schema({ name: { type: 'string' }});
      (function () {
        schema.assert({ name: 123 });
      }).should.throw(/failed/);
    })
  });
})
