const Schema = require('../lib/schema')
const Property = require('../lib/property')

describe('Schema', () => {
  context('when given an object', () => {
    it('should create properties', () => {
      const schema = new Schema({ a: { type: 'string' }})
      schema.props.should.have.property('a')
    })
  })

  describe('.path()', () => {
    it('should create properties', () => {
      const schema = new Schema()
      schema.path('a', { type: 'string' })
      schema.props.should.have.property('a')
    })

    it('should allow type shorthand', () => {
      const schema = new Schema()
      schema.path('a', 'string')
      schema.props['a']._type.should.equal('string')
    })

    it('should create properties for all subpaths', () => {
      const schema = new Schema()
      schema.path('hello.planet.earth')
      schema.props.should.have.property('hello')
      schema.props.should.have.property('hello.planet')
      schema.props.should.have.property('hello.planet.earth')
    })

    it('should support nested properties', () => {
      const schema = new Schema()
      schema.path('a', { b: { type: 'string' }})
      schema.props.should.have.property('a.b')
    })

    it('should register validators', () => {
      const schema = new Schema()
      schema.path('a', { b: { required: true }})
      schema.validate({}).should.have.length(1)
    })

    it('should return a Property', () => {
      const schema = new Schema()
      schema.path('a')
        .should.be.instanceOf(Property)
        .and.have.property('name', 'a')
    })

    it('should work with nested schemas', () => {
      const schema1 = new Schema()
      const schema2 = new Schema()
      schema2.path('hello', { required: true })
      schema1.path('schema2', schema2).required(true)
      schema1.props.should.have.property('schema2.hello')
      schema1.validate({}).should.have.length(2)
      schema1.validate({ schema2: { hello: null }}).should.have.length(1)
      schema1.validate({ schema2: { hello: 'world' }}).should.have.length(0)
    })

    it('should propagate new props from nested schema', () => {
      const schema1 = new Schema()
      const schema2 = new Schema()
      schema1.path('schema2', schema2)
      schema2.path('hello', { required: true })
      schema2.path('hello.world', { required: true })
      schema1.props.should.have.property('schema2.hello')
      schema1.props.should.have.property('schema2.hello.world')
    })

    context('when given a path ending with $', () => {
      it('should set `property.type` to array', () => {
        const schema = new Schema()
        schema.path('hello.$')
        schema.props.hello._type.should.equal('array')
      })

      it('should apply rules to each element in the array', () => {
        const schema = new Schema()
        schema.path('hello.$').type('number')
        schema.props.hello._type.should.equal('array')
        schema.props['hello.$']._type.should.equal('number')
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
      obj.should.deepEqual({ a: 1, b: [{ a: 1 }, { a: 1 }], c: { a: 1 }})
    })
  })

  describe('.validate()', () => {
    it('should return an array of errors', () => {
      const schema = new Schema({ name: { type: 'string' }})
      const res = schema.validate({ name: 123 })
      res.should.be.an.Array()
      res.should.have.length(1)
    })

    it('should set the correct paths on the error objects', () => {
      const schema = new Schema({ things: [{ type: 'string' }]})
      const res = schema.validate({ things: ['car', 1, 3] })
      const [err1, err2] = res
      res.should.have.length(2)
      err1.path.should.equal('things.1')
      err1.message.should.match(/things\.1/)
      err2.path.should.equal('things.2')
      err2.message.should.match(/things\.2/)
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
      res.should.have.length(3)
    })

    it('should strip by default', () => {
      const schema = new Schema({ a: { type: 'number' }})
      const obj = { a: 1, b: 1 }
      const res = schema.validate(obj)
      obj.should.deepEqual({ a: 1 })
    })

    context('with strip disabled', () => {
      it('should not delete any keys', () => {
        const obj = { name: 'name', age: 23 }
        const schema = new Schema({ name: { type: 'string' }})
        const res = schema.validate(obj, { strip: false })
        obj.should.have.property('age', 23)
      })
    })

    context('with typecasting enabled', () => {
      it('should typecast before validation', () => {
        const schema = new Schema({ name: { type: 'string' }})
        const res = schema.validate({ name: 123 }, { typecast: true })
        res.should.have.length(0)
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
        res.should.have.length(0)

        obj.should.deepEqual({
          a: [{ b: ['a', 'b'] }, { b: ['1'], c: [['a', 'b'], ['a', '2']]}],
          b: [1, 2, 3, 4, 5]
        })
      })

      it('should not typecast undefined', () => {
        const schema = new Schema({ name: { type: 'string' }})
        const wrap = () => schema.validate({}, { typecast: true })
        wrap.should.not.throw()
      })
    })
  })

  describe('.assert()', () => {
    it('should throw if validation fails', () => {
      const schema = new Schema({ name: { type: 'string' }})
      const wrap = () => schema.assert({ name: 123 })
      wrap.should.throw()
    })
  })

  describe('.message()', () => {
    it('should set default messages', () => {
      const schema = new Schema({ name: { required: true }})
      schema.message({ required: 'test' })
      const [error] = schema.validate({})
      error.message.should.equal('test')
    })

    context('with no messages given', () => {
      it('should return current messages', () => {
        const messages = (new Schema()).messages
        messages.required.should.be.a.Function()
      })
    })
  })

  describe('.validator()', () => {
    it('should set default validators', () => {
      const schema = new Schema({ name: { required: true }})
      schema.validator({ required: () => false })
      const [error] = schema.validate({ name: 'hello' })
      error.message.should.equal('name is required.')
    })

    context('with no validators given', () => {
      it('should return current validators', () => {
        const validators = (new Schema()).validators
        validators.required.should.be.a.Function()
      })
    })
  })
})
