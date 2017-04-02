import { just, never, map } from 'most'
import { sync as syncSubject, hold as holdSubject } from 'most-subject'

import { NodeDeclaration } from './node'
import { createElementNode } from './node-dom'
import { createReplacementNode, createOrderedListNode } from './node-stream'
import { toArray } from './kind'

// TODO: Relocate to JSX transform
export const defaultNamespaceUriMap = {
  html: `http://www.w3.org/1999/xhtml`,
  svg: `http://www.w3.org/2000/svg`,
  xlink: `http://www.w3.org/1999/xlink`
}

export const defaultNamespaceUri = `http://www.w3.org/1999/xhtml`

export function render (f, stream) {
  // TODO: Consider warning when stream produces anything other than a node declaration
  return map(f, stream)
}

export function renderItems (args, stream) {
  // TODO: Rename to identifyItem and renderItem for clarity?
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
// TODO: Rename to identifyItem and renderItem for clarity?
export function renderItemStreams ({ identify, render }, listStream) {
  const orderedListDeclaration = new NodeDeclaration(createOrderedListNode, {
    getKey: identify,
    renderItemStream: render,
    list$: listStream
  })
  return just(orderedListDeclaration).concat(never)
}

// TODO: Settle on "destroy" or "dispose"
export function mount (parentNode, beforeNode, nodeDeclarations$) {
  const mounted$ = holdSubject(1, syncSubject())
  const destroy$ = holdSubject(1, syncSubject())

  // TODO: Explain the sync/async disposal reason for the strange use of promises
  let resolveMount
  let rejectMount
  const promiseToMount = new Promise((resolve, reject) => {
    resolveMount = resolve
    rejectMount = reject
  })

  let resolveDispose
  let rejectDispose
  const promiseToDispose = new Promise((resolve, reject) => {
    resolveDispose = resolve
    rejectDispose = reject
  })

  let disposed = false
  const mount = () => {
    if (disposed) {
      rejectMount()
    } else {
      mounted$.next()
      resolveMount()
    }
  }
  const dispose = () => {
    if (!disposed) {
      disposed = true

      try {
        destroy$.next()
        rootDescriptor.remove()
        resolveDispose()
      } catch (error) {
        rejectDispose(error)
      }
    }
  }

  const document = parentNode.ownerDocument
  const scope = {
    document,
    parentNamespaceUri: defaultNamespaceUri,
    sharedRange: document.createRange(),
    mounted$,
    destroy$
  }
  const content$ = nodeDeclarations$.until(destroy$).multicast()
  const rootDescriptor = createReplacementNode(scope, nodeDeclarations$)
  rootDescriptor.insert(parentNode, beforeNode)

  setTimeout(mount)
  content$.drain().then(dispose)

  return {
    rootDescriptor,
    nodeDeclarations$,
    promiseToMount,
    promiseToDispose,
    dispose
  }
}

// Add `declare` to `streamDom` export so it can be used
// by transpiled JSX without requiring an additional import.
// TODO: Decide whether streamDom should be an export
const streamDom = { declare }
export default streamDom

export function declare (tag, name, args) {
  if (typeof tag === `string`) {
    return declareElement(tag, args)
  } else if (typeof tag === `function`) {
    return declareComponent(tag, args)
  } else {
    throw new TypeError(`Unsupported tag type '${tag}'`)
  }
}

function declareElement (name, {
  nodeName,
  namespaceUri,
  attrs,
  props,
  children
}) {
  if (name === ``) {
    throw new RangeError(`Tag name must not be the empty string`)
  } else {
    return new NodeDeclaration(createElementNode, {
      nodeName, namespaceUri, name, attrs, props, children
    })
  }
}

function declareComponent (Component, { nodeName, props }) {
  return new NodeDeclaration(Component, { nodeName, props })
}

export { component, propTypes } from './node-component'
