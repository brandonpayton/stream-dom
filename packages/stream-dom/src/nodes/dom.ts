import { Attributes, Attribute, InitializeNode, NodeDescriptor, DomContainerNode } from './node'
import { isStream } from './stream'
import { initializeChildren } from './util'
import { attachEventStream } from '../eventing'
import { StreamDomContext, StreamDomScope } from '../index'

import { domEvent } from '@most/dom-event'

export type InitializeElementNode = (scope: StreamDomScope) => ElementNodeDescriptor

export interface ElementDetails {
  namespaceName?: string
  attributes?: Attributes,
  children?: InitializeNode[]
}

export function element(
  context: StreamDomContext,
  name: string,
  {
    namespaceName = null,
    attributes = [],
    children = []
  }: ElementDetails = {}
): InitializeElementNode {
  return (scope: StreamDomScope) => {
    const { document } = context
    const { parentNamespaceUri, mounted$, destroy$ } = scope
    const namespaceUri = namespaceName ? context.getNamespaceUri(namespaceName) : parentNamespaceUri
    const domNode = document.createElementNS(namespaceUri, name)

    processAttributes(context, domNode, attributes, scope)

    const fragment = document.createDocumentFragment()

    const childScope = {
      parentNamespaceUri: namespaceUri,
      mounted$: scope.mounted$,
      destroy$: scope.destroy$
    }
    const childDescriptors = initializeChildren(children, childScope)
    childDescriptors.forEach(cd => cd.insert(fragment))
    domNode.appendChild(fragment)

    return new ElementNodeDescriptor({ domNode, childDescriptors })
  }
}

export function text(context: StreamDomContext, str: string): InitializeNode {
  return () => new TextNodeDescriptor(context.document.createTextNode(str))
}

function processAttributes(
  context: StreamDomContext,
  domNode: Element,
  attributes: Attributes,
  scope: StreamDomScope
) {
  attributes.forEach(attributeDescriptor => {
    if (Array.isArray(attributeDescriptor)) {
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

function setWithStream(
  valueOrStream: any,
  setter: (value: any) => void,
  { destroy$ }: StreamDomScope
) {
  isStream(valueOrStream)
    ? valueOrStream.until(destroy$).observe(setter)
    : setter(valueOrStream)
}

function handleAttribute(
  context: StreamDomContext,
  elementNode: Element,
  { namespace, name, value }: Attribute,
  scope: StreamDomScope
) {
  const namespaceUri = namespace ? context.getNamespaceUri(namespace) : null

  setWithStream(value, setAttribute, scope)

  function setAttribute(effectiveValue: any) {
    if (effectiveValue === true || effectiveValue === false) {
      value
        ? elementNode.setAttributeNS(namespaceUri, name, '')
        : elementNode.removeAttributeNS(namespaceUri, name)
    }
    else {
      elementNode.setAttributeNS(namespaceUri, name, effectiveValue)
    }
  }
}

function handlePropertyAttribute(
  context: StreamDomContext,
  elementNode: Element,
  { name, value }: Attribute,
  scope: StreamDomScope
) {
  setWithStream(value, setProperty, scope)

  function setProperty(effectiveValue: any) {
    elementNode[name] = effectiveValue
  }
}

function handleEventAttribute(
  context: StreamDomContext,
  elementNode: Element,
  { name, value: proxy$ }: Attribute,
  { mounted$, destroy$ }: StreamDomScope
) {
  if (name === 'mount') {
    attachEventStream(proxy$, mounted$.map(() => ({ target: elementNode })))
  }
  else if (name === 'destroy') {
    attachEventStream(proxy$, destroy$.map(() => ({ target: elementNode })))
  }
  else {
    attachEventStream(proxy$, domEvent(name, elementNode).until(destroy$))
  }
}

export abstract class DomNodeDescriptor implements NodeDescriptor {
  domNode: Node;

  constructor(domNode: Node) {
    this.domNode = domNode
  }

  abstract get type(): string

  insert(domParentNode: DomContainerNode, domBeforeNode: Node = null) {
    domParentNode.insertBefore(this.domNode, domBeforeNode)
  }
  remove() {
    const {domNode} = this
    domNode.parentNode.removeChild(domNode)
  }
}

export class ElementNodeDescriptor extends DomNodeDescriptor {
  childDescriptors: NodeDescriptor[]

  get type() { return 'element' }

  constructor({ domNode, childDescriptors }: { domNode: Element, childDescriptors: NodeDescriptor[] }) {
    super(domNode)

    this.childDescriptors = childDescriptors
  }
}

export class TextNodeDescriptor extends DomNodeDescriptor {
  get type() { return 'text' }
}
