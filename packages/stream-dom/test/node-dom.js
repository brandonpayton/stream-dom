import {
  createElementNode,
  createTextNode,
  ElementNodeDescriptor,
  TextNodeDescriptor
} from '../src/node-dom'
import { NodeDeclaration } from '../src/node'
import domAssert from '../test-util/dom-assert'
import * as mock from '../test-util/mock'

import { sync as syncSubject } from 'most-subject'
import { assert } from 'chai'

suite(`nodes/dom`, function () {
  let scope

  setup(function () {
    scope = mock.scope()
  })
  teardown(function () {
    scope.destroy$.next()
  })

  suite(`createElementNode`, function () {
    test(`returns an ElementNodeDescriptor`, function () {
      const actual = createElementNode(scope, { name: `div` })
      assert.instanceOf(actual, ElementNodeDescriptor)
    })
    test(`no children, attributes, or properties`, function () {
      const descriptor = createElementNode(scope, { name: `section` })
      const { domNode } = descriptor
      assert.strictEqual(domNode.nodeType, Node.ELEMENT_NODE)
      assert.strictEqual(domNode.tagName, `SECTION`)
    })
    test(`static attributes`, function () {
      const expectedAttributes = {
        type: `checkbox`,
        name: `test-checkbox`
      }
      const { domNode } = createElementNode(scope, {
        name: `input`,
        attrs: expectedAttributes
      })

      Object.keys(expectedAttributes).forEach(name => {
        assertAttributeValue(domNode, name, expectedAttributes[name])
      })
    })
    test(`static boolean attributes`, function () {
      const { domNode: optionNode1 } = createElementNode(scope, {
        name: `option`,
        attrs: { selected: true }
      })
      assertBooleanAttributeValue(optionNode1, `selected`, true)

      const { domNode: optionNode2 } = createElementNode(scope, {
        name: `option`,
        attrs: { selected: false }
      })
      assertBooleanAttributeValue(optionNode2, `selected`, false)
    })
    test(`dynamic attributes`, function () {
      const class$ = syncSubject()

      const { domNode } = createElementNode(scope, {
        name: `div`, attrs: { class: class$ }
      })

      return mock.signalMounted(scope).then(() => {
        assert.isFalse(domNode.hasAttribute(`class`), `no class attribute yet`)

        const expectedClassValue1 = `unit test expected-value1`
        class$.next(expectedClassValue1)
        assert.strictEqual(domNode.getAttribute(`class`), expectedClassValue1)

        const expectedClassValue2 = `unit test expected-value2`
        class$.next(expectedClassValue2)
        assert.strictEqual(domNode.getAttribute(`class`), expectedClassValue2)
      })
    })
    test(`dynamic boolean attributes`, function () {
      const checked$ = syncSubject()

      const { domNode } = createElementNode(scope, {
        name: `input`, attrs: { type: `checkbox`, checked: checked$ }
      })

      return mock.signalMounted(scope).then(() => {
        assert.isFalse(
          domNode.hasAttribute(`checked`),
          `no checked attribute yet`
        )

        assert.isFalse(
          domNode.hasAttribute(`checked`),
          `no checked attribute`
        )

        const expectedCheckedValue1 = true
        checked$.next(expectedCheckedValue1)
        assert.isTrue(domNode.hasAttribute(`checked`), `has checked attribute`)
        assert.strictEqual(
          domNode.getAttribute(`checked`),
          ``,
          `no value for boolean attributes`
        )

        const expectedCheckedValue2 = false
        checked$.next(expectedCheckedValue2)
        assert.isFalse(domNode.hasAttribute(`checked`), `no checked attribute`)
      })
    })
    test(`static namespaced attributes`, function () {
      const expectedNamespacedAttributes = [
        { nsUri: `http://test.me`, name: `test`, value: `value` },
        { nsUri: `http://test.me.two`, name: `test2`, value: `value2` }
      ]
      const descriptor = createElementNode(scope, {
        name: `input`,
        nsAttrs: expectedNamespacedAttributes
      })
      const { domNode } = descriptor

      expectedNamespacedAttributes.forEach(a => {
        assertAttributeValue(domNode, a.name, a.value, a.nsUri)
      })
    })
    test(`static namespaced, boolean attributes`, function () {
      const namespacedBooleanAttribute1 = {
        nsUri: `http://test.me`, name: `flag`, value: true
      }
      const { domNode: divNode1 } = createElementNode(scope, {
        name: `input`,
        nsAttrs: [ namespacedBooleanAttribute1 ]
      })
      assertBooleanAttributeValue(
        divNode1,
        namespacedBooleanAttribute1.name,
        namespacedBooleanAttribute1.value,
        namespacedBooleanAttribute1.nsUri
      )

      const namespacedBooleanAttribute2 = {
        nsUri: `http://test.me`, name: `flag`, value: false
      }
      const { domNode: divNode2 } = createElementNode(scope, {
        name: `input`,
        nsAttrs: [ namespacedBooleanAttribute2 ]
      })
      assertBooleanAttributeValue(
        divNode2,
        namespacedBooleanAttribute2.name,
        namespacedBooleanAttribute2.value,
        namespacedBooleanAttribute2.nsUri
      )
    })
    test(`dynamic namespaced attributes`, function () {
      const attr$ = syncSubject()

      const testAttr = {
        nsUri: `http://test.me`, name: `example`, value: attr$
      }
      const { domNode } = createElementNode(scope, {
        name: `div`, nsAttrs: [ testAttr ]
      })

      return mock.signalMounted(scope).then(() => {
        assert.isFalse(
          domNode.hasAttributeNS(testAttr.nsUri, testAttr.name),
          `no attribute yet`
        )

        const expectedValue1 = `first`
        attr$.next(expectedValue1)
        assertAttributeValue(
          domNode, testAttr.name, expectedValue1, testAttr.nsUri
        )

        const expectedValue2 = `second`
        attr$.next(expectedValue2)
        assertAttributeValue(
          domNode, testAttr.name, expectedValue2, testAttr.nsUri
        )
      })
    })
    test(`dynamic namespaced, boolean attributes`, function () {
      const attr$ = syncSubject()

      const testAttr = {
        nsUri: `http://test.me`, name: `example`, value: attr$
      }
      const { domNode } = createElementNode(scope, {
        name: `div`, nsAttrs: [ testAttr ]
      })

      return mock.signalMounted(scope).then(() => {
        assert.isFalse(
          domNode.hasAttributeNS(testAttr.nsUri, testAttr.name),
          `no attribute yet`
        )

        const expectedValue1 = true
        attr$.next(expectedValue1)
        assertBooleanAttributeValue(
          domNode, testAttr.name, expectedValue1, testAttr.nsUri
        )

        const expectedValue2 = false
        attr$.next(expectedValue2)
        assertBooleanAttributeValue(
          domNode, testAttr.name, expectedValue2, testAttr.nsUri
        )
      })
    })
    test(`static properties`, function () {
      const { domNode } = createElementNode(scope, {
        name: `div`, props: { className: `expected` }
      })
      assert.strictEqual(domNode.className, `expected`)
    })
    test(`dynamic properties`, function () {
      const className$ = syncSubject()
      const { domNode } = createElementNode(scope, {
        name: `div`, props: { className: className$ }
      })

      return mock.signalMounted(scope).then(() => {
        assert.strictEqual(domNode.className, ``, `property not yet set`)

        className$.next(`expected1`)
        assert.strictEqual(domNode.className, `expected1`)

        className$.next(`expected2`)
        assert.strictEqual(domNode.className, `expected2`)
      })
    })
    test(`children`, function () {
      const { domNode } = createElementNode(scope, {
        name: `div`,
        children: [
          new NodeDeclaration(createTextNode, `expected text`),
          new NodeDeclaration(createElementNode, { name: `p` }),
          new NodeDeclaration(createElementNode, { name: `span` })
        ]
      })
      assert.strictEqual(domNode.childNodes.length, 3, `expected child count`)
      domAssert.textNode(domNode.childNodes[0], `expected text`)
      domAssert.elementNode(domNode.childNodes[1], `p`)
      domAssert.elementNode(domNode.childNodes[2], `span`)
    })
  })

  suite(`createTextNode`, function () {
    test(`creates a text node`, function () {
      const descriptor = createTextNode(scope, `expected text`)
      assert.property(descriptor, `domNode`)
      domAssert.textNode(descriptor.domNode, `expected text`)
    })
  })

  suite(`DomNodeDescriptor`, function () {
    test(`properties`)
    // name
    // domNode

    test(`extractContents`)
    test(`deleteContents`)
    test(`getBeforeNode`)
    test(`getNextSiblingNode`)
  })

  test(`ElementNodeDescriptor`, function () {
    // name
    // domNode
    // childDescriptors
    // expose
  })

  test(`TextNodeDescriptor`, function () {
    const expectedNode = document.createTextNode(`expected`)
    const descriptor = new TextNodeDescriptor(expectedNode)
    assert.propertyVal(descriptor, `domNode`, expectedNode)
  })
})

function assertAttributeValue (domNode, name, expectedValue, namespaceUri) {
  assert.strictEqual(
    getAttributeValue(domNode, name, expectedValue, namespaceUri),
    expectedValue
  )
}

function getAttributeValue (domNode, name, value, namespaceUri) {
  return namespaceUri
    ? domNode.getAttributeNS(namespaceUri, name)
    : domNode.getAttribute(name)
}

function assertBooleanAttributeValue (domNode, name, expectedValue, namespaceUri) {
  const present = namespaceUri
    ? domNode.hasAttributeNS(namespaceUri, name)
    : domNode.hasAttribute(name)

  assert.strictEqual(present, expectedValue, `expected attribute presence`)
  present && assert.strictEqual(
    getAttributeValue(domNode, name, expectedValue, namespaceUri),
    ``,
    `a boolean attribute has no value`
  )
}
