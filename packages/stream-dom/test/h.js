import { parseTagExpression } from '../lib/h'
import { assert } from 'chai'

describe('h', function () {
  describe('parseTagExpression', function () {
    it('parses simple tag name', function () {
      const { name } = parseTagExpression('div')
      assert.strictEqual(name, 'div')
    })

    it('parses tag name with classes', function () {
      const { name, classes } = parseTagExpression('span.class1.class2.class3')
      assert.strictEqual(name, 'span')
      assert.deepEqual(classes, [ 'class1', 'class2', 'class3' ])
    })

    it('parses tag name with ID', function () {
      const { name, id } = parseTagExpression('header#the-header')
      assert.strictEqual(name, 'header')
      assert.strictEqual(id, 'the-header')
    })

    it('parses tag name with classes and ID', function () {
      const { name, classes, id } = parseTagExpression('footer.class1.class2#the-footer')
      assert.strictEqual(name, 'footer')
      assert.deepEqual(classes, [ 'class1', 'class2' ])
      assert.strictEqual(id, 'the-footer')
    })

    it('throws on zero-length tag name', function () {
      assert.throws(() => parseTagExpression(''))
      assert.throws(() => parseTagExpression('.class1.class2'))
      assert.throws(() => parseTagExpression('#something'))
    })
  })
})
