import { merge, Stream } from 'most'

import { create, initializeChildren } from './util'

import { DomContainerNode, Child, InitializeNode, NodeDescriptor } from './node'
import { StreamDomContext, StreamDomScope } from '../index'

export function stream(context: StreamDomContext, children$: Stream<Child[]>) : InitializeNode {
  return (scope: StreamDomScope) => {
    const { document } = context
    const { mounted$, destroy$ } = scope
    const domStartNode = document.createComment('')
    const domEndNode = document.createComment('')

    const childDescriptors$ = children$
      .until(destroy$)
      .map(children => initializeChildren(children, <StreamDomScope>create(scope, {
        // TODO: Remove use of delay() workaround for most-proxy sync dispatch during attach
        mounted$: mounted$.delay(1),
        destroy$: merge(children$, destroy$).take(1),
      })))
      .tap(childDescriptors => {
        const { document, sharedRange } = context

        const fragment = document.createDocumentFragment()
        childDescriptors.forEach(childDescriptor => childDescriptor.insert(fragment))

        sharedRange.setStartAfter(domStartNode)
        sharedRange.setEndBefore(domEndNode)
        sharedRange.deleteContents()
        sharedRange.insertNode(fragment)
      })
      // TODO: Add multicast() here after TS conversion and test

    childDescriptors$.drain()

    return new StreamNodeDescriptor(
      context.sharedRange,
      domStartNode,
      domEndNode,
      childDescriptors$
    )
  }
}

class StreamNodeDescriptor {
  sharedRange: Range
  domStartNode: Node
  domEndNode: Node
  childDescriptors$: Stream<NodeDescriptor[]>

  get type() { return 'stream' }

  // TODO: As an internal API, why not simply use discrete args?
  constructor(
    sharedRange: Range,
    domStartNode: Node,
    domEndNode: Node,
    // TODO: Allow nesting?
    childDescriptors$: Stream<NodeDescriptor[]>
  ) {
    this.sharedRange = sharedRange
    this.domStartNode = domStartNode
    this.domEndNode = domEndNode
    this.childDescriptors$ = childDescriptors$
  }

  insert(domParentNode: DomContainerNode, domBeforeNode: Node = null) {
    domParentNode.insertBefore(this.domStartNode, domBeforeNode)
    domParentNode.insertBefore(this.domEndNode, domBeforeNode)
  }
  remove() {
    const { sharedRange } = this
    sharedRange.setStartBefore(this.domStartNode)
    sharedRange.setEndAfter(this.domEndNode)
    sharedRange.deleteContents()
  }
}
