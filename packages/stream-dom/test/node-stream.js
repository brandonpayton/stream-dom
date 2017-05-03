import { assert } from 'chai'
import { just, never } from 'most'
import { sync as syncSubject } from 'most-subject'

import { NodeDeclaration } from '../src/node'
import { createElementNode, createTextNode } from '../src/node-dom'
import { createReplacementNode, createOrderedListNode } from '../src/node-stream'
import * as mock from '../test-util/mock'
import { wait } from '../test-util/time'
import domAssert from '../test-util/dom-assert'

suite(`node-stream`, function () {
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

      const content$ = syncSubject()
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
    function getItemId (item) {
      return item.id
    }
    function numberedRenderItemStream () {
      let counter = 0

      return function renderItemStream (item$) {
        return new NodeDeclaration(createElementNode, {
          name: `div`,
          attrs: {
            id: item$.map(getItemId),
            'data-ordinal': counter++
          },
          children: [
            item$.map(item => item.value)
          ]
        })
      }
    }

    function getOrdinal (domNode) {
      return domNode.getAttribute(`data-ordinal`)
    }

    function assertRenderedItem (
      domNode, itemName, expectedId, expectedContent, expectedOrdinal
    ) {
      const message = s => `item ${itemName}: ${s}`

      assert.strictEqual(
        Number(domNode.id), expectedId, message(`id`)
      )
      if (expectedOrdinal !== undefined) {
        assert.strictEqual(
          getOrdinal(domNode), expectedOrdinal, message(`ordinal`)
        )
      }

      // TODO: Don't assume implementation detail of surrouding comment nodes
      const contentNodes = getNodesBetween(domNode.firstChild, domNode.lastChild)
      assert.strictEqual(
        contentNodes.length, 1, message(`single content node`)
      )
      domAssert.textNode(
        contentNodes[0], expectedContent, message(`content`)
      )
    }

    function getNodesBetween (startNode, endNode) {
      const nodes = []
      for (
        let node = startNode.nextSibling;
        node && node !== endNode;
        node = node.nextSibling
      ) {
        nodes.push(node)
      }
      return nodes
    }

    // TODO: Clarify this test name
    test(`render items with targeted updates`, function () {
      const list$ = syncSubject()

      const parentNode = document.createElement(`div`)
      const nodeDescriptor = createOrderedListNode(scope, {
        getKey: item => item.id,
        renderItemStream: numberedRenderItemStream(),
        list$
      })
      nodeDescriptor.insert(parentNode)

      return mock.signalMounted(scope).then(() => {
        const { domStartNode, domEndNode } = nodeDescriptor
        assert.strictEqual(domStartNode.nextSibling, domEndNode, `no content`)

        const firstItems = [
          { id: 1, value: `one-a` },
          { id: 2, value: `two-a` },
          { id: 3, value: `three-a` }
        ]
        list$.next(firstItems)
        const firstActualNodes = getNodesBetween(domStartNode, domEndNode)
        const firstOrdinals = firstActualNodes.map(
          n => n.getAttribute(`data-ordinal`)
        )

        assert.strictEqual(firstActualNodes.length, 3, `expected item count`)
        firstItems.forEach((item, i) => {
          assertRenderedItem(
            firstActualNodes[i],
            `first ${i}`,
            item.id,
            item.value,
            firstOrdinals[i]
          )
        })

        const secondItems = [
          { id: 1, value: `one-b` },
          { id: 2, value: `two-b` },
          { id: 3, value: `three-b` }
        ]
        list$.next(secondItems)
        const secondActualNodes = getNodesBetween(domStartNode, domEndNode)

        assert.strictEqual(
          secondActualNodes.length,
          firstActualNodes.length,
          `same item count`
        )
        secondItems.forEach((item, i) => {
          assertRenderedItem(
            secondActualNodes[i],
            `second ${i}`,
            item.id,
            item.value,
            // Assert ordinals are the same as the original so we can
            // infer list items are being updated rather than replaced.
            firstOrdinals[i]
          )
        })

        const thirdItems = [
          { id: 1, value: `one-c` },
          { id: 2, value: `two-c` },
          { id: 3, value: `three-c` }
        ]
        list$.next(thirdItems)
        const thirdActualNodes = getNodesBetween(domStartNode, domEndNode)

        assert.strictEqual(
          thirdActualNodes.length,
          firstActualNodes.length,
          `same item count`
        )
        thirdItems.forEach((item, i) => {
          assertRenderedItem(
            thirdActualNodes[i],
            `third ${i}`,
            item.id,
            item.value,
            // Assert ordinals are the same as the original so we can
            // infer list items are being updated rather than replaced.
            firstOrdinals[i]
          )
        })
      })
    })
    test(`moves items to match list order`, function () {
      const list$ = syncSubject()

      const parentNode = document.createElement(`div`)
      const nodeDescriptor = createOrderedListNode(scope, {
        getKey: item => item.id,
        renderItemStream: numberedRenderItemStream(),
        list$
      })
      nodeDescriptor.insert(parentNode)

      return mock.signalMounted(scope).then(() => {
        const { domStartNode, domEndNode } = nodeDescriptor
        assert.strictEqual(domStartNode.nextSibling, domEndNode, `no content`)

        const firstItems = [
          { id: 1, value: `one` },
          { id: 2, value: `two` },
          { id: 3, value: `three` },
          { id: 4, value: `four` }
        ]
        list$.next(firstItems)
        const firstActualNodes = getNodesBetween(domStartNode, domEndNode)
        const firstOrdinals = firstActualNodes.map(
          n => n.getAttribute(`data-ordinal`)
        )

        assert.strictEqual(firstActualNodes.length, 4, `expected item count`)
        firstItems.forEach((item, i) => {
          assertRenderedItem(
            firstActualNodes[i],
            `first ${i}`,
            item.id,
            item.value,
            firstOrdinals[i]
          )
        })

        const secondItems = [ firstItems[3], firstItems[2], firstItems[1], firstItems[0] ]
        const secondExpectedOrdinals = [
          firstOrdinals[3], firstOrdinals[2], firstOrdinals[1], firstOrdinals[0]
        ]
        list$.next(secondItems)
        const secondActualNodes = getNodesBetween(domStartNode, domEndNode)

        assert.strictEqual(
          secondActualNodes.length,
          firstActualNodes.length,
          `same item count`
        )
        secondItems.forEach((item, i) => {
          assertRenderedItem(
            secondActualNodes[i],
            `second ${i}`,
            item.id,
            item.value,
            secondExpectedOrdinals[i]
          )
        })

        const thirdItems = [
          firstItems[1], firstItems[3], firstItems[0], firstItems[2]
        ]
        const thirdExpectedOrdinals = [
          firstOrdinals[1], firstOrdinals[3], firstOrdinals[0], firstOrdinals[2]
        ]
        list$.next(thirdItems)
        const thirdActualNodes = getNodesBetween(domStartNode, domEndNode)

        assert.strictEqual(
          thirdActualNodes.length,
          firstActualNodes.length,
          `same item count`
        )
        thirdItems.forEach((item, i) => {
          assertRenderedItem(
            thirdActualNodes[i],
            `third ${i}`,
            item.id,
            item.value,
            thirdExpectedOrdinals[i]
          )
        })
      })
    })
    test(`adds items to match the list`, function () {
      const list$ = syncSubject()

      const parentNode = document.createElement(`div`)
      const nodeDescriptor = createOrderedListNode(scope, {
        getKey: item => item.id,
        renderItemStream: numberedRenderItemStream(),
        list$
      })
      nodeDescriptor.insert(parentNode)

      return mock.signalMounted(scope).then(() => {
        const { domStartNode, domEndNode } = nodeDescriptor
        assert.strictEqual(domStartNode.nextSibling, domEndNode, `no content`)

        const originalItems = [
          { id: 1, value: `one` },
          { id: 3, value: `three` }
        ]
        list$.next(originalItems)
        const originalActualNodes = getNodesBetween(domStartNode, domEndNode)
        const originalOrdinals = originalActualNodes.map(
          n => n.getAttribute(`data-ordinal`)
        )

        assert.strictEqual(
          originalActualNodes.length,
          2,
          `expected item count`
        )
        originalItems.forEach((item, i) => {
          assertRenderedItem(
            originalActualNodes[i],
            `original ${i}`,
            item.id,
            item.value,
            originalOrdinals[i]
          )
        })

        const nextItems = [
          { id: 1, value: `one` },
          { id: 2, value: `two` },
          { id: 3, value: `three` },
          { id: 4, value: `four` }
        ]
        list$.next(nextItems)
        const nextActualNodes = getNodesBetween(domStartNode, domEndNode)
        // Specify ordinals for original items to make sure they didn't change
        const expectedOrdinals = [
          originalOrdinals[0],
          undefined,
          originalOrdinals[1],
          undefined
        ]

        assert.strictEqual(
          nextActualNodes.length,
          4,
          `expected item count`
        )
        nextItems.forEach((item, i) => {
          assertRenderedItem(
            nextActualNodes[i],
            `next ${i}`,
            item.id,
            item.value,
            expectedOrdinals[i]
          )
        })
      })
    })
    test(`removes items to match the list`, function () {
      const list$ = syncSubject()

      const parentNode = document.createElement(`div`)
      const nodeDescriptor = createOrderedListNode(scope, {
        getKey: item => item.id,
        renderItemStream: numberedRenderItemStream(),
        list$
      })
      nodeDescriptor.insert(parentNode)

      return mock.signalMounted(scope).then(() => {
        const { domStartNode, domEndNode } = nodeDescriptor
        assert.strictEqual(domStartNode.nextSibling, domEndNode, `no content`)

        const firstItems = [
          { id: 1, value: `one` },
          { id: 2, value: `two` },
          { id: 3, value: `three` },
          { id: 4, value: `four` }
        ]
        list$.next(firstItems)
        const firstActualNodes = getNodesBetween(domStartNode, domEndNode)
        const firstOrdinals = firstActualNodes.map(
          n => n.getAttribute(`data-ordinal`)
        )

        assert.strictEqual(
          firstActualNodes.length,
          4,
          `expected item count`
        )
        firstItems.forEach((item, i) => {
          assertRenderedItem(
            firstActualNodes[i],
            `first ${i}`,
            item.id,
            item.value,
            firstOrdinals[i]
          )
        })

        const secondItems = [
          { id: 1, value: `one` },
          { id: 2, value: `two` },
          { id: 4, value: `four` }
        ]
        list$.next(secondItems)
        const secondActualNodes = getNodesBetween(domStartNode, domEndNode)

        assert.strictEqual(
          secondActualNodes.length,
          3,
          `expected item count`
        )
        secondItems.forEach((item, i) => {
          assertRenderedItem(
            secondActualNodes[i], `second ${i}`, item.id, item.value
          )
        })

        const thirdItems = []
        list$.next(thirdItems)
        const thirdActualNodes = getNodesBetween(domStartNode, domEndNode)

        assert.strictEqual(
          thirdActualNodes.length,
          0,
          `expected item count`
        )
        thirdItems.forEach((item, i) => {
          assertRenderedItem(
            thirdActualNodes[i], `second ${i}`, item.id, item.value
          )
        })
      })
    })
    test(`adds and removes items to match the list`, function () {
      const list$ = syncSubject()

      const parentNode = document.createElement(`div`)
      const nodeDescriptor = createOrderedListNode(scope, {
        getKey: item => item.id,
        renderItemStream: numberedRenderItemStream(),
        list$
      })
      nodeDescriptor.insert(parentNode)

      return mock.signalMounted(scope).then(() => {
        const { domStartNode, domEndNode } = nodeDescriptor
        assert.strictEqual(domStartNode.nextSibling, domEndNode, `no content`)

        const firstItems = [
          { id: 1, value: `one` },
          { id: 2, value: `two` }
        ]
        list$.next(firstItems)
        const firstActualNodes = getNodesBetween(domStartNode, domEndNode)
        const firstOrdinals = firstActualNodes.map(getOrdinal)

        assert.strictEqual(
          firstActualNodes.length,
          2,
          `expected item count`
        )
        firstItems.forEach((item, i) => {
          assertRenderedItem(
            firstActualNodes[i],
            `first ${i}`,
            item.id,
            item.value,
            firstOrdinals[i]
          )
        })

        const secondItems = [
          { id: 1, value: `one` },
          { id: 4, value: `four` }
        ]
        list$.next(secondItems)
        const secondActualNodes = getNodesBetween(domStartNode, domEndNode)
        const secondActualOrdinals = secondActualNodes.map(getOrdinal)
        const secondExpectedOrdinals = [ firstOrdinals[0], undefined, undefined ]

        assert.strictEqual(
          secondActualNodes.length,
          2,
          `expected item count`
        )
        secondItems.forEach((item, i) => {
          assertRenderedItem(
            secondActualNodes[i],
            `second ${i}`,
            item.id,
            item.value,
            secondExpectedOrdinals[i]
          )
        })

        const thirdItems = [
          { id: 3, value: `three` },
          { id: 4, value: `four` },
          { id: 5, value: `five` }
        ]
        list$.next(thirdItems)
        const thirdActualNodes = getNodesBetween(domStartNode, domEndNode)
        const thirdExpectedOrdinals = [
          undefined,
          secondActualOrdinals[1],
          undefined
        ]

        assert.strictEqual(
          thirdActualNodes.length,
          3,
          `expected item count`
        )
        thirdItems.forEach((item, i) => {
          assertRenderedItem(
            thirdActualNodes[i],
            `second ${i}`,
            item.id,
            item.value,
            thirdExpectedOrdinals[i]
          )
        })
      })
    })
    test(`adds, moves, and removes items to match the list`, function () {
      const list$ = syncSubject()

      const parentNode = document.createElement(`div`)
      const nodeDescriptor = createOrderedListNode(scope, {
        getKey: item => item.id,
        renderItemStream: numberedRenderItemStream(),
        list$
      })
      nodeDescriptor.insert(parentNode)

      return mock.signalMounted(scope).then(() => {
        const { domStartNode, domEndNode } = nodeDescriptor
        assert.strictEqual(domStartNode.nextSibling, domEndNode, `no content`)

        const firstItems = [
          { id: 1, value: `one` },
          { id: 2, value: `two` }
        ]
        list$.next(firstItems)
        const firstActualNodes = getNodesBetween(domStartNode, domEndNode)
        const firstOrdinals = firstActualNodes.map(getOrdinal)

        assert.strictEqual(
          firstActualNodes.length,
          2,
          `expected item count`
        )
        firstItems.forEach((item, i) => {
          assertRenderedItem(
            firstActualNodes[i],
            `first ${i}`,
            item.id,
            item.value,
            firstOrdinals[i]
          )
        })

        const secondItems = [
          { id: 4, value: `four` },
          { id: 1, value: `one` }
        ]
        list$.next(secondItems)
        const secondActualNodes = getNodesBetween(domStartNode, domEndNode)
        const secondActualOrdinals = secondActualNodes.map(getOrdinal)
        const secondExpectedOrdinals = [ undefined, firstOrdinals[0] ]

        assert.strictEqual(
          secondActualNodes.length,
          2,
          `expected item count`
        )
        secondItems.forEach((item, i) => {
          assertRenderedItem(
            secondActualNodes[i],
            `second ${i}`,
            item.id,
            item.value,
            secondExpectedOrdinals[i]
          )
        })

        const thirdItems = [
          { id: 3, value: `three` },
          { id: 5, value: `five` },
          { id: 4, value: `four` }
        ]
        list$.next(thirdItems)
        const thirdActualNodes = getNodesBetween(domStartNode, domEndNode)
        const thirdExpectedOrdinals = [
          undefined,
          undefined,
          secondActualOrdinals[0]
        ]

        assert.strictEqual(
          thirdActualNodes.length,
          3,
          `expected item count`
        )
        thirdItems.forEach((item, i) => {
          assertRenderedItem(
            thirdActualNodes[i],
            `second ${i}`,
            item.id,
            item.value,
            thirdExpectedOrdinals[i]
          )
        })
      })
    })
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
