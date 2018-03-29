const { expect } = require('chai')
const Property = require('../lib/property')
const Schema = require('../lib/schema')
const messages = require('../lib/messages')

describe('Property', () => {
  it('should have a .name property', () => {
    const prop = new Property('test', new Schema())
    expect(prop.name).to.equal('test')
  })

  describe('.use()', () => {
    it('should register each object property as a validator', () => {
      const prop = new Property('test', new Schema())
      prop.use({
        one: (v) => v != 1,
        two: (v) => v != 2
      })
      expect(prop.validate(1)).to.be.an.instanceOf(Error)
      expect(prop.validate(2)).to.be.an.instanceOf(Error)
      expect(prop.validate(3)).to.equal(false)
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

      expect(prop.validate(1).message).to.equal('error 1')
      expect(prop.validate(2).message).to.equal('error 2')
    })

    it('should register additional arguments', () => {
      const prop = new Property('test', new Schema())
      let first, second;
      prop.use({
        one: [(v, c, arg) => first = arg, 1],
        two: [(v, c, arg) => second = arg, 2]
      })
      prop.validate({ test: 1 })
      expect(first).to.equal(1)
      expect(second).to.equal(2)
    })

    it('should support chaining', () => {
      const prop = new Property('test', new Schema())
      expect(prop.use({ one: () => {}})).to.equal(prop)
    })
  })

  describe('.required()', () => {
    it('should register a validator', () => {
      const prop = new Property('test', new Schema())
      prop.required()
      expect(prop.validate(null)).to.be.an.instanceOf(Error)
      expect(prop.validate(100)).to.equal(false)
    })

    it('should use the correct error message', () => {
      const prop = new Property('test', new Schema())
      const message = messages.required(prop.name, {}, true)
      prop.required()
      expect(prop.validate(null).message).to.equal(message)
    })

    it('should support chaining', () => {
      const prop = new Property('test', new Schema())
      expect(prop.required()).to.equal(prop)
    })
  })

  describe('.type()', () => {
    it('should register a validator', () => {
      const prop = new Property('test', new Schema())
      prop.type('string')
      expect(prop.validate(1)).to.be.an.instanceOf(Error)
      expect(prop.validate('test')).to.equal(false)
      expect(prop.validate(null)).to.equal(false)
    })

    it('should set the internal ._type property', () => {
      const prop = new Property('test', new Schema())
      prop.type('string')
      expect(prop._type).to.equal('string')
    })

    it('should use the correct error message', () => {
      const prop = new Property('test', new Schema())
      const message = messages.type(prop.name, {}, 'string')
      prop.type('string')
      expect(prop.validate(1).message).to.equal(message)
    })

    it('should support chaining', () => {
      const prop = new Property('test', new Schema())
      expect(prop.type('number')).to.equal(prop)
    })
  })

  describe('.match()', () => {
    it('should register a validator', () => {
      const prop = new Property('test', new Schema())
      prop.match(/^abc$/)
      expect(prop.validate('cab')).to.be.an.instanceOf(Error)
      expect(prop.validate('abc')).to.equal(false)
      expect(prop.validate(null)).to.equal(false)
    })

    it('should use the correct error message', () => {
      const prop = new Property('test', new Schema())
      const regexp = /^abc$/
      const message = messages.match(prop.name, {}, regexp)
      prop.match(regexp)
      expect(prop.validate('cab').message).to.equal(message)
    })

    it('should support chaining', () => {
      const prop = new Property('test', new Schema())
      expect(prop.match(/abc/)).to.equal(prop)
    })
  })

  describe('.length()', () => {
    it('should register a validator', () => {
      const prop = new Property('test', new Schema())
      prop.length({ min: 2, max: 3 })
      expect(prop.validate('abcd')).to.be.an.instanceOf(Error)
      expect(prop.validate('a')).to.be.an.instanceOf(Error)
      expect(prop.validate('abc')).to.equal(false)
      expect(prop.validate(null)).to.equal(false)
    })

    it('should use the correct error message', () => {
      const prop = new Property('test', new Schema())
      const rule = { max: 1 }
      const message = messages.length(prop.name, {}, rule)
      prop.length(rule)
      expect(prop.validate('abc').message).to.equal(message)
    })

    it('should support chaining', () => {
      const prop = new Property('test', new Schema())
      expect(prop.length({})).to.equal(prop)
    })
  })

  describe('.enum()', () => {
    it('should register a validator', () => {
      const prop = new Property('test', new Schema())
      prop.enum(['one', 'two'])
      expect(prop.validate('three')).to.be.an.instanceOf(Error)
      expect(prop.validate('one')).to.equal(false)
      expect(prop.validate('two')).to.equal(false)
      expect(prop.validate(null)).to.equal(false)
    })

    it('should use the correct error message', () => {
      const prop = new Property('test', new Schema())
      const enums = ['one', 'two']
      const message = messages.enum(prop.name, {}, enums)
      prop.enum(enums)
      expect(prop.validate('three').message).to.equal(message)
    })

    it('should support chaining', () => {
      const prop = new Property('test', new Schema())
      expect(prop.enum(['one', 'two'])).to.equal(prop)
    })
  })


  describe('.schema()', () => {
    it('should mount given schema on parent schema ', () => {
      const schema1 = new Schema()
      const schema2 = new Schema({ world: { required: true }})
      const prop1 = schema1.path('hello')
      const prop2 = schema2.path('world')
      prop1.schema(schema2)
      expect(schema1.path('hello.world')).to.equal(prop2)
    })

    it('should support chaining', () => {
      const schema = new Schema()
      const prop = new Property('test', new Schema())
      expect(prop.schema(schema)).to.equal(prop)
    })
  })

  describe('.elements()', () => {
    it('should define paths for given array elements', () => {
      const schema = new Schema()
      const prop = new Property('test', schema)
      prop.elements([{ type: 'number' }, { type: 'string' }])
      expect(schema.path('test.0')._type).to.equal('number')
      expect(schema.path('test.1')._type).to.equal('string')
    })

    it('should work', () => {
      const schema = new Schema()
      const prop = new Property('test', schema)
      prop.elements([{ type: 'number' }, { type: 'string' }])
      expect(schema.validate({ test: [1, 'hello']})).to.have.length(0)
      expect(schema.validate({ test: ['hello', 'hello']})).to.have.length(1)
    })

    it('should support chaining', () => {
      const prop = new Property('test', new Schema())
      expect(prop.elements([])).to.equal(prop)
    })
  })

  describe('.each()', () => {
    it('should define a new array path on the parent schema', () => {
      const schema = new Schema()
      const prop = new Property('test', schema)
      prop.each({ type: 'number' })
      expect(schema.path('test.$')._type).to.equal('number')
    })

    it('should support chaining', () => {
      const prop = new Property('test', new Schema())
      expect(prop.each({})).to.equal(prop)
    })
  })

  describe('.typecast()', () => {
    it('should typecast given value to the type defined by ._type', () => {
      const prop = new Property('test', new Schema())
      prop.type('string')
      expect(prop.typecast(123)).to.equal('123')
    })
  })

  describe('.validate()', () => {
    it('should validate using using registered validators', () => {
      const prop = new Property('test', new Schema())
      prop.required()
      prop.match(/^abc$/)
      expect(prop.validate(null)).to.be.an.instanceOf(Error)
      expect(prop.validate('abc')).to.equal(false)
      expect(prop.validate('cab')).to.be.an.instanceOf(Error)
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

      expect(done.required).to.equal(1)
      expect(done.type).to.equal(2)
    })

    it('should assign errors a .path', () => {
      const prop = new Property('some.path', new Schema())
      prop.required()
      expect(prop.validate(null).path).to.equal('some.path')
    })

    it('should allow path to be overridden', () => {
      const prop = new Property('some.path', new Schema())
      prop.required()
      expect(prop.validate(null, {}, 'some.other.path').path).to.equal('some.other.path')
    })

    it('should pass context to validators', () => {
      const prop = new Property('test', new Schema())
      const obj = { hello: 'world' }
      let ctx;

      prop.use({
        context: (v, c) => {
          ctx = c
        }
      })

      prop.validate('abc', obj)
      expect(obj).to.equal(ctx)
    })

    it('should pass path to validators', () => {
      const prop = new Property('test', new Schema())
      let path

      prop.use({
        context: (v, c, p) => {
          path = p
        }
      })

      prop.validate('abc', { test: 1 })
      expect(path).to.equal('test')
    })
  })

  describe('.path()', () => {
    it('should proxy all arguments to parent schema', () => {
      const schema = new Schema()
      const prop = new Property('test', schema)
      const ret = prop.path('hello')
      expect(schema.path('hello')).to.equal(ret)
    })
  })
})
