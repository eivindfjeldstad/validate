import ValidationError from '../src/error';

describe('ValidationError', () => {
  test('should accpet a message and a path', () => {
    const err = new ValidationError('hello', 'some.path');
    expect(err.message).toBe('hello');
    expect(err.path).toBe('some.path');
  });

  test('should not have enumerable properties', () => {
    const err = new ValidationError('hello', 'some.path');
    const keys = Object.keys(err);
    expect(keys.length).toBe(0);
  });
});
