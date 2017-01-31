import { Stream, just, never, map } from 'most'
import { sync as syncSubject, hold as holdSubject } from 'most-subject'

import { NodeDeclaration } from './node'
import { createElementNode } from './node-dom'
import { replacementStream, orderedListStream } from './node-stream'
import { toArray } from './kind'

// TODO: Relocate to JSX transform
export const defaultNamespaceUriMap = {
  html: `http://www.w3.org/1999/xhtml`,
  svg: `http://www.w3.org/2000/svg`,
  xlink: `http://www.w3.org/1999/xlink`
}

export const defaultNamespaceUri = `http://www.w3.org/1999/xhtml`

export function prop (key, stream) {
  return map(a => a[key], stream)
}

export function render (f, stream) {
  // TODO: Consider warning when stream produces anything other than a node declaration
  return map(f, stream)
}

export function renderItems (args, stream) {
  const { render, identify } = typeof args === `object` ? args : { render: args }

  if (identify === undefined) {
    // TODO: Consider whether non-iterable should result in an error
    return map(items => toArray(items).map(render), stream)
  } else {
    return renderItemStreams(
      { identify, render: item$ => item$.map(render) },
      stream
    )
  }
}

export function renderItemStreams ({ identify, render }, listStream) {
  const orderedListDeclaration = new NodeDeclaration(orderedListStream, {
    getKey: identify,
    renderItemStream: render,
    list$: listStream
  })
  return just(orderedListDeclaration).concat(never)
}

export function mount (parentNode, beforeNode, nodeDeclarationStream) {
  const mountedSubject$ = holdSubject(1, syncSubject())
  const destroySubject$ = holdSubject(1, syncSubject())
  // End the mounted stream when there is a destroy event so a call to
  // `dispose` will stop mounting if it hasn't already occurred.
  const mounted$ = mountedSubject$.until(destroySubject$).multicast()
  const destroy$ = destroySubject$.take(1).multicast()

  const document = parentNode.ownerDocument
  const scope = {
    document,
    parentNamespaceUri: defaultNamespaceUri,
    sharedRange: document.createRange(),
    mounted$,
    destroy$
  }

  const rootDescriptor = replacementStream(scope, nodeDeclarationStream)
  rootDescriptor.insert(parentNode, beforeNode)

  setTimeout(() => mountedSubject$.next())

  // Destroy the UI if the declaration stream ends
  nodeDeclarationStream.drain().then(() => destroySubject$.next())

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

export class StreamDom extends Stream {
  constructor (stream) {
    super(stream.source)
  }
  prop (key) {
    return prop(key, this)
  }
  render (f) {
    return render(f, this)
  }
  renderItems (args) {
    return renderItems(args, this)
  }
  renderItemStreams (args) {
    return renderItemStreams(args, this)
  }
  mount (parentNode, beforeNode) {
    return mount(parentNode, beforeNode, this)
  }
}

export function streamDom (stream) {
  return stream instanceof StreamDom ? stream : new StreamDom(stream)
}

// Add `declare` to `streamDom` export so it can be used
// by transpiled JSX without requiring an additional import.
streamDom.declare = declare

export function declare (tag, args) {
  if (typeof tag === `string`) {
    return declareElement(tag, args)
  } else if (typeof tag === `function`) {
    return declareComponent(tag, args)
  } else {
    throw new TypeError(`Unsupported tag type '${tag}'`)
  }
}

function declareElement (name, {
  namespaceName,
  attrs,
  props,
  children
}) {
  if (name === ``) {
    throw new RangeError(`Tag name must not be the empty string`)
  } else {
    return new NodeDeclaration(createElementNode, {
      namespaceName, name, attrs, props, children
    })
  }
}

function declareComponent (Component, props) {
  return new NodeDeclaration(Component, props)
}

export { component } from './node-component'
