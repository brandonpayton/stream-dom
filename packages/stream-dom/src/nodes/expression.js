import { text } from './dom'
import { stream } from './stream'
import is from '../is'

export function expression(context, value) {
  return (
    is.stream(value) ? stream(context, value.multicast()) :
    is.array(value) ? value.map(c => expression(context, c)) :
    // Consider strengthening this check for a node initialization function
    is.function(value) ? value :
    text(context, value)
  )
}
