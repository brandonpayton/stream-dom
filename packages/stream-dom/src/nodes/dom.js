import { domEvent } from '@most/dom-event'

import { NodeDescriptor } from '.'
import { createNodeDescriptors } from './util'
import { isStream } from './stream'

export function element (scope, args) {
  const { document, parentNamespaceUri } = scope
  const {
    name,
    attributes = {},
    properties = {},
    children = []
  } = args
  const namespaceUri = getNamespaceUri(scope, args)

  const domNode = document.createElementNS(namespaceUri, name)

  const childScope = namespaceUri === parentNamespaceUri
    ? scope
    : Object.assign({}, { parentNamespaceUri: namespaceUri })

  processAttributes(childScope, domNode, attributes)
  processProperties(childScope, domNode, properties)

  const childDescriptors = createNodeDescriptors(childScope, children)

  const fragment = document.createDocumentFragment()
  childDescriptors.forEach(descriptor => descriptor.insert(fragment))
  domNode.appendChild(fragment)

  return new ElementNodeDescriptor({ domNode, childDescriptors })
}

export function text (scope, str) {
  return () => new TextNodeDescriptor(scope.document.createTextNode(str))
}

function processAttributes (scope, domNode, attributes) {
  attributes.forEach(
    attribute => handleAttribute(scope, domNode, attribute)
  )
}

function handleAttribute (scope, elementNode, attribute) {
  const namespaceUri = getNamespaceUri(scope, attribute)
  const { name, value: valueOrStream } = attribute

  if (isStream(valueOrStream)) {
    const stream = valueOrStream
    setWithStream(scope, stream, value => {
      setAttribute(elementNode, namespaceUri, name, value)
    })
  } else {
    const value = valueOrStream
    setAttribute(elementNode, namespaceUri, name, value)
  }
}

function setAttribute (elementNode, namespaceUri, name, value) {
  // Attributes with no value are treated as boolean
  value === null && (value = true)

  if (value === true || !value) {
    setBooleanAttribute(elementNode, namespaceUri, name, value)
  } else {
    elementNode.setAttributeNS(namespaceUri, name, value)
  }
}

function setBooleanAttribute (elementNode, namespaceUri, name, value) {
  value
    ? elementNode.setAttributeNS(namespaceUri, name, ``)
    : elementNode.removeAttributeNS(namespaceUri, name)
}

function getNamespaceUri (scope, nodeArgs) {
  return nodeArgs.namespaceUri || scope.parentNamespaceUri
}

function processProperties (scope, domNode, properties) {
  Object.keys(properties).forEach(
    name => handleProperty(scope, domNode, name, properties[name])
  )
}

function handleProperty (scope, elementNode, name, value) {
  isStream(value)
    ? setWithStream(elementNode, value, value => (elementNode[name] = value))
    : setProperty(elementNode, name, value)
}

function setProperty (elementNode, name, value) {
  elementNode[name] = value
}

function setWithStream (scope, valueStream, setter) {
  valueStream.skipRepeats().until(scope.destroy$).observe(setter)
}

/**
 * Abstract class for a DOM node descriptor.
 */
export class DomNodeDescriptor extends NodeDescriptor {
  /**
   * Create a DOM node descriptor.
   * @param {string|null} name - The node name
   * @param {NodeDescriptor[]|null} childDescriptors - The node's child descriptors
   * @param {Node} domNode - The DOM node.
   */
  constructor (name, childDescriptors, domNode) {
    super(name)

    /**
     * The DOM node.
     * @type {Node}
     */
    this.domNode = domNode
  }

  extractContents () {
    return this.domNode
  }
  deleteContents () {
    const { domNode } = this
    domNode.parentNode.removeChild(domNode)
  }
  getBeforeNode () {
    return this.domNode
  }
}

class ExposedElement {
  constructor (domNode) {
    this.domNode = domNode
  }
  on (eventName, useCapture = false) {
    return domEvent(eventName, this.domNode, useCapture)
  }
}

/**
 * A descriptor for a DOM element.
 */
export class ElementNodeDescriptor extends DomNodeDescriptor {
  get type () { return `element` }

  constructor (name, childDescriptors, domNode) {
    super(name, domNode)

    /**
     * The node's child descriptors
     * @type {NodeDescriptor[]|null}
     */
    this.childDescriptors = childDescriptors

    // TODO: Document this.
    this.expose = new ExposedElement(domNode)
  }
}

/**
 * A descriptor for a DOM text node.
 */
export class TextNodeDescriptor extends DomNodeDescriptor {
  get type () { return `text` }
}
