import Validators from '../src/validators';

describe('Validators', () => {
  describe('.required()', () => {
    test('should return false if given value is null, undefined or an empty string', () => {
      expect(Validators.required(null, {}, true)).toBe(false);
      expect(Validators.required(undefined, {}, true)).toBe(false);
      expect(Validators.required('', {}, true)).toBe(false);
    });

    test('should return true otherwise', () => {
      expect(Validators.required(0, {}, true)).toBe(true);
      expect(Validators.required(false, {}, true)).toBe(true);
      expect(Validators.required('test', {}, true)).toBe(true);
    });

    test('should return true when boolean argument is false', () => {
      expect(Validators.required(null, {}, false)).toBe(true);
    });
  });

  describe('.type()', () => {
    test('should return true if given value is of given type', () => {
      expect(Validators.type(0, {}, 'number')).toBe(true);
      expect(Validators.type('', {}, 'string')).toBe(true);
      expect(Validators.type(true, {}, 'boolean')).toBe(true);
      expect(Validators.type(new Date(), {}, 'date')).toBe(true);
      expect(Validators.type([], {}, 'array')).toBe(true);
      expect(Validators.type({}, {}, 'object')).toBe(true);
    });

    test('should return true if given value null or undefined', () => {
      expect(Validators.type(null, {}, 'string')).toBe(true);
      expect(Validators.type(undefined, {}, 'string')).toBe(true);
    });

    test('should accept a constructor as type', () => {
      class A {};
      expect(Validators.type(new A(), {}, A)).toBe(true);
      expect(Validators.type('', {}, A)).toBe(false);
    });

    test('should return false otherwise', () => {
      expect(Validators.type('not a number', {}, 'number')).toBe(false);
      expect(Validators.type(1, {}, 'string')).toBe(false);
      expect(Validators.type(1, {}, 'boolean')).toBe(false);
      expect(Validators.type(1, {}, 'date')).toBe(false);
      expect(Validators.type(1, {}, 'array')).toBe(false);
      expect(Validators.type(1, {}, 'object')).toBe(false);
    });
  });

  describe('.match()', () => {
    test('should return true if given regexp matches given value', () => {
      expect(Validators.match('abc', {}, /^abc$/)).toBe(true);
    });

    test('should return true if given value null or undefined', () => {
      expect(Validators.match(null, {}, /^abc$/)).toBe(true);
      expect(Validators.match(undefined, {}, /^abc$/)).toBe(true);
    });

    test('should return false otherwise', () => {
      expect(Validators.match('cba', {}, /^abc$/)).toBe(false);
    });
  });

  describe('.length()', () => {
    test(
      'should return true if given value has length between given min and max',
      () => {
        expect(Validators.length('ab', {}, { min: 2, max: 4 })).toBe(true);
        expect(Validators.length('abc', {}, { min: 2, max: 4 })).toBe(true);
        expect(Validators.length('abcd', {}, { min: 2, max: 4 })).toBe(true);
        expect(Validators.length('abcde', {}, { min: 2 })).toBe(true);
        expect(Validators.length('a', {}, { max: 4 })).toBe(true);
      }
    );

    test('should return true if given value null or undefined', () => {
      expect(Validators.length(null, {}, { min: 2, max: 4 })).toBe(true);
      expect(Validators.length(undefined, {}, { min: 2, max: 4 })).toBe(true);
    });

    test('should return false otherwise', () => {
      expect(Validators.length('a', {}, { min: 2, max: 4 })).toBe(false);
      expect(Validators.length('abcde', {}, { min: 2, max: 4 })).toBe(false);
      expect(Validators.length('a', {}, { min: 2 })).toBe(false);
      expect(Validators.length('abcde', {}, { max: 4 })).toBe(false);
    });

    test('should work with a number as an exact length', () => {
      expect(Validators.length('a', {}, 2)).toBe(false);
      expect(Validators.length('ab', {}, 2)).toBe(true);
    });
  });

  describe('.size()', () => {
    test(
      'should return true if given value has size between given min and max',
      () => {
        expect(Validators.size(2, {}, { min: 2, max: 4 })).toBe(true);
        expect(Validators.size(3, {}, { min: 2, max: 4 })).toBe(true);
        expect(Validators.size(4, {}, { min: 2, max: 4 })).toBe(true);
        expect(Validators.size(5, {}, { min: 2 })).toBe(true);
        expect(Validators.size(1, {}, { max: 4 })).toBe(true);
      }
    );

    test('should return true if given value null or undefined', () => {
      expect(Validators.size(null, {}, { min: 2, max: 4 })).toBe(true);
      expect(Validators.size(undefined, {}, { min: 2, max: 4 })).toBe(true);
    });

    test('should return false otherwise', () => {
      expect(Validators.size(1, {}, { min: 2, max: 4 })).toBe(false);
      expect(Validators.size(5, {}, { min: 2, max: 4 })).toBe(false);
      expect(Validators.size(1, {}, { min: 2 })).toBe(false);
      expect(Validators.size(5, {}, { max: 4 })).toBe(false);
    });

    test('should work with a number as an exact size', () => {
      expect(Validators.size(1, {}, 2)).toBe(false);
      expect(Validators.size(2, {}, 2)).toBe(true);
    });
  });

  describe('.enum()', () => {
    test('should return true if given value is included in given array', () => {
      expect(Validators.enum('a', {}, ['a', 'b'])).toBe(true);
      expect(Validators.enum('b', {}, ['a', 'b'])).toBe(true);
    });

    test('should return true if given value null or undefined', () => {
      expect(Validators.enum(null, {}, ['a', 'b'])).toBe(true);
      expect(Validators.enum(undefined, {}, ['a', 'b'])).toBe(true);
    });

    test('should return false otherwise', () => {
      expect(Validators.enum('c', {}, ['a', 'b'])).toBe(false);
    });
  });
});
