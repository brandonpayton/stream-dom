import { from, merge } from 'most'
import { hold } from '@most/hold'
import { sync } from 'most-subject'

import { DoublyLinkedList, Node as ListNode } from './doubly-linked-list'

import { NodeDescriptor } from './node'
import { createNodeDescriptors } from './node-helpers'
import { toArray } from './kind'

function createStreamNode (manageContent, scope, inputObservable) {
  const { document } = scope
  const input$ = from(inputObservable)
  const domStartNode = document.createComment(``)
  const domEndNode = document.createComment(``)

  // TODO: Rework or comment the reliance on always starting in a fragment
  const fragment = document.createDocumentFragment()
  fragment.appendChild(domStartNode)
  fragment.appendChild(domEndNode)

  const content$ = manageContent(scope, domStartNode, domEndNode, input$)
    .until(scope.destroy$)
    .multicast()
  content$.drain()

  return new StreamNodeDescriptor(
    scope.sharedRange, domStartNode, domEndNode, content$
  )
}

export function createReplacementNode (scope, input$) {
  return createStreamNode(replaceOnContentEvent, scope, input$)

  function replaceOnContentEvent (scope, domStartNode, domEndNode, children$) {
    return children$.map(toArray).map(children => {
      const childScope = Object.assign({}, scope, {
        // TODO: Having to use skip() seems like a declaration smell. Is there a better way?
        destroy$: merge(children$.skip(1), scope.destroy$).take(1).multicast()
      })
      return createNodeDescriptors(childScope, children)
    })
    .tap(childDescriptors => {
      const { document } = scope

      const fragment = document.createDocumentFragment()
      childDescriptors.forEach(childDescriptor => childDescriptor.insert(fragment))

      if (domStartNode.nextSibling !== domEndNode) {
        const { sharedRange } = scope

        sharedRange.setStartAfter(domStartNode)
        sharedRange.setEndBefore(domEndNode)
        sharedRange.deleteContents()
      }

      domEndNode.parentNode.insertBefore(fragment, domEndNode)
    })
  }
}

export function createOrderedListNode (scope, {
  getKey,
  renderItemStream,
  list$
}) {
  return createStreamNode(updateListOnContentEvent, scope, list$)

  function updateListOnContentEvent (scope, domStartNode, domEndNode, list$) {
    const parentDestroy$ = scope.destroy$
    const update$ = list$.map(itemList => {
      const itemMap = itemList.reduce(
        (map, item) => ((map[getKey(item)] = item), map),
        // Initially using simple object instead of a Map in order to avoid
        // the need for a polyfill. If object keys are desired, we can reconsider later.
        {}
      )
      return { itemList, itemMap }
    }).thru(hold)
    const itemMap$ = update$.map(({ itemMap }) => itemMap)
    const nodeRecordList = new NodeRecordList({
      getParentDomNode: getParentNode,
      domEndNode
    })

    return update$.tap(patchList).multicast()

    // Expose for unit test
    // TODO: Address high complexity and re-enable complexity rule
    // eslint-disable-next-line complexity
    function patchList ({ itemList, itemMap: itemsByKey }) {
      // TODO: Consider treating itemList as an Iterable, not an Array
      let currentRecordNode = nodeRecordList.head
      let i = 0
      while (i < itemList.length) {
        const removeCurrentListNode =
          currentRecordNode && !(currentRecordNode.value.key in itemsByKey)

        if (removeCurrentListNode) {
          const nodeToRemove = currentRecordNode
          currentRecordNode = currentRecordNode.next
          nodeRecordList.remove(nodeToRemove)
        } else {
          const item = itemList[i]
          const itemKey = getKey(item)

          if (nodeRecordList.hasNodeByKey(itemKey)) {
            const itemRecordNode = nodeRecordList.getNodeByKey(itemKey)

            if (itemRecordNode.value.key === currentRecordNode.value.key) {
              currentRecordNode = currentRecordNode.next
            } else {
              nodeRecordList.insertBefore(itemRecordNode, currentRecordNode)
            }
          } else {
            const newRecordNode = createRecordNode(itemKey)
            nodeRecordList.insertBefore(newRecordNode, currentRecordNode)
          }

          ++i
        }
      }

      // We have passed all nodes associated with existing items,
      // so the remaining nodes should be removed
      while (currentRecordNode !== null) {
        const nodeToRemove = currentRecordNode
        currentRecordNode = currentRecordNode.next
        nodeRecordList.remove(nodeToRemove)
      }
    }

    function createRecordNode (key) {
      const itemDestroy$ = sync()
      const declaration = renderItemStream(itemMap$.map(
        itemMap => itemMap[key]
      ))
      const itemScope = Object.assign({}, scope, {
        destroy$: merge(parentDestroy$, itemDestroy$).take(1).multicast()
      })
      const descriptor = declaration.create(itemScope)

      return new ListNode({ key, descriptor, itemDestroy$ })
    }

    function getParentNode () {
      return domEndNode.parentNode
    }
  }
}

