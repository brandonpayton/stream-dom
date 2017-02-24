import {
  createElementNode,
  createTextNode,
  ElementNodeDescriptor,
  TextNodeDescriptor
} from '../src/node-dom'

import { sync as syncSubject, hold as holdSubject } from 'most-subject'
import { assert } from 'chai'

suite(`nodes/dom`, function () {
  let scope

  setup(function () {
    scope = {
      document,
      parentNamespaceUri: `http://www.w3.org/1999/xhtml`,
      sharedRange: document.createRange(),
      mounted$: holdSubject(1, syncSubject()),
      destroy$: holdSubject(1, syncSubject())
    }
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
      const expectedAttributes = [
        { name: `type`, value: `checkbox` },
        { name: `name`, value: `test-checkbox` },
        { name: `checked`, value: `true` }
        // TODO: Test with namespaced attributes
      ]
      const descriptor = createElementNode(scope, {
        name: `input`,
        attributes: expectedAttributes
      })
      const { domNode } = descriptor

      expectedAttributes.forEach(a => {
        assert.strictEqual(domNode.getAttribute(a.name), a.value)
      })
    })
    test(`dynamic attributes`)
    test(`static and dynamic attributes`)
    test(`static properties`)
    test(`static and dynamic properties`)
    test(`static attributes and properties`)
    test(`static and dynamic attributes and properties`)
    test(`children`)
    test(`children and static attributes`)
    test(`children and dynamic attributes`)
    test(`children and static and dynamic attributes`)
    test(`children and static properties`)
    test(`children and dynamic properties`)
    test(`children and static and dynamic properties`)
    test(`children and static attributes and properties`)
    test(`children and dynamic attributes and properties`)
    test(`children and static and dynamic attributes and properties`)
  })

  suite(`createTextNode`, function () {
    test(`creates a text node`, function () {
      const descriptor = createTextNode(scope, `expected text`)
      assert.property(descriptor, `domNode`)
      assert.propertyVal(descriptor.domNode, `nodeType`, Node.TEXT_NODE)
      assert.propertyVal(descriptor.domNode, `nodeValue`, `expected text`)
    })
  })

  suite(`DomNodeDescriptor`, function () {
    test(`properties`)
    // name
    // domNode

    test(`extractContents`)
    test(`deleteContents`)
    test(`getBeforeNode`)
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
