import { merge } from 'most'
import { sync } from 'most-subject'
import uuid from 'uuid'
import diff, { CREATE, UPDATE, MOVE, REMOVE } from 'dift'

import { NodeDescriptor } from './node'
import { createNodeDescriptors } from './node-helpers'
import { toArray } from './kind'
import { symbol } from './symbol'

const orderedListIdKey = symbol(`stream-dom-ordered-list-id`)

function createStreamNode (manageContent, scope, input$) {
  const { document } = scope
  const domStartNode = document.createComment(``)
  const domEndNode = document.createComment(``)

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
        destroy$: merge(children$, scope.destroy$).take(1).multicast()
      })
      return createNodeDescriptors(childScope, children)
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

export function createOrderedListNode (scope, {
  getKey,
  renderItemStream,
  list$
}) {
  const orderedListId = uuid.v4()

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
    })
    const itemMap$ = update$.map(({ itemMap }) => itemMap).multicast()

    return update$.scan((previousNodeRecords, update) => {
      const { itemList } = update
      const nodeRecords = new Array(itemList.length)

      // eslint-disable-next-line complexity
      function patchListNodes (type, nodeRecord, item, index) {
        if (type === CREATE) {
          createListNode(nodeRecords, itemMap$, getKey(item), index)
        } else if (type === UPDATE) {
          updateListNode(nodeRecords, nodeRecord, index)
        } else if (type === MOVE) {
          moveListNode(nodeRecords, nodeRecord, index)
        } else if (type === REMOVE) {
          destroyListNode(nodeRecord)
        } else {
          console.error(`Unexpected dift type '${type}'`)
        }
      }

      diff(previousNodeRecords, itemList, patchListNodes, getDiffKey)

      return nodeRecords
    }, [])

    function getDiffKey (o) {
      return typeof o === `object` && o[orderedListIdKey] === orderedListId
        ? o[orderedListIdKey]
        : getKey(o)
    }

    function createListNode (nodeRecords, itemMap$, itemKey, insertionIndex) {
      const itemDestroy$ = sync()
      const declaration = renderItemStream(itemMap$.map(
        itemMap => itemMap[itemKey]
      ))
      const itemScope = Object.assign({}, scope, {
        destroy$: merge(parentDestroy$, itemDestroy$).take(1).multicast()
      })
      const descriptor = declaration.create(itemScope)
      descriptor[orderedListIdKey] = orderedListId

      const record = {
        key: itemKey,
        descriptor,
        itemDestroy$
      }
      moveListNode(nodeRecords, record, insertionIndex)
    }

    function updateListNode (nodeRecords, record, index) {
      nodeRecords[index] = record
    }

    function moveListNode (nodeRecords, record, toIndex) {
      const parentNode = getParentNode()
      const beforeNode = getBeforeNode(nodeRecords, toIndex)
      record.descriptor.insert(parentNode, beforeNode)
    }

    function destroyListNode (nodeRecord) {
      nodeRecord.itemDestroy$.next()
      nodeRecord.descriptor.remove()
    }

    function getParentNode () {
      return domEndNode.parentNode
    }

    // eslint-disable-next-line complexity
    function getBeforeNode (newRecordList, insertionIndex) {
      if (insertionIndex === newRecordList.length - 1) {
        return domEndNode
      } else if (insertionIndex === 0) {
        return domStartNode.nextSibling
      } else if (newRecordList[insertionIndex + 1]) {
        const { descriptor } = newRecordList[insertionIndex + 1]
        return descriptor.getBeforeNode()
      } else if (newRecordList[insertionIndex - 1]) {
        const { descriptor } = newRecordList[insertionIndex - 1]
        return descriptor.getNextSiblingNode() || domEndNode
      } else {
        console.error(`Unable to find beforeNode for inserting list item.`)
      }
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

    if (domStartNode.parentNode === null) {
      const fragment = document.createDocumentFragment()
      fragment.appendChild(domStartNode)
      fragment.appendChild(domEndNode)
      return fragment
    } else {
      const { sharedRange } = this
      sharedRange.setStartBefore(domStartNode)
      sharedRange.setStartAfter(domEndNode)
      return sharedRange.extractContents()
    }
  }

  deleteContents () {
    if (this.domStartNode.parentNode !== null) {
      const { sharedRange } = this
      sharedRange.setStartBefore(this.domStartNode)
      sharedRange.setEndAfter(this.domEndNode)
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
