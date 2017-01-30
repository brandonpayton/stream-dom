import { NodeDeclaration } from '.'
import { replacementStream } from './stream'
import { text } from './dom'
import { isStream } from '../kind'

export function createNodeDescriptors (scope, declarationExpressions) {
  return declarationExpressions.reduce(reduceExpressions, [])

  function reduceExpressions (descriptors, expression) {
    if (Array.isArray(expression)) {
      expression.reduce(reduceExpressions, descriptors)
    } else {
      descriptors.push(
        expression instanceof NodeDeclaration ? expression.create(scope) :
        isStream(expression) ? replacementStream(scope, expression) :
        text(scope, expression.toString())
      )
    }

    return descriptors
  }
}
