import { Stream } from 'most'

import hold from '@most/hold'
import { domEvent } from '@most/dom-event'

import {
  createMemoryEventStream,
  DomEvent
} from './eventing'

import { StreamDomContext, StreamDomScope } from './index'
import { InitializeElementNode } from './nodes/dom'

export function mount(
  context: StreamDomContext,
  streamDomNodeInit: InitializeElementNode,
  domParentNode: Element,
  domBeforeNode: Node = null
) {
  const mounted$ = createMemoryEventStream<null>()
  const destroy$ = createMemoryEventStream<null>()

  const scope: StreamDomScope = {
    parentNamespaceUri: context.defaultNamespaceUri,
    mounted$,
    destroy$
  }

  const nodeDescriptor = streamDomNodeInit(scope)
  const {domNode} = nodeDescriptor

  nodeDescriptor.insert(domParentNode, domBeforeNode)

  mounted$.next(null)

  return {
    nodeDescriptor,
    dispose() {
      destroy$.next(null)
      nodeDescriptor.remove()
    }
  }
}
