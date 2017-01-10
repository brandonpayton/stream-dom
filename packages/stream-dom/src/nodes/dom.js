import { NodeDescriptor, createNodeDescriptors } from '.'
import { isStream } from './stream'

export function element(
  config,
  scope,
  {
    name,
    namespaceName = null,
    attributes = [],
    children = []
  }
) {
  const { document, parentNamespaceUri } = scope
  const namespaceUri = namespaceName ? config.getNamespaceUri(namespaceName) : parentNamespaceUri
  const domNode = document.createElementNS(namespaceUri, name)

  processAttributes(config, scope, domNode, attributes)

  const childScope = Object.assign({}, { parentNamespaceUri: namespaceUri })
  const childDescriptors = createNodeDescriptors(config, childScope, children)

  const fragment = document.createDocumentFragment()
  childDescriptors.forEach(cd => cd.insert(fragment))
  domNode.appendChild(fragment)

  return new ElementNodeDescriptor({ domNode, childDescriptors })
}

export function text(config, scope, str) {
  return () => new TextNodeDescriptor(config.document.createTextNode(str))
}

function processAttributes(config, scope, domNode, attributes) {
  attributes.forEach(attributeDescriptor => {
    if (Array.isArray(attributeDescriptor)) {
      processAttributes(config, scope, domNode, attributeDescriptor)
    }
    else {
      const { namespace } = attributeDescriptor
      const handler = namespace === config.propertyNamespaceName
        ? handlePropertyAttribute
        : handleAttribute

      handler(config, scope, domNode, attributeDescriptor)
    }
  })
}

function handleAttribute(config, scope, elementNode, attribute) {
  const { namespace, name } = attribute
  const valueOrStream = attribute.value
  const namespaceUri = namespace ? config.getNamespaceUri(namespace) : null

  if (isStream(valueOrStream)) {
    const stream = valueOrStream
    setWithStream(scope, stream, value => {
      setAttribute(elementNode, namespaceUri, name, value)
    })
  }
  else {
    const value = valueOrStream
    setAttribute(elementNode, namespaceUri, name, value)
  }
}

function handlePropertyAttribute(
  config, scope, elementNode, { name, valueOrStream }
) {
  if (isStream(valueOrStream)) {
    const stream = valueOrStream
    setWithStream(elementNode, stream, value => (elementNode[name] = value))
  }
  else {
    const value = valueOrStream
    setProperty(elementNode, name, value)
  }
}

function setAttribute(elementNode, namespaceUri, name, value) {
  // Attributes with a no value are treated as boolean
  value === null && (value = true)

  if (value === true || value === false) {
    value
      ? elementNode.setAttributeNS(namespaceUri, name, '')
      : elementNode.removeAttributeNS(namespaceUri, name)
  }
  else {
    elementNode.setAttributeNS(namespaceUri, name, value)
  }
}

function setProperty(elementNode, name, value) {
  elementNode[name] = value
}

function setWithStream(scope, valueStream, setter) {
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
  constructor(name, childDescriptors, domNode) {
    super(name)

    /**
     * The DOM node.
     * @type {Node}
     */
    this.domNode = domNode

    this.expose = this.domNode
  }

  extractContents() {
    return this.domNode
  }
  deleteContents() {
    const { domNode } = this
    domNode.parentNode.removeChild(domNode)
  }
  getBeforeNode() {
    return this.domNode
  }
}

/**
 * A descriptor for a DOM element.
 */
export class ElementNodeDescriptor extends DomNodeDescriptor {
  get type() { return 'element' }

  constructor(name, childDescriptors, domNode) {
    super(name, domNode)

    /**
     * The node's child descriptors
     * @type {NodeDescriptor[]|null}
     */
    this.childDescriptors = childDescriptors
  }
}

/**
 * A descriptor for a DOM text node.
 */
export class TextNodeDescriptor extends DomNodeDescriptor {
  get type() { return 'text' }
}
