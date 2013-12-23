var Schema = require('../lib/schema');
var Property = require('../lib/property');

describe('Schema', function () {
  describe('when given an object', function () {
    it('should create properties', function () {
      var schema = new Schema({ name: { type: 'string' }});
      schema.props.should.have.property('name');
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
        schema.validate({}).errors.should.have.length(1);
      })
      
      it('should return a Property', function () {
        var schema = new Schema();
        schema.path('name', { type: 'string' })
          .should.be.instanceOf(Property)
          .and.have.property('name', 'name');
      })
    })
  })
  
  describe('.validate()', function () {
    it('should return an array of error messages', function () {
      var schema = new Schema({ name: { type: 'string' }});
      var res = schema.validate({ name: 123 });
      res.errors.should.be.an.Array.and.have.length(1);
    })
    
    it('should return the accepted object', function () {
      var schema = new Schema({ name: { type: 'string' }});
      var res = schema.validate({ name: 'name', age: 23 });
      res.accepted.should.have.not.have.property('age');
      res.accepted.should.have.property('name', 'name');
    })
    
    describe('with typecasting enabled', function () {
      it('should typecast before validation', function () {
        var schema = new Schema({ name: { type: 'string' }});
        var res = schema.validate({ name: 123 }, { typecast: true });
        res.errors.should.have.length(0);
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
    
    it('should return the accepted object', function () {
      var schema = new Schema({ name: { type: 'string' }});
      var res = schema.assert({ name: 'name', age: 23 });
      res.should.have.not.have.property('age');
      res.should.have.property('name', 'name');
    })
    
    describe('with typecasting enabled', function () {
      it('should typecast before validation', function () {
        var schema = new Schema({ name: { type: 'string' }});
        (function () {
          schema.assert({ name: 123 }, { typecast: true });
        }).should.not.throw();
      });
    });
  });
})