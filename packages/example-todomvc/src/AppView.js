import { combine, merge, just } from 'most'
import { domEvent } from '@most/dom-event'
import assign from 'lodash.assign'
import keycode from 'keycode'
import { streamDom } from './stream-dom'

import {
  create as createTodo,
  destroy as destroyTodo,
  edit as editTodo,
  toggle as toggleTodo,
  toggleAll,
  destroyAllCompleted
} from './model/todo-actions'

export function AppView({
  properties: {
    todos$: allTodos$,
    action$
  }
}) {
  const locationHash$ = domEvent('hashchange', window)
    .map(() => location.hash)
    .startWith(location.hash)

  const filter$ = locationHash$.map(hash => (
    hash === '#/active' ? todo => !todo.completed :
    hash === '#/completed' ? todo => todo.completed :
    () => true
  ))

  const todos$ = combine(
    (allTodos, filter) => allTodos.filter(filter),
    allTodos$,
    filter$
  )

  return (
    <div>
      <section class="todoapp">
        <header class="header">
          <h1>todos</h1>
          <NewTodoTextBox action$={action$} />
        </header>
        <section class="main">
          <ToggleAllCheckbox id="toggle-all" action$={action$} />
          <TodoList todos$={todos$} action$={action$} />
        </section>
        <TodosFooter allTodos$={allTodos$} action$={action$} />
      </section>
      <footer class="info">
        <p>Double-click to edit a todo</p>
        // Remove the below line ↓
        <p>Template by <a href="http://sindresorhus.com">Sindre Sorhus</a></p>
        // Change this out with your name and url ↓
        <p>Created by <a href="http://todomvc.com">you</a></p>
        <p>Part of <a href="http://todomvc.com">TodoMVC</a></p>
      </footer>
    </div>
  )
}

function NewTodoTextBox({
  properties: {
    action$
  },
  createEventStream,
  attachEventStream
}) {
  const keyPress$ = createEventStream()
  const newTodo$ = keyPress$
    .filter(e => e.keyCode === keycode('Enter'))
    .map(e => e.target.value.trim())
    .filter(text => text.length > 0)

  // const allWhitespace = /^\s*$/
  // const newTodo$ = keyPress$
  //   .filter(e => e.keyCode === keycode('Enter') && !allWhitespace.test(e.target.value))
  //   .map(e => {
  //     const value = e.target.value.trim()
  //     e.target.value = ''
  //     return value
  //   })

  attachEventStream(action$, newTodo$.map(createTodo))

  return <input class="new-todo" placeholder="What needs to be done?" autofocus
    e:keypress={keyPress$}
    />
}

function ToggleAllCheckbox({
  properties: {
    id,
    action$
  },
  createEventStream,
  attachEventStream
}) {
  const change$ = createEventStream()

  attachEventStream(
    action$,
    change$.map(e => toggleAll(e.target.checked))
  )

  return (
    <div>
      <input id={id} class="toggle-all" type="checkbox" e:changed={change$} />
      <label for={id}>Mark all as complete</label>
    </div>
  )
}

function TodoList({
  properties: { todos$, action$ }
}) {
  return (
    <ul class="todo-list">
      {todos$.map(todos => {
        return todos.map(
          (todo, i) => <Todo todo={todo} index={i} action$={action$} />
        )
      })}
    </ul>
  )
}

function Todo({
  // TODO: Implement and use object spread
  properties: {
    todo,
    action$
  },
  createEventStream,
  attachEventStream
}) {
  // TODO: Handle destroy
  // TODO: Handle edit

  // TODO: Handle edit, destruction, and completion with event delegation

  const { id, text, completed } = todo

  // TODO: Consider action-based architecture
  const destroyClick$ = createEventStream()
  attachEventStream(action$, destroyClick$.map(() => destroyTodo(id)))

  const completedChange$ = createEventStream()
  attachEventStream(action$, completedChange$.map(
    e => toggleTodo(id, e.target.checked)
  ))

  const doubleClick$ = createEventStream()
  const blur$ = createEventStream()
  const keyDown$ = createEventStream()
  const enterKeyDown$ = keyDown$.filter(e => e.keyCode === keycode('Enter'))
  const abortEdit$ = keyDown$.filter(e => e.keyCode === keycode('Escape'))

  const commitEdit$ = merge(blur$, enterKeyDown$).map(e => e.target.value)
  attachEventStream(action$, commitEdit$.map(text => editTodo(id, text)))

  const editing$ = merge(
      doubleClick$.map(() => true),
      merge(commitEdit$, abortEdit$).map(() => false)
    )
    .skipRepeats()
    .startWith(false)

  const class$ = editing$
    .map(editing => {
      const editingClass = editing ? 'editing' : ''
      const completedClass = completed ? 'completed' : ''
      return `${editingClass} ${completedClass}`
    })

  return (
    <li class={class$}
      e:dblclick={doubleClick$}
      >
      <div class="view">
        <input class="toggle" type="checkbox" checked={!!completed}
          e:change={completedChange$}
          />
        <label>{text}</label>
        <button class="destroy"
          e:click={destroyClick$}
          />
      </div>
      <input class="edit" value={text}
        e:blur={blur$}
        e:keydown={keyDown$}
        />
    </li>
  )
}

function TodosFooter({
  properties: {
    allTodos$,
    action$
  }
}) {
  const activeCount$ = allTodos$.filter(todo => !todo.completed).map(todos => todos.length)
  const footerStyle$ = allTodos$.map(conditionalVisibility(allTodos => allTodos.length > 0))

  return (
    <footer class="footer" style={footerStyle$}>
      <span class="todo-count"><strong>{activeCount$}</strong> items left</span>
      <ul class="filters">
        <li>
          <a class="selected" href="#/">All</a>
        </li>
        <li>
          <a href="#/active">Active</a>
        </li>
        <li>
          <a href="#/completed">Completed</a>
        </li>
      </ul>
      <ClearCompletedButton action$={action$} />
    </footer>
  )
}

function ClearCompletedButton({
  properties: { action$ },
  createEventStream,
  attachEventStream
}) {
  const click$ = createEventStream()
  attachEventStream(action$, click$.map(() => destroyAllCompleted()))

  return <button class="clear-completed"
    e:click={click$}
    >Clear completed</button>
}

function conditionalVisibility(predicate) {
  return x => predicate(x) ? '': 'display: none'
}
