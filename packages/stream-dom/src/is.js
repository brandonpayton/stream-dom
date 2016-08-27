import symbolObservable from 'symbol-observable'

export default {
  array(candidate) {
    return Array.isArray(candidate)
  },

  boolean(candidate) {
    return candidate === true || candidate === false
  },

  ['function'](candidate) {
    return typeof candidate === 'function'
  },

  stream(candidate) {
    return !!candidate[symbolObservable]
  }
}
