export const propertyNamespaceUri = `http://happycode.net/ns/stream-dom/property`

export const defaultNamespaceUriMap = {
  html: `http://www.w3.org/1999/xhtml`,
  svg: `http://www.w3.org/2000/svg`,
  xlink: `http://www.w3.org/1999/xlink`,
  prop: propertyNamespaceUri
}

export default function ({ types }) {
  const t = types

  // TODO: Fix Babylon allowing namespaced member expression
  // TODO: Make namespaceUriMap configurable
  // TODO: Support and test for boolean attributes
  const namespaceNameToUriLiteral =
    Object.keys(defaultNamespaceUriMap).reduce((memo, key) => {
      memo[key] = t.stringLiteral(defaultNamespaceUriMap[key])
      return memo
    }, {})

  return {
    inherits: require(`babel-plugin-syntax-jsx`),
    visitor: {
      JSXElement: visitJSXElement
    }
  }

  function visitJSXElement (path) {
    const { node } = path

    path.replaceWith(isComponentName(node.openingElement.name) ? toComponent(node) : toDomElement(node))

    function toDomElement ({
      openingElement: { attributes: jsxAttributes, name },
      children
    }) {
      const {
        identifier: elementName,
        namespaceUriLiteral
      } = parseElementName(name)

      const { nodeName, attrs, nsAttrs, props } = parseElementAttributes(jsxAttributes)

      const argsProperties = []

      namespaceUriLiteral && argsProperties.push(
        objectProperty(`nsUri`, namespaceUriLiteral)
      )
      nodeName !== undefined && argsProperties.push(
        objectProperty(`nodeName`, nodeName)
      )
      attrs && argsProperties.push(objectProperty(`attrs`, attrs))
      nsAttrs && argsProperties.push(objectProperty(`nsAttrs`, nsAttrs))
      props && argsProperties.push(objectProperty(`props`, props))

      const args = argsProperties.length > 0
        ? t.objectExpression(argsProperties)
        : undefined

      return streamDomDeclaration(
        t.stringLiteral(elementName),
        { args, children }
      )
    }

    function toComponent ({
      openingElement: { attributes: jsxAttributes, name },
      children
    }) {
      const componentTarget = isJsxMemberExpression(name)
        ? toMemberExpression(name)
        : t.identifier(name.name)

      const { nodeName, input } = parseComponentAttributes(jsxAttributes)

      const argsProperties = []
      nodeName !== undefined && (argsProperties.push(
        objectProperty(`nodeName`, nodeName)
      ))
      input !== undefined && (argsProperties.push(
        objectProperty(`input`, input)
      ))
      const args = argsProperties.length > 0
        ? t.objectExpression(argsProperties)
        : undefined

      return streamDomDeclaration(componentTarget, { args, children })
    }

    function parseElementAttributes (jsxAttributes) {
      let nodeName
      const attrProperties = []
      const nsAttrElements = []
      const propsProperties = []

      jsxAttributes.forEach(a => {
        if (a.type === `JSXAttribute`) {
          const { name, value } = a

          if (name.type === `JSXIdentifier`) {
            const parsedAttr = parseAttribute(name, value)

            if (parsedAttr.nodeName !== undefined) {
              nodeName = parsedAttr.nodeName
            } else if (parsedAttr.attrProperty !== undefined) {
              attrProperties.push(parsedAttr.attrProperty)
            } else {
              this.unexpected()
            }
          } else if (name.type === `JSXNamespacedName`) {
            const nsUriLiteral = getNamespaceUriLiteral(name.namespace.name)

            if (nsUriLiteral.value === propertyNamespaceUri) {
              propsProperties.push(
                objectProperty(name.name.name, parseAttributeValue(value))
              )
            } else {
              nsAttrElements.push(
                t.objectExpression([
                  objectProperty(`nsUri`, getNamespaceUriLiteral(name.namespace.name)),
                  objectProperty(`name`, t.stringLiteral(name.name.name)),
                  objectProperty(`value`, parseAttributeValue(value))
                ])
              )
            }
          } else {
            this.unexpected()
          }
        } else if (a.type === `JSXSpreadAttribute`) {
          attrProperties.push(t.spreadProperty(a.argument))
        } else {
          this.unexpected()
        }
      })

      const result = {}
      nodeName !== undefined && (result.nodeName = nodeName)
      attrProperties.length > 0 && (
        result.attrs = t.objectExpression(attrProperties)
      )
      nsAttrElements.length > 0 && (
        result.nsAttrs = t.arrayExpression(nsAttrElements)
      )
      propsProperties.length > 0 && (
        result.props = t.objectExpression(propsProperties)
      )
      return result
    }

    function parseComponentAttributes (jsxAttributes) {
      // TODO: Consider removing the `node-name` special case (it looks like an regular attribute but isn't)
      let nodeName
      const inputProperties = []

      jsxAttributes.forEach(a => {
        if (a.type === `JSXAttribute`) {
          const { name, value } = a

          if (name.type === `JSXIdentifier`) {
            const parsedAttr = parseAttribute(name, value)

            if (parsedAttr.nodeName !== undefined) {
              nodeName = parsedAttr.nodeName
            } else if (parsedAttr.attrProperty !== undefined) {
              inputProperties.push(parsedAttr.attrProperty)
            } else {
              this.unexpected()
            }
          } else if (name.type === `JSXNamespacedName`) {
            throw path.buildCodeFrameError(
              `Namespaced attributes cannot be used for components.`
            )
          } else {
            this.unexpected()
          }
        } else if (a.type === `JSXSpreadAttribute`) {
          inputProperties.push(
            t.spreadProperty(a.argument)
          )
        } else {
          this.unexpected()
        }
      })

      const result = {}
      nodeName !== undefined && (result.nodeName = nodeName)
      inputProperties.length > 0 && (
        result.input = t.objectExpression(inputProperties)
      )
      return result
    }

    function parseAttribute (jsxIdentifier, value) {
      const { name } = jsxIdentifier
      const parsedValue = parseAttributeValue(value)

      if (name === `node-name`) {
        if (parsedValue.type !== `StringLiteral`) {
          throw path.buildCodeFrameError(`node-name must be a string literal`)
        }

        return { nodeName: parsedValue }
      } else {
        return { attrProperty: objectProperty(name, parsedValue) }
      }
    }

    function parseAttributeValue (jsxAttributeValue) {
      if (jsxAttributeValue === null) {
        // This is a boolean attribute with no value.
        return t.booleanLiteral(true)
      } else {
        const { type } = jsxAttributeValue
        // TODO: What of JSXText type?
        if (type === `StringLiteral` || type === `JSXElement`) {
          return jsxAttributeValue
        } else if (type === `JSXExpressionContainer`) {
          return jsxAttributeValue.expression
        } else {
          this.unexpected()
        }
      }
    }

    function mapChildren (children) {
      return t.arrayExpression(children.map(childNode => (
        childNode.type === `JSXText` ? toText(childNode.value) :
        childNode.type === `JSXExpressionContainer` ? childNode.expression :
        childNode
      )))
    }

    function toText (str) {
      return t.stringLiteral(str)
    }

    function isComponentName (name) {
      return !isNamespacedName(name) && (
        isJsxMemberExpression(name) || (isJsxIdentifier(name) && /^[A-Z]/.test(name.name))
      )
    }

    function toMemberExpression ({ object, property }) {
      return t.memberExpression(
        isJsxMemberExpression(object) ? toMemberExpression(object) : t.identifier(object.name),
        t.identifier(property.name)
      )
    }

    function isJsxIdentifier (name) {
      return name.type === `JSXIdentifier`
    }

    function isJsxMemberExpression (name) {
      return name.type === `JSXMemberExpression`
    }

    function isNamespacedName (nameNode) {
      return nameNode.type === `JSXNamespacedName`
    }

    function streamDomDeclaration (target, { args, children: jsxChildren }) {
      const declarationArgs = [ target ]
      args !== undefined && declarationArgs.push(args)
      jsxChildren.length > 0 && declarationArgs.push(
        mapChildren(jsxChildren)
      )

      return t.callExpression(
        t.identifier(`h`),
        declarationArgs
      )
    }

    function objectProperty (key, value) {
      return t.objectProperty(toObjectKeyType(key), value)
    }

    function toObjectKeyType (key) {
      return t.isValidIdentifier(key)
        ? t.identifier(key)
        : t.stringLiteral(key)
    }

    function parseElementName (nameNode) {
      if (isNamespacedName(nameNode)) {
        return {
          identifier: nameNode.name.name,
          namespaceUriLiteral: getNamespaceUriLiteral(nameNode.namespace.name)
        }
      } else {
        return {
          identifier: nameNode.name
        }
      }
    }

    function getNamespaceUriLiteral (nameStr) {
      if (nameStr in namespaceNameToUriLiteral) {
        return namespaceNameToUriLiteral[nameStr]
      } else {
        throw path.buildCodeFrameError(
          `There is no namespace URI for namespace name '${nameStr}'`
        )
      }
    }
  }
}
