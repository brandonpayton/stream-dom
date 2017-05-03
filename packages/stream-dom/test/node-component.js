import { assert } from 'chai'
import { sync as syncSubject } from 'most-subject'

import { component, inputTypes } from '../src/node-component'
import { NodeDeclaration } from '../src/node'
import { createElementNode } from '../src/node-dom'

import * as mock from '../test-util/mock'
import domAssert from '../test-util/dom-assert'

suite(`nodes/component`, function () {
  let scope

  setup(function () {
    scope = mock.scope()
  })

  teardown(function () {
    scope.destroy$.next()
  })

  test(`structure with no input or output`, function () {
    const TestComponent = component({
      structure: () => new NodeDeclaration(createElementNode, {
        name: `section`,
        attrs: {
          class: `expected`
        }
      })
    })

    const descriptor = TestComponent(scope)

    const domContents = descriptor.extractContents()
    domAssert.elementNode(domContents, `section`, scope.parentNamespaceUri)
    domAssert.elementAttributes(
      domContents,
      [ { name: `class`, value: `expected` } ]
    )
  })
  test(`static input and structure`, function () {
    const TestComponent = component({
      input: {
        value: inputTypes.number
      },
      structure: input => new NodeDeclaration(createElementNode, {
        name: `section`,
        children: [ input.value ]
      })
    })

    const expectedValue = 123
    const descriptor = TestComponent(scope, {
      input: {
        value: expectedValue
      }
    })

    const domContents = descriptor.extractContents()
    domAssert.elementNode(domContents, `section`, scope.parentNamespaceUri)
    assert.strictEqual(
      domContents.childNodes.length, 1, `expected child count`
    )
    domAssert.textNode(domContents.firstChild, expectedValue)
  })
  test(`dynamic input and structure`, function () {
    const class$ = syncSubject()
    const TestComponent = component({
      input: {
        class$: inputTypes.observable
      },
      structure: input => new NodeDeclaration(createElementNode, {
        name: `span`,
        attrs: { class: class$ }
      })
    })

    const descriptor = TestComponent(scope, {
      input: { class$ }
    })

    const domContents = descriptor.extractContents()
    domAssert.elementNode(domContents, `span`, scope.parentNamespaceUri)

    return mock.signalMounted(scope).then(() => {
      assert.isFalse(domContents.hasAttribute(`class`), `no class yet`)

      class$.next(`expected1`)
      assert.strictEqual(
        domContents.getAttribute(`class`),
        `expected1`,
        `first expected class value`
      )

      class$.next(`expected2`)
      assert.strictEqual(
        domContents.getAttribute(`class`),
        `expected2`,
        `second expected class value`
      )
    })
  })
  test(`structure and output`)
  test(`static input structure and output`)
  test(`dynamic input structure and output`)
  test(`feedback streams`)

  suite(`ComponentNodeDescriptor`, function () {
    test(`name property`)
    test(`extractContents`)
    test(`deleteContents`)
    test(`getBeforeNode`)
    test(`getNextSiblingNode`)
    test(`expose`)
  })

  suite(`input`, function () {
    suite(`inputTypes validation`, function () {
      test(`required`)
      test(`any`)
      test(`boolean`)
      test(`string`)
      test(`number`)
      test(`object`)
      test(`array`)
      test(`children`)
      test(`stream`)
      test(`feedback`)
    })

    test(`relays declared inputs`)
    test(`ignores undeclared inputs`)
    test(`validates declared inputs`)
    test(`filters out undeclared inputs`)
    test(`identifies feedback streams`)
    test(`ensures input streams are multicast`)
  })

  suite(`create structure`, function () {
    test(`provides a scope with the component's default namespace`)
    test(`returns the root node descriptor`)
    test(`provides a map of named nodes`)
  })

  suite(`output`, function () {
    test(`ensures output streams are multicast`)
    test(`attaches feedback streams`)
  })
})
