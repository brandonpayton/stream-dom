import uuid from 'uuid'

function symbolWorkaround (name) {
  return `${name}-${uuid.v4()}`
}

export const symbol = typeof Symbol === `undefined`
  ? symbolWorkaround
  : Symbol
