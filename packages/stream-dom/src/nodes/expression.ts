import { text } from './dom'
import { stream, isStream } from './stream'

import { InitializeNode } from './node'
import { StreamDomContext } from '../index'

export function expression(
  context: StreamDomContext,
  value: any
): (InitializeNode | InitializeNode[]) {
  return (
    isStream(value) ? stream(context, value.multicast()) :
    Array.isArray(value) ? value.map(c => expression(context, c)) :
    // TODO: Strengthen this check to exclude all but InitializeNode functions
    typeof value === 'function' ? value :
    text(context, value)
  )
}
