import globalDocument from 'global/document'
import {domEvent} from '@most/dom-event'
import hold from '@most/hold'
import {merge} from 'most'
import _ from 'lodash'

import {createEventStream, attachEventStream} from './eventing'
import is from './is'

const defaultNamespaceUriMap = {
  html: 'http://www.w3.org/1999/xhtml',
  svg: 'http://www.w3.org/2000/svg',
  xlink: 'http://www.w3.org/1999/xlink'
}

class StreamDom {
  constructor({
    document = globalDocument,
    eventNamespaceName = 'event',
    propertyNamespaceName = 'property',
    namespaceUriMap = defaultNamespaceUriMap
  } = {}) {
    this.document = document
    this.eventNamespaceName = eventNamespaceName
    this.propertyNamespaceName = propertyNamespaceName
    this.namespaceUriMap = namespaceUriMap

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

  getNamespaceUri(namespaceName) {
    if (namespaceName in this.namespaceUriMap) {
      return this.namespaceUriMap[namespaceName]
    }
    else {
      throw new Error(`No namespace URI found for namespace name '${namespaceName}'`)
    }
  }

  getDefaultNamespaceUri() {
    return this.getNamespaceUri('html')
  }

  mount(streamDomNodeInit, domParentNode, domBeforeNode = null) {
    const mountedProxy$ = createEventStream()
    const mounted$ = mountedProxy$.thru(hold)
    const destroyProxy$ = createEventStream()
    const destroy$ = destroyProxy$.multicast()

    const config = {
      parentNamespaceUri: this.getDefaultNamespaceUri(),
      mounted$,
      destroy$
    }

    const nodeDescriptor = streamDomNodeInit(config)
    const {domNode} = nodeDescriptor

    attachEventStream(mountedProxy$, domEvent('mount', domNode).take(1))
    attachEventStream(destroyProxy$, domEvent('destroy', domNode).take(1))

    nodeDescriptor.insert(domParentNode, domBeforeNode)

    setTimeout(() => domNode.dispatchEvent(new CustomEvent('mount')), 0)

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
    attributes = [],
    children = []
  } = {}) {
    return (config) => {
      const { document } = this
      const { parentNamespaceUri, mounted$, destroy$ } = config
      const namespaceUri = namespaceName ? this.getNamespaceUri(namespaceName) : parentNamespaceUri
      const domNode = document.createElementNS(namespaceUri, name)

      this.processAttributes(domNode, attributes, config)

      const fragment = document.createDocumentFragment()

      const childDescriptors = this.initializeChildren(children, _.create(config, { parentNamespaceUri: namespaceUri }))
      childDescriptors.forEach(cd => cd.insert(fragment))

      domNode.appendChild(fragment)

      return new this.ElementNodeDescriptor({ domNode, childDescriptors, mounted$, destroy$ })
    }
  }

  stream(children$) {
    return (config) => {
      const { destroy$ } = config
      const domStartNode = this.document.createComment('')
      const domEndNode = this.document.createComment('')

      const childDescriptors$ = children$
        .until(destroy$)
        .map(children => this.initializeChildren(children, _.create(config, {
          destroy$: merge(children$, destroy$).take(1),
        })))
        .tap(childDescriptors => {
          const { document, sharedRange } = this

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

  component(ComponentFactory, { attributes = [], children } = {}) {
    const args = { properties: {}, eventStreams: {}, children, createEventStream }

    const processAttributes = attributes => attributes.forEach(attributeDescriptor => {
      if (is.array(attributeDescriptor)) {
        processAttributes(attributeDescriptor)
      }
      else {
        const { namespace, name, value } = attributeDescriptor

        if (namespace === undefined) {
          args.properties[name] = value
        }
        else if (namespace === this.eventNamespaceName) {
          args.eventStreams[name] = value
        }
        else {
          throw new Error(`Unsupported component namespace '${namespace}'`)
        }
      }
    })

    processAttributes(attributes)

    return ComponentFactory(args)
  }

  expression(value) {
    return (
      is.stream(value) ? this.stream(value.multicast()) :
      is.array(value) ? value.map(c => this.expression(c)) :
      is.function(value) ? value :
      this.text(value)
    )
  }

  processAttributes(domNode, attributes, config) {
    attributes.forEach(attributeDescriptor => {
      if (is.array(attributeDescriptor)) {
        this.processAttributes(domNode, attributeDescriptor, config)
      }
      else {
        const { namespace } = attributeDescriptor
        const handlerName =
          namespace === this.eventNamespaceName ? 'handleEventAttribute' :
          namespace === this.propertyNamespaceName ? 'handlePropertyAttribute' :
          'handleAttribute'

        this[handlerName](domNode, attributeDescriptor, config)
      }
    })
  }

  setWithStream(value, setter, { destroy$ }) {
    is.stream(value)
      ? value.until(destroy$).observe(setter)
      : setter(value)
  }

  handleAttribute(domNode, { namespace, name, value }, config) {
    const namespaceUri = namespace ? this.getNamespaceUri(namespace) : null

    this.setWithStream(value, setAttribute, config)

    function setAttribute(effectiveValue) {
      if (is.boolean(effectiveValue)) {
        value
          ? domNode.setAttributeNS(namespaceUri, name, '')
          : domNode.removeAttributeNS(namespaceUri, name)
      }
      else {
        domNode.setAttributeNS(namespaceUri, name, effectiveValue)
      }
    }
  }

  handlePropertyAttribute(domNode, { name, value }, config) {
    this.setWithStream(value, setProperty, config)

    function setProperty(effectiveValue) {
      domNode[name] = effectiveValue
    }
  }

  handleEventAttribute(domNode, { name, value: proxy$ }, { mounted$, destroy$ }) {
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

  initializeChildren(children, config) {
    return children.reduce(reduceChildren, [])

    function reduceChildren(descriptors, childInitOrArray) {
      if (is.array(childInitOrArray)) {
        childInitOrArray.reduce(reduceChildren, descriptors)
      }
      else if (is.function(childInitOrArray)) {
        descriptors.push(childInitOrArray(config))
      }
      else {
        throw new Error('Unexpected child type', childInitOrArray)
      }

      return descriptors
    }
  }
}

export function configureStreamDom(...config) {
  return new StreamDom(...config)
}

const streamDom = configureStreamDom()

export default streamDom
