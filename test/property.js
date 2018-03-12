const Property = require('../lib/property')
const Schema = require('../lib/schema')
const messages = require('../lib/messages')

describe('Property', () => {
  it('should have a .name property', () => {
    const prop = new Property('test', new Schema())
    prop.name.should.equal('test')
  })

  describe('.use()', () => {
    it('should register each object property as a validator', () => {
      const prop = new Property('test', new Schema())
      prop.use({
        one: (v) => v != 1,
        two: (v) => v != 2
      })
      prop.validate(1).should.be.an.instanceOf(Error)
      prop.validate(2).should.be.an.instanceOf(Error)
      prop.validate(3).should.equal(false)
    })

    it('should use property names to look up error messages', () => {
      const schema = new Schema()
      const prop = new Property('test', schema)

      schema.message({
        one: () => 'error 1',
        two: () => 'error 2'
      })

      prop.use({
        one: (v) => v != 1,
        two: (v) => v != 2
      })

      prop.validate(1).message.should.equal('error 1')
      prop.validate(2).message.should.equal('error 2')
    })

    it('should support chaining', () => {
      const prop = new Property('test', new Schema())
      prop.use({ one: () => {}}).should.equal(prop)
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

    it('should use the correct error message', () => {
      const prop = new Property('test', new Schema())
      prop.required()
      prop.validate(null).message.should.equal(messages.required(prop.name, true))
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

    it('should use the correct error message', () => {
      const prop = new Property('test', new Schema())
      prop.type('string')
      prop.validate(1).message.should.equal(messages.type(prop.name, 'string'))
    })

    it('should support chaining', () => {
      const prop = new Property('test', new Schema())
      prop.type('number').should.equal(prop)
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

    it('should use the correct error message', () => {
      const prop = new Property('test', new Schema())
      const regexp = /^abc$/
      prop.match(regexp)
      prop.validate('cab').message.should.equal(messages.match(prop.name, regexp))
    })

    it('should support chaining', () => {
      const prop = new Property('test', new Schema())
      prop.match(/abc/).should.equal(prop)
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

    it('should use the correct error message', () => {
      const prop = new Property('test', new Schema())
      const rule = { max: 1 }
      prop.length(rule)
      prop.validate('abc').message.should.equal(messages.length(prop.name, rule))
    })

    it('should support chaining', () => {
      const prop = new Property('test', new Schema())
      prop.length({}).should.equal(prop)
    })
  })

  describe('.enum()', () => {
    it('should register a validator', () => {
      const prop = new Property('test', new Schema())
      prop.enum(['one', 'two'])
      prop.validate('three').should.be.an.instanceOf(Error)
      prop.validate('one').should.equal(false)
      prop.validate('two').should.equal(false)
      prop.validate(null).should.equal(false)
    })

    it('should use the correct error message', () => {
      const prop = new Property('test', new Schema())
      const enums = ['one', 'two']
      prop.enum(enums)
      prop.validate('three').message.should.equal(messages.enum(prop.name, enums))
    })

    it('should support chaining', () => {
      const prop = new Property('test', new Schema())
      prop.enum(['one', 'two']).should.equal(prop)
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

    it('should support chaining', () => {
      const schema = new Schema()
      const prop = new Property('test', new Schema())
      prop.schema(schema).should.equal(prop)
    })
  })

  describe('.each()', () => {
    it('should define a new array path on the parent schema', () => {
      const schema = new Schema()
      const prop = new Property('test', schema)
      prop.each({ type: 'number' })
      schema.path('test.$')._type.should.equal('number')
    })

    it('should support chaining', () => {
      const prop = new Property('test', new Schema())
      prop.each({}).should.equal(prop)
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

    it('should run `required` and `type` validators first', () => {
      const schema = new Schema();
      const prop = new Property('test', schema)
      const done = {};
      let counter = 0;

      schema.validator({
        required: () => done.required = ++counter,
        type: () => done.type = ++counter,
        match: () => done.match = ++counter,
        enum: () => done.enum = ++counter
      })

      prop.match()
      prop.enum()
      prop.type()
      prop.required()
      prop.validate('something')

      done.required.should.eql(1)
      done.type.should.eql(2)
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

      prop.use({
        context: function (val, ctx) {
          ctx1 = this
          ctx2 = ctx
        }
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
