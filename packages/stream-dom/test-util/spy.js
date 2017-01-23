export function spy (f) {
  const s = (...args) => {
    s.lastArgs = args
    s.callCount++
    return f && (s.lastReturnValue = f(...args))
  }

  s.lastArgs = undefined
  s.callCount = 0
  s.lastReturnValue = undefined

  return s
}
