const { expect } = require('chai')
const ValidationError = require('../lib/error')

describe('ValidationError', () => {
  it('should accpet a message and a path', () => {
    const err = new ValidationError('hello', 'some.path')
    expect(err.message).to.equal('hello')
    expect(err.path).to.equal('some.path')
  })

  it('should not have enumerable properties', () => {
    const err = new ValidationError('hello', 'some.path')
    const keys = Object.keys(err)
    expect(keys.length).to.equal(0)
  })
})
