export class DoublyLinkedList {
  constructor () {
    this.head = null
    this.tail = null
  }

  insertBefore (node, beforeNode) {
    this.remove(node)

    const previousNode = beforeNode ? beforeNode.previous : this.tail
    const nextNode = beforeNode || null
    node.previous = previousNode
    previousNode && (previousNode.next = node)

    node.next = nextNode
    nextNode && (nextNode.previous = node)

    nextNode === this.head && (this.head = node)
    nextNode === null && (this.tail = node)
  }

  remove (node) {
    node === this.head && (this.head = node.next)
    node === this.tail && (this.tail = node.previous)

    const previousNode = node.previous
    const nextNode = node.next
    previousNode && (previousNode.next = nextNode)
    nextNode && (nextNode.previous = previousNode)

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
