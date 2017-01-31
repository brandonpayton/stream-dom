import { DoublyLinkedList, Node } from '../src/doubly-linked-list'
import { assert } from 'chai'

suite(`doubly-linked-list`, function () {
  test(`starts with null head and tail`, function () {
    const list = new DoublyLinkedList()
    assert.isNull(list.head)
    assert.isNull(list.tail)
  })

  suite(`append`, function () {
    test(`updates head and tail on an empty list`, function () {
      const list = new DoublyLinkedList()

      const node = new Node(123)
      list.append(node)
      assert.strictEqual(list.head, node)
      assert.strictEqual(list.tail, node)
    })
    test(`updates only tail on a non-empty list`, function () {
      const list = new DoublyLinkedList()
      list.append(new Node(123))

      const expectedHead = list.head
      const additionalNode = new Node(456)
      list.append(additionalNode)
      assert.strictEqual(list.head, expectedHead)
      assert.strictEqual(list.tail, additionalNode)
    })
    test(`appends a node and sets correct links`, function () {
      const list = new DoublyLinkedList()
      const firstNode = new Node(123)
      list.append(firstNode)
      assert.isNull(firstNode.previous)
      assert.isNull(firstNode.next)

      const secondNode = new Node(456)
      list.append(secondNode)
      assert.isNull(firstNode.previous)
      assert.strictEqual(firstNode.next, secondNode)
      assert.strictEqual(secondNode.previous, firstNode)
      assert.isNull(secondNode.next)

      const thirdNode = new Node(789)
      list.append(thirdNode)
      assert.isNull(firstNode.previous)
      assert.strictEqual(firstNode.next, secondNode)
      assert.strictEqual(secondNode.previous, firstNode)
      assert.strictEqual(secondNode.next, thirdNode)
      assert.strictEqual(thirdNode.previous, secondNode)
      assert.isNull(thirdNode.next)
    })
  })

  suite(`insertBefore`, function () {
    test(`updates head and tail when inserting in an empty list`, function () {
      const list = new DoublyLinkedList()

      const node = new Node(123)
      list.insertBefore(node, null)
      assert.strictEqual(list.head, node)
      assert.strictEqual(list.tail, node)
    })
    test(`updates only tail when inserting before nothing in a non-empty list`, function () {
      const list = new DoublyLinkedList()
      list.append(new Node(123))

      const expectedHead = list.head
      const insertedNode = new Node(456)
      list.insertBefore(insertedNode, null)
      assert.strictEqual(list.head, expectedHead)
      assert.strictEqual(list.tail, insertedNode)
    })
    test(`updates only head when inserting before the head`, function () {
      const list = new DoublyLinkedList()
      list.append(new Node(123))

      const expectedTail = list.tail
      const insertedNode = new Node(456)
      list.insertBefore(insertedNode, list.head)
      assert.strictEqual(list.head, insertedNode)
      assert.strictEqual(list.tail, expectedTail)
    })
    test(`sets correct links`, function () {
      const list = new DoublyLinkedList()
      const expectedHead = new Node(`head`)
      const expectedTail = new Node(`tail`)
      list.append(expectedHead)
      list.append(expectedTail)

      const insertedNode = new Node(`inserted`)
      list.insertBefore(insertedNode, expectedTail)

      assert.strictEqual(list.head, expectedHead)
      assert.strictEqual(list.tail, expectedTail)

      assert.isNull(expectedHead.previous)
      assert.strictEqual(expectedHead.next, insertedNode)
      assert.strictEqual(insertedNode.previous, expectedHead)
      assert.strictEqual(insertedNode.next, expectedTail)
      assert.strictEqual(expectedTail.previous, insertedNode)
      assert.isNull(expectedTail.next)
    })
  })

  suite(`remove`, function () {
    test(`nulls both head and tail when removing the only item`, function () {
      const list = new DoublyLinkedList()
      const node = new Node(123)

      list.append(node)
      assert.isNotNull(list.head)
      assert.isNotNull(list.tail)

      list.remove(node)
      assert.isNull(list.head)
      assert.isNull(list.tail)
    })
    test(`updates head when removing the head of a non-empty list`, function () {
      const list = new DoublyLinkedList()
      list.append(new Node(123))
      list.append(new Node(456))

      const expectedHead = list.head.next
      assert.isNotNull(expectedHead)
      list.remove(list.head)
      assert.strictEqual(list.head, expectedHead)
    })
    test(`updates tail when removing the tail of a non-empty list`, function () {
      const list = new DoublyLinkedList()
      list.append(new Node(123))
      list.append(new Node(456))

      const expectedTail = list.tail.previous
      assert.isNotNull(expectedTail)
      list.remove(list.tail)
      assert.strictEqual(list.tail, expectedTail)
    })
    test(`removes a node and sets correct links`, function () {
      const list = new DoublyLinkedList()
      list.append(new Node(123))
      const nodeToRemove = new Node(456)
      list.append(nodeToRemove)
      list.append(new Node(789))

      assert.strictEqual(list.head.next, nodeToRemove)
      assert.strictEqual(nodeToRemove.previous, list.head)
      assert.strictEqual(nodeToRemove.next, list.tail)
      assert.strictEqual(list.tail.previous, nodeToRemove)

      list.remove(nodeToRemove)
      assert.strictEqual(list.head.next, list.tail)
      assert.strictEqual(list.tail.previous, list.head)
      assert.isNull(nodeToRemove.previous)
      assert.isNull(nodeToRemove.next)
    })
  })
})
