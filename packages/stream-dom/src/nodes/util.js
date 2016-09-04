import is from '../is'

export function create(base, ...mixinObjects) {
  const result = Object.create(base)
  mixinObjects.forEach(mixinObject => {
    Object.keys(mixinObject).forEach(key => result[key] = mixinObject[key])
  })
  return result
}

export function initializeChildren(children, scope) {
  return children.reduce(reduceChildren, [])

  function reduceChildren(descriptors, childInitOrArray) {
    if (is.array(childInitOrArray)) {
      childInitOrArray.reduce(reduceChildren, descriptors)
    }
    else if (is.function(childInitOrArray)) {
      descriptors.push(childInitOrArray(scope))
    }
    else {
      throw new Error('Unexpected child type', childInitOrArray)
    }

    return descriptors
  }
}
