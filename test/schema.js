const { expect } = require('chai')
const Schema = require('..')
const Property = require('../lib/property')

describe('Schema', () => {
  context('when given an object', () => {
    it('should create properties', () => {
      const schema = new Schema({ a: { type: 'string' }})
      expect(schema.props).to.have.property('a')
    })
  })

  describe('.path()', () => {
    it('should create properties', () => {
      const schema = new Schema()
      schema.path('a', { type: 'string' })
      expect(schema.props).to.have.property('a')
    })

    it('should allow type shorthand', () => {
      const schema = new Schema()
      schema.path('a', 'string')
      expect(schema.props['a']._type).to.equal('string')
    })

    it('should create properties for all subpaths', () => {
      const schema = new Schema()
      schema.path('hello.planet.earth')
      expect(schema.props).to.have.property('hello')
      expect(schema.props).to.have.property('hello.planet')
      expect(schema.props).to.have.property('hello.planet.earth')
    })

    it('should support nested properties', () => {
      const schema = new Schema()
      schema.path('a', { b: { type: 'string' }})
      expect(schema.props).to.have.property('a.b')
    })

    it('should register validators', () => {
      const schema = new Schema()
      schema.path('a', { b: { required: true }})
      expect(schema.validate({})).to.have.length(1)
    })

    it('should return a Property', () => {
      const schema = new Schema()
      expect(schema.path('a')).to.be.instanceOf(Property)
        .and.have.property('name', 'a')
    })

    it('should work with nested schemas', () => {
      const schema1 = new Schema()
      const schema2 = new Schema()
      schema2.path('hello', { required: true })
      schema1.path('schema2', schema2).required(true)
      expect(schema1.props).to.have.property('schema2.hello')
      expect(schema1.validate({})).to.have.length(2)
      expect(schema1.validate({ schema2: { hello: null }})).to.have.length(1)
      expect(schema1.validate({ schema2: { hello: 'world' }})).to.have.length(0)
    })

    it('should propagate new props from nested schema', () => {
      const schema1 = new Schema()
      const schema2 = new Schema()
      schema1.path('schema2', schema2)
      schema2.path('hello', { required: true })
      schema2.path('hello.world', { required: true })
      expect(schema1.props).to.have.property('schema2.hello')
      expect(schema1.props).to.have.property('schema2.hello.world')
    })

    context('when given a path ending with $', () => {
      it('should set `property.type` to array', () => {
        const schema = new Schema()
        schema.path('hello.$')
        expect(schema.props.hello._type).to.equal('array')
      })

      it('should apply rules to each element in the array', () => {
        const schema = new Schema()
        schema.path('hello.$').type('number')
        expect(schema.props.hello._type).to.equal('array')
        expect(schema.props['hello.$']._type).to.equal('number')
      })
    })
  })

  describe('.strip()', () => {
    it('should delete all keys not in the schema', () => {
      const schema = new Schema({
        a: { type: 'number' },
        b: [{ a: { type: 'number' }}],
        c: { a: { type: 'number' }}
      })

      const obj = { a: 1, b: [{ a: 1, b: 1}, { a: 1 }], c: { a: 1, b: 1 }, d: 1}
      schema.strip(obj)
      expect(obj).to.deep.equal({ a: 1, b: [{ a: 1 }, { a: 1 }], c: { a: 1 }})
    })
  })

  describe('.validate()', () => {
    it('should return an array of errors', () => {
      const schema = new Schema({ name: { type: 'string' }})
      const res = schema.validate({ name: 123 })
      expect(res).to.be.an.instanceOf(Array)
      expect(res).to.have.length(1)
    })

    it('should set the correct paths on the error objects', () => {
      const schema = new Schema({ things: [{ type: 'string' }]})
      const res = schema.validate({ things: ['car', 1, 3] })
      const [err1, err2] = res
      expect(res).to.have.length(2)
      expect(err1.path).to.equal('things.1')
      expect(err1.message).to.match(/things\.1/)
      expect(err2.path).to.equal('things.2')
      expect(err2.message).to.match(/things\.2/)
    })

    it('should work with $ a placeholder for array indices', () => {
      const schema = new Schema()
      schema.path('a.$.b').required()
      schema.path('a.$.b.$').type('string')
      schema.path('a.$.c.$.$').type('string')
      const res = schema.validate({
        a: [
          { b: ['hello', 'world'] },
          { b: ['hello', 1] },
          { c: [['hello', 'world'], ['hello', 2]]}
        ]
      })
      expect(res).to.have.length(3)
    })

    it('should strip by default', () => {
      const schema = new Schema({ a: { type: 'number' }})
      const obj = { a: 1, b: 1 }
      const res = schema.validate(obj)
      expect(obj).to.deep.equal({ a: 1 })
    })

    it('should not strip array elements', () => {
      const schema = new Schema({ a: { type: 'array' }})
      const obj = { a: [1, 2, 3] }
      const res = schema.validate(obj)
      expect(obj).to.deep.equal({ a: [1, 2, 3] })
    })

    context('with strip disabled', () => {
      it('should not delete any keys', () => {
        const obj = { name: 'name', age: 23 }
        const schema = new Schema({ name: { type: 'string' }})
        const res = schema.validate(obj, { strip: false })
        expect(obj).to.have.property('age', 23)
      })
    })

    context('with typecasting enabled', () => {
      it('should typecast before validation', () => {
        const schema = new Schema({ name: { type: 'string' }})
        const res = schema.validate({ name: 123 }, { typecast: true })
        expect(res).to.have.length(0)
      })

      it('should typecast arrays and elements within arrays', () => {
        const schema = new Schema()
        schema.path('a.$.b').required()
        schema.path('a.$.b.$').type('string')
        schema.path('a.$.c.$.$').type('string')
        schema.path('b.$').type('number')

        const obj = {
          a: [{ b: ['a', 'b'] }, { b: 1, c: [['a', 'b'], ['a', 2]]}],
          b: '1,2,3,4,5'
        }

        const res = schema.validate(obj, { typecast: true })
        expect(res).to.have.length(0)

        expect(obj).to.deep.equal({
          a: [{ b: ['a', 'b'] }, { b: ['1'], c: [['a', 'b'], ['a', '2']]}],
          b: [1, 2, 3, 4, 5]
        })
      })

      it('should not typecast undefined', () => {
        const schema = new Schema({ name: { type: 'string' }})
        const wrap = () => schema.validate({}, { typecast: true })
        expect(wrap).to.not.throw()
      })
    })
  })

  describe('.assert()', () => {
    it('should throw if validation fails', () => {
      const schema = new Schema({ name: { type: 'string' }})
      const wrap = () => schema.assert({ name: 123 })
      expect(wrap).to.throw()
    })
  })

  describe('.message()', () => {
    it('should set default messages', () => {
      const schema = new Schema({ name: { required: true }})
      schema.message('required', 'test')
      const [error] = schema.validate({})
      expect(error.message).to.equal('test')
    })

    it('should accept an object of name-message pairs', () => {
      const schema = new Schema({ name: { required: true }})
      schema.message({ required: 'test' })
      const [error] = schema.validate({})
      expect(error.message).to.equal('test')
    })
  })

  describe('.validator()', () => {
    it('should set default validators', () => {
      const schema = new Schema({ name: { required: true }})
      schema.validator('required', () => false)
      const [error] = schema.validate({ name: 'hello' })
      expect(error.message).to.equal('name is required.')
    })

    it('should accept an object of name-function pairs', () => {
      const schema = new Schema({ name: { required: true }})
      schema.validator({ required: () => false })
      const [error] = schema.validate({ name: 'hello' })
      expect(error.message).to.equal('name is required.')
    })
  })
})
