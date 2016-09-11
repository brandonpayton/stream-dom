import { Stream } from 'most'
import { proxy } from 'most-proxy'

const attachProp = '@@most-proxy-attach'

export function createEventStream<A>(): Stream<A> {
  const {attach, stream} = proxy<A>()
  stream[attachProp] = attach
  return stream
}

export function attachEventStream<A>(proxy$: Stream<A>, stream$: Stream<A>): void {
  proxy$[attachProp](stream$)
}

interface CustomEventInit {
  bubbles?: boolean,
  cancelable?: boolean,
  detail?: Object
}

export function createCustomEvent(
  document: HTMLDocument,
  eventName: string,
  customEventInit: CustomEventInit = {}
): CustomEvent {
  if (typeof CustomEvent === 'function') {
    return new CustomEvent(eventName, customEventInit)
  }
  else {
    const customEvent = document.createEvent('CustomEvent')
    const { bubbles = false, cancelable = false, detail = null } = customEventInit
    customEvent.initCustomEvent(eventName, bubbles, cancelable, detail)
    return customEvent
  }
}
