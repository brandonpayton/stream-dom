import { Stream, merge } from 'most'
import { sync as syncSubject, hold as holdSubject } from 'most-subject'

import { replacementStream, orderedListStream } from './nodes/stream'

export const defaultNamespaceUriMap = {
  html: 'http://www.w3.org/1999/xhtml',
  svg: 'http://www.w3.org/2000/svg',
  xlink: 'http://www.w3.org/1999/xlink'
}

export function configure ({
  document = window.document,
  eventNamespaceName = 'event',
  propertyNamespaceName = 'property',
  namespaceUriMap = defaultNamespaceUriMap,
  defaultNamespaceName = 'html'
} = {}) {
  const config = {
    eventNamespaceName,
    propertyNamespaceName,
    namespaceUriMap,
    defaultNamespaceUri: this.getNamespaceUri(defaultNamespaceName),
  }

  class StreamDom extends Stream {
    constructor(stream) {
      super(stream.source)
    }
    prop(name) {
      return this.map(a => a[name])
    }
    // TODO: Consider how to handle or avoid repeated calls to methods like list()
    list() {
      return new StreamDomList(this)
    }
    render(f) {
      return this.map(f)
    }
    mount(parentNode, beforeNode) {
      const mountedSubject$ = holdSubject(1, syncSubject())
      const destroySubject$ = holdSubject(1, syncSubject())
      const mounted$ = mountedSubject$.until(destroySubject$)
      const destroy$ = destroySubject$.take(1)

      const scope = {
        document,
        parentNamespaceUri: config.defaultNamespaceUri,
        sharedRange: document.createRange(),
        mounted$,
        destroy$
      }

      const nodeDescriptor = replacementStream(config, scope, this)

      nodeDescriptor.insert(parentNode, beforeNode)
      merge(this, destroy$).drain().then(() => nodeDescriptor.remove())

      setTimeout(() => mountedSubject$.next())

      return {
        nodeDescriptor,
        dispose() {
          destroySubject$.next()
        }
      }
    }
  }

  class StreamDomList extends StreamDom {
    identifyItems(f) {
      return new StreamDomIdentifiedList(this, f)
    }
    renderItems(f) {
      return replacementStream(
        config,
        this.map(items => items.map(f))
      )
    }
  }

  class StreamDomIdentifiedList extends StreamDomList {
    constructor(stream, identifyItem) {
      super(stream)
      this._identifyItem = identifyItem
    }
    renderItems (f) {
      return orderedListStream(
        config,
        this._identifyItem,
        item$ => replacementStream(
          item$.map(items => items.map(f))
        ),
        this
      )
    }
    renderItemStreams (f) {
      return orderedListStream(config, this._identifyItem, f, this)
    }
  }

  return stream => new StreamDom(stream)
}
