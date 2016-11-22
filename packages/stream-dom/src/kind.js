import { isIterable } from 'most/lib/iterable'
import symbolObservable from 'symbol-observable'

export function isObservable (o) {
  return (
    typeof o === `object` &&
    o !== null &&
    symbolObservable in o
  )
}

export function toArray (o) {
  if (Array.isArray(o)) {
    return o
  } else if (isIterable(o) && typeof o !== `string`) {
    return Array.from(o)
  } else {
    return [ o ]
    // TODO: Reconsider whether this should be an error
    // throw new Error(`Unable to convert object to an Array`)
  }
}
