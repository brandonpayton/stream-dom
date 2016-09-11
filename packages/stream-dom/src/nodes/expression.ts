import { text } from './dom'
import { stream } from './stream'
import is from '../is'

import { InitializeNode } from './node'
import { StreamDomContext } from '../index'

// TODO: Revisit return type
export function expression(
  context: StreamDomContext,
  value: any
) : (InitializeNode | InitializeNode[]) {
  return (
    is.stream(value) ? stream(context, value.multicast()) :
    is.array(value) ? value.map(c => expression(context, c)) :
    // TODO: Consider strengthening this check for a node initialization function
    is.function(value) ? value :
    text(context, value)
  )
}
