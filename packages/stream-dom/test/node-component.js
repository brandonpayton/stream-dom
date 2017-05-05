import { assert } from 'chai'
import { fromPromise } from 'most'
import { sync as syncSubject } from 'most-subject'
import { domEvent } from '@most/dom-event'

import { component, inputTypes } from '../src/node-component'
import { NodeDeclaration } from '../src/node'
import { createElementNode } from '../src/node-dom'

import * as mock from '../test-util/mock'
import { wait } from '../test-util/time'
import domAssert from '../test-util/dom-assert'

suite(`node-component`, function () {
  let containerNode
  let scope

  setup(function () {
    containerNode = document.body.appendChild(
      document.createElement(`div`)
    )
    scope = mock.scope()
  })

  teardown(function () {
    containerNode.parentNode.removeChild(containerNode)
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
  test(`structure and output`, function () {
    const TestComponent = component({
      structure: input => new NodeDeclaration(createElementNode, {
        nodeName: `buttonNode`,
        name: `button`
      }),
      output: namedNodes => ({
        click$: domEvent(`click`, namedNodes.buttonNode)
      })
    })

    const descriptor = TestComponent(scope)
    descriptor.insert(containerNode)

    const buttonNode = descriptor.getBeforeNode()
    domAssert.elementNode(buttonNode, `button`)

    const expectedClickCount = 7

    return mock.signalMounted(scope).then(() => {
      const { click$ } = descriptor.expose

      const promiseToClick = wait(100).then(() => {
        for (let i = 0; i < expectedClickCount; ++i) {
          buttonNode.click()
        }
      })

      return click$
        .until(fromPromise(promiseToClick))
        .reduce(count => count + 1, 0)
    }).then(actualClickCount => {
      assert.strictEqual(
        actualClickCount,
        expectedClickCount,
        `component click count`
      )
    })
  })
  test(`input, structure, and output`, function () {
    const multiplier = 123

    const TestComponent = component({
      input: {
        multiplier: inputTypes.number
      },
      structure: input => new NodeDeclaration(createElementNode, {
        nodeName: `buttonNode`,
        name: `button`,
        attrs: { class: input.class$ }
      }),
      output: (namedNodes, input) => ({
        magnitude$: domEvent(`click`, namedNodes.buttonNode).scan(
          current => current * input.multiplier,
          1
        )
      })
    })

    const descriptor = TestComponent(scope, { input: { multiplier } })
    descriptor.insert(containerNode)

    const buttonNode = descriptor.getBeforeNode()
    domAssert.elementNode(buttonNode, `button`)

    const expectedClickCount = 7

    return mock.signalMounted(scope).then(() => {
      const { magnitude$ } = descriptor.expose

      const promiseToClick = wait(100).then(() => {
        for (let i = 0; i < expectedClickCount; ++i) {
          buttonNode.click()
        }
      })

      return magnitude$
        .until(fromPromise(promiseToClick))
        .reduce((_, lastMagnitude) => lastMagnitude)
    }).then(actualMagnitude => {
      const expectedMagnitude = Math.pow(multiplier, expectedClickCount)
      assert.strictEqual(actualMagnitude, expectedMagnitude, `final magnitude`)
    })
  })
  test(`feedback streams`, function () {
    const TestComponent = component({
      input: {
        clickCount$: inputTypes.feedback
      },
      structure: input => new NodeDeclaration(createElementNode, {
        nodeName: `rootNode`,
        name: `div`,
        attrs: { 'data-click-count': input.clickCount$ }
      }),
      output: namedNodes => ({
        clickCount$: domEvent(`click`, namedNodes.rootNode)
          .scan(count => count + 1, 0)
      })
    })

    const descriptor = TestComponent(scope)
    descriptor.insert(containerNode)

    return mock.signalMounted(scope).then(() => {
      const domNode = descriptor.getBeforeNode()
      const getClickCount = () => Number(
        domNode.getAttribute(`data-click-count`)
      )

      assert.strictEqual(getClickCount(), 0, `initial count`)

      domNode.click()
      assert.strictEqual(getClickCount(), 1, `count after one click`)

      domNode.click()
      assert.strictEqual(getClickCount(), 2, `count after two clicks`)

      domNode.click()
      assert.strictEqual(getClickCount(), 3, `count after three clicks`)
    })
  })

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
