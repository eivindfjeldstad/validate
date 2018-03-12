const Property = require('../lib/property')
const Schema = require('../lib/schema')
const messages = require('../lib/messages')

describe('Property', () => {
  it('should have a .name property', () => {
    const prop = new Property('test', new Schema())
    prop.name.should.equal('test')
  })

  describe('.use()', () => {
    it('should register given function as a validator', () => {
      const prop = new Property('test', new Schema())
      prop.use(() => false)
      prop.validate(1).should.be.an.instanceOf(Error)
    })

    it('should use default error messages', () => {
      const prop = new Property('test', new Schema())
      prop.use(() => false)
      prop.validate(null).message.should.equal(messages.use(prop.name, true))
    })

    it('should support custom error messages', () => {
      const prop = new Property('test', new Schema())
      prop.use(() => false, 'fail')
      prop.validate(1).message.should.equal('fail')
    })

    it('should support chaining', () => {
      const prop = new Property('test', new Schema())
      prop.use(() => {}).should.equal(prop)
    })
  })

  describe('.required()', () => {
    it('should register a validator', () => {
      const prop = new Property('test', new Schema())
      prop.required()
      prop.validate(null).should.be.an.instanceOf(Error)
      prop.validate(100).should.equal(false)
    })

    it('should not consider `0` or `false` to be invalid', () => {
      const prop = new Property('test', new Schema())
      prop.required(true)
      prop.validate(0).should.equal(false)
      prop.validate(false).should.equal(false)
      prop.validate('').should.be.an.instanceOf(Error)
    })

    it('should respect boolean argument', () => {
      const prop = new Property('test', new Schema())
      prop.required(false)
      prop.validate(null).should.equal(false)
    })

    it('should use default error messages', () => {
      const prop = new Property('test', new Schema())
      prop.required()
      prop.validate(null).message.should.equal(messages.required(prop.name, true))
    })

    it('should support custom error messages', () => {
      const prop = new Property('test', new Schema())
      prop.required(true, 'fail')
      prop.validate(null).message.should.equal('fail')
    })

    it('should support chaining', () => {
      const prop = new Property('test', new Schema())
      prop.required().should.equal(prop)
    })
  })

  describe('.type()', () => {
    it('should register a validator', () => {
      const prop = new Property('test', new Schema())
      prop.type('string')
      prop.validate(1).should.be.an.instanceOf(Error)
      prop.validate('test').should.equal(false)
      prop.validate(null).should.equal(false)
    })

    it('should set the internal ._type property', () => {
      const prop = new Property('test', new Schema())
      prop.type('string')
      prop._type.should.equal('string')
    })

    it('should use default error messages', () => {
      const prop = new Property('test', new Schema())
      prop.type('string')
      prop.validate(1).message.should.equal(messages.type(prop.name, 'string'))
    })

    it('should support custom error messages', () => {
      const prop = new Property('test', new Schema())
      prop.type('number', 'fail')
      prop.validate('hello').message.should.equal('fail')
    })
  })

  describe('.match()', () => {
    it('should register a validator', () => {
      const prop = new Property('test', new Schema())
      prop.match(/^abc$/)
      prop.validate('cab').should.be.an.instanceOf(Error)
      prop.validate('abc').should.equal(false)
      prop.validate(null).should.equal(false)
    })

    it('should produce an error with a message', () => {
      const prop = new Property('test', new Schema())
      prop.match(/^abc$/, 'fail')
      prop.validate('cab').message.should.equal('fail')
    })

    it('should use default error messages', () => {
      const prop = new Property('test', new Schema())
      const regexp = /^abc$/
      prop.match(regexp)
      prop.validate('cab').message.should.equal(messages.match(prop.name, regexp))
    })

    it('should support custom error messages', () => {
      const prop = new Property('test', new Schema())
      prop.match(/^abc$/, 'fail')
      prop.validate('cab').message.should.equal('fail')
    })
  })

  describe('.length()', () => {
    it('should register a validator', () => {
      const prop = new Property('test', new Schema())
      prop.length({ min: 2, max: 3 })
      prop.validate('abcd').should.be.an.instanceOf(Error)
      prop.validate('a').should.be.an.instanceOf(Error)
      prop.validate('abc').should.equal(false)
      prop.validate(null).should.equal(false)
    })

    it('should use default error messages', () => {
      const prop = new Property('test', new Schema())
      const rule = { max: 1 }
      prop.length(rule)
      prop.validate('abc').message.should.equal(messages.length(prop.name, rule))
    })

    it('should support custom error messages', () => {
      const prop = new Property('test', new Schema())
      prop.length({ min: 10 }, 'fail')
      prop.validate('hello').message.should.equal('fail')
    })
  })

  describe('.schema()', () => {
    it('should mount given schema on parent schema ', () => {
      const schema1 = new Schema()
      const schema2 = new Schema({ world: { required: true }})
      const prop1 = schema1.path('hello')
      const prop2 = schema2.path('world')
      prop1.schema(schema2)
      schema1.path('hello.world').should.equal(prop2)
    })
  })

  describe('.each()', () => {
    it('should define a new array path on the parent schema', () => {
      const schema = new Schema()
      const prop = new Property('test', schema)
      prop.each({ type: 'number' })
      schema.path('test.$')._type.should.equal('number')
    })
  })

  describe('.typecast()', () => {
    it('should typecast given value to the type defined by ._type', () => {
      const prop = new Property('test', new Schema())
      prop.type('string')
      prop.typecast(123).should.equal('123')
    })
  })

  describe('.validate()', () => {
    it('should validate using using registered validators', () => {
      const prop = new Property('test', new Schema())
      prop.required()
      prop.match(/^abc$/)
      prop.validate(null).should.be.an.instanceOf(Error)
      prop.validate('abc').should.equal(false)
      prop.validate('cab').should.be.an.instanceOf(Error)
    })

    it('should assign errors a .path', () => {
      const prop = new Property('some.path', new Schema())
      prop.required()
      prop.validate(null).path.should.equal('some.path')
    })

    it('should allow path to be overridden', () => {
      const prop = new Property('some.path', new Schema())
      prop.required()
      prop.validate(null, {}, 'some.other.path').path.should.equal('some.other.path')
    })

    it('should pass context to validators', () => {
      const prop = new Property('test', new Schema())
      const obj = { hello: 'world' }
      let ctx1, ctx2

      prop.use(function (val, ctx) {
        ctx1 = this
        ctx2 = ctx
      })

      prop.validate('abc', obj)
      obj.should.equal(ctx1)
      obj.should.equal(ctx2)
    })
  })

  describe('.path()', () => {
    it('should proxy all arguments to parent schema', () => {
      const schema = new Schema()
      const prop = new Property('test', schema)
      const ret = prop.path('hello')
      schema.path('hello').should.equal(ret)
    })
  })
})
