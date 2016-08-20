export default function ({ types }) {
  const t = types

  // TODO: Explicitly error on namespaced things until they're supported
  // TODO: Support namespaced DOM elements and attributes
  // TODO: Support spread attributes
  // TODO: Support spread children
  // TODO: Fix Babylon allowing namespaced member expression

  // TODO: Clean this up

  return {
    inherits: require('babel-plugin-syntax-jsx'),
    visitor: {
      JSXElement: visitJSXElement
    }
  }

  function visitJSXElement(path, state) {
    const { node } = path
    const {
      opts: {
        propertyNamespace = 'property',
        eventNamespace = 'event'
      }
    } = state

    path.replaceWith(isComponentName(node.openingElement.name) ? toComponent(node) : toDomElement(node))

    function toDomElement({
      openingElement: { attributes: jsxAttributes, name },
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
        { attributes: [], namespacedAttributes: [], properties: [], eventStreams: [] }
      )

      const [ elementName, namespaceName ] = isNamespacedName(name)
        ? [ name.name.name, name.namespace.name ]
        : [ name.name, undefined ]

      const objectProperties = []

      if (namespaceName !== undefined) {
        objectProperties.push(objectProperty('namespaceName', t.stringLiteral(namespaceName)))
      }

      objectProperties.push(
        objectProperty('attributes', t.objectExpression(config.attributes)),
        objectProperty('properties', t.objectExpression(config.properties)),
        objectProperty('eventStreams', t.objectExpression(config.eventStreams)),
        objectProperty('children', mapChildren(children))
      )

      return streamDomCallExpression('element', [
        t.stringLiteral(elementName),
        t.objectExpression(objectProperties)
      ])
    }

    function toComponent({
      openingElement: { attributes: jsxAttributes, name },
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
          isJsxMemberExpression(name) ? toMemberExpression(name) : t.identifier(name.name),
          t.objectExpression([
            objectProperty('properties', t.objectExpression(config.properties)),
            objectProperty('eventStreams', t.objectExpression(config.eventStreams)),
            objectProperty('children', mapChildren(children))
          ])
        ]
      )
    }

    function mapChildren(children) {
      return t.arrayExpression(children.map(childNode => (
        childNode.type === 'JSXText' ? toText(childNode.value) :
        childNode.type === 'JSXExpressionContainer' ? toExpression(childNode.expression) :
        childNode
      )))
    }

    function toText(str) {
      return streamDomCallExpression('text', [ t.stringLiteral(str) ])
    }

    function toExpression(expressionNode) {
      return streamDomCallExpression('expression', [ expressionNode ])
    }

    function isComponentName(name) {
      return !isNamespacedName(name) && (
        isJsxMemberExpression(name) || (isJsxIdentifier(name) && /^[A-Z]/.test(name.name))
      )
    }

    function toMemberExpression({ object, property }) {
      return t.memberExpression(
        isJsxMemberExpression(object) ? toMemberExpression(object) : t.identifier(object.name),
        t.identifier(property.name)
      )
    }

    function isJsxIdentifier(name) {
      return name.type === 'JSXIdentifier'
    }

    function isJsxMemberExpression(name) {
      return name.type === 'JSXMemberExpression'
    }

    function isNamespacedName(name) {
      return name.type === 'JSXNamespacedName'
    }

    function isDomPropertyName(name) {
      return isNamespacedName(name) && name.namespace.name === propertyNamespace
    }

    function isEventListenerName(name) {
      return isNamespacedName(name) && name.namespace.name === eventNamespace
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
}
