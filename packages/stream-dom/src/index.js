import globalDocument from 'global/document'

import { mount } from './mount'
import { element, text } from './nodes/dom'
import { component } from './nodes/component'
import { stream } from './nodes/stream'
import { expression } from './nodes/expression'

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

    this.sharedRange = document.createRange()
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
    return mount(this, streamDomNodeInit, domParentNode, domBeforeNode)
  }

  text(str) {
    return text(this, str)
  }

  element(name, details) {
    return element(this, name, details)
  }

  stream(children$) {
    return stream(this, children$)
  }

  component(ComponentFactory, details) {
    return component(this, ComponentFactory, details)
  }

  expression(value) {
    return expression(this, value)
  }
}

export function configureStreamDom(...config) {
  return new StreamDom(...config)
}

const streamDom = configureStreamDom()

export default streamDom
