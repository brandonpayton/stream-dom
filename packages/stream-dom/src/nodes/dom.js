import { initializeChildren } from './util/initializeChildren'
import is from '../is'
import { attachEventStream } from '../eventing'

import create from 'lodash.create'
import { domEvent } from '@most/dom-event'

export function element(context, name, {
  namespaceName = null,
  attributes = [],
  children = []
} = {}) {
  return (scope) => {
    const { document } = context
    const { parentNamespaceUri, mounted$, destroy$ } = scope
    const namespaceUri = namespaceName ? context.getNamespaceUri(namespaceName) : parentNamespaceUri
    const domNode = document.createElementNS(namespaceUri, name)

    processAttributes(context, domNode, attributes, scope)

    const fragment = document.createDocumentFragment()

    const childDescriptors = initializeChildren(children, create(scope, { parentNamespaceUri: namespaceUri }))
    childDescriptors.forEach(cd => cd.insert(fragment))

    domNode.appendChild(fragment)

    return new ElementNodeDescriptor({ domNode, childDescriptors, mounted$, destroy$ })
  }
}

export function text(context, str) {
  return () => new TextNodeDescriptor(context.document.createTextNode(str))
}

function processAttributes(context, domNode, attributes, scope) {
  attributes.forEach(attributeDescriptor => {
    if (is.array(attributeDescriptor)) {
      processAttributes(context, domNode, attributeDescriptor, scope)
    }
    else {
      const { namespace } = attributeDescriptor
      const handler =
        namespace === context.eventNamespaceName ? handleEventAttribute :
        namespace === context.propertyNamespaceName ? handlePropertyAttribute :
        handleAttribute

      handler(context, domNode, attributeDescriptor, scope)
    }
  })
}

function setWithStream(valueOrStream, setter, { destroy$ }) {
  is.stream(valueOrStream)
    ? valueOrStream.until(destroy$).observe(setter)
    : setter(valueOrStream)
}

function handleAttribute(context, domNode, { namespace, name, value }, scope) {
  const namespaceUri = namespace ? this.getNamespaceUri(namespace) : null

  setWithStream(value, setAttribute, scope)

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

function handlePropertyAttribute(context, domNode, { name, value }, scope) {
  setWithStream(value, setProperty, scope)

  function setProperty(effectiveValue) {
    domNode[name] = effectiveValue
  }
}

function handleEventAttribute(context, domNode, { name, value: proxy$ }, { mounted$, destroy$ }) {
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

class ElementNodeDescriptor extends DomNodeDescriptor {
  get type() { return 'element' }

  constructor({ domNode, childDescriptors}) {
    super(domNode)

    this.childDescriptors = childDescriptors
  }
}

class TextNodeDescriptor extends DomNodeDescriptor {
  get type() { return 'text' }
}
