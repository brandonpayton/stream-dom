/**
 * Base stream-dom node module.
 * @module nodes
 */

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
  create (scope) {
    return this.createNode(scope, this.creationArgs)
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

  constructor (name = null) {
    /**
     * The node name
     * @type {string|null}
     */
    this.name = name
  }

  /**
   * Insert this node into a DOM parent, before a specified node
   * or appended when no `beforeNode` is specified.
   * @param {Node|DocumentFragment} parentNode - The target DOM parent
   * @param {Node|NodeDescriptor} [beforeNode=null] - An optional DOM node or
   * stream-dom node before which to insert the target node
   */
  insert (domParentNode, beforeNode = null) {
    const actualBeforeNode = beforeNode instanceof NodeDescriptor
      ? beforeNode.getBeforeNode()
      : beforeNode
    domParentNode.insertBefore(this.extractContents(), actualBeforeNode)
  }

  /**
   * Remove this node from its DOM parent.
   */
  remove () {
    this.deleteContents()
  }

  /**
   * @abstract
   * @function
   * @name extractContents
   * @description Extract the contents of this node.
   * @returns {Node|DocumentFragment} A node or document fragment for insertion.
   */

  /**
   * @abstract
   * @function
   * @name deleteContents
   * @description Remove the contents of this node.
   */

  /**
   * @abstract
   * @function
   * @name getBeforeNode
   * @description Get a reference node for `insertBefore`
   * @returns {Node}
   */

  /**
   * @abstract
   * @function
   * @name getNextSiblingNode
   * @description Get the next sibling DOM node that follows this stream-dom node
   * @returns {Node|null}
   */

  // TODO: Consider setting via constructor
  /**
   * @abstract
   * @property {?} expose - An optional property representing exposed
   * reference for a node.
   */
}
