export default function ({ types }) {
  const t = types

  // TODO: Auto import stream-dom?
  // TODO: Avoid generating empty arguments to stream-dom methods
  // TODO: Explicitly error on member expressions until they're supported
  // TODO: Explicitly error on namespaced things until they're supported
  // TODO: Support member expressions
  // TODO: Support namespaced DOM elements and attributes
  // TODO: Support spread attributes
  // TODO: Support spread children
  // TODO: Support configurable event and property namespaces

  return {
    inherits: require('babel-plugin-syntax-jsx'),
    visitor: {
      JSXElement: visitJSXElement
    }
  }

  function visitJSXElement(path) {
    const { node } = path

    path.replaceWith(isComponentName(node.openingElement.name.name) ? toComponent(node) : toDomElement(node))
  }

  function toDomElement({
    openingElement: { attributes: jsxAttributes, name: { name } },
    children
  }) {
    // TODO: Support JSXSpreadAttribute
    const config = jsxAttributes.reduce(
      (config, attribute) => {
        const { name, value } = attribute

        if (isEventListenerName(name)) {
          config.eventStreams.push(
            // TODO: Throw error when value is not an expression
            objectProperty(name.name.name, value.expression)
          )
        }
        else if (isDomPropertyName(name)) {
          config.properties.push(
            objectProperty(name.name.name, value.type === 'JSXExpressionContainer' ? value.expression : value)
          )
        }
        // TODO: Handle other namespaced names
        // TODO: Support or error on dot-delimited names
        else {
          config.attributes.push(
            objectProperty(name.name, value.type === 'JSXExpressionContainer' ? value.expression : value)
          )
        }

        return config
      },
      { attributes: [], properties: [], eventStreams: [] }
    )

    return streamDomCallExpression(
      'element',
      [
        t.stringLiteral(name),
        t.objectExpression([
          objectProperty('attributes', t.objectExpression(config.attributes)),
          objectProperty('properties', t.objectExpression(config.properties)),
          objectProperty('eventStreams', t.objectExpression(config.eventStreams)),
          objectProperty('children', t.arrayExpression(children.map(childNode => (
              childNode.type === 'JSXText' ? toText(childNode.value) :
              childNode.type === 'JSXExpressionContainer' ? toExpression(childNode.expression) :
              childNode
          ))))
        ])
      ]
    )
  }

  function toComponent({
    openingElement: { attributes: jsxAttributes, name: { name } },
    children
  }) {
    // TODO: Support JSXSpreadAttribute
    const config = jsxAttributes.reduce(
      (config, attribute) => {
        const { name, value } = attribute

        if (isEventListenerName(name)) {
          config.eventStreams.push(
            // TODO: Throw error when value is not an expression
            objectProperty(name.name.name, value.expression)
          )
        }
        else if (isDomPropertyName(name)) {
          // TODO: Include namespace and name in error message. This message is probably broken as-is.
          throw new Error(`Components do not support property attributes '${name}'`)
        }
        // TODO: Support or error on dot-delimited names
        else {
          config.properties.push(
            objectProperty(name.name, value.type === 'JSXExpressionContainer' ? value.expression : value)
          )
        }

        return config
      },
      { properties: [], eventStreams: [] }
    )

    return streamDomCallExpression(
      'component',
      [
        t.identifier(name),
        t.objectExpression([
          objectProperty('properties', t.objectExpression(config.properties)),
          objectProperty('eventStreams', t.objectExpression(config.eventStreams)),
          objectProperty('children', t.arrayExpression(children.map(childNode => (
              childNode.type === 'JSXText' ? toText(childNode.value) :
              childNode.type === 'JSXExpressionContainer' ? toExpression(childNode.expression) :
              childNode
          ))))
        ])
      ]
    )
  }

  function toText(str) {
    return streamDomCallExpression('text', [ t.stringLiteral(str) ])
  }

  function toExpression(expressionNode) {
    return streamDomCallExpression('expression', [ expressionNode ])
  }


  function isComponentName(name) {
    return /^[A-Z]/.test(name)
  }

  function isNamespacedName(name) {
    return name.type === 'JSXNamespacedName'
  }

  function isDomPropertyName(name) {
    return isNamespacedName(name) && name.namespace.name === 'property'
  }

  function isEventListenerName(name) {
    return isNamespacedName(name) && name.namespace.name === 'event'
  }

  function streamDomCallExpression(name, args) {
    return t.callExpression(
      t.memberExpression(t.identifier('streamDom'), t.identifier(name)),
      args
    )
  }

  function objectProperty(name, value) {
    return t.objectProperty(t.identifier(name), value)
  }
}
