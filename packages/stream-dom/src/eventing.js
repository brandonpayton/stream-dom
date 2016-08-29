import {proxy} from 'most-proxy'

const attachProp = '@@most-proxy-attach'

export const createEventStream = () => {
  const {attach, stream} = proxy()
  stream[attachProp] = attach
  return stream
}

export const attachEventStream = (proxy$, stream$) => proxy$[attachProp](stream$)

export function createCustomEvent(document, eventName, customEventInit = {}) {
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
