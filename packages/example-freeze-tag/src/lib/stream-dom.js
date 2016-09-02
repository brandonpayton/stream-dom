import { configureStreamDom } from 'stream-dom'

const streamDom = configureStreamDom({
  eventNamespaceName: 'e',
  propertyNamespaceName: 'p',
})

export default streamDom