import Schema from '../src/schema';
import Property from '../src/property';
import ValidationError from '../src/error';
import Messages from '../src/messages';

describe('Schema', () => {
  describe('when given an object', () => {
    test('should create properties', () => {
      const schema = new Schema({ a: { type: String } });
      expect(schema.props).toHaveProperty(['a']);
    });
  });

  describe('.path()', () => {
    test('should create properties', () => {
      const schema = new Schema();
      schema.path('a', { type: String });
      expect(schema.props).toHaveProperty(['a']);
    });

    test('should allow type shorthand', () => {
      const schema = new Schema();
      schema.path('a', 'string');
      schema.path('b', String);
      expect(schema.props.a._type).toBe('string');
      expect(schema.props.b._type).toBe(String);
    });

    test('should accept implicit arrays', () => {
      const schema = new Schema();
      schema.path('a', [String]);
      schema.path('b', [String, Number]);
      const errors = schema.validate({ a: ['a', 1], b: ['a', 'b'] });
      expect(errors.length).toBe(2);
      expect(errors[0].path).toBe('a.1');
      expect(errors[1].path).toBe('b.1');
    });

    test('should keep the meaning of implicit array shorthand', () => {
      const schema = new Schema();
      schema.path('a', [String]);
      schema.path('b', [String, Number]);
      expect(schema.props).toHaveProperty(['a.$']);
      expect(schema.props).toHaveProperty(['b.0']);
      expect(schema.props).toHaveProperty(['b.1']);
    });

    test('should not treat a union type as a nested object', () => {
      const schema = new Schema({ a: { type: { anyOf: [String, Number] } } });
      expect(Object.keys(schema.props)).toStrictEqual(['a']);
      expect(schema.props.a._type.anyOf).toStrictEqual([String, Number]);
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
      schema.path('a', { b: { type: String } });
      expect(schema.props).toHaveProperty(['a.b']);
    });

    test('should support implicit object type', () => {
      const schema = new Schema();
      schema.path('a', { b: { type: String } });
      expect(schema.props.a._type).toBe(Object);
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
        expect(schema.props.hello._type).toBe(Array);
      });

      test('should apply rules to each element in the array', () => {
        const schema = new Schema();
        schema.path('hello.$').type(Number);
        expect(schema.props.hello._type).toBe(Array);
        expect(schema.props['hello.$']._type).toBe(Number);
      });
    });
  });

  describe('.strip()', () => {
    test('should delete all keys not in the schema', () => {
      const schema = new Schema({
        a: { type: Number },
        b: [{ a: { type: Number } }],
        c: { a: { type: Number } }
      });

      const obj = { a: 1, b: [{ a: 1, b: 1 }, { a: 1 }], c: { a: 1, b: 1 }, d: 1 };
      schema.strip(obj);
      expect(obj).toEqual({ a: 1, b: [{ a: 1 }, { a: 1 }], c: { a: 1 } });
    });
  });

  describe('.validate()', () => {
    test('should return an array of errors', () => {
      const schema = new Schema({ name: { type: String } });
      const res = schema.validate({ name: 123 });
      expect(res).toBeInstanceOf(Array);
      expect(res).toHaveLength(1);
    });

    test('should set the correct paths on the error objects', () => {
      const schema = new Schema({ things: [{ type: String }] });
      const res = schema.validate({ things: ['car', 1, 3] });
      const [err1, err2] = res;
      expect(res).toHaveLength(2);
      expect(err1.path).toBe('things.1');
      expect(err1.message).toMatch(/things\.1/);
      expect(err2.path).toBe('things.2');
      expect(err2.message).toMatch(/things\.2/);
    });

    test('should validate union types', () => {
      const schema = new Schema({ a: { type: { anyOf: [String, Number] } } });
      expect(schema.validate({ a: 'x' })).toHaveLength(0);
      expect(schema.validate({ a: 1 })).toHaveLength(0);
      const res = schema.validate({ a: true });
      expect(res).toHaveLength(1);
      expect(res[0].path).toBe('a');
      expect(res[0].message).toBe('a must be of type String or Number.');
    });

    test('should let null and undefined pass a union type unless required', () => {
      const schema = new Schema({ a: { type: { anyOf: [String, Number] } } });
      expect(schema.validate({})).toHaveLength(0);
      expect(schema.validate({ a: null })).toHaveLength(0);

      const required = new Schema({ a: { type: { anyOf: [String, Number] }, required: true } });
      const res = required.validate({});
      expect(res).toHaveLength(1);
      expect(res[0].message).toBe('a is required.');
    });

    test('should validate union types in array elements', () => {
      const schema = new Schema({ a: [{ type: { anyOf: [String, Number] } }] });
      expect(schema.validate({ a: ['x', 1] })).toHaveLength(0);
      const res = schema.validate({ a: ['x', true] });
      expect(res).toHaveLength(1);
      expect(res[0].path).toBe('a.1');
    });

    test('should keep a union containing Array when combined with each', () => {
      const typeFirst = new Schema({ tags: { type: { anyOf: [String, Array] }, each: String } });
      const eachFirst = new Schema({ tags: { each: String, type: { anyOf: [String, Array] } } });
      const chained = new Schema();
      chained.path('tags').type({ anyOf: [String, Array] }).each(String);

      [typeFirst, eachFirst, chained].forEach(schema => {
        expect(schema.validate({ tags: 'a' })).toHaveLength(0);
        expect(schema.validate({ tags: ['a', 'b'] })).toHaveLength(0);
        const element = schema.validate({ tags: ['a', 1] });
        expect(element).toHaveLength(1);
        expect(element[0].path).toBe('tags.1');
        expect(element[0].message).toBe('tags.1 must be of type String.');
        const res = schema.validate({ tags: 5 });
        expect(res).toHaveLength(1);
        expect(res[0].message).toBe('tags must be of type String or Array.');
      });
    });

    test('should work with $ a placeholder for array indices', () => {
      const schema = new Schema();
      schema.path('a.$.b').required();
      schema.path('a.$.b.$').type(String);
      schema.path('a.$.c.$.$').type(String);
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
      const schema = new Schema({ a: { type: Number } });
      const obj = { a: 1, b: 1 };
      schema.validate(obj);
      expect(obj).toEqual({ a: 1 });
    });

    test('should not strip array elements', () => {
      const schema = new Schema({ a: { type: Array } });
      const obj = { a: [1, 2, 3] };
      schema.validate(obj);
      expect(obj).toEqual({ a: [1, 2, 3] });
    });

    describe('with strip disabled', () => {
      test('should not delete any keys', () => {
        const obj = { name: 'name', age: 23 };
        const schema = new Schema({ name: { type: String } });
        schema.validate(obj, { strip: false });
        expect(obj).toHaveProperty('age', 23);
      });
    });

    describe('with typecasting enabled', () => {
      test('should typecast before validation', () => {
        const schema = new Schema({ name: { type: String } });
        const res = schema.validate({ name: 123 }, { typecast: true });
        expect(res).toHaveLength(0);
      });

      test('should typecast arrays and elements within arrays', () => {
        const schema = new Schema();
        schema.path('a.$.b').required();
        schema.path('a.$.b.$').type(String);
        schema.path('a.$.c.$.$').type(String);
        schema.path('b.$').type(Number);

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
        const schema = new Schema({ name: { type: String } });
        const wrap = () => schema.validate({}, { typecast: true });
        expect(wrap).not.toThrowError();
      });

      test('should not typecast union types', () => {
        const schema = new Schema({ a: { type: { anyOf: [String, Number] } } });
        const obj = { a: '1' };
        expect(schema.validate(obj, { typecast: true })).toHaveLength(0);
        expect(obj.a).toBe('1');

        const invalid = { a: true };
        const res = schema.validate(invalid, { typecast: true });
        expect(invalid.a).toBe(true);
        expect(res).toHaveLength(1);
        expect(res[0].message).toBe('a must be of type String or Number.');
      });
    });

    describe('with strict mode enabled', () => {
      test('should generate errors for properties not in schema', () => {
        const schema = new Schema({
          a: Number,
          b: [{ a: Number }],
          c: { a: Number },
          d: [[{ a: Number }]]
        });

        const obj = {
          a: 1,
          b: [{ a: 1, b: 1 }, { a: 1, c: { d: 1 } }],
          c: { a: 1, b: 1 },
          d: [[{ a: 1 }, { a: 1, b: 1 }]],
          e: 1
        };

        const errors = schema.validate(obj, { strict: true });
        const messages = errors.map(e => e.message);
        const paths = errors.map(e => e.path);

        expect(messages).toStrictEqual([
          Messages.illegal('b.0.b'),
          Messages.illegal('b.1.c'),
          Messages.illegal('c.b'),
          Messages.illegal('d.0.1.b'),
          Messages.illegal('e')
        ]);
        expect(paths).toStrictEqual([
          'b.0.b',
          'b.1.c',
          'c.b',
          'd.0.1.b',
          'e'
        ]);
      });

      test('should only report undeclared properties next to a union type', () => {
        const schema = new Schema({ a: { type: { anyOf: [String, Number] } } });
        const errors = schema.validate({ a: 1, b: 1 }, { strict: true });
        expect(errors.map(e => e.message)).toStrictEqual([Messages.illegal('b')]);
      });
    });
  });

  describe('.assert()', () => {
    test('should throw if validation fails', () => {
      const schema = new Schema({ name: { type: String } });
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

  describe('.typecaster()', () => {
    test('should set default typecasters', () => {
      const obj = { name: 123 };
      const schema = new Schema({ name: { type: 'hello' } });
      schema.typecaster('hello', (val) => val.toString());
      schema.typecast(obj);
      expect(obj.name).toBe('123');
    });

    test('should set default typecasters', () => {
      const obj = { name: 123 };
      const schema = new Schema({ name: { type: 'hello' } });
      schema.typecaster({ hello: (val) => val.toString() });
      schema.typecast(obj);
      expect(obj.name).toBe('123');
    });
  });

  describe('.ValidationError', () => {
    test('should expose ValidationError', () => {
      expect(Schema.ValidationError).toBe(ValidationError);
    });
  });
});
