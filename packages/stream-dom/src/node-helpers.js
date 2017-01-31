import { NodeDeclaration } from './node'
import { replacementStream } from './node-stream'
import { createTextNode } from './node-dom'
import { isStream } from './kind'

export function createNodeDescriptors (scope, declarationExpressions) {
  return declarationExpressions.reduce(reduceExpressions, [])

  function reduceExpressions (descriptors, expression) {
    if (Array.isArray(expression)) {
      expression.reduce(reduceExpressions, descriptors)
    } else {
      descriptors.push(
        expression instanceof NodeDeclaration ? expression.create(scope) :
        isStream(expression) ? replacementStream(scope, expression) :
        createTextNode(scope, expression.toString())
      )
    }

    return descriptors
  }
}
