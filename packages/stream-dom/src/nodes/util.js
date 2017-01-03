import { NodeDeclaration } from './node'

export function initializeChildren(config, scope, children) {
  return children.reduce(reduceChildren, [])

  function reduceChildren(descriptors, childDeclarationOrArray) {
    if (Array.isArray(childDeclarationOrArray)) {
      childDeclarationOrArray.reduce(reduceChildren, descriptors)
    }
    else if (childDeclarationOrArray instanceof NodeDeclaration) {
      descriptors.push(childDeclarationOrArray.create(config.scope))
    }
    else {
      throw new Error(`Unexpected child type ${typeof childInitOrArray}`)
    }

    return descriptors
  }
}
