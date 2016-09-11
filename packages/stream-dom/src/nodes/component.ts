import { Stream } from 'most'

import { createEventStream } from '../eventing'
import is from '../is'

import { StreamDomContext } from '../index'
import { Attributes, Attribute, InitializeNode } from './node'

export interface ComponentDeclarationArgs {
  attributes?: Attributes,
  children?: InitializeNode[]
}

interface ComponentFactoryArgs {
  properties: { [s: string]: any },
  eventStreams: { [s: string]: Stream<any> },
  children: InitializeNode[],
  // TODO: Does this actually work?
  createEventStream: typeof createEventStream
}

export function component(
  context: StreamDomContext,
  ComponentFactory: Function,
  { attributes = [], children = [] }: ComponentDeclarationArgs = {}
) {
  const args: ComponentFactoryArgs = { properties: {}, eventStreams: {}, children, createEventStream }

  const processAttributes = (attributes: Attributes) => attributes.forEach(attributeDescriptor => {
    if (Array.isArray(attributeDescriptor)) {
      processAttributes(attributeDescriptor)
    }
    else {
      const { namespace, name, value } = <Attribute>attributeDescriptor

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
