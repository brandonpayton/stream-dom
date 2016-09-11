import { Stream } from 'most'

import hold from '@most/hold'
import { domEvent } from '@most/dom-event'

import { createEventStream, attachEventStream, createCustomEvent } from './eventing'

import { StreamDomContext, StreamDomScope } from './index'
import { InitializeElementNode } from './nodes/dom'

export function mount(
  context: StreamDomContext,
  streamDomNodeInit: InitializeElementNode,
  domParentNode: Element,
  domBeforeNode: Node = null
) {
  const mountedProxy$ = createEventStream()
  const mounted$ = mountedProxy$.thru(hold)
  mounted$.drain()

  const destroyProxy$ = createEventStream()
  const destroy$ = destroyProxy$.thru(hold)
  destroy$.drain()

  const scope: StreamDomScope = {
    parentNamespaceUri: context.defaultNamespaceUri,
    mounted$,
    destroy$
  }

  const nodeDescriptor = streamDomNodeInit(scope)
  const {domNode} = nodeDescriptor

  attachEventStream(mountedProxy$, domEvent('mount', domNode).take(1))
  attachEventStream(destroyProxy$, domEvent('destroy', domNode).take(1))

  nodeDescriptor.insert(domParentNode, domBeforeNode)

  const { document } = context
  setTimeout(() => domNode.dispatchEvent(createCustomEvent(document, 'mount')), 0)

  destroy$.observe(() => nodeDescriptor.remove())

  return {
    nodeDescriptor,
    dispose() {
      domNode.dispatchEvent(createCustomEvent(document, 'destroy'))
    }
  }
}
