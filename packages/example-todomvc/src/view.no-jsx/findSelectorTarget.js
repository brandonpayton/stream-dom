// TODO: Revisit this. A filter function should be pure, but this one sets event.selectorTarget.
export function findSelectorTarget (selector) {
  return e => {
    let c = e.target
    do {
      if (c.matches(selector)) {
        e.selectorTarget = c
        return true
      }
      else {
        c = c.parentNode
      }
    }
    while (c !== e.currentTarget)

    return false
  }
}
