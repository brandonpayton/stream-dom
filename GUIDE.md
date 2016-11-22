# Simple example

```javascript
streamDom({
  initialSalutation: 'Hello',
  name: 'World'
})
.until(domEvent('unload', window))
.render(props => h(Greeting, props))
.mount(document.body)

export const inputs = {
  initialSalutation: propTypes.string,
  salutationStream: propTypes.output.observable.string,
  name: propTypes.string
}

export const create = ({ salutationStream, name }, h) => (
  <div>
    <label>Salutation: <input node-name="salutationNode" /></label>
    <div>Result: {salutationStream}, {name}!</div>
  </div>
)

export const output = ({ salutationNode }) => ({
  salutationStream: salutationNode.on('change')
    .map(() => salutationNode.value)
    .startWith(salutationNode.value)
})

export default component(inputs, create, outputs)
```

# Collection example

```javascript
const inputs = {
  createDataSource /* createDataStream(action$) */
}

export const inputs = {
  createDataSource: propTypes.function,
  action$: propTypes.output.observable.object
}

export const create = ({ createDataSource, action$ }) => {
  const todos$ = createDataSource(action$)

  return (
    <ul node-name="listNode">
      {todos$
        .list()
        .identifyItems(item => item.id)
        .diffPositions()
        .renderItems((item, h) => {
          // render items that are repositioned as needed and replaced on update
        })
        // OR
        .renderItemStreams((item$, h) => {
          // render items that are repositioned as needed and directly modified on update
        })
      }
    </ul>
  )
}

export const outputs = ({ listNode }) => {


  const editTodo$
}


renderItems(item => <div>stuff</div>)
renderItems({
  identify: item => item.id,
  render: item => <div>{item.name}</div>
})
renderItemStreams({
  identify: item => item.id,
  render: item$ => <div>{item$.prop('name')}</div>
})
