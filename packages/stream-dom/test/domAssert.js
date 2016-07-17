import { assert } from 'chai'

export default {
  textNode(domNode, expectedText) {
    assert.strictEqual(domNode.nodeType, Node.TEXT_NODE, 'is a text node')
    assert.strictEqual(domNode.textContent, expectedText, 'correct contents')
  },

  elementNode(domNode, expectedTagName) {
    assert.strictEqual(domNode.nodeType, Node.ELEMENT_NODE, 'correct DOM node type')
    assert.strictEqual(domNode.tagName, expectedTagName.toUpperCase(), 'correct element name')
  },

  elementAttributes(domElement, expectedAttributes, customComment) {
    const expectedNames = Object.keys(expectedAttributes)
    const comment = customComment || 'same number of actual and expected attributes'

    assert.strictEqual(domElement.attributes.length, expectedNames.length, comment)

    expectedNames.forEach(name => {
      assert.isTrue(domElement.hasAttribute(name), 'attribute present')
      assert.strictEqual(domElement.getAttribute(name), expectedAttributes[name], 'expected value')
    })
  },

  elementProperties(domElement, expectedProperties) {
    const expectedNames = Object.keys(expectedProperties)

    expectedNames.forEach(name => assert.propertyVal(domElement, name, expectedProperties[name]))
  }
}

