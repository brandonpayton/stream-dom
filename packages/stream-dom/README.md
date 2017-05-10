# stream-dom

An experimental, declarative DOM library that models change and I/O with reactive streams.

[![Build Status](https://travis-ci.org/brandonpayton/stream-dom.svg?branch=master)](https://travis-ci.org/brandonpayton/stream-dom)

The purpose of this package is to explore the following:

1. Modeling UI change over time with reactive streams. Treat all else as static content.
2. Diffing input data rather than virtual DOM trees to identify changes.
3. Explicit unidirectional data flow through a component declaring both input and output.
4. Feedback loops. A component may declare feedback inputs that are satisfied by its outputs.
 
## Overview

The current version of `stream-dom` is based on most.js, and some of the following examples use most.js combinators. The examples also use JSX, though a reasonable node declaration function is planned.

### Components

Components are reusable trees of elements and other components that explicitly declare the shape of their input, structure, and output.

```javascript
const Example = component({ input, structure, output })
```

#### Input

Component input is declared as a hash of name/type pairs.

```javascript
input: {
  label: types.string,
  initialValue: types.number
}
```

#### Structure

Component structure is a tree of component and DOM nodes.

Each component declares its structure as a tree of component and DOM nodes. Nodes may be named for use in the output declaration. Note uses of the `node-name` attribute.
```javascript
structure: input => (
  <form node-name="formNode">
    <label>
      {input.label}: <input node-name="inputNode" value={input.initialValue} />
    </label>
    <button>Enter</button>
  </form>
)
```

#### Output

Components declare their output with a hash of name/value pairs. A named element provides direct access to its DOM node. A named component, shown later, provides access to its output which may be incorporated into the declared output of its parent component. Most often, component outputs will be reactive streams, but component outputs may  also be static values.

```javascript
output: namedNodes => {
    const { formNode, inputNode } = namedNodes

    const submit$ = tap(e => e.preventDefault(), domEvent('submit', formNode))
    const value$ = startWith(
        inputNode.value,
        map(() => inputNode.value, submit$)
    )
        
    return { value$ }    
}
```

#### Feedback loops

A component can model a feedback loop by declaring feedback input that is satisfied by the component's declared output.

```javascript
const ClickCount = component({
    // Declare feedback input
    input: { count$: types.feedback },

    // Use feedback input
    structure: ({ count$ }) => <span node-name="domNode">Click count: {count$}</span>,

    // Declare feedback output
    output: ({ domNode }) => ({
        count$: scan(x => x + 1, 0, domEvent('click', domNode))
    })
})
```

### Dynamic content

Dynamic content is explicitly declared. In `stream-dom`, an input that changes over time should be represented by a reactive stream. All other content is treated as static content.

```javascript
const StaticAndDynamic = component({
    input: {
        staticValue: types.number,
        dynamicValue: types.stream
    },
    structure: ({ staticValue, dynamicValue }) => <table>
        <tr><th scope="row">Will not change</th><td>{staticValue}</td></tr>
        <tr><th scope="row">May change</th><td>{dynamicValue}</td></tr>
    </table>
})
```

### Inserting stream-dom UI

A single component or DOM node forms the root of a stream-dom UI. Use the `mount` function to create and insert a `stream-dom` UI into the DOM. The `mount` function returns a handle with a `dispose` method that may be used to remove the UI from the DOM and perform necessary cleanup.

```javascript
// Create and insert
const handle = mount(document.body, null, <p>Hello, DOM!</p>)

// Remove and dispose
handle.dispose()
```

## Philosophy

Strive to model the truth for the sake of simplicity and a better developer outcome.

1. Orient to the foundation, the web platform.
    * Reduce the risk of library abstractions conflicting with underlying reality.
    * Avoid building library-specific knowledge at the expense of platform fundamentals.
2. Say what you mean.
    * Reduce the need for assumptions and other magic.
    * Example: Developers may speak directly to both attributes and properties. There is no built-in list of attribute names that are mapped to property assignments.
    * Example: Elements assume their parent's namespace unless the developer specifies a different namespace. There is no built-in mapping of elements to particular namespaces.
