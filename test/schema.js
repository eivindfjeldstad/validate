const Schema = require('..');
const Property = require('../lib/property');
const ValidationError = require('../lib/error');

describe('Schema', () => {
  describe('when given an object', () => {
    test('should create properties', () => {
      const schema = new Schema({ a: { type: 'string' } });
      expect(schema.props).toHaveProperty(['a']);
    });
  });

  describe('.path()', () => {
    test('should create properties', () => {
      const schema = new Schema();
      schema.path('a', { type: 'string' });
      expect(schema.props).toHaveProperty(['a']);
    });

    test('should allow type shorthand', () => {
      const schema = new Schema();
      schema.path('a', 'string');
      expect(schema.props['a']._type).toBe('string');
    });

    test('should create properties for all subpaths', () => {
      const schema = new Schema();
      schema.path('hello.planet.earth');
      expect(schema.props).toHaveProperty(['hello']);
      expect(schema.props).toHaveProperty(['hello.planet']);
      expect(schema.props).toHaveProperty(['hello.planet.earth']);
    });

    test('should support nested properties', () => {
      const schema = new Schema();
      schema.path('a', { b: { type: 'string' } });
      expect(schema.props).toHaveProperty(['a.b']);
    });

    test('should register validators', () => {
      const schema = new Schema();
      schema.path('a', { b: { required: true } });
      expect(schema.validate({})).toHaveLength(1);
    });

    test('should return a Property', () => {
      const schema = new Schema();
      expect(schema.path('a')).toBeInstanceOf(Property);
    });

    test('should work with nested schemas', () => {
      const schema1 = new Schema();
      const schema2 = new Schema();
      schema2.path('hello', { required: true });
      schema1.path('schema2', schema2).required(true);
      expect(schema1.props).toHaveProperty(['schema2.hello']);
      expect(schema1.validate({})).toHaveLength(2);
      expect(schema1.validate({ schema2: { hello: null } })).toHaveLength(1);
      expect(schema1.validate({ schema2: { hello: 'world' } })).toHaveLength(0);
    });

    test('should propagate new props from nested schema', () => {
      const schema1 = new Schema();
      const schema2 = new Schema();
      schema1.path('schema2', schema2);
      schema2.path('hello', { required: true });
      schema2.path('hello.world', { required: true });
      expect(schema1.props).toHaveProperty(['schema2.hello']);
      expect(schema1.props).toHaveProperty(['schema2.hello.world']);
    });

    describe('when given a path ending with $', () => {
      test('should set `property.type` to array', () => {
        const schema = new Schema();
        schema.path('hello.$');
        expect(schema.props.hello._type).toBe('array');
      });

      test('should apply rules to each element in the array', () => {
        const schema = new Schema();
        schema.path('hello.$').type('number');
        expect(schema.props.hello._type).toBe('array');
        expect(schema.props['hello.$']._type).toBe('number');
      });
    });
  });

  describe('.strip()', () => {
    test('should delete all keys not in the schema', () => {
      const schema = new Schema({
        a: { type: 'number' },
        b: [{ a: { type: 'number' } }],
        c: { a: { type: 'number' } }
      });

      const obj = { a: 1, b: [{ a: 1, b: 1 }, { a: 1 }], c: { a: 1, b: 1 }, d: 1 };
      schema.strip(obj);
      expect(obj).toEqual({ a: 1, b: [{ a: 1 }, { a: 1 }], c: { a: 1 } });
    });
  });

  describe('.validate()', () => {
    test('should return an array of errors', () => {
      const schema = new Schema({ name: { type: 'string' } });
      const res = schema.validate({ name: 123 });
      expect(res).toBeInstanceOf(Array);
      expect(res).toHaveLength(1);
    });

    test('should set the correct paths on the error objects', () => {
      const schema = new Schema({ things: [{ type: 'string' }] });
      const res = schema.validate({ things: ['car', 1, 3] });
      const [err1, err2] = res;
      expect(res).toHaveLength(2);
      expect(err1.path).toBe('things.1');
      expect(err1.message).toMatch(/things\.1/);
      expect(err2.path).toBe('things.2');
      expect(err2.message).toMatch(/things\.2/);
    });

    test('should work with $ a placeholder for array indices', () => {
      const schema = new Schema();
      schema.path('a.$.b').required();
      schema.path('a.$.b.$').type('string');
      schema.path('a.$.c.$.$').type('string');
      const res = schema.validate({
        a: [
          { b: ['hello', 'world'] },
          { b: ['hello', 1] },
          { c: [['hello', 'world'], ['hello', 2]] }
        ]
      });
      expect(res).toHaveLength(3);
    });

    test('should strip by default', () => {
      const schema = new Schema({ a: { type: 'number' } });
      const obj = { a: 1, b: 1 };
      schema.validate(obj);
      expect(obj).toEqual({ a: 1 });
    });

    test('should not strip array elements', () => {
      const schema = new Schema({ a: { type: 'array' } });
      const obj = { a: [1, 2, 3] };
      schema.validate(obj);
      expect(obj).toEqual({ a: [1, 2, 3] });
    });

    describe('with strip disabled', () => {
      test('should not delete any keys', () => {
        const obj = { name: 'name', age: 23 };
        const schema = new Schema({ name: { type: 'string' } });
        schema.validate(obj, { strip: false });
        expect(obj).toHaveProperty('age', 23);
      });
    });

    describe('with typecasting enabled', () => {
      test('should typecast before validation', () => {
        const schema = new Schema({ name: { type: 'string' } });
        const res = schema.validate({ name: 123 }, { typecast: true });
        expect(res).toHaveLength(0);
      });

      test('should typecast arrays and elements within arrays', () => {
        const schema = new Schema();
        schema.path('a.$.b').required();
        schema.path('a.$.b.$').type('string');
        schema.path('a.$.c.$.$').type('string');
        schema.path('b.$').type('number');

        const obj = {
          a: [{ b: ['a', 'b'] }, { b: 1, c: [['a', 'b'], ['a', 2]] }],
          b: '1,2,3,4,5'
        };

        const res = schema.validate(obj, { typecast: true });
        expect(res).toHaveLength(0);

        expect(obj).toEqual({
          a: [{ b: ['a', 'b'] }, { b: ['1'], c: [['a', 'b'], ['a', '2']] }],
          b: [1, 2, 3, 4, 5]
        });
      });

      test('should not typecast undefined', () => {
        const schema = new Schema({ name: { type: 'string' } });
        const wrap = () => schema.validate({}, { typecast: true });
        expect(wrap).not.toThrowError();
      });
    });
  });

  describe('.assert()', () => {
    test('should throw if validation fails', () => {
      const schema = new Schema({ name: { type: 'string' } });
      const wrap = () => schema.assert({ name: 123 });
      expect(wrap).toThrowError();
    });
  });

  describe('.message()', () => {
    test('should set default messages', () => {
      const schema = new Schema({ name: { required: true } });
      schema.message('required', 'test');
      const [error] = schema.validate({});
      expect(error.message).toBe('test');
    });

    test('should accept an object of name-message pairs', () => {
      const schema = new Schema({ name: { required: true } });
      schema.message({ required: 'test' });
      const [error] = schema.validate({});
      expect(error.message).toBe('test');
    });
  });

  describe('.validator()', () => {
    test('should set default validators', () => {
      const schema = new Schema({ name: { required: true } });
      schema.validator('required', () => false);
      const [error] = schema.validate({ name: 'hello' });
      expect(error.message).toBe('name is required.');
    });

    test('should accept an object of name-function pairs', () => {
      const schema = new Schema({ name: { required: true } });
      schema.validator({ required: () => false });
      const [error] = schema.validate({ name: 'hello' });
      expect(error.message).toBe('name is required.');
    });
  });

  describe('.ValidationError', () => {
    test('should expose ValidationError', () => {
      expect(Schema.ValidationError).toBe(ValidationError);
    });
  });
});
