import { merge } from 'most'
import keycode from 'keycode'

import { streamDom } from '../stream-dom'
import { findSelectorTarget } from './findSelectorTarget'
import * as actions from '../model/todo-actions'

export function TodoList({
  properties: { todos$ },
  eventStreams: { todoAction },
  createEventStream,
  attachEventStream
}) {
  const change$ = createEventStream()
  const keydown$ = createEventStream()
  const click$ = createEventStream()

  const findTodoSelectorTarget = findSelectorTarget('.todo')

  attachEventStream(todoAction, change$
    .filter(e => e.target.matches('.toggle'))
    .filter(findTodoSelectorTarget)
    .map(e => actions.toggle(e.selectorTarget.id, e.target.checked))
  )

  attachEventStream(todoAction, keydown$
    .filter(e => e.target.matches('.edit') && isCommitEdit(e))
    .filter(findTodoSelectorTarget)
    .map(e => {
      const { id } = e.selectorTarget
      const trimmedText = e.target.value.trim()
      return trimmedText.length === 0 ? actions.destroy(id) : actions.edit(id, trimmedText)
    })
  )

  attachEventStream(todoAction, click$
    .filter(findTodoSelectorTarget)
    .filter(e => e.target.matches('.destroy'))
    .map(e => actions.destroy(e.selectorTarget.id))
  )

  return (
    <ul class="todo-list" e:change={change$} e:keydown={keydown$} e:click={click$}>
      {todos$.map(todos => todos.map(todo => <Todo todo={todo} />))}
    </ul>
  )
}

function Todo({
  properties: { todo },
  createEventStream
}) {
  const { id, text, completed } = todo

  const doubleClick$ = createEventStream()
  // Ignore double clicks on the edit field to avoid interfering with
  // double clicking to select a word in the input.
  const doubleClickForEdit$ = doubleClick$.filter(e => !e.target.matches('.edit'))
  const blur$ = createEventStream()
  const keyDown$ = createEventStream()
  const enterKeyDown$ = keyDown$.filter(isCommitEdit)
  const abortEdit$ = merge(
    keyDown$.filter(e => e.keyCode === keycode('Escape')),
    blur$
  )

  const editing$ =
    merge(
      doubleClickForEdit$.constant(true),
      merge(enterKeyDown$, abortEdit$).constant(false)
    )
    .startWith(false)

  const class$ = editing$.map(editing => {
    const editingClass = editing ? 'editing' : ''
    const completedClass = completed ? 'completed' : ''
    return `todo ${editingClass} ${completedClass}`
  })

  doubleClickForEdit$.observe(({ currentTarget }) => setTimeout(() => {
    const inputNode = currentTarget.querySelector('.edit')
    inputNode.focus()
    inputNode.selectionStart = inputNode.value.length
  }))

  return (
    <li id={id} class={class$} e:dblclick={doubleClick$}>
      <div class="view">
        <input class="toggle" type="checkbox" checked={!!completed} />
        <label>{text}</label>
        <button class="destroy" />
      </div>
      <input class="edit" value={text} e:blur={blur$} e:keydown={keyDown$} />
    </li>
  )
}

function isCommitEdit(e) {
  return e.keyCode === keycode('Enter')
}
