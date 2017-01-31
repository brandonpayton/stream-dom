import { NodeDescriptor } from './node'
import { isStream } from './kind'
import { streamDom, defaultNamespaceUri } from './index'

import { proxy } from 'most-proxy'

const any = () => true
const required = v => v !== undefined
const boolean = v => typeof v === `boolean`
const string = v => typeof v === `string`
const number = v => typeof v === `number`
const object = v => typeof v === `object`
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

export function component (propsDeclaration, declareStructure, createOutput) {
  return function createComponentNode (scope, { name, props: originalProps }) {
    // TODO: Wrap unwrapped input streams
    const { props, feedbackStreams } =
      bindInput(streamDom, propsDeclaration, originalProps)

    const declaredStructure = declareStructure(props)

    const { rootDescriptor, namedNodes } =
      createStructure(defaultNamespaceUri, scope, declaredStructure)

    const output =
      bindOutput(streamDom, feedbackStreams, createOutput(namedNodes))

    return new ComponentNodeDescriptor(name, rootDescriptor, output)
  }
}

// Expose for unit test
// TODO: Address high complexity and re-enable complexity rule
// eslint-disable-next-line complexity
export function reduceNamedNodes (namedNodes, node) {
  const { name } = node
  if (name) {
    if (name in namedNodes) {
      console.warn(`Duplicate node name '${name}'`)
    } else if (!(`expose` in node)) {
      console.warn(`No exposed interface for node named '${name}'`)
    } else {
      namedNodes[name] = node
    }
  }

  if (node.type === `element` && node.childDescriptors.length > 0) {
    namedNodes = node.childDescriptors.reduce(
      reduceNamedNodes, namedNodes
    )
  }

  return namedNodes
}

// Expose for unit test
export function bindInput (streamDom, shapeDeclaration, actualInput) {
  // TODO: Address high complexity and re-enable complexity rule
  // eslint-disable-next-line complexity
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
    } else {
      const value = actualInput[key]
      const valid = validator(value)
      if (!valid) {
        console.warn(`Invalid prop '${key}'`)
      }

      result.props[key] = validator === stream
        ? streamDom(value)
        : value
    }

    return result
  }, { props: {}, feedbackStreams: {} })
}

// Expose for unit test
export function createStructure (defaultNamespaceUri, scope, declaration) {
  const componentScope = scope.parentNamespaceUri === defaultNamespaceUri
    ? scope
    : Object.assign({}, scope, { parentNamespaceUri: defaultNamespaceUri })

  const rootDescriptor = declaration.create(componentScope)
  const namedNodes = [ rootDescriptor ].reduce(reduceNamedNodes, {})

  return { rootDescriptor, namedNodes }
}

// Expose for unit test
export function bindOutput (streamDom, feedbackStreams, rawOutput) {
  const output = Object.keys(rawOutput).reduce((memo, key) => {
    const value = rawOutput[key]
    memo[key] = isStream(value) ? streamDom(value) : value
    return memo
  }, {})

  Object.keys(feedbackStreams).forEach(key => {
    if (!(key in output)) {
      console.warn(`Unable to attach feedback stream for key '${key}'`)
    } else {
      const attach = feedbackStreams[key]
      attach(output[key])
    }
  })

  return output
}

export class ComponentNodeDescriptor extends NodeDescriptor {
  get type () { return `component` }

  constructor (name, rootDescriptor, output) {
    super(name)

    /**
     * The descriptor rendered at the component root
     * @property
     */
    this.rootDescriptor = rootDescriptor

    this.expose = output
  }

  extractContents () {
    return this.rootDescriptor.extractContents()
  }
  deleteContents () {
    this.rootDescriptor.deleteContents()
  }
  getBeforeNode () {
    return this.rootDescriptor.getBeforeNode()
  }
}
