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
        schema.validate({}).length.should.eql(1);
        var err = schema.validate({ name: { first: 'abc' }});
        (err === null).should.be.ok;
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
    it('should return an array of errors', function () {
      var schema = new Schema({ name: { type: 'string' }});
      schema.validate({ name: 123 }).should.be.an.Array.and.have.length(1);
    })
    
    it('should return null if no errors were found', function () {
      var schema = new Schema({ name: { type: 'string' }});
      var err = schema.validate({ name: 'name' });
      (err === null).should.be.ok;
    })
    
    describe('with typecasting enabled', function () {
      it('should typecast before validation', function () {
        var schema = new Schema({ name: { type: 'string' }});
        var err = schema.validate({ name: 'name' }, { typecast: true });
        (err === null).should.be.ok;
      });
    });
  });
})