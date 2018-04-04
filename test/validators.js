const { expect } = require('chai')
const Validators = require('../lib/validators')

describe('Validators', () => {
  describe('.required()', () => {
    it('should return false if given value is null, undefined or an empty string', () => {
      expect(Validators.required(null, {}, true)).to.equal(false)
      expect(Validators.required(undefined, {}, true)).to.equal(false)
      expect(Validators.required('', {}, true)).to.equal(false)
    })

    it('should return true otherwise', () => {
      expect(Validators.required(0, {}, true)).to.equal(true)
      expect(Validators.required(false, {}, true)).to.equal(true)
      expect(Validators.required('test', {}, true)).to.equal(true)
    })

    it('should return true when boolean argument is false', () => {
      expect(Validators.required(null, {}, false)).to.equal(true)
    })
  })

  describe('.type()', () => {
    it('should return true if given value is of given type', () => {
      expect(Validators.type(0, {}, 'number')).to.equal(true)
      expect(Validators.type('', {}, 'string')).to.equal(true)
      expect(Validators.type(true, {}, 'boolean')).to.equal(true)
      expect(Validators.type(new Date(), {}, 'date')).to.equal(true)
      expect(Validators.type([], {}, 'array')).to.equal(true)
      expect(Validators.type({}, {}, 'object')).to.equal(true)
    })

    it('should return false otherwise', () => {
      expect(Validators.type('not a number', {}, 'number')).to.equal(false)
      expect(Validators.type(1, {}, 'string')).to.equal(false)
      expect(Validators.type(1, {}, 'boolean')).to.equal(false)
      expect(Validators.type(1, {}, 'date')).to.equal(false)
      expect(Validators.type(1, {}, 'array')).to.equal(false)
      expect(Validators.type(1, {}, 'object')).to.equal(false)
    })
  })

  describe('.match()', () => {
    it('should return true if given regexp matches given value', () => {
      expect(Validators.match('abc', {}, /^abc$/)).to.equal(true)
    })

    it('should return false otherwise', () => {
      expect(Validators.match('cba', {}, /^abc$/)).to.equal(false)
    })
  })

  describe('.length()', () => {
    it('should return true if given value has length between given min and max', () => {
      expect(Validators.length('ab', {}, { min: 2, max: 4 })).to.equal(true)
      expect(Validators.length('abc', {}, { min: 2, max: 4 })).to.equal(true)
      expect(Validators.length('abcd', {}, { min: 2, max: 4 })).to.equal(true)
      expect(Validators.length('abcde', {}, { min: 2 })).to.equal(true)
      expect(Validators.length('a', {}, { max: 4 })).to.equal(true)
    })

    it('should return false otherwise', () => {
      expect(Validators.length('a', {}, { min: 2, max: 4 })).to.equal(false)
      expect(Validators.length('abcde', {}, { min: 2, max: 4 })).to.equal(false)
      expect(Validators.length('a', {}, { min: 2 })).to.equal(false)
      expect(Validators.length('abcde', {}, { max: 4 })).to.equal(false)
    })

    it('should work with a number as an exact length', () => {
      expect(Validators.length('a', {}, 2)).to.equal(false)
      expect(Validators.length('ab', {}, 2)).to.equal(true)
    })
  })

  describe('.enum()', () => {
    it('should return true if given value is included in given array', () => {
      expect(Validators.enum('a', {}, ['a', 'b'])).to.equal(true)
      expect(Validators.enum('b', {}, ['a', 'b'])).to.equal(true)
    })

    it('should return false otherwise', () => {
      expect(Validators.enum('c', {}, ['a', 'b'])).to.equal(false)
    })
  })
})
