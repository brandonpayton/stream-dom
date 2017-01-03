import { text } from './dom'
import { replacementStream, isStream } from './stream'

import { NodeDeclaration } from './node'

export function expression(config, scope, value) {
  return (
    isStream(value) ? replacementStream(config, scope, value.multicast()) :
    Array.isArray(value) ? value.map(c => expression(config, scope, c)) :
    // TODO: Strengthen this check to exclude all but InitializeNode functions
    value instanceof NodeDeclaration ? value.create(config, scope) :
    text(config, scope, value)
  )
}
