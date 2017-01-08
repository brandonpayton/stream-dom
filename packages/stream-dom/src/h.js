import { NodeDeclaration } from './nodes'
import { element, text } from './nodes/dom'
import { component } from './nodes/component'

/**
 * Parse a tag expression containing an optional namespace prefix and a tag name.
 *
 * Examples:
 * * `'div'`
 * * `'svg:svg'`
 *
 * **Exposed for unit test.**
 *
 * @param {string} - The expression to parse.
 * @returns {Object} tagDeclaration
 * @returns {string} tagDeclaration.name - Tag name
 */
export function parseTagExpression (str) {
  /** @todo Replace this unreadable regex with a clearer, stronger parser. */
  const m = str.match(/^(?:([^\s:]+):)?([^\s]+)$/)

  if (m) {
    const [ , namespaceName = '', name ] = m
    return { namespaceName, name }
  }
  else {
    throw new Error(`Unable to parse tag expression '${str}'`)
  }
}

export function h(tagExpression, args, children) {
  if (typeof tagExpression === 'string') {
    const { namespaceName, name } = parseTagExpression(tagExpression)
    const { attrs, props } = args

    return new NodeDeclaration(element, {
      namespaceName, name, attrs, props, children
    })
  }
  else if (typeof tagExpression === 'function') {
    const component = tagExpression
    const { props } = args
    return new NodeDeclaration(component, { props, children })
  }
  else {
    throw new TypeError(`Unsupported tag type '${tagExpression}'`)
  }
}
