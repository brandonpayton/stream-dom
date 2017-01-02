import { mount } from './mount'
import { element, text, InitializeElementNode, ElementDetails, ElementNodeDescriptor } from './nodes/dom'
import { component, ComponentFactory, ComponentDetails } from './nodes/component'
import { replacementStream,  } from './nodes/stream'
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

export class StreamDomContext {
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
}

const symbols = {
  base: '@@stream-dom',
  list: '@@stream-dom-list',
  identifiedItems: '@stream-dom-identified-items'
}

const streamDomMembers = {
  [symbols.base]: true,
  prop(name) {
    return this.map(a => a[name])
  },
  render(f: (a: any) => any) {
    return this.map(f)
  },
}
const streamDomListMembers = {
  [symbols.list]: true,
  identifyItems()
}

class StreamDom<A> extends Stream<A> {
  constructor(stream: Stream<A>) {
    super(stream.source)
  }
  prop(name) {
    return this.map(a => a[name])
  }
  list() {

    return new StreamDomList(this)
  }
  render(f: (a: any) => any) {
    return this.map(f)
  }
}

type ItemIdentifier = string | symbol
type IdentifyItem<A> = (a: A) => ItemIdentifier

class StreamDomList<A extends Array<B>, B> extends StreamDom<A> {
  identifyItems(f: IdentifyItem<B>) {
    return new StreamDomIdentifiedList(this, f)
  }
}

class StreamDomIdentifiedList<A extends Array<B>, B> extends StreamDomList<A, B> {
  private identifyItem: IdentifyItem<B>

  constructor(stream: StreamDomList<A, B>, identifyItem: IdentifyItem<B>) {
    super(stream)
    this.identifyItem = identifyItem
  }
}

export function configureStreamDom(config = {}) {
  return function (stream) {

  }
}

const streamDom = configureStreamDom()

export default streamDom

export { createEventStream, attachEventStream }

