import { merge } from 'most'
import symbolObservable from 'symbol-observable'

import { DoublyLinkedList, Node as ListNode } from '../util/doubly-linked-list'

import { createNodeDescriptors } from '.'

function stream(manageContent, config, scope, input$) {
  const { document } = scope
  const domStartNode = document.createComment('')
  const domEndNode = document.createComment('')

  const content$ = manageContent(config, scope, domEndNode, input$)
    .until(scope.destroy$)
    .multicast()
  content$.drain()

  return new StreamNodeDescriptor(
    config.sharedRange,
    domStartNode,
    domEndNode,
    content$
  )
}

export function replacementStream(config, scope, input$) {
  return stream(replaceOnContentEvent, config, scope, input$)

  function replaceOnContentEvent (config, scope, domStartNode, domEndNode, children$) {
    return children$.map(children => {
      const childScope = Object.assign({}, scope, {
        destroy$: merge(children$, scope.destroy$).take(1).multicast()
      })
      return createNodeDescriptors(config, childScope, children)
    })
    .tap(childDescriptors => {
      const { document, sharedRange } = scope

      const fragment = document.createDocumentFragment()
      childDescriptors.forEach(childDescriptor => childDescriptor.insert(fragment))

      sharedRange.setStartAfter(domStartNode)
      sharedRange.setEndBefore(domEndNode)
      sharedRange.deleteContents()
      sharedRange.insertNode(fragment)
    })
  }
}

export function orderedListStream (config, scope, getKey, renderItemStream, list$) {
  return stream(updateListOnContentEvent, config, scope, list$)

  function updateListOnContentEvent(config, scope, domStartNode, domEndNode, list$) {
    const update$ = list$.map(itemList => {
      const itemMap = itemList.reduce(
        (map, item) => map.set(getKey(item), item),
        new Map()
      )
      return { itemList, itemMap }
    })
    const itemMap$ = update$.map(update => update.itemMap).multicast()

    return update$.scan((nodeState, update) => {
      const { nodeList, nodeMap } = nodeState
      const { itemList, itemMap } = update

      let currentListNode = nodeList.head()
      // TODO: Treat itemList as an Iterable, not an Array
      let i = 0
      while (i < itemList.length) {
        const removeCurrentListNode = !!currentListNode && itemMap.has(currentListNode.value.key)
        if (removeCurrentListNode) {
          const nodeToDestroy = currentListNode
          currentListNode = currentListNode.next
          destroyListNode(itemList, itemMap, nodeToDestroy)
        }
        else {
          const item = itemList[i]
          const itemKey = getKey(item)

          if (nodeMap.has(itemKey)) {
            const itemListNode = nodeMap.get(itemKey)

            if (itemListNode.key === currentListNode.key) {
              currentListNode = currentListNode.next
            }
            else {
              moveListNode(nodeList, itemListNode, currentListNode)
            }
          }
          else {
            createListNode(nodeList, nodeMap, itemMap$, itemKey, currentListNode)
          }

          ++i
        }
      }

      // We have passed all nodes associated with existing items,
      // so the remaining nodes should be removed
      for (; currentListNode !== null; currentListNode = currentListNode.next) {
        destroyListNode(nodeList, nodeMap, currentListNode)
      }

      return { nodeList, nodeMap }
    }, {
      nodeList: new DoublyLinkedList(),
      nodeMap: new Map()
    })

    function createListNode (nodeList, listNodeMap, itemMap$, itemKey, beforeListNode) {
      const newListNode = new ListNode({
        key: itemKey,
        streamDomNode: renderItemStream(itemMap$.map(
          itemMap => itemMap.has(itemKey) ? itemMap.get(itemKey) : null
        ))
      })

      moveListNode(nodeList, newListNode, beforeListNode)
      listNodeMap.set(newListNode.value.key, newListNode)
    }

    function destroyListNode (nodeList, listNodeMap, listNode) {
      nodeList.remove(listNode)
      listNodeMap.delete(listNode.value.key)
      listNode.value.streamDomNode.remove()
    }

    function moveListNode (nodeList, listNode, beforeListNode) {
      nodeList.insertBefore(listNode, beforeListNode)

      const { streamDomNode } = listNode.value
      const parentNode = domEndNode.parentNode
      const beforeNode = beforeListNode ? beforeListNode.value.streamDomNode : domEndNode
      streamDomNode.insert(parentNode, beforeNode)
    }
  }
}

class StreamNodeDescriptor {
  get type() { return 'stream' }

  constructor(sharedRange, domStartNode, domEndNode, childDescriptors$) {
    this.sharedRange = sharedRange
    this.domStartNode = domStartNode
    this.domEndNode = domEndNode
    this.childDescriptors$ = childDescriptors$
  }

  insert(domParentNode, domBeforeNode = null) {
    const { domStartNode, domEndNode } = this

    if (domStartNode.parentNode === null) {
      domParentNode.insertBefore(domStartNode, domBeforeNode)
      domParentNode.insertBefore(domEndNode, domBeforeNode)
    }
    else {
      const { sharedRange } = this
      sharedRange.setStartBefore(domStartNode)
      sharedRange.setStartAfter(domEndNode)
      domParentNode.insertBefore(sharedRange.extractContents(), domBeforeNode)
    }
  }
  remove() {
    const { sharedRange } = this
    sharedRange.setStartBefore(this.domStartNode)
    sharedRange.setEndAfter(this.domEndNode)
    sharedRange.deleteContents()
  }
}

export function isStream(candidate) {
  return candidate && !!candidate[symbolObservable]
}
