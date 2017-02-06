import { Stream } from 'most'
import { isIterable } from 'most/lib/iterable'

export function isStream (o) {
  return o instanceof Stream
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
