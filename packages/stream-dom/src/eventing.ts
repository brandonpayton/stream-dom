import { Stream, merge } from 'most'
import { proxy } from 'most-proxy'

export type DomEvent = Event | CustomEvent | { target: Element }

const bindProxySymbol = '@@stream-dom-proxy-bind'
const attachedStreamsSymbol = '@@stream-dom-attached-streams'

// TODO: Consider better name for this
export interface ConstructingStream extends Stream<any> {
  // TS does not allow interfaces computed property names unless using built-in symbols,
  // so we have to duplicate the key here.
  '@@stream-dom-attached-streams'?: Stream<any>[];
}

export function createEventStream<T>(): Stream<T> {
  const {attach, stream} = proxy<T>()
  stream[bindProxySymbol] = attach
  return stream
}

// TODO: Consider better name for this
export function attachEventStream(to$: ConstructingStream, from$: Stream<any>): void {
  const attachedStreams = to$[attachedStreamsSymbol] || (to$[attachedStreamsSymbol] = [])
  attachedStreams.push(from$)
}

export function bindEventStream<T>(proxy$: Stream<T>): void {
  const attachedStreams = proxy$[attachedStreamsSymbol]
  proxy$[attachedStreamsSymbol] = null

  if (attachedStreams.length > 0) {
    proxy$[bindProxySymbol](
      attachedStreams.length === 1 ? attachedStreams[0] : merge(...attachedStreams)
    )
  }
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
