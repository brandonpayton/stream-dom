import { Stream } from '@most/core'

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
    throw new Error(`Unable to convert object to an Array`)
  }
}
