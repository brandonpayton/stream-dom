import { assert } from 'chai'

export default {
  textNode (domNode, expectedText) {
    assert.strictEqual(domNode.nodeType, Node.TEXT_NODE, `is a text node`)
    assert.strictEqual(domNode.textContent, expectedText, `correct contents`)
  },

  elementNode (domNode, expectedTagName, expectedNamespaceURI) {
    assert.strictEqual(domNode.nodeType, Node.ELEMENT_NODE, `correct DOM node type`)
    assert.match(domNode.tagName, new RegExp(expectedTagName, `i`), `correct element name`)

    if (expectedNamespaceURI !== undefined) {
      assert.strictEqual(domNode.namespaceURI, expectedNamespaceURI, `correct namespace URI`)
    }
  },

  elementAttributes (domElement, expectedAttributes, customComment) {
    const comment = customComment || `same number of actual and expected attributes`

    assert.strictEqual(domElement.attributes.length, expectedAttributes.length, comment)

    expectedAttributes.forEach(({ name, value }) => {
      assert.isTrue(domElement.hasAttribute(name), `attribute present`)
      assert.strictEqual(domElement.getAttribute(name), value, `expected value`)
    })
  },

  elementProperties (domElement, expectedProperties) {
    expectedProperties.forEach(
      ({ name, value }) => assert.propertyVal(domElement, name, value)
    )
  }
}

