export function delegatedEvent (selector) {
  return eventStream => eventStream.filter(e => {
    let c = e.target
    do {
      if (c.matches(selector)) {
        e.selectorTarget = c
        return true
      } else {
        c = c.parentNode
      }
    }
    while (c !== e.currentTarget)

    return false
  })
}
