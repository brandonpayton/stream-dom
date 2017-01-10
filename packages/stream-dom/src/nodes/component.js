import { NodeDescriptor } from '.'
import { isStream } from './stream'

import { proxy } from 'most-proxy'

const any = () => true
const required = v => v !== undefined
const boolean = v => typeof v === 'boolean'
const string = v => typeof v === 'string'
const number = v => typeof v === 'number'
const object = v => typeof v === 'object'
const array = v => Array.isArray(v)
const stream = isStream
// `feedback` indicates an internal stream dependency, so no validation is
// necessary. We do not use `any` here because the reference must be unique in
// order to detect `feedback` declarations
const feedback = () => true
// We do not use `array` here because the reference must be unique in
// order to detect `feedback` declarations
const children = v => Array.isArray(v)

export const propTypes = {
  required,
  any,
  boolean,
  string,
  number,
  object,
  array,
  children,
  stream,
  feedback
}

// TODO: Provide actual reference to StreamDom class
class StreamDom {}

export function component (propsDeclaration, declare, createOutput) {
  return function (config, scope, {
    name,
    props: originalProps
  }) {
    // TODO: Wrap input streams if necessary
    const { props, feedbackStreams } = bindInput(propsDeclaration, originalProps)
    const declaration = declare(props)

    const rootDescriptor = declaration.create(config, scope)
    const namedNodes = [ rootDescriptor ].reduce(reduceNamedNodes, {})

    const output = createOutput(namedNodes)

    Object.keys(feedbackStreams).forEach(key => {
      if (!(key in output)) {
        console.warn(`Unable to attach feedback stream for key '${key}'`)
      }
      else {
        const attach = feedbackStreams[key]
        attach(output[key])
      }
    })

    return new ComponentDescriptor(name, rootDescriptor, output)
  }
}

// Expose for unit test
export function reduceNamedNodes(namedNodes, node) {
  const { name } = node
  if (name) {
    if (name in namedNodes) {
      console.warn(`Duplicate node name '${name}'`)
    }
    else {
      namedNodes[name] = node
    }
  }

  if (node.type === 'element' && node.childDescriptors.length > 0) {
    namedNodes = node.childDescriptors.reduce(reduceNamedNodes, namedNodes)
  }

  return namedNodes
}

// Expose for unit test
export function bindInput (shapeDeclaration, actualInput) {
  return Object.keys(shapeDeclaration).reduce((result, key) => {
    const validator = shapeDeclaration[key]

    if (validator === feedback) {
      if (key in actualInput) {
        console.warn(
          `Ignoring incoming prop with same name as feedback stream '${key}'`
        )
      }
      const { stream, attach } = proxy()
      result.props[key] = stream
      result.feedbackStreams[key] = attach
    }
    else {
      const value = actualInput[key]
      const valid = validator(value)
      if (!valid) {
        console.warn(`Invalid prop '${key}'`)
      }

      result.props[key] = validator === stream && !(stream instanceof StreamDom)
        ? new StreamDom(value)
        : value
    }

    return result
  }, { props: {}, feedbackStreams: {} })
}

export class ComponentDescriptor extends NodeDescriptor {
  get type() { return 'component' }

  constructor (name, rootDescriptor, output) {
    super(name)

    /**
     * The descriptor rendered at the component root
     * @property
     */
    this.rootDescriptor = rootDescriptor

    this.expose = output
  }

  extractContents() {
    return this.rootDescriptor.extractContents()
  }
  deleteContents() {
    this.rootDescriptor.deleteContents()
  }
  getBeforeNode() {
    return this.rootDescriptor.getBeforeNode()
  }
}
