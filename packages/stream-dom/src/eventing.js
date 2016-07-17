import {proxy} from 'most-proxy'

const attachProp = '@@most-proxy-attach'

export const createEventStream = () => {
  const {attach, stream} = proxy()
  stream[attachProp] = attach
  return stream
}

export const attachEventStream = (proxy$, stream$) => proxy$[attachProp](stream$)
