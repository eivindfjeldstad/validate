const Schema = require('../lib/schema');
const Property = require('../lib/property');

describe('Schema', () => {
  describe('when given an object', () => {
    it('should create properties', () => {
      const schema = new Schema({ name: { type: 'string' }});
      schema.props.should.have.property('name');
    })

    it('should create nested properties', () => {
      const schema = new Schema({ name: { first: { type: 'string' }, last: { type: 'string' }}});
      schema.props.should.have.property('name');
      schema.props.should.have.property('name.first');
      schema.props.should.have.property('name.last');
    });

    it('should pass full path to properties', () => {
      const schema = new Schema({ name: { first: { type: 'string' }, last: { type: 'string' }}});
      schema.props['name'].name.should.equal('name');
      schema.props['name.first'].name.should.equal('name.first');
      schema.props['name.last'].name.should.equal('name.last');
    })

    it('should allow type shorthand', () => {
      const schema = new Schema({ name: { first: 'string', last: 'string' }, age: 'number' });
      schema.props['name.first']._type.should.equal('string');
      schema.props['name.last']._type.should.equal('string');
      schema.props['age']._type.should.equal('number');
    });
  })

  describe('.path()', () => {
    describe('when given a path and an object', () => {
      it('should create properties', () => {
        const schema = new Schema();
        schema.path('name', { type: 'string' });
        schema.props.should.have.property('name');
      })

      it('should support nested properties', () => {
        const schema = new Schema();
        schema.path('name', { first: { type: 'string' }});
        schema.props.should.have.property('name.first');
      })

      it('should register validators', () => {
        const schema = new Schema();
        schema.path('name', { first: { required: true }});
        schema.validate({}).should.have.length(1);
      })

      it('should return a Property', () => {
        const schema = new Schema();
        schema.path('name', { type: 'string' })
          .should.be.instanceOf(Property)
          .and.have.property('name', 'name');
      })
    })
  })

  describe('.strip()', () => {
    it('should delete all keys not in the schema', () => {
      const obj = { name: 'name', age: 23 };
      const schema = new Schema({ name: { type: 'string' }});
      schema.strip(obj);
      obj.should.not.have.property('age');
      obj.should.have.property('name', 'name');
    });

    it('should work with nested objects', () => {
      const obj = { name: { first: 'first', last: 'last' }};
      const schema = new Schema({ name: { first: { type: 'string' }}});
      schema.strip(obj);
      obj.should.have.property('name');
      obj.name.should.have.property('first');
      obj.name.should.not.have.property('last');
    });
  });

  describe('.validate()', () => {
    it('should return an array of errors', () => {
      const schema = new Schema({ name: { type: 'string' }});
      const res = schema.validate({ name: 123 });
      res.should.be.an.Array();
      res.should.have.length(1);
    })

    it('should delete all keys not in the schema', () => {
      const obj = { name: 'name', age: 23 };
      const schema = new Schema({ name: { type: 'string' }});
      const res = schema.validate(obj);
      obj.should.not.have.property('age');
      obj.should.have.property('name', 'name');
    });

    describe('with strip disabled', () => {
      it('should not delete any keys', () => {
        const obj = { name: 'name', age: 23 };
        const schema = new Schema({ name: { type: 'string' }});
        const res = schema.validate(obj, { strip: false });
        obj.should.have.property('age', 23);
      });
    });

    describe('with typecasting enabled', () => {
      it('should typecast before validation', () => {
        const schema = new Schema({ name: { type: 'string' }});
        const res = schema.validate({ name: 123 }, { typecast: true });
        res.should.have.length(0);
      });

      it('should not typecast undefineds', () => {
        const schema = new Schema({ name: { type: 'string' }});
        (() => {
          schema.validate({}, { typecast: true });
        }).should.not.throw();
      });
    });
  });

  describe('.assert()', () => {
    it('should throw if validation fails', () => {
      const schema = new Schema({ name: { type: 'string' }});
      (() => {
        schema.assert({ name: 123 });
      }).should.throw(/failed/);
    })
  });
})