export class StreamNodeDescriptor extends NodeDescriptor {
  get type () { return `stream` }

  constructor (sharedRange, domStartNode, domEndNode, childDescriptors$) {
    super()

    this.sharedRange = sharedRange
    this.domStartNode = domStartNode
    this.domEndNode = domEndNode
    this.childDescriptors$ = childDescriptors$
  }

  extractContents () {
    const { domStartNode, domEndNode } = this

    if (domStartNode.parentNode.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
      return domStartNode.parentNode
    } else {
      const { sharedRange } = this
      sharedRange.setStartBefore(domStartNode)
      sharedRange.setStartAfter(domEndNode)
      return sharedRange.extractContents()
    }
  }

  deleteContents () {
    const { domStartNode, domEndNode } = this

    if (domStartNode.parentNode.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
      const fragment = document.createDocumentFragment()
      fragment.appendChild(domStartNode)
      fragment.appendChild(domEndNode)
    } else {
      const { sharedRange } = this
      sharedRange.setStartBefore(domStartNode)
      sharedRange.setEndAfter(domEndNode)
      sharedRange.deleteContents()
    }
  }

  getBeforeNode () {
    return this.domStartNode
  }

  getNextSiblingNode () {
    return this.domEndNode.nextSibling
  }
}

class NodeRecordList {
  constructor ({
    getParentDomNode,
    domEndNode
  }) {
    this._list = new DoublyLinkedList()
    this._getParentDomNode = getParentDomNode
    this._domEndNode = domEndNode
    this._nodeMap = {}
  }

  get head () { return this._list.head }
  get tail () { return this._list.tail }

  insertBefore (node, beforeNode) {
    const key = this.getNodeKey(node)

    if (this.hasNodeByKey(key) && this.getNodeByKey(key) !== node) {
      console.warn(
        `At least two items exist with the same key. There can be only one. ` +
        `Ignoring the new node with the duplicate key.`
      )
    } else {
      node.value.descriptor.insert(
        this._getParentDomNode(),
        beforeNode ? beforeNode.value.descriptor : this._domEndNode
      )
      this._list.insertBefore(node, beforeNode)
      this._rememberNode(node)
    }
  }

  remove (node) {
    const nodeValue = node.value
    nodeValue.itemDestroy$.next()
    nodeValue.descriptor.remove()
    this._list.remove(node)
    this._forgetNode(node)
  }

  getNodeKey (node) {
    return node.value.key
  }

  getNodeByKey (key) {
    return this.hasNodeByKey(key) ? this._nodeMap[key] : null
  }

  hasNodeByKey (key) {
    return key in this._nodeMap
  }

  _rememberNode (node) {
    const key = this.getNodeKey(node)
    this._nodeMap[key] = node
  }

  _forgetNode (node) {
    const key = this.getNodeKey(node)
    delete this._nodeMap[key]
  }
}
