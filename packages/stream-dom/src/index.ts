import { mount } from './mount'
import { element, text, InitializeElementNode, ElementDeclarationArgs } from './nodes/dom'
import { component, ComponentDeclarationArgs } from './nodes/component'
import { stream } from './nodes/stream'
import { expression } from './nodes/expression'
import { Child } from './nodes/node'

import { Stream } from 'most'

interface UriMap {
  [s: string]: string
}

// TODO: Consider renaming `context` to `config`
export interface StreamDomContext {
  document: HTMLDocument
  eventNamespaceName: string
  propertyNamespaceName: string
  getNamespaceUri(namespaceName: string): string
  defaultNamespaceUri: string
  sharedRange: Range;
}

export interface StreamDomScope {
  parentNamespaceUri: string,
  // TODO: Strengthen Stream type param
  mounted$: Stream<any>,
  destroy$: Stream<any>
}

export const defaultNamespaceUriMap: UriMap = {
  html: 'http://www.w3.org/1999/xhtml',
  svg: 'http://www.w3.org/2000/svg',
  xlink: 'http://www.w3.org/1999/xlink'
}

class StreamDom implements StreamDomContext {
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

  element(name: string, details: ElementDeclarationArgs) {
    return element(this, name, details)
  }

  stream(children$: Stream<Child[]>) {
    return stream(this, children$)
  }

  component(ComponentFactory: Function, details: ComponentDeclarationArgs) {
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
