import { mount } from './mount'
import { element, text, InitializeElementNode, ElementDetails, ElementNodeDescriptor } from './nodes/dom'
import { component, ComponentFactory, ComponentDetails } from './nodes/component'
import { stream } from './nodes/stream'
import { expression } from './nodes/expression'
import { ChildDeclaration, InitializeNode, NodeDescriptor } from './nodes/node'
import { DomEvent, createEventStream, attachEventStream } from './eventing'

import { Stream } from 'most'

export interface UriMap {
  [s: string]: string
}

export interface StreamDomContext {
  document: HTMLDocument
  eventNamespaceName: string
  propertyNamespaceName: string
  getNamespaceUri(namespaceName: string): string
  defaultNamespaceUri: string
  sharedRange: Range
}

export interface StreamDomScope {
  parentNamespaceUri: string,
  mounted$: Stream<null>,
  destroy$: Stream<null>
}

export const defaultNamespaceUriMap: UriMap = {
  html: 'http://www.w3.org/1999/xhtml',
  svg: 'http://www.w3.org/2000/svg',
  xlink: 'http://www.w3.org/1999/xlink'
}

export class StreamDom implements StreamDomContext {
  document: HTMLDocument
  eventNamespaceName: string
  propertyNamespaceName: string
  namespaceUriMap: UriMap
  defaultNamespaceUri: string

  sharedRange: Range

  constructor({
    document = window.document,
    eventNamespaceName = 'event',
    propertyNamespaceName = 'property',
    namespaceUriMap = defaultNamespaceUriMap,
    defaultNamespaceName = 'html'
  } = {}) {
    this.document = document
    this.eventNamespaceName = eventNamespaceName
    this.propertyNamespaceName = propertyNamespaceName
    this.namespaceUriMap = namespaceUriMap
    this.defaultNamespaceUri = this.getNamespaceUri(defaultNamespaceName)

    this.sharedRange = document.createRange()
  }

  getNamespaceUri(namespaceName: string) {
    if (namespaceName in this.namespaceUriMap) {
      return this.namespaceUriMap[namespaceName]
    }
    else {
      throw new Error(`No namespace URI found for namespace name '${namespaceName}'`)
    }
  }

  mount(
    streamDomNodeInit: InitializeElementNode,
    domParentNode: Element,
    domBeforeNode: Node = null
  ) {
    return mount(this, streamDomNodeInit, domParentNode, domBeforeNode)
  }

  text(str: string) {
    return text(this, str)
  }

  element(name: string, details: ElementDetails) {
    return element(this, name, details)
  }

  stream(children$: Stream<ChildDeclaration>) {
    return stream(this, children$)
  }

  component(ComponentFactory: ComponentFactory, details: ComponentDetails) {
    return component(this, ComponentFactory, details)
  }

  expression(value: any) {
    return expression(this, value)
  }
}

export function configureStreamDom(config = {}) {
  return new StreamDom(config)
}

const streamDom = configureStreamDom()

export default streamDom

export { createEventStream, attachEventStream }

