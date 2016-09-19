import { configureStreamDom } from 'stream-dom'

export const streamDom = configureStreamDom({
  eventNamespaceName: 'e',
  propertyNamespaceName: 'p'
})
