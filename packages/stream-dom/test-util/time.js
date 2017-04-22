export function wait (t = 0) {
  return new Promise(resolve => setTimeout(resolve, t))
}
