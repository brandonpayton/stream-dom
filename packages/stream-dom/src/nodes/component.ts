import { Stream } from 'most'

import { createEventStream, attachEventStream, Subject } from '../eventing'

import { StreamDomContext, StreamDomScope } from '../index'
import { Attributes, Attribute, InitializeNode, NodeDescriptor } from './node'

export interface ComponentDetails {
  attributes?: Attributes,
  children?: InitializeNode[]
}

interface ComponentFactoryArgs {
  properties: { [s: string]: any },
  eventStreams: { [s: string]: Stream<any> },
  children: InitializeNode[],
  createEventStream: typeof createEventStream,
  attachEventStream: typeof attachEventStream
}

export interface ComponentFactory {
  (ComponentFactoryArgs): InitializeNode
}

export function component(
  context: StreamDomContext,
  ComponentFactory: ComponentFactory,
  { attributes = [], children = [] }: ComponentDetails = {}
) {
  const properties = {};
  const eventStreams = {};

  const processAttributes = (attributes: Attributes) => attributes.forEach(attributeDescriptor => {
    if (Array.isArray(attributeDescriptor)) {
      processAttributes(attributeDescriptor)
    }
    else {
      const { namespace, name, value } = <Attribute>attributeDescriptor

      if (namespace === undefined) {
        properties[name] = value
      }
      else if (namespace === context.eventNamespaceName) {
        eventStreams[name] = value
      }
      else {
        throw new Error(`Unsupported component namespace '${namespace}'`)
      }
    }
  })

  processAttributes(attributes)

  return (scope: StreamDomScope) => {
    const createdEventStreams: Stream<any>[] = []

    const nodeDescriptor = ComponentFactory({
      properties,
      eventStreams,
      children,
      createEventStream<T>() {
        const eventStream = createEventStream<T>()
        createdEventStreams.push(eventStream)
        return eventStream
      },
      attachEventStream<T>(to$: Subject<T>, from$: Stream<any>) {
        attachEventStream(to$, from$.until(scope.destroy$))
      }
    })(scope)

    return nodeDescriptor
  }
}
