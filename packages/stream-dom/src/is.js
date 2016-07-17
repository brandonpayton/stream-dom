import symbolObservable from 'symbol-observable'

export default {
  boolean(candidate) {
    return candidate === true || candidate === false
  },

  stream(candidate) {
    return !!candidate[symbolObservable]
  }
}
