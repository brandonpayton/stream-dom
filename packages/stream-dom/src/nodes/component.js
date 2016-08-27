import { createEventStream } from '../eventing'
import is from '../is'

export function component(context, ComponentFactory, { attributes = [], children } = {}) {
  const args = { properties: {}, eventStreams: {}, children, createEventStream }

  const processAttributes = attributes => attributes.forEach(attributeDescriptor => {
    if (is.array(attributeDescriptor)) {
      processAttributes(attributeDescriptor)
    }
    else {
      const { namespace, name, value } = attributeDescriptor

      if (namespace === undefined) {
        args.properties[name] = value
      }
      else if (namespace === context.eventNamespaceName) {
        args.eventStreams[name] = value
      }
      else {
        throw new Error(`Unsupported component namespace '${namespace}'`)
      }
    }
  })

  processAttributes(attributes)

  return ComponentFactory(args)
}
