import { StreamDomScope } from '../index'
import { ChildDeclaration, InitializeNode, NodeDescriptor } from './node'

export function initializeChildren(children: ChildDeclaration[], scope: StreamDomScope): NodeDescriptor[] {
  return children.reduce(reduceChildren, [])

  function reduceChildren(descriptors: NodeDescriptor[], childInitOrArray: ChildDeclaration) {
    if (Array.isArray(childInitOrArray)) {
      childInitOrArray.reduce(reduceChildren, descriptors)
    }
    else if (typeof childInitOrArray === 'function') {
      descriptors.push(childInitOrArray(scope))
    }
    else {
      throw new Error(`Unexpected child type ${typeof childInitOrArray}`)
    }

    return descriptors
  }
}
