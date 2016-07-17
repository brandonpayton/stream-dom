import globalDocument from 'global/document'
import {domEvent} from '@most/dom-event'
import hold from '@most/hold'
import {subject} from 'most-subject'

import {createEventStream, attachEventStream} from './eventing'
import is from './is'

export class StreamDom {
  constructor({document = globalDocument} = {}) {
    this.document = document
    const sharedRange = this.sharedRange = document.createRange()

    class DomNodeDescriptor {
      constructor(domNode) {
        this.domNode = domNode
      }

      insert(domParentNode, domBeforeNode = null) {
        domParentNode.insertBefore(this.domNode, domBeforeNode)
      }
      remove() {
        const {domNode} = this
        domNode.parentNode.removeChild(domNode)
      }
    }

    this.TextNodeDescriptor = class TextNodeDescriptor extends DomNodeDescriptor {
      get type() { return 'text' }
    }

    this.ElementNodeDescriptor = class ElementNodeDescriptor extends DomNodeDescriptor {
      get type() { return 'element' }

      constructor({ domNode, childDescriptors}) {
        super(domNode)

        this.childDescriptors = childDescriptors
      }
    }

    this.StreamNodeDescriptor = class StreamNodeDescriptor {
      get type() { return 'stream' }

      constructor({ domStartNode, domEndNode, childDescriptors$ }) {
        this.domStartNode = domStartNode
        this.domEndNode = domEndNode
        this.childDescriptors$ = childDescriptors$
      }

      insert(domParentNode, domBeforeNode = null) {
        domParentNode.insertBefore(this.domStartNode, domBeforeNode)
        domParentNode.insertBefore(this.domEndNode, domBeforeNode)
      }
      remove() {
        const { domStartNode, domEndNode } = this
        sharedRange.setStartBefore(domStartNode)
        sharedRange.setEndAfter(domEndNode)
        sharedRange.deleteContents()
      }
    }
  }

  mount(streamDomNodeInit, domParentNode, domBeforeNode = null) {
    const mountedProxy$ = createEventStream()
    const mounted$ = mountedProxy$.thru(hold)
    const destroyProxy$ = createEventStream()
    const destroy$ = destroyProxy$.multicast()

    const nodeDescriptor = streamDomNodeInit({ mounted$, destroy$ })
    const {domNode} = nodeDescriptor

    attachEventStream(mountedProxy$, domEvent('mount', domNode).take(1))
    attachEventStream(destroyProxy$, domEvent('destroy', domNode).take(1))

    nodeDescriptor.insert(domParentNode, domBeforeNode)

    // TODO: IIRC, it is wrong to emit an event in the same call stack as observe(). Investigate.
    domNode.dispatchEvent(new CustomEvent('mount'))

    destroy$.observe(() => nodeDescriptor.remove())

    return {
      nodeDescriptor,
      dispose() {
        domNode.dispatchEvent(new CustomEvent('destroy'))
      }
    }
  }

  text(str) {
    return () => new this.TextNodeDescriptor(this.document.createTextNode(str))
  }

  element(name, {attributes = {}, properties = {}, eventStreams = {}, children = []} = {}) {
    const domNode = this.document.createElement(name)

    return ({ mounted$, destroy$ }) => {
      const apply = (hash, applicator) => {
        for (const name in hash) {
          const value = hash[name]
          if (is.stream(value)) {
            const value$ = value
            value$
              .until(destroy$)
              .observe(v => {
                applicator(domNode, name, v)
              })
          }
          else {
            applicator(domNode, name, value)
          }
        }
      }

      const setAttribute = (domNode, name, value) => {
        if (is.boolean(value)) {
          value
            ? domNode.setAttribute(name, '')
            : domNode.removeAttribute(name)
        }
        else {
          domNode.setAttribute(name, value)
        }
      }

      const setProperty = (domNode, name, value) => domNode[name] = value

      apply(attributes, setAttribute)
      apply(properties, setProperty)

      for (const name in eventStreams) {
        const proxy$ = eventStreams[name]

        // NOTE: This is probably too magical. Revisit.
        if (name === 'mount' || name === 'destroy') {
          attachEventStream(proxy$, mounted$.map(() => ({ target: domNode })))
        }
        else if (name === 'destroy') {
          attachEventStream(proxy$, destroy$.map(() => ({ target: domNode })))
        }
        else {
          attachEventStream(proxy$, domEvent(name, domNode).until(destroy$))
        }
      }

      const fragment = document.createDocumentFragment()
      const childDescriptors = children.map(childInit => {
        const childDescriptor = childInit({ mounted$, destroy$ })
        childDescriptor.insert(fragment)
        return childDescriptor
      })
      domNode.appendChild(fragment)

      return new this.ElementNodeDescriptor({ domNode, childDescriptors, mounted$, destroy$ })
    }
  }

  stream(children$) {
    return ({ mounted$, destroy$ }) => {
      const domStartNode = this.document.createComment('')
      const domEndNode = this.document.createComment('')

      const mountedGate$ = subject()
      const localDestroy$ = subject()

      const childMount$ = mountedGate$.chain(() => mounted$)
      const childDestroy$ = localDestroy$.merge(destroy$)

      // TODO: Rework this to remove need for subjects
      const childDescriptors$ = children$
        .until(destroy$)
        .loop((dispose, children) => {
          dispose()

          return {
            seed: () => localDestroy$.next(),
            value: children.map(childInit => childInit({
              mounted$: childMount$,
              destroy$: childDestroy$.take(1)
            }))
          }
        }, () => {})
        .tap(childDescriptors => {
          const {document, sharedRange} = this
          sharedRange.setStartAfter(domStartNode)
          sharedRange.setEndBefore(domEndNode)
          sharedRange.deleteContents()

          const fragment = document.createDocumentFragment()
          childDescriptors.forEach(childDescriptor => childDescriptor.insert(fragment))
          sharedRange.insertNode(fragment)

          mountedGate$.next()
        })

      childDescriptors$.drain()

      return new this.StreamNodeDescriptor({ domStartNode, domEndNode, childDescriptors$ })
    }
  }

  component(ComponentFactory, { properties = {}, eventStreams = {}, children } = {}) {
    const localDestroy$ = subject()

    const componentInit = ComponentFactory({ properties, eventStreams, children, createEventStream })

    return ({ mounted$, destroy$ }) => {
      destroy$
        .take(1)
        .until(localDestroy$)
        .observe(() => localDestroy$.next())

      localDestroy$.observe(() => localDestroy$.complete())

      return componentInit({ mounted$, destroy$: localDestroy$ })
    }
  }

  expression(value) {
    return is.stream(value) ? stream(value) : text(value)
  }
}

const streamDom = new StreamDom()

export default streamDom

export const
  mount = streamDom.mount.bind(streamDom),
  element = streamDom.element.bind(streamDom),
  text = streamDom.text.bind(streamDom),
  stream = streamDom.stream.bind(streamDom),
  component = streamDom.component.bind(streamDom)
