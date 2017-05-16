import { NodeDescriptor } from './node'
import { isObservable } from './kind'
import { defaultNamespaceUri } from './index'

import { from } from 'most'
import { hold } from '@most/hold'
import { proxy } from 'most-proxy'

const any = () => true
const required = v => v !== undefined
const boolean = v => typeof v === `boolean`
const string = v => typeof v === `string`
const number = v => typeof v === `number`
const object = v => typeof v === `object`
const array = v => Array.isArray(v)
const observable = isObservable
// `feedback` indicates an internal stream dependency, so no validation is
// necessary. We do not use `any` here because the reference must be unique in
// order to detect `feedback` declarations
const feedback = () => true
// We do not use `array` here because the reference must be unique in
// order to detect `feedback` declarations
const children = v => Array.isArray(v)

export const types = {
  required,
  any,
  boolean,
  string,
  number,
  object,
  array,
  children,
  observable,
  feedback
}

function noOp () {}

export function component ({
  input: inputDeclaration = {},
  structure: declareStructure,
  output: createOutput = noOp
}) {
  return function createComponentNode (scope, {
    nodeName,
    input: originalInput = {}
  } = {}) {
    const { input, feedbackStreams } =
      bindInput(inputDeclaration, originalInput)

    const declaredStructure = declareStructure(input)

    const { rootDescriptor, namedNodes } =
      createStructure(defaultNamespaceUri, scope, declaredStructure)

    const output =
      bindOutput(feedbackStreams, createOutput(namedNodes, input))

    return new ComponentNodeDescriptor(nodeName, rootDescriptor, output)
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
      namedNodes[name] = node.expose
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
export function bindInput (shapeDeclaration, actualInput) {
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
      result.input[key] = stream
      result.feedbackStreams[key] = attach
    } else {
      let value = actualInput[key]
      const valid = validator(value)
      if (!valid) {
        console.warn(`Invalid prop '${key}'`)
      }

      result.input[key] = value
    }

    if (isObservable(result.input[key])) {
      // TODO: Is it actually the right thing to make all input streams hold/multicast?
      result.input[key] = from(result.input[key]).thru(hold)
    }

    return result
  }, { input: {}, feedbackStreams: {} })
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
export function bindOutput (feedbackStreams, output) {
  // TODO: Bound output streams to end when component is destroyed

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
