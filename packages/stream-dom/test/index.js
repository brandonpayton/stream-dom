import streamDom from 'stream-dom'
import {createEventStream} from 'stream-dom/eventing'
import domAssert from './domAssert'
import {assert} from 'chai'
import {subject} from 'most-subject'

// TODO: DEV: Consider supporting stream-based test interface where a test only ends after stream completes
const slice = arrayLike => [].slice.apply(arrayLike)
const toNodeArrayWithoutComments = nodeList => slice(nodeList).filter(node => node.nodeType !== Node.COMMENT_NODE)

function config({ mounted$, destroy$ }) {
  return {
    document,
    // TODO: What's the point of `getDefaultNamespaceUri`?
    parentNamespaceUri: streamDom.getDefaultNamespaceUri(),
    namespaceUriMap: streamDom.namespaceUriMap,
    getNamespaceUri: namespaceName => streamDom.getNamespaceUri(namespaceName),
    mounted$,
    destroy$
  }
}

describe('stream-dom nodes', function () {

  const mounted$ = subject()
  const destroy$ = subject()

  afterEach(() => destroy$.next())
  describe('elements', function () {
    it('creates an element', function () {
      const init = streamDom.element('div')
      const {domNode} = init(config({ mounted$, destroy$ }))
      domAssert.elementNode(domNode, 'div')
    })

    it('defaults to xhtml namespace URI', function () {
      const init = streamDom.element('div')
      const {domNode} = init(config({ mounted$, destroy$ }))
      domAssert.elementNode(domNode, 'div', streamDom.namespaceUriMap.html)
    })

    it('creates a namespaced element', function () {
      const svgNamespaceUri = streamDom.namespaceUriMap.svg
      const init = streamDom.element('svg', { namespaceName: 'svg' })
      const {domNode} = init(config({ mounted$, destroy$ }))

      domAssert.elementNode(domNode, 'svg', svgNamespaceUri)
    })

    it('defaults child elements to namespace URI of parent', function () {
      const svgNamespaceUri = streamDom.namespaceUriMap.svg

      const init = streamDom.element('svg', {
        namespaceName: 'svg',
        children: [ streamDom.element('g') ]
      })
      const {domNode} = init(config({ mounted$, destroy$ }))

      domAssert.elementNode(domNode, 'svg', svgNamespaceUri)
      domAssert.elementNode(domNode.firstElementChild, 'g', svgNamespaceUri)
    })

    it('allows children to override namespace URI of parent', function () {
      const svgNamespaceUri = streamDom.namespaceUriMap.svg
      const htmlNamespaceUri = streamDom.namespaceUriMap.html

      const init = streamDom.element('svg', {
        namespaceName: 'svg',
        children: [
          streamDom.element('foreignObject', {
            children: [
              streamDom.element('div', { namespaceName: 'html' })
            ]
          })
        ]
      })
      const {domNode} = init(config({ mounted$, destroy$ }))

      domAssert.elementNode(domNode, 'svg', svgNamespaceUri)
      domAssert.elementNode(domNode.firstElementChild, 'foreignObject', svgNamespaceUri)
      domAssert.elementNode(domNode.firstElementChild.firstElementChild, 'div', htmlNamespaceUri)
    })

    it('creates an element with static attributes', function () {
      const expectedTagName = 'div'
      const expectedAttributes = [
        { name: 'id', value: 'someId' },
        { name: 'class', value: 'someClass' }
      ]
      const init = streamDom.element(expectedTagName, { attributes: expectedAttributes })
      const {domNode} = init(config({ mounted$, destroy$ }))

      domAssert.elementNode(domNode, expectedTagName)
      domAssert.elementAttributes(domNode, expectedAttributes)
    })

    it('creates an element with static properties', function () {
      const expectedTagName = 'div'
      const expectedProperties = [
        { namespace: 'property', name: 'id', value: 'someId' },
        { namespace: 'property', name: 'className', value: 'someClass' }
      ]
      const init = streamDom.element(expectedTagName, { attributes: expectedProperties })
      const {domNode} = init(config({ mounted$, destroy$ }))

      domAssert.elementNode(domNode, expectedTagName)
      domAssert.elementProperties(domNode, expectedProperties)
    })

    it('creates an element with static attributes and properties', function () {
      const expectedTagName = 'div'
      const expected = [
        { name: 'id', value: 'someId' },
        { name: 'class', value: 'someClass' },
        { namespace: 'property', name: 'className', value: 'someClass' }
      ]
      const expectedAttributes = expected.filter(descriptor => !descriptor.namespace)
      const expectedProperties = expected.filter(descriptor => !!descriptor.namespace)

      const init = streamDom.element(expectedTagName, {
        attributes: expected,
      })
      const {domNode} = init(config({ mounted$, destroy$ }))

      domAssert.elementNode(domNode, expectedTagName)
      domAssert.elementAttributes(domNode, expectedAttributes)
      domAssert.elementProperties(domNode, expectedProperties)
    })

    it('creates an element with dynamic attributes', function (done) {
      const expectedTagName = 'div'
      const classSubject = subject()
      const ariaLabelSubject = subject()

      const init = streamDom.element(expectedTagName, {
        attributes: [
          { name: 'class', value: classSubject },
          { name: 'aria-label', value: ariaLabelSubject }
        ]
      })
      const {domNode} = init(config({ mounted$, destroy$ }))

      domAssert.elementNode(domNode, expectedTagName)

      Promise.all([
        classSubject.reduce((actualValues) => {
          actualValues.push(domNode.getAttribute('class'))
          return actualValues
        }, []),
        ariaLabelSubject.reduce((actualValues) => {
          actualValues.push(domNode.getAttribute('aria-label'))
          return actualValues
        }, [])
      ])
      .then(([actualClassValues, actualAriaLabelValues]) => {
        assert.deepEqual(actualClassValues, expectedClassValues, 'correctly updates `class` attribute')
        assert.deepEqual(actualAriaLabelValues, expectedAriaLabelValues, 'correctly updates `aria-label` attribute')
      })
      .then(done, done)

      const expectedClassValues = [ 'class1', 'class2', 'class3' ]
      expectedClassValues.forEach(value => classSubject.next(value))
      classSubject.complete()

      const expectedAriaLabelValues = [ 'label1', 'label2', 'label3' ]
      expectedAriaLabelValues.forEach(value => ariaLabelSubject.next(value))
      ariaLabelSubject.complete()
    })

    it('creates an element with dynamic properties', function (done) {
      const expectedTagName = 'input'
      const classSubject = subject()
      const valueSubject = subject()

      const init = streamDom.element(expectedTagName, {
        attributes: [
          { namespace: 'property', name: 'value', value: valueSubject },
          { namespace: 'property', name: 'className', value: classSubject }
        ]
      })
      const {domNode} = init(config({ mounted$, destroy$ }))
      domAssert.elementNode(domNode, expectedTagName)

      Promise.all([
        valueSubject.reduce((actualValues) => {
          actualValues.push(domNode.value)
          return actualValues
        }, []),
        classSubject.reduce((actualValues) => {
          actualValues.push(domNode.className)
          return actualValues
        }, [])
      ])
      .then(([actualValues, actualClassValues]) => {
        assert.deepEqual(actualValues, expectedValues, 'correctly updates `value` property')
        assert.deepEqual(actualClassValues, expectedClassValues, 'correctly updates `className` property')
      })
      .then(done, done)

      const expectedValues = [ 'larry', 'moe', 'curly' ]
      expectedValues.forEach(value => valueSubject.next(value))
      valueSubject.complete()

      const expectedClassValues = [ 'class1', 'class2', 'class3' ]
      expectedClassValues.forEach(value => classSubject.next(value))
      classSubject.complete()
    })

    it('creates an element with dynamic and static attributes and properties', function (done) {
      const expectedTagName = 'input'
      const expectedTypeAttribute = 'password'
      const classSubject = subject()
      const expectedTitleProperty = 'test node'
      const valueSubject = subject()

      const init = streamDom.element(expectedTagName, {
        attributes: [
          { name: 'type', value: expectedTypeAttribute },
          { name: 'class', value: classSubject },
          { namespace: 'property', name: 'title', value: expectedTitleProperty },
          { namespace: 'property', name: 'value', value: valueSubject }
        ]
      })
      const {domNode} = init(config({ mounted$, destroy$ }))
      domAssert.elementNode(domNode, expectedTagName)

      Promise.all([
        valueSubject.reduce(actualValues => {
          actualValues.push(domNode.value)
          return actualValues
        }, []),
        classSubject.reduce(actualValues => {
          actualValues.push(domNode.className)
          return actualValues
        }, [])
      ])
      .then(([actualValues, actualClassValues]) => {
        assert.strictEqual(domNode.getAttribute('type'), expectedTypeAttribute)
        assert.deepEqual(actualClassValues, expectedClassValues, 'correctly updates `className` attribute')
        assert.strictEqual(domNode.title, expectedTitleProperty)
        assert.deepEqual(actualValues, expectedValues, 'correctly updates `value` property')
      })
      .then(done, done)

      const expectedClassValues = [ 'class1', 'class2', 'class3' ]
      expectedClassValues.forEach(value => classSubject.next(value))
      classSubject.complete()

      const expectedValues = [ 'larry', 'moe', 'curly' ]
      expectedValues.forEach(value => valueSubject.next(value))
      valueSubject.complete()
    }),

    it('handles spread attributes', function () {
      const expectedTagName = 'div'
      const expected = [
        [
          { name: 'id', value: 'someId' },
          { name: 'class', value: 'someClass' },
          { namespace: 'property', name: 'className', value: 'someClass' }
        ]
      ]
      const expectedAttributes = expected[0].filter(descriptor => !descriptor.namespace)
      const expectedProperties = expected[0].filter(descriptor => !!descriptor.namespace)

      const init = streamDom.element(expectedTagName, {
        attributes: expected,
      })
      const {domNode} = init(config({ mounted$, destroy$ }))

      domAssert.elementNode(domNode, expectedTagName)
      domAssert.elementAttributes(domNode, expectedAttributes)
      domAssert.elementProperties(domNode, expectedProperties)
    })

    // TODO: Test using event subjects in until()
    it('creates an element with event streams', function () {
      const expectedElementName = 'div'
      const click$ = createEventStream()
      const streamDomNodeInit = streamDom.element(expectedElementName, {
        attributes: [
          { namespace: 'event', name: 'click', value: click$ }
        ]
      })

      const mountInfo = streamDom.mount(streamDomNodeInit, document.body)

      const promiseToReduce = click$.reduce(
        (eventTypes, event) => {
          eventTypes.push(event.type)
          return eventTypes
        },
        []
      )
      .then(eventTypes => {
        assert.deepEqual(eventTypes, [ 'click' ])
      })

      const {domNode} = mountInfo.nodeDescriptor
      domNode.click()

      mountInfo.dispose()

      return promiseToReduce
    })

    // TODO: Test listening for mount event

    it('creates an element with static children', function () {
      const expectedParentName = 'div'
      const expectedChildName0 = 'span'
      const expectedChildName1 = 'p'
      const expectedChildContent = 'paragraph'
      const expectedChildName2 = 'ol'
      const expectedGrandChildName = 'li'

      const init = streamDom.element(expectedParentName, {
        children: [
          streamDom.element(expectedChildName0),
          streamDom.element(expectedChildName1, { children: [ streamDom.text(expectedChildContent) ] }),
          streamDom.element(expectedChildName2, {
            children: [
              streamDom.element(expectedGrandChildName)
            ]
          })
        ]
      })
      const {domNode} = init(config({ mounted$, destroy$ }))

      domAssert.elementNode(domNode, expectedParentName)
      domAssert.elementNode(domNode.childNodes[0], expectedChildName0)
      domAssert.elementNode(domNode.childNodes[1], expectedChildName1)
      domAssert.textNode(domNode.childNodes[1].childNodes[0], expectedChildContent)
      domAssert.elementNode(domNode.childNodes[2], expectedChildName2)
      domAssert.elementNode(domNode.childNodes[2].childNodes[0], expectedGrandChildName)
    })

    it('creates an element with dynamic children', function (done) {
      const expectedTagName = 'div'
      const children$ = subject()

      const init = streamDom.element(expectedTagName, {
        children: [ streamDom.stream(children$) ]
      })
      const elementDescriptor = init(config({ mounted$, destroy$ }))

      const {domNode} = elementDescriptor
      const streamChildDescriptor = elementDescriptor.childDescriptors[0]

      streamChildDescriptor.childDescriptors$
      .reduce(
        actualChildrenNames => {
          const relevantChildNodes = toNodeArrayWithoutComments(domNode.childNodes)
          actualChildrenNames.push(
            relevantChildNodes.map(childNode => childNode.tagName.toLowerCase())
          )
          return actualChildrenNames
        },
        []
      )
      .then(
        actualChildrenNames => assert.deepEqual(actualChildrenNames, expectedChildrenNames)
      )
      .then(done, done)

      domAssert.elementNode(domNode, expectedTagName)

      // TODO: FIX: Finish this test
      const expectedChildrenNames = [
        [ 'p', 'span', 'div' ],
        [ 'span', 'div', 'p' ],
        [ 'p', 'div', 'span' ]
      ]

      expectedChildrenNames.forEach(childrenNames => {
        children$.next(
          childrenNames.map(name => streamDom.element(name))
        )
      })
      children$.complete()
    })

    it('creates an element with static and dynamic children', function (done) {
      const expectedTagName = 'div'
      const expectedFirstChildTagName = 'span'
      const expectedLastChildTagName = 'p'
      const expectedStreamedChildrenNames = [
        [ 'p', 'span', 'div' ],
        [ 'span', 'div', 'p' ],
        [ 'p', 'div', 'span' ]
      ]
      const expectedChildrenNames = expectedStreamedChildrenNames.map(
        streamedNames => [ expectedFirstChildTagName, ...streamedNames, expectedLastChildTagName ]
      )
      const streamedChildren$ = subject()

      const init = streamDom.element(expectedTagName, {
        children: [
          streamDom.element(expectedFirstChildTagName),
          streamDom.stream(streamedChildren$),
          streamDom.element(expectedLastChildTagName)
        ]
      })
      const elementDescriptor = init(config({ mounted$, destroy$ }))
      const {domNode} = elementDescriptor

      domAssert.elementNode(domNode, expectedTagName)
      domAssert.elementNode(domNode.firstChild, expectedFirstChildTagName)
      domAssert.elementNode(domNode.lastChild, expectedLastChildTagName)

      const streamChildDescriptor = elementDescriptor.childDescriptors[1]
      assert.strictEqual(streamChildDescriptor.type, 'stream', 'confirm assumption of stream descriptor')

      streamChildDescriptor.childDescriptors$
      .reduce(
        actualChildrenNames => {
          const relevantChildNodes = toNodeArrayWithoutComments(domNode.childNodes)
          actualChildrenNames.push(
            relevantChildNodes.map(childNode => childNode.tagName.toLowerCase())
          )
          return actualChildrenNames
        },
        []
      )
      .then(
        actualChildrenNames => assert.deepEqual(actualChildrenNames, expectedChildrenNames)
      )
      .then(done, done)

      expectedStreamedChildrenNames.forEach(childrenNames => {
        streamedChildren$.next(
          childrenNames.map(name => streamDom.element(name))
        )
      })
      streamedChildren$.complete()
    })
  })

  // TODO: Test components

  // TODO: mixed text and element dynamic children

  // TODO: Support replacing all children

  // TODO: Support patching children

  // TODO: Test event listeners

  /**
   * Scenarios
   * =========
   * reorder on sorted child change
   * reorder on sort change
   * no reorder - child change
   * child inserted
   * child deleted
   */

  // TODO: Properties always applied after attributes

  describe('components', function () {
    it('creates an element encapsulated by a component factory function', function () {
      const expectedTagName = 'article'
      function TestComponent() {
        return streamDom.element(expectedTagName)
      }

      const init = streamDom.component(TestComponent)
      const descriptor = init(config({ mounted$, destroy$ }))
      assert.property(descriptor, 'domNode')
      assert.strictEqual(descriptor.domNode.tagName.toLowerCase(), expectedTagName)
    })
  })
})

