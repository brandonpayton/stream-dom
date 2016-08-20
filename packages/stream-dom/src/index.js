import globalDocument from 'global/document'
import {domEvent} from '@most/dom-event'
import hold from '@most/hold'
import {merge} from 'most'

import {createEventStream, attachEventStream} from './eventing'
import is from './is'

class StreamDom {
  constructor({
    document = globalDocument,
    eventListenerNamespace = 'event',
    propertyNamespace = 'property',
    namespaceMap = {}
  } = {}) {
    this.document = document
    this.namespaceMap = namespaceMap

    const sharedRange = this.sharedRange = document.createRange()

    class DomNodeDescriptor {
      constructor(domNode) {
        this.domNode = domNode
      }

      insert(domParentNode, domBeforeNode = null) {
        domParentNode.insertBefore(this.domNode, domBeforeNode)
      }
      remove() {
        const {domNode} = this
        domNode.parentNode.removeChild(domNode)
      }
    }

    this.TextNodeDescriptor = class TextNodeDescriptor extends DomNodeDescriptor {
      get type() { return 'text' }
    }

    this.ElementNodeDescriptor = class ElementNodeDescriptor extends DomNodeDescriptor {
      get type() { return 'element' }

      constructor({ domNode, childDescriptors}) {
        super(domNode)

        this.childDescriptors = childDescriptors
      }
    }

    this.StreamNodeDescriptor = class StreamNodeDescriptor {
      get type() { return 'stream' }

      constructor({ domStartNode, domEndNode, childDescriptors$ }) {
        this.domStartNode = domStartNode
        this.domEndNode = domEndNode
        this.childDescriptors$ = childDescriptors$
      }

      insert(domParentNode, domBeforeNode = null) {
        domParentNode.insertBefore(this.domStartNode, domBeforeNode)
        domParentNode.insertBefore(this.domEndNode, domBeforeNode)
      }
      remove() {
        const { domStartNode, domEndNode } = this
        sharedRange.setStartBefore(domStartNode)
        sharedRange.setEndAfter(domEndNode)
        sharedRange.deleteContents()
      }
    }
  }

  getNamespaceURI(namespaceName) {
    if (namespaceName in this.namespaceMap) {
      return this.namespaceMap[namespaceName]
    }
    else {
      throw new Error(`No namespace URI found for namespace name '${namespaceName}'`)
    }
  }

  mount(streamDomNodeInit, domParentNode, domBeforeNode = null) {
    const mountedProxy$ = createEventStream()
    // TODO: End mounted$ when destroy$ emits an event
    const mounted$ = mountedProxy$.thru(hold)
    const destroyProxy$ = createEventStream()
    const destroy$ = destroyProxy$.multicast()

    const nodeDescriptor = streamDomNodeInit({ mounted$, destroy$ })
    const {domNode} = nodeDescriptor

    attachEventStream(mountedProxy$, domEvent('mount', domNode).take(1))
    attachEventStream(destroyProxy$, domEvent('destroy', domNode).take(1))

    nodeDescriptor.insert(domParentNode, domBeforeNode)

    // TODO: IIRC, it is wrong to emit an event in the same call stack as observe(). Investigate.
    domNode.dispatchEvent(new CustomEvent('mount'))

    destroy$.observe(() => nodeDescriptor.remove())

    return {
      nodeDescriptor,
      dispose() {
        domNode.dispatchEvent(new CustomEvent('destroy'))
      }
    }
  }

  text(str) {
    return () => new this.TextNodeDescriptor(this.document.createTextNode(str))
  }

  element(name, {
    namespaceName = null,
    attributes = {},
    properties = {},
    eventStreams = {},
    children = []
  } = {}) {
    const { document } = this
    const domNode = namespaceName
      ? document.createElementNS(this.getNamespaceURI(namespaceName), name)
      : document.createElement(name)

    return ({ mounted$, destroy$ }) => {
      const apply = (hash, applicator) => {
        for (const name in hash) {
          const value = hash[name]
          if (is.stream(value)) {
            const value$ = value
            value$
              .until(destroy$)
              .observe(v => {
                applicator(domNode, name, v)
              })
          }
          else {
            applicator(domNode, name, value)
          }
        }
      }

      const setAttribute = (domNode, name, value) => {
        if (is.boolean(value)) {
          value
            ? domNode.setAttribute(name, '')
            : domNode.removeAttribute(name)
        }
        else {
          domNode.setAttribute(name, value)
        }
      }

      const setProperty = (domNode, name, value) => domNode[name] = value

      apply(attributes, setAttribute)
      apply(properties, setProperty)

      for (const name in eventStreams) {
        const proxy$ = eventStreams[name]

        if (name === 'mount') {
          attachEventStream(proxy$, mounted$.map(() => ({ target: domNode })))
        }
        else if (name === 'destroy') {
          attachEventStream(proxy$, destroy$.map(() => ({ target: domNode })))
        }
        else {
          attachEventStream(proxy$, domEvent(name, domNode).until(destroy$))
        }
      }

      const fragment = document.createDocumentFragment()

      const childDescriptors = initializeChildren({ children, mounted$, destroy$ })
      childDescriptors.forEach(cd => cd.insert(fragment))

      domNode.appendChild(fragment)

      return new this.ElementNodeDescriptor({ domNode, childDescriptors, mounted$, destroy$ })
    }
  }

  stream(children$) {
    return ({ mounted$, destroy$ }) => {
      const domStartNode = this.document.createComment('')
      const domEndNode = this.document.createComment('')

      const childDescriptors$ = children$
        .until(destroy$)
        .map(children => initializeChildren({
          children,
          mounted$,
          destroy$: merge(children$, destroy$).take(1)
        }))
        .tap(childDescriptors => {
          const {document, sharedRange} = this

          const fragment = document.createDocumentFragment()
          childDescriptors.forEach(childDescriptor => childDescriptor.insert(fragment))

          sharedRange.setStartAfter(domStartNode)
          sharedRange.setEndBefore(domEndNode)
          sharedRange.deleteContents()
          sharedRange.insertNode(fragment)
        })

      childDescriptors$.drain()

      return new this.StreamNodeDescriptor({ domStartNode, domEndNode, childDescriptors$ })
    }
  }

  component(ComponentFactory, { properties = {}, eventStreams = {}, children } = {}) {
    return ComponentFactory({ properties, eventStreams, children, createEventStream })
  }

  expression(value) {
    return (
      is.stream(value) ? stream(value) :
      is.array(value) ? value.map(c => this.expression(c)) :
      is.function(value) ? value :
      text(value)
    )
  }
}

function initializeChildren({ children, mounted$, destroy$ }) {
  function reduceChildren(descriptors, childInitOrArray) {
    if (is.array(childInitOrArray)) {
      childInitOrArray.reduce(reduceChildren, descriptors)
    }
    else if (is.function(childInitOrArray)) {
      descriptors.push(childInitOrArray({ mounted$, destroy$ }))
    }
    else {
      throw new Error('Unexpected child type', childInitOrArray)
    }

    return descriptors
  }

  return children.reduce(reduceChildren, [])
}

export function configureStreamDom(...config) {
  return new StreamDom(...config)
}

const streamDom = configureStreamDom()

export default streamDom

export const
  mount = streamDom.mount.bind(streamDom),
  element = streamDom.element.bind(streamDom),
  text = streamDom.text.bind(streamDom),
  stream = streamDom.stream.bind(streamDom),
  component = streamDom.component.bind(streamDom)
