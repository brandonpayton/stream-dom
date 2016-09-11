import symbolObservable from 'symbol-observable'
import { Stream } from 'most'

export default {
  array(candidate: any): boolean {
    return Array.isArray(candidate)
  },

  boolean(candidate: any): boolean {
    return candidate === true || candidate === false
  },

  ['function'](candidate: any): boolean {
    return typeof candidate === 'function'
  },

  stream(candidate: any): candidate is Stream<any> {
    return !!candidate[symbolObservable]
  }
}
