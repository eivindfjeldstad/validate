const Validators = require('../lib/validators')

describe('Validators', () => {
  describe('.required()', () => {
    it('should return false if given value is null, undefined or an empty string', () => {
      Validators.required(null, {}, true).should.equal(false)
      Validators.required(undefined, {}, true).should.equal(false)
      Validators.required('', {}, true).should.equal(false)
    })

    it('should return true otherwise', () => {
      Validators.required(0, {}, true).should.equal(true)
      Validators.required(false, {}, true).should.equal(true)
      Validators.required('test', {}, true).should.equal(true)
    })

    it('should return true when boolean argument is false', () => {
      Validators.required(null, {}, false).should.equal(true)
    })
  })

  describe('.type()', () => {
    it('should return true if given value is of given type', () => {
      Validators.type(0, {}, 'number').should.equal(true)
      Validators.type('', {}, 'string').should.equal(true)
      Validators.type(true, {}, 'boolean').should.equal(true)
      Validators.type(new Date(), {}, 'date').should.equal(true)
      Validators.type([], {}, 'array').should.equal(true)
      Validators.type({}, {}, 'object').should.equal(true)
    })

    it('should return false otherwise', () => {
      Validators.type('not a number', {}, 'number').should.equal(false)
      Validators.type(1, {}, 'string').should.equal(false)
      Validators.type(1, {}, 'boolean').should.equal(false)
      Validators.type(1, {}, 'date').should.equal(false)
      Validators.type(1, {}, 'array').should.equal(false)
      Validators.type(1, {}, 'object').should.equal(false)
    })
  })

  describe('.match()', () => {
    it('should return true if given regexp matches given value', () => {
      Validators.match('abc', {}, /^abc$/).should.equal(true)
    })

    it('should return false otherwise', () => {
      Validators.match('cba', {}, /^abc$/).should.equal(false)
    })
  })

  describe('.length()', () => {
    it('should return true if given value has length between given min and max', () => {
      Validators.length('ab', {}, { min: 2, max: 4 }).should.equal(true)
      Validators.length('abc', {}, { min: 2, max: 4 }).should.equal(true)
      Validators.length('abcd', {}, { min: 2, max: 4 }).should.equal(true)
      Validators.length('abcde', {}, { min: 2 }).should.equal(true)
      Validators.length('a', {}, { max: 4 }).should.equal(true)
    })

    it('should return false otherwise', () => {
      Validators.length('a', {}, { min: 2, max: 4 }).should.equal(false)
      Validators.length('abcde', {}, { min: 2, max: 4 }).should.equal(false)
      Validators.length('a', {}, { min: 2 }).should.equal(false)
      Validators.length('abcde', {}, { max: 4 }).should.equal(false)
    })
  })

  describe('.enum()', () => {
    it('should return true if given value is included in given array', () => {
      Validators.enum('a', {}, ['a', 'b']).should.equal(true)
      Validators.enum('b', {}, ['a', 'b']).should.equal(true)
    })

    it('should return false otherwise', () => {
      Validators.enum('c', {}, ['a', 'b']).should.equal(false)
    })
  })
})
