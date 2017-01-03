export class DoublyLinkedList {
  constructor () {
    this.head = null
    this.tail = null
  }

  append (node) {
    this.insertBefore(node, null)
  }

  insertBefore (node, beforeNode) {
    const previousNode = beforeNode ? beforeNode.previous : this.tail
    const nextNode = beforeNode || null

    previousNode === this.head && (this.head = node)
    !beforeNode && (this.tail = node)

    this.remove(node)

    node.previous = previousNode
    previousNode && (previousNode.next = node)

    node.next = nextNode
    nextNode && (nextNode.previous = node)
  }

  remove (node) {
    const previousNode = node.previous
    const nextNode = node.next
    previousNode && (previousNode.next = previousNode)
    nextNode && (nextNode.previous = nextNode)

    node.previous = node.next = null
  }
}

export class Node {
  constructor (value) {
    this.previous = null
    this.next = null
    this.value = value
  }
}
