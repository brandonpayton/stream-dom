import esutils from 'esutils'

export default function ({ types }) {
  const t = types

  // TODO: Fix Babylon allowing namespaced member expression

  // TODO: Clean this up

  return {
    inherits: require('babel-plugin-syntax-jsx'),
    visitor: {
      JSXElement: visitJSXElement
    }
  }

  function visitJSXElement(path) {
    const { node } = path

    path.replaceWith(isComponentName(node.openingElement.name) ? toComponent(node) : toDomElement(node))

    function toDomElement({
      openingElement: { attributes: jsxAttributes, name },
      children
    }) {
      const [ elementName, namespaceName ] = isNamespacedName(name)
        ? [ name.name.name, name.namespace.name ]
        : [ name.name, undefined ]

      const objectProperties = []

      if (namespaceName !== undefined) {
        objectProperties.push(objectProperty('namespaceName', t.stringLiteral(namespaceName)))
      }

      objectProperties.push(
        objectProperty('attributes', toAttributesArray(jsxAttributes)),
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
      return streamDomCallExpression(
        'component',
        [
          isJsxMemberExpression(name) ? toMemberExpression(name) : t.identifier(name.name),
          t.objectExpression([
            objectProperty('attributes', toAttributesArray(jsxAttributes)),
            objectProperty('children', mapChildren(children))
          ])
        ]
      )
    }

    function toAttributesArray(jsxAttributes) {
      return t.arrayExpression(
        jsxAttributes.map(jsxAttribute =>
          jsxAttribute.type === 'JSXSpreadAttribute' ? jsxAttribute.argument : toAttributeObject(jsxAttribute)
        )
      )
    }

    function toAttributeObject(jsxAttribute) {
      const { name: nameNode, value: valueNode } = jsxAttribute

      const [ namespace, identifier ] = isNamespacedName(nameNode)
        ? [ nameNode.namespace.name, nameNode.name ]
        : [ null, nameNode ]

      const attributeProperties = []

      if (namespace) {
        attributeProperties.push(objectProperty('namespace', t.stringLiteral(namespace)))
      }

      attributeProperties.push(
        objectProperty('name', t.stringLiteral(identifier.name)),
        objectProperty('value',
          valueNode === null ? t.booleanLiteral(true) :
          valueNode.type === 'JSXExpressionContainer' ? valueNode.expression :
          valueNode
        )
      )

      return t.objectExpression(attributeProperties)
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

    function streamDomCallExpression(name, args) {
      return t.callExpression(
        t.memberExpression(t.identifier('streamDom'), t.identifier(name)),
        args
      )
    }

    function objectProperty(key, value) {
      return t.objectProperty(toObjectKeyType(key), value)
    }

    function toObjectKeyType(key) {
      return esutils.keyword.isIdentifierNameES6(key)
        ? t.identifier(key)
        : t.stringLiteral(key)
    }
  }
}
