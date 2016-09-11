import { merge, Stream } from 'most'

import { initializeChildren } from './util'

import { DomContainerNode, ChildDeclaration, InitializeNode, NodeDescriptor } from './node'
import { StreamDomContext, StreamDomScope } from '../index'

import symbolObservable from 'symbol-observable'

export function stream(context: StreamDomContext, children$: Stream<ChildDeclaration[]>) : InitializeNode {
  return (scope: StreamDomScope) => {
    const { document } = context
    const { mounted$, destroy$ } = scope
    const domStartNode = document.createComment('')
    const domEndNode = document.createComment('')

    const childDescriptors$ = children$
      .until(destroy$)
      .map(children => {
        const childScope = {
          parentNamespaceUri: scope.parentNamespaceUri,
          // TODO: Remove use of delay() workaround for most-proxy sync dispatch during attach
          mounted$: mounted$.delay(1).multicast(),
          destroy$: merge<any>(children$, destroy$).take(1).multicast()
        }
        return initializeChildren(children, childScope)
      })
      .tap(childDescriptors => {
        const { document, sharedRange } = context

        const fragment = document.createDocumentFragment()
        childDescriptors.forEach(childDescriptor => childDescriptor.insert(fragment))

        sharedRange.setStartAfter(domStartNode)
        sharedRange.setEndBefore(domEndNode)
        sharedRange.deleteContents()
        sharedRange.insertNode(fragment)
      })
      .multicast()

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

  constructor(
    sharedRange: Range,
    domStartNode: Node,
    domEndNode: Node,
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

export function isStream(candidate: any): boolean {
  return !!candidate[symbolObservable]
}
