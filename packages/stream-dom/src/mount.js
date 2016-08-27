import {domEvent} from '@most/dom-event'
import hold from '@most/hold'

import { createEventStream, attachEventStream } from './eventing'

export function mount(context, streamDomNodeInit, domParentNode, domBeforeNode = null) {
  const mountedProxy$ = createEventStream()
  const mounted$ = mountedProxy$.thru(hold)
  const destroyProxy$ = createEventStream()
  const destroy$ = destroyProxy$.multicast()

  const config = {
    parentNamespaceUri: context.getDefaultNamespaceUri(),
    mounted$,
    destroy$
  }

  const nodeDescriptor = streamDomNodeInit(config)
  const {domNode} = nodeDescriptor

  attachEventStream(mountedProxy$, domEvent('mount', domNode).take(1))
  attachEventStream(destroyProxy$, domEvent('destroy', domNode).take(1))

  nodeDescriptor.insert(domParentNode, domBeforeNode)

  setTimeout(() => domNode.dispatchEvent(new CustomEvent('mount')), 0)

  destroy$.observe(() => nodeDescriptor.remove())

  return {
    nodeDescriptor,
    dispose() {
      domNode.dispatchEvent(new CustomEvent('destroy'))
    }
  }
}
