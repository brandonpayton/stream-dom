import { Stream } from 'most'

export function isIterable (o) {
  return (
    typeof o === `object` &&
    typeof Symbol !== `undefined` &&
    Symbol.iterable in o
  )
}

export function isStream (o) {
  return o instanceof Stream
}

export function toArray (o) {
  if (Array.isArray(o)) {
    return o
  } else if (isIterable(o)) {
    return Array.from(o)
  } else {
    return [ o ]
    // TODO: Reconsider whether this should be an error
    // throw new Error(`Unable to convert object to an Array`)
  }
}