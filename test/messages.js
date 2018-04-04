const { expect } = require('chai')
const Messages = require('../lib/messages')

describe('Messages', () => {
  describe('.required()', () => {
    it('should return the correct message', () => {
      expect(Messages.required('a')).to.equal('a is required.')
    })
  })

  describe('.type()', () => {
    it('should return the correct message', () => {
      expect(Messages.type('a', {}, 'string')).to.equal('a must be of type string.')
    })
  })

  describe('.match()', () => {
    it('should return the correct message', () => {
      expect(Messages.match('a', {}, /abc/)).to.equal('a must match /abc/.')
    })
  })

  describe('.length()', () => {
    it('should return the correct message', () => {
      expect(Messages.length('a', {}, 2)).to.equal('a must have a length of 2.')
      expect(Messages.length('a', {}, { min: 2 })).to.equal('a must have a minimum length of 2.')
      expect(Messages.length('a', {}, { max: 2 })).to.equal('a must have a maximum length of 2.')
      expect(Messages.length('a', {}, { min: 2, max: 4 })).to.equal('a must have a length between 2 and 4.')
    })
  })

  describe('.enum()', () => {
    it('should return true if given value is included in given array', () => {
      expect(Messages.enum('a', {}, ['b', 'c'])).to.equal('a must be either b or c.')
    })
  })
})
