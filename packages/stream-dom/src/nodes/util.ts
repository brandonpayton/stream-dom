import is from '../is'
import { StreamDomScope } from '../index'
import { Child, InitializeNode, NodeDescriptor } from './node'

export function create(base: Object, ...mixinObjects: Object[]): Object {
  const result = Object.create(base)
  mixinObjects.forEach(mixinObject => {
    Object.keys(mixinObject).forEach(key => result[key] = mixinObject[key])
  })
  return result
}

export function initializeChildren(children: Child[], scope: StreamDomScope): NodeDescriptor[] {
  return children.reduce(reduceChildren, [])

  function reduceChildren(descriptors: NodeDescriptor[], childInitOrArray: Child) {
    if (Array.isArray(childInitOrArray)) {
      childInitOrArray.reduce(reduceChildren, descriptors)
    }
    else if (is.function(childInitOrArray)) {
      descriptors.push(childInitOrArray(scope))
    }
    else {
      throw new Error(`Unexpected child type ${typeof childInitOrArray}`)
    }

    return descriptors
  }
}
