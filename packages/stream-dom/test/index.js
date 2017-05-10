import { assert } from 'chai'
import {
  render,
  renderItems,
  renderItemStreams,
  mount,
  h,
  component as componentExport
} from '../src/index'
import { NodeDeclaration } from '../src/node'
import {
  createOrderedListNode,
  StreamNodeDescriptor
} from '../src/node-stream'
import { createElementNode } from '../src/node-dom'
import { component } from '../src/node-component'
import { isObservable } from '../src/kind'

import { just, take, never, reduce } from 'most'
import { sync } from 'most-subject'

const lastValue = (memo, value) => value

suite(`streamDom`, function () {
  test(`render`, function () {
    const expected = {}
    const rendered$ = render(actual => ({ actual }), just(expected))
    return reduce(lastValue, null, rendered$).then(
      result => assert.strictEqual(result.actual, expected)
    )
  })

  test(`renderItems with unidentified items`, function () {
    const fakeCreate = function () {}
    const items = [ 1, 2, 3 ]
    const itemToDeclaration = item => new NodeDeclaration(fakeCreate, item)
    const declarations$ = renderItems(itemToDeclaration, just(items))
    return reduce(lastValue, null, declarations$).then(actual => {
      assert.isArray(actual)
      assert.isTrue(actual.every(d => d instanceof NodeDeclaration))
      assert.isTrue(actual.every(d => d.createNode === fakeCreate))
      assert.deepEqual(
        actual.map(declaration => declaration.creationArgs),
        items
      )
    })
  })

  test(`renderItems with identified items`, function () {
    const items$ = just([])
    const identify = item => item.id
    const renderItem = item => ({ prop: item.id })
    const declarations$ = renderItems(
      { identify, render: renderItem },
      items$
    )
    return reduce(lastValue, null, take(1, declarations$)).then(actual => {
      assert.instanceOf(actual, NodeDeclaration)
      assert.strictEqual(actual.createNode, createOrderedListNode)
      assert.strictEqual(actual.creationArgs.getKey, identify)
      assert.strictEqual(actual.creationArgs.list$, items$)
      assert.isFunction(actual.creationArgs.renderItemStream)

      const item$ = just({ id: `test-id` })
      const renderedItem$ = actual.creationArgs.renderItemStream(item$)
      assert.isTrue(isObservable(renderedItem$), `render yields an observable`)
      return reduce(lastValue, null, renderedItem$).then(actualRender => {
        assert.propertyVal(actualRender, `prop`, `test-id`)
      })
    })
  })

  test(`renderItemStreams`, function () {
    const items$ = just([])
    const identify = item => item.id
    const renderItemStream = item$ => `something`
    const declarations$ = renderItemStreams(
      {
        identify,
        render: renderItemStream
      },
      items$
    )
    return reduce(lastValue, null, take(1, declarations$)).then(actual => {
      assert.instanceOf(actual, NodeDeclaration)
      assert.strictEqual(actual.createNode, createOrderedListNode)
      assert.strictEqual(actual.creationArgs.getKey, identify)
      assert.strictEqual(actual.creationArgs.renderItemStream, renderItemStream)
      assert.strictEqual(actual.creationArgs.list$, items$)
    })
  })

  suite(`mount`, function () {
    let containerNode = null
    let mountHandle = null

    setup(function () {
      containerNode = document.body.appendChild(document.createElement(`div`))
    })
    teardown(function () {
      containerNode.parentNode.removeChild(containerNode)
      containerNode = null

      if (mountHandle) {
        mountHandle.dispose()
        mountHandle = null
      }
    })

    test(`creates stream node as root`, function () {
      mountHandle = mount(containerNode, null, never())

      const { rootDescriptor } = mountHandle
      assert.instanceOf(rootDescriptor, StreamNodeDescriptor)
      assert.strictEqual(rootDescriptor.domStartNode.parentNode, containerNode)
      assert.strictEqual(rootDescriptor.domEndNode.parentNode, containerNode)
    })
    test(`appends root node to a DOM parent`, function () {
      const existingChildNode = containerNode.appendChild(
        document.createElement(`span`)
      )
      mountHandle = mount(containerNode, null, never())

      assert.strictEqual(
        mountHandle.rootDescriptor.domStartNode,
        existingChildNode.nextSibling,
        `appended to parent`
      )
    })
    test(`inserts root node before a reference DOM node`, function () {
      const existingChildNode = containerNode.appendChild(
        document.createElement(`span`)
      )
      mountHandle = mount(containerNode, existingChildNode, never())

      assert.strictEqual(
        mountHandle.rootDescriptor.domEndNode,
        existingChildNode.previousSibling,
        `inserted before reference node`
      )
    })
    test(`adds latest stream content to the DOM`, function () {
      const content$ = sync()
      mountHandle = mount(containerNode, null, content$)

      return mountHandle.promiseToMount.then(() => {
        const { rootDescriptor } = mountHandle
        const { domStartNode, domEndNode } = rootDescriptor

        assert.strictEqual(domStartNode.nextSibling, domEndNode, `empty`)
        content$.next(`expected-text`)
        assert.notStrictEqual(domStartNode.nextSibling, domEndNode, `non-empty`)

        const node1 = domStartNode.nextSibling
        assert.strictEqual(node1.nodeType, Node.TEXT_NODE)
        assert.strictEqual(node1.nodeValue, `expected-text`)
      })
    })
    test(`removes stream from the DOM when dispose is invoked`, function () {
      mountHandle = mount(containerNode, null, never())
      const { rootDescriptor } = mountHandle

      assert.isNotNull(rootDescriptor.domStartNode.parentNode)
      assert.isNotNull(rootDescriptor.domEndNode.parentNode)
      mountHandle.dispose()
      assert.isNull(rootDescriptor.domStartNode.parentNode)
      assert.isNull(rootDescriptor.domEndNode.parentNode)
    })
    test(`removes stream from the DOM when the stream ends`, function () {
      const content$ = sync()
      mountHandle = mount(containerNode, null, content$)
      const { rootDescriptor } = mountHandle

      assert.isNotNull(rootDescriptor.domStartNode.parentNode)
      assert.isNotNull(rootDescriptor.domEndNode.parentNode)
      content$.complete()

      return mountHandle.promiseToDispose.then(() => {
        assert.isNull(rootDescriptor.domStartNode.parentNode)
        assert.isNull(rootDescriptor.domEndNode.parentNode)
      })
    })
  })

  suite(`h`, function () {
    // TODO: `args` optional
    // TODO: `children` optional

    test(`declares an element`, function () {
      const expectedTagName = `div`
      const expectedNamespaceUri = `test-uri`
      const expectedAttributes = {}
      const expectedNamespacedAttributes = []
      const expectedProperties = {}
      const expectedChildren = []
      const declaration = h(expectedTagName, {
        nsUri: expectedNamespaceUri,
        attrs: expectedAttributes,
        nsAttrs: expectedNamespacedAttributes,
        props: expectedProperties
      }, expectedChildren)
      assert.instanceOf(declaration, NodeDeclaration)
      assert.strictEqual(declaration.createNode, createElementNode)
      assert.strictEqual(declaration.creationArgs.nsUri, expectedNamespaceUri)
      assert.strictEqual(declaration.creationArgs.name, expectedTagName)
      assert.strictEqual(declaration.creationArgs.attrs, expectedAttributes)
      assert.strictEqual(declaration.creationArgs.nsAttrs, expectedNamespacedAttributes)
      assert.strictEqual(declaration.creationArgs.props, expectedProperties)
      assert.strictEqual(declaration.creationArgs.children, expectedChildren)
    })
    test(`declares a component`, function () {
      const expectedComponent = function () {}
      const expectedArgs = { nodeName: `theComponent`, input: { x: 123, y: 456 } }
      const declaration = h(expectedComponent, expectedArgs)
      assert.instanceOf(declaration, NodeDeclaration)
      assert.strictEqual(declaration.createNode, expectedComponent)
      assert.deepEqual(declaration.creationArgs, expectedArgs)
    })
  })

  test(`exports component`, function () {
    assert.strictEqual(componentExport, component)
  })
})
