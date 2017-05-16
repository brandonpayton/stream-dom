import { from } from 'most'

import { NodeDescriptor } from './node'
import { createNodeDescriptors } from './node-helpers'
import { isObservable } from './kind'

export function createElementNode (scope, args) {
  const { document, parentNamespaceUri } = scope
  const {
    nodeName,
    nsUri,
    name,
    attrs = {},
    nsAttrs = [],
    props = {},
    children = []
  } = args
  const namespaceUri = getNamespaceUri(scope, nsUri)

  const domNode = document.createElementNS(namespaceUri, name)

  const childScope = namespaceUri === parentNamespaceUri
    ? scope
    : Object.assign({}, scope, { parentNamespaceUri: namespaceUri })

  processAttributes(childScope, domNode, attrs)
  processNamespacedAttributes(childScope, domNode, nsAttrs)
  processProperties(childScope, domNode, props)

  const childDescriptors = createNodeDescriptors(childScope, children)

  if (childDescriptors.length > 0) {
    const fragment = document.createDocumentFragment()
    childDescriptors.forEach(descriptor => descriptor.insert(fragment))
    domNode.appendChild(fragment)
  }

  return new ElementNodeDescriptor(nodeName, domNode, childDescriptors)
}

export function createTextNode (scope, str) {
  return new TextNodeDescriptor(scope.document.createTextNode(str))
}

function processAttributes (scope, domNode, attributes) {
  for (let name in attributes) {
    // WORKAROUND:
    // JSX spread attributes with namespace names are not yet supported.
    // We cannot detect whether an property was specified via spread properties,
    // so we detect and warn on embedded colon characters as a compromise.
    if (/:/.test(name)) {
      console.warn(
        `\`attrs\` and JSX spread attributes which are added to \`attrs\` ` +
        `may not include attributes prefixed with namespace names. ` +
        `Ignoring '${name}'.`
      )
    } else {
      handleAttribute(scope, domNode, name, attributes[name])
    }
  }
}

function processNamespacedAttributes (scope, domNode, namespacedAttributes) {
  namespacedAttributes.forEach(a => handleAttribute(
    scope, domNode, a.name, a.value, a.nsUri
  ))
}

function handleAttribute (scope, elementNode, name, valueOrStream, nsUri) {
  const namespaceUri = getNamespaceUri(scope, nsUri)

  // Avoid specifying the same namespace as the current element because
  // IE 11 and earlier do not always process it the same as when specifying
  // no namespace.
  // For example, an `<input>` with namespace URI http://www.w3.org/1999/xhtml
  // only correctly takes a `type` attribute when specified with no namespace.
  // If the `type` attribute is set using namespace URI http://www.w3.org/1999/xhtml,
  // the effective `<input> type` is unchanged.
  const attributeNamespaceUri = namespaceUri === scope.parentNamespaceUri
    ? null
    : namespaceUri

  if (isObservable(valueOrStream)) {
    const stream = valueOrStream
    setWithObservable(scope, stream, value => {
      setAttribute(elementNode, attributeNamespaceUri, name, value)
    })
  } else {
    const value = valueOrStream
    setAttribute(elementNode, attributeNamespaceUri, name, value)
  }
}

function setAttribute (elementNode, namespaceUri, name, value) {
  if (value === true || value === false) {
    setBooleanAttribute(elementNode, namespaceUri, name, value)
  } else if (namespaceUri) {
    elementNode.setAttributeNS(namespaceUri, name, value)
  } else {
    elementNode.setAttribute(name, value)
  }
}

function setBooleanAttribute (elementNode, namespaceUri, name, value) {
  value
    ? namespaceUri
      ? elementNode.setAttributeNS(namespaceUri, name, ``)
      : elementNode.setAttribute(name, ``)
    : namespaceUri
      ? elementNode.removeAttributeNS(namespaceUri, name)
      : elementNode.removeAttribute(name)
}

function getNamespaceUri (scope, nsUri) {
  return nsUri || scope.parentNamespaceUri
}

function processProperties (scope, domNode, properties) {
  for (let name in properties) {
    handleProperty(scope, domNode, name, properties[name])
  }
}

function handleProperty (scope, elementNode, name, value) {
  isObservable(value)
    ? setWithObservable(scope, value, value => setProperty(elementNode, name, value))
    : setProperty(elementNode, name, value)
}

function setProperty (elementNode, name, value) {
  elementNode[name] = value
}

function setWithObservable (scope, valueObservable, setter) {
  from(valueObservable).skipRepeats().until(scope.destroy$).observe(setter)
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
  constructor (name, domNode) {
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
  getNextSiblingNode () {
    return this.domNode.nextSibling
  }
}

/**
 * A descriptor for a DOM element.
 */
export class ElementNodeDescriptor extends DomNodeDescriptor {
  get type () { return `element` }

  constructor (name, domNode, childDescriptors) {
    super(name, domNode)

    /**
     * The node's child descriptors
     * @type {NodeDescriptor[]|null}
     */
    this.childDescriptors = childDescriptors
  }

  get expose () {
    return this.domNode
  }
}

/**
 * A descriptor for a DOM text node.
 */
export class TextNodeDescriptor extends DomNodeDescriptor {
  get type () { return `text` }

  constructor (textNode) {
    super(undefined, textNode)
  }
}
