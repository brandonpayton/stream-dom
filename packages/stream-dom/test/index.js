import { assert } from 'chai'
import {
  prop,
  render,
  renderItems,
  renderItemStreams,
  mount,
  declare,
  streamDom,
  component
} from '../src/index'
import { NodeDeclaration } from '../src/node'
import { createReplacementNode, createOrderedListNode } from '../src/node-stream'

import { just, reduce } from 'most'

const lastValue = (memo, value) => value

suite(`streamDom`, function () {
  test(`prop`, function () {
    const expected = {}
    const prop$ = prop(`expected`, just({ expected }))
    return reduce(lastValue, null, prop$).then(
      actual => assert.strictEqual(actual, expected)
    )
  })

  test(`render`, function () {
    const expected = {}
    const rendered$ = render(actual => ({ actual }), just(expected))
    return reduce(lastValue, null, rendered$).then(
      result => assert.strictEqual(result.actual, expected)
    )
  })

  test(`renderItems with unidentified items`, function () {
    const fakeCreate = function () {}
    const items = [ 1, 2, 3 ]
    const itemToDeclaration = item => new NodeDeclaration(fakeCreate, item)
    const declarations$ = renderItems(itemToDeclaration, just(items))
    return reduce(lastValue, null, declarations$).then(actual => {
      assert.isArray(actual)
      assert.deepEqual(
        actual.map(declaration => declaration.creationArgs),
        items
      )
    })
  })
  suite(`renderItems`, function () {
    test(`function argument and unidentified items`)
    test(`object argument and unidentified items`)
    test(`object argument and identified items`)
  })

  suite(`renderItems with identified items`, function () {
    test(`orderedListStream used for identified items`)
  })

  suite(`renderItemStreams`, function () {
    test(`requires identified items`)
    test(`orderedListStream used`)
  })

  suite(`mount`, function () {
    test(`adds stream to the DOM`)
    test(`removes stream from the DOM when dispose handle invoked`)
    test(`removes stream from the DOM when the stream ends`)
  })

  suite(`declare`, function () {
    test(`declares an element`)
    test(`declares a component`)
  })

  suite(`streamDom function`, function () {
    test(`convert Stream to StreamDom`)
    test(`returns same stream if it is already StreamDom`)
  })
})
