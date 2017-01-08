/**
 * Base stream-dom node module.
 * @module nodes
 */

import { replacementStream, isStream } from './stream'
import { text } from './dom'

/**
 * A node declaration
 */
export class NodeDeclaration {
  /**
   * Create a node declaration.
   * @param {function} createNode - The node creation function.
   * @param creationArgs - The arguments to the node creation function.
   * @returns {NodeDescriptor}
   */
  constructor (createNode, creationArgs) {
    this.createNode = createNode
    this.creationArgs = creationArgs
  }

  /**
   * Create a node descriptor.
   * @param config  - The stream-dom configuration
   * @param scope   - The stream-dom scope
   */
  create (config, scope) {
    this.createNode(this.creationArgs, config, scope)
  }
}

/**
 * Abstract class for a node descriptor.
 */
export class NodeDescriptor {
  /**
   * @abstract
   * @property {string} type - The node type
   */

  /**
   * @abstract
   * @function
   * @name insert
   * @description Insert this node into a DOM parent, before a specified node
   * or appended when no `beforeNode` is specified.
   * @param {Node|DocumentFragment} parentNode - The target DOM parent
   * @param {Node|NodeDescriptor} [beforeNode=null] - An optional node before
   * which to insert the target node
   */

  /**
   * @abstract
   * @function
   * @name remove
   * @description Remove this node from its DOM parent.
   */
}

export function createNodeDescriptors(config, scope, declarationExpressions) {
  return declarationExpressions.reduce(reduceExpressions, [])

  function reduceExpressions(descriptors, expression) {
    if (Array.isArray(expression)) {
      expression.reduce(reduceExpressions, descriptors)
    }
    else {
      descriptors.push(
        expression instanceof NodeDeclaration ? expression.create(config, scope) :
        isStream(expression) ? replacementStream(config, scope, expression) :
        text(config, scope, expression.toString())
      )
    }

    return descriptors
  }
}
