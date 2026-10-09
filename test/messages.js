import Messages from '../src/messages';

describe('Messages', () => {
  describe('.required()', () => {
    test('should return the correct message', () => {
      expect(Messages.required('a')).toBe('a is required.');
    });
  });

  describe('.type()', () => {
    test('should return the correct message', () => {
      class A {};
      expect(Messages.type('a', {}, 'string')).toBe('a must be of type string.');
      expect(Messages.type('a', {}, A)).toBe('a must be of type A.');
    });

    test('should list the members of a union', () => {
      class A {};
      expect(Messages.type('a', {}, { anyOf: [String, Number] })).toBe('a must be of type String or Number.');
      expect(Messages.type('a', {}, { anyOf: [String, 'number', A] })).toBe('a must be of type String, number or A.');
      expect(Messages.type('a', {}, { anyOf: [String] })).toBe('a must be of type String.');
    });
  });

  describe('.match()', () => {
    test('should return the correct message', () => {
      expect(Messages.match('a', {}, /abc/)).toBe('a must match /abc/.');
    });
  });

  describe('.length()', () => {
    test('should return the correct message', () => {
      expect(Messages.length('a', {}, 2)).toBe('a must have a length of 2.');
      expect(Messages.length('a', {}, { min: 2 })).toBe('a must have a minimum length of 2.');
      expect(Messages.length('a', {}, { max: 2 })).toBe('a must have a maximum length of 2.');
      expect(Messages.length('a', {}, { min: 2, max: 4 })).toBe('a must have a length between 2 and 4.');
    });
  });

  describe('.enum()', () => {
    test('should return the correct message', () => {
      expect(Messages.enum('a', {}, ['b', 'c'])).toBe('a must be either b or c.');
    });
  });

  describe('.illegal()', () => {
    test('should return the correct message', () => {
      expect(Messages.illegal('a')).toBe('a is not allowed.');
    });
  });
});