describe('mount', function () {
  const testContainerNode = document.createElement('div')

  beforeEach(() => document.body.appendChild(testContainerNode))
  afterEach(() => {
    testContainerNode.parentNode.removeChild(testContainerNode)
    testContainerNode.innerHTML = ''
  })

  it('inserts and removes an element from the DOM', function () {
    const expectedTagName = 'section'
    const streamDomNodeInit = streamDom.element(expectedTagName)

    const mountInfo = streamDom.mount(streamDomNodeInit, testContainerNode)
    const {domNode} = mountInfo.nodeDescriptor

    assert.strictEqual(domNode.tagName.toLowerCase(), expectedTagName, 'confirm an assumption')
    assert.strictEqual(domNode.parentNode, testContainerNode, 'mount inserted the node')

    mountInfo.dispose()

    assert.strictEqual(domNode.parentNode, null, 'mount `dispose` removes the node from the DOM')
  })

  it('notifies an element when it is mounted and when it is diposed', () => {
    const streamDomNodeInit = streamDom.element('section')

    let actualMounted$
    let actualDestroy$
    let promiseToReduceMount
    const nodeInitSpy = function ({ mounted$, destroy$ }) {
      actualMounted$ = mounted$
      actualDestroy$ = destroy$

      promiseToReduceMount = actualMounted$.take(1).reduce(count => count + 1, 0)
      return streamDomNodeInit.apply(undefined, arguments)
    }

    const mountInfo = streamDom.mount(nodeInitSpy, testContainerNode)

    assert.isDefined(actualMounted$)
    assert.isDefined(actualDestroy$)

    // TODO: Verifying count is useless when we're only taking one event. Address this.
    return promiseToReduceMount
    .then(count => assert.strictEqual(count, 1, 'notified of mount'))
    .then(() => {
      const promiseToReduceDestroy = actualDestroy$.take(1).reduce(count => count + 1, 0)
      .then(count => assert.strictEqual(count, 1))

      mountInfo.dispose()

      return promiseToReduceDestroy
    })
  })

  // TODO: Test mounting components
})

