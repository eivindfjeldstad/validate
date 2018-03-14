const Messages = require('../lib/messages')

describe('Messages', () => {
  describe('.required()', () => {
    it('should return the correct message', () => {
      Messages.required('a').should.equal('a is required.')
    })
  })

  describe('.type()', () => {
    it('should return the correct message', () => {
      Messages.type('a', {}, 'string').should.equal('a must be of type string.')
    })
  })

  describe('.match()', () => {
    it('should return the correct message', () => {
      Messages.match('a', {}, /abc/).should.equal('a must match /abc/.')
    })
  })

  describe('.length()', () => {
    it('should return the correct message', () => {
      Messages.length('a', {}, { min: 2 }).should.equal('a must have a minimum length of 2.')
      Messages.length('a', {}, { max: 2 }).should.equal('a must have a maximum length of 2.')
      Messages.length('a', {}, { min: 2, max: 4 }).should.equal('a must have a length between 2 and 4.')
    })
  })

  describe('.enum()', () => {
    it('should return true if given value is included in given array', () => {
      Messages.enum('a', {}, ['b', 'c']).should.equal('a must be either b or c.')
    })
  })
})
