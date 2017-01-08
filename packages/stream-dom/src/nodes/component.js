import { isStream } from './stream'

const any = () => true
const required = v => v !== undefined
const boolean = v => typeof v === 'boolean'
const string = v => typeof v === 'string'
const number = v => typeof v === 'number'
const object = v => typeof v === 'object'
const array = v => Array.isArray(v)
const stream = isStream
const loop = [ required, isStream ]

export const propTypes = {
  required,
  any,
  boolean,
  string,
  number,
  object,
  array,
  stream,
  loop
}

export function component (input, create, output) {
  return function (props) {
    // Input
      // Validate props
      // Create proxies for all loop streams

    // Create
      // Create declared tree, building map of named node refs

    // Output
      // Provide named node refs
      // Connect output streams to loop stream proxies
        // Warn when there is no output stream for declared loop stream
      // Expose output on NodeDescriptor
  }
}
