import { assert } from 'chai'
import { never } from 'most'

import {
  isObservable,
  toArray
} from '../src/kind'

suite(`kind`, function () {
  test(`isObservable`, function () {
    assert.isTrue(isObservable(never()))
    assert.isFalse(isObservable({}))
  })
  // TODO: Test most-subject and stream-dom rely on the same Stream lib. Later: Use Observable interop

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
