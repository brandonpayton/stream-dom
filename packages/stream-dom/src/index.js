import { Stream, just, never } from 'most'
import { sync as syncSubject, hold as holdSubject } from 'most-subject'

import { NodeDeclaration } from './nodes'
import { element } from './nodes/dom'
import { configure as configureComponent } from './nodes/component'
import { replacementStream, orderedListStream } from './nodes/stream'

// TODO: Relocate to JSX transform
export const defaultNamespaceUriMap = {
  html: 'http://www.w3.org/1999/xhtml',
  svg: 'http://www.w3.org/2000/svg',
  xlink: 'http://www.w3.org/1999/xlink'
}

export function configure ({
  defaultNamespaceUri = 'http://www.w3.org/1999/xhtml'
} = {}) {
  const config = { defaultNamespaceUri }

  class StreamDom extends Stream {
    constructor (stream) {
      super(stream.source)
    }
    prop (name) {
      return this.map(a => a[name])
    }
    // TODO: Consider how to handle or avoid repeated calls to methods like list()
    list () {
      return this instanceof StreamDomList ? this : new StreamDomList(this)
    }
    render (f) {
      return this.map(f)
    }
    mount (parentNode, beforeNode) {
      const mountedSubject$ = holdSubject(1, syncSubject())
      const destroySubject$ = holdSubject(1, syncSubject())
      // End the mounted stream when there is a destroy event so a call to
      // `dispose` will stop mounting if it hasn't already occurred.
      const mounted$ = mountedSubject$.until(destroySubject$).multicast()
      const destroy$ = destroySubject$.take(1).multicast()

      const document = parentNode.ownerDocument
      const scope = {
        document,
        parentNamespaceUri: config.defaultNamespaceUri,
        sharedRange: document.createRange(),
        mounted$,
        destroy$
      }

      const rootDescriptor = replacementStream(scope, this)
      rootDescriptor.insert(parentNode, beforeNode)

      // Destroy the UI if this stream ends
      this.drain().then(() => destroySubject$.next())

      // Only remove the root node when the root content stream ends,
      // allowing internal destruction logic to run first
      rootDescriptor.content$.drain().then(() => rootDescriptor.remove())

      return {
        rootDescriptor,
        dispose () {
          destroySubject$.next()
        }
      }
    }
  }

  class StreamDomList extends StreamDom {
    identifyItems (f) {
      return new StreamDomIdentifiedList(this, f)
    }
    renderItems (f) {
      return this.map(items => items.map(f))
    }
  }

  class StreamDomIdentifiedList extends StreamDomList {
    constructor (stream, identifyItem) {
      super(stream)
      this._identifyItem = identifyItem
    }
    renderItems (f) {
      return this.renderItemStreams(item$ => item$.map(f))
    }
    renderItemStreams (f) {
      const orderedListDeclaration = new NodeDeclaration(orderedListStream, {
        getKey: this._identifyItem,
        renderItemStream: f,
        list$: this
      })
      return just(orderedListDeclaration).concat(never)
    }
  }

  function streamDom (stream) {
    return stream instanceof StreamDom ? stream : new StreamDom(stream)
  }

  // Add `d` to `streamDom` export so it can be used
  // by transpiled JSX without requiring an additional import.
  streamDom.d = function d (tag, args) {
    if (typeof tag === 'string') {
      return declareElement(tag, args)
    } else if (typeof tag === 'function') {
      return declareComponent(tag, args)
    } else {
      throw new TypeError(`Unsupported tag type '${tag}'`)
    }
  }

  return {
    streamDom,
    component: configureComponent({ streamDom, defaultNamespaceUri })
  }
}

export const { streamDom, component } = configure()

function declareElement (name, {
  namespaceName,
  attrs,
  props,
  children
}) {
  if (name === '') {
    throw new RangeError('Tag name must not be the empty string')
  } else {
    return new NodeDeclaration(element, {
      namespaceName, name, attrs, props, children
    })
  }
}

function declareComponent (Component, props) {
  return new NodeDeclaration(Component, props)
}
