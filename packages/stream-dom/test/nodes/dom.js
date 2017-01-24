import { text, TextNodeDescriptor } from '../../src/nodes/dom'

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

  suite(`element`, function () {
    test(`no children, attributes, or properties`)
    test(`static attributes`)
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

  suite(`DomNodeDescriptor`, function () {
    test(`name property`)
    test(`extractContents`)
    test(`deleteContents`)
    test(`getBeforeNode`)
    test(`expose`)
  })

  suite(`ElementNodeDescriptor`, function () {
    test(`name property`)
    test(`domNode property`)
    test(`childDescriptors property`)

    suite(`expose`, function () {
      test(`domNode`)
      test(`on`)
    })
  })

  suite(`text`, function () {
    test(`creates a text node`, function () {
      const descriptor = text(scope, `expected text`)
      assert.property(descriptor, `domNode`)
      assert.propertyVal(descriptor.domNode, `nodeType`, Node.TEXT_NODE)
      assert.propertyVal(descriptor.domNode, `nodeValue`, `expected text`)
    })
  })

  suite(`TextNodeDescriptor`, function () {
    test(`domNode property`, function () {
      const expectedNode = document.createTextNode(`expected`)
      const descriptor = new TextNodeDescriptor(expectedNode)
      assert.propertyVal(descriptor, `domNode`, expectedNode)
    })
  })
})
