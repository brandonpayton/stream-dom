import { assert } from 'chai'
import { just, never } from 'most'
import { sync } from 'most-subject'

import { NodeDeclaration } from '../src/node'
import { createElementNode, createTextNode } from '../src/node-dom'
import { createReplacementNode } from '../src/node-stream'
import * as mock from '../test-util/mock'
import domAssert from '../test-util/dom-assert'

suite(`nodes/stream`, function () {
  let scope

  setup(function () {
    scope = mock.scope()
  })
  teardown(function () {
    scope.destroy$.next()
  })

  suite(`createReplacementNode`, function () {
    test(`has no content before initial event`, function () {
      const parentNode = document.createElement(`div`)

      const content$ = never()
      const nodeDescriptor = createReplacementNode(scope, content$)
      nodeDescriptor.insert(parentNode)

      assertNoContent(nodeDescriptor, `no content before mount`)
      return mock.signalMounted(scope).then(
        () => assertNoContent(nodeDescriptor, `no content after mount`)
      )
    })

    test(`initial content present after first mount`, function () {
      const parentNode = document.createElement(`div`)

      const content$ = just([
        new NodeDeclaration(createTextNode, `expected initial`)
      ])
      const nodeDescriptor = createReplacementNode(scope, content$)
      nodeDescriptor.insert(parentNode)

      assertNoContent(nodeDescriptor, `no content before mount`)
      return mock.signalMounted(scope).then(() => {
        const { domStartNode, domEndNode } = nodeDescriptor
        const childNode = domStartNode.nextSibling

        domAssert.textNode(childNode, `expected initial`)
        assert.strictEqual(childNode.nextSibling, domEndNode, `end of content`)
      })
    })

    test(`replaces content with each event`, function () {
      const parentNode = document.createElement(`div`)

      const content$ = sync()
      const nodeDescriptor = createReplacementNode(scope, content$)
      nodeDescriptor.insert(parentNode)

      return mock.signalMounted(scope).then(() => {
        content$.next([
          `expected first`,
          new NodeDeclaration(createElementNode, { name: `hr` }),
          `expected last`
        ])

        const { domStartNode, domEndNode } = nodeDescriptor
        let childDomNode

        childDomNode = domStartNode.nextSibling
        domAssert.textNode(childDomNode, `expected first`)
        childDomNode = childDomNode.nextSibling
        domAssert.elementNode(childDomNode, `hr`)
        childDomNode = childDomNode.nextSibling
        domAssert.textNode(childDomNode, `expected last`)
        assert.strictEqual(
          childDomNode.nextSibling, domEndNode, `end of content`
        )

        // Test replacing with smaller number of nodes
        content$.next([
          new NodeDeclaration(createElementNode, { name: `h1` }),
          new NodeDeclaration(createElementNode, { name: `h2` })
        ])
        childDomNode = domStartNode.nextSibling
        domAssert.elementNode(childDomNode, `h1`)
        childDomNode = childDomNode.nextSibling
        domAssert.elementNode(childDomNode, `h2`)
        assert.strictEqual(
          childDomNode.nextSibling, domEndNode, `end of content`
        )

        // Test replacing with larger number of nodes
        content$.next([
          new NodeDeclaration(createElementNode, { name: `h3` }),
          new NodeDeclaration(createElementNode, { name: `h4` }),
          new NodeDeclaration(createElementNode, { name: `h5` }),
          new NodeDeclaration(createElementNode, { name: `h6` })
        ])
        childDomNode = domStartNode.nextSibling
        domAssert.elementNode(childDomNode, `h3`)
        childDomNode = childDomNode.nextSibling
        domAssert.elementNode(childDomNode, `h4`)
        childDomNode = childDomNode.nextSibling
        domAssert.elementNode(childDomNode, `h5`)
        childDomNode = childDomNode.nextSibling
        domAssert.elementNode(childDomNode, `h6`)
        assert.strictEqual(
          childDomNode.nextSibling, domEndNode, `end of content`
        )
      })
    })
  })

  suite(`createOrderedListNode`, function () {
    test(`render items with targeted updates`)
    test(`moves items to match list order`)
    test(`adds items to match the list`)
    test(`removes items to match the list`)
    test(`adds and removes items to match the list`)
    test(`adds, moves, and removes items to match the list`)
  })

  // TODO: Test StreamNodeDescriptor interface
})

function assertNoContent (streamNodeDescriptor, message) {
  assert.strictEqual(
    streamNodeDescriptor.domStartNode.nextSibling,
    streamNodeDescriptor.domEndNode,
    message
  )
}
