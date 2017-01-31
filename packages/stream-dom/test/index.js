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

import { just, reduce } from 'most'

suite(`streamDom`, function () {
  test(`prop`, function () {
    const expected = {}
    const prop$ = prop(`expected`, just({ expected }))
    const promise = reduce(
      (memo, value) => value,
      null,
      prop$
    )
    return promise.then(
      actual => assert.strictEqual(actual, expected)
    )
  })

  suite(`render`, function () {
    test(`text`)
    test(`element`)
    test(`component`)
  })

  suite(`renderItems`, function () {
    test(`replacementStream used for unidentified items`)
    test(`orderedListStream used for identified items`)
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
