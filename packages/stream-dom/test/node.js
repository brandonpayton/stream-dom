import { NodeDeclaration, NodeDescriptor } from '../src/node'

import { spy } from '../test-util/spy'

import { assert } from 'chai'

suite(`nodes/index`, function () {
  test(`NodeDeclaration`, function () {
    const expectedScope = {}
    const expectedArgument = {}
    const expectedCreation = {}
    const mockCreateNode = spy(() => expectedCreation)

    const declaration = new NodeDeclaration(mockCreateNode, expectedArgument)

    const actualCreation = declaration.create(expectedScope)
    assert.strictEqual(actualCreation, expectedCreation, `relays creation`)

    const creationArguments = mockCreateNode.lastArgs
    assert.strictEqual(creationArguments.length, 2)
    assert.strictEqual(creationArguments[0], expectedScope)
    assert.strictEqual(creationArguments[1], expectedArgument)
  })

  suite(`NodeDescriptor`, function () {
    class SpyNodeDescriptor extends NodeDescriptor {
      constructor (name) {
        super(name)

        const contents = document.createElement(`div`)
        contents.textContent = name

        this.extractContents = spy(() => contents)
        this.deleteContents = spy(() => contents.parentNode.removeChild(contents))
        this.getBeforeNode = spy(() => contents)
      }
    }

    const containerNode = document.createElement(`div`)
    suiteSetup(function () {
      document.body.appendChild(containerNode)
    })
    suiteTeardown(function () {
      document.body.removeChild(containerNode)
    })

    teardown(function () {
      containerNode.innerHTML = ``
    })

    test(`name property`, function () {
      const descriptor = new SpyNodeDescriptor(`expectedName`)
      assert.strictEqual(descriptor.name, `expectedName`)
    })
    test(`insert calls extractContents to get inserted contents`, function () {
      const descriptor = new SpyNodeDescriptor()
      assert.strictEqual(descriptor.extractContents.callCount, 0)
      descriptor.insert(containerNode)
      assert.strictEqual(descriptor.extractContents.callCount, 1)
      assert.strictEqual(containerNode.childNodes.length, 1)
      assert.strictEqual(containerNode.childNodes[0], descriptor.extractContents.lastReturnValue)
    })
    test(`append when inserting before nothing`, function () {
      const descriptor = new SpyNodeDescriptor()

      const firstChild = containerNode.appendChild(
        document.createElement(`div`)
      )
      descriptor.insert(containerNode, null)
      assert.strictEqual(containerNode.childNodes.length, 2, `child count`)
      assert.strictEqual(containerNode.childNodes[0], firstChild, `first child`)
      assert.strictEqual(
        containerNode.childNodes[1],
        descriptor.extractContents.lastReturnValue,
        `appended contents`
      )
    })
    test(`insert before DOM node`, function () {
      const descriptor = new SpyNodeDescriptor()

      const beforeNode = containerNode.appendChild(
        document.createElement(`div`)
      )
      descriptor.insert(containerNode, beforeNode)
      assert.strictEqual(containerNode.childNodes.length, 2, `child count`)
      assert.strictEqual(
        containerNode.childNodes[0],
        descriptor.extractContents.lastReturnValue,
        `inserted before reference node`
      )
      assert.strictEqual(containerNode.childNodes[1], beforeNode, `second child`)
    })
    test(`insert before NodeDescriptor`, function () {
      const descriptor = new SpyNodeDescriptor()

      const beforeDescriptor = new SpyNodeDescriptor()
      beforeDescriptor.insert(containerNode)

      assert.strictEqual(beforeDescriptor.getBeforeNode.callCount, 0)
      descriptor.insert(containerNode, beforeDescriptor)
      assert.strictEqual(containerNode.childNodes.length, 2, `child count`)
      assert.strictEqual(
        containerNode.childNodes[0],
        descriptor.extractContents.lastReturnValue,
        `inserted before reference descriptor`
      )
      assert.strictEqual(beforeDescriptor.getBeforeNode.callCount, 1)
      assert.strictEqual(
        containerNode.childNodes[1],
        beforeDescriptor.getBeforeNode.lastReturnValue,
        `second child`
      )
    })
    test(`remove`, function () {
      const descriptor = new SpyNodeDescriptor()

      descriptor.insert(containerNode)
      assert.strictEqual(containerNode.childNodes.length, 1)
      assert.strictEqual(
        containerNode.childNodes[0],
        descriptor.extractContents.lastReturnValue,
        `content inserted prior to removal`
      )
      assert.strictEqual(descriptor.deleteContents.callCount, 0)
      descriptor.remove()
      assert.strictEqual(descriptor.deleteContents.callCount, 1)
      assert.strictEqual(containerNode.childNodes.length, 0)
      assert.isNull(descriptor.extractContents.lastReturnValue.parentNode)
    })
  })
})
