import { assert } from 'chai'
import { never } from 'most'

import {
  isStream,
  toArray
} from '../src/kind'

suite(`kind`, function () {
  test(`isStream`, function () {
    assert.isTrue(isStream(never()))
    assert.isFalse(isStream({}))
  })

  const missingSymbolIterator =
    typeof Symbol === `undefined` && typeof Symbol.iterator === `undefined`

  test(`toArray`, function () {
    const expectedArray = []
    assert.strictEqual(toArray(expectedArray), expectedArray)
    missingSymbolIterator || typeof Set !== `function` ||
      assert.sameMembers(toArray(new Set([ 1, 2, 3 ])), [ 1, 2, 3 ])
    assert.deepEqual(toArray(123), [ 123 ])
  })
})
