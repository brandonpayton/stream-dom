import { combine, merge } from 'most'
import { domEvent } from '@most/dom-event'
import assign from 'lodash.assign'
import keycode from 'keycode'
import { createLocalStorageStream } from './most-local-storage'
import { streamDom } from './stream-dom'

export function AppView({
  createEventStream
}) {
  const updateTodos$ = createEventStream()
  const allTodos$ = createLocalStorageStream({
    key: 'todomvc-todos',
    update$: updateTodos$,
    defaultValue: []
  })

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
          <NewTodoTextBox todos$={todos$} updateTodos$={updateTodos$} />
        </header>
        // This section should be hidden by default and shown when there are todos
        <section class="main">
          <ToggleAllCheckbox id="toggle-all" todos$={todos$} updateTodos$={updateTodos$} />
          <TodoList todos$={todos$} updateTodos$={updateTodos$} />
        </section>
        <TodosFooter todos$={todos$} updateTodos$={updateTodos$} />
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
    todos$,
    updateTodos$
  },
  createEventStream,
  attachEventStream
}) {
  const keyPress$ = createEventStream()
  const enterKeyPress$ = keyPress$.filter(e => e.keyCode === keycode('Enter'))
  attachEventStream(
    updateTodos$,
    combine(
      (todos, text) => todos.concat({ text, completed: false }),
      todos$,
      enterKeyPress$
        .map(e => e.target.value.trim())
        .filter(text => text.length > 0)
    )
  )

  return <input class="new-todo" placeholder="What needs to be done?" autofocus
    e:keypress={keyPress$}
    />
}

function ToggleAllCheckbox({
  properties: {
    id,
    todos$,
    updateTodos$
  },
  createEventStream,
  attachEventStream
}) {
  const change$ = createEventStream()

  attachEventStream(
    updateTodos$,
    combine(
      (todos, completed) => todos.map(todo => Object.assign({}, todo, { completed })),
      todos$,
      change$.map(e => e.target.checked)
    )
  )

  return (
    <div>
      <input id={id} class="toggle-all" type="checkbox" e:changed={change$} />
      <label for={id}>Mark all as complete</label>
    </div>
  )
}

function TodoList({
  properties: { todos$, updateTodos$ }
}) {
  return (
    <ul class="todo-list">
      {todos$.map(
        (todo, i) => <Todo todo={todo} index={i} todos$={todos$} updateTodos$={updateTodos$} />
      )}
    </ul>
  )
}

function Todo({
  // TODO: Implement and use object spread
  properties: {
    todo,
    index,
    todos$,
    updateTodos$
  },
  createEventStream,
  attachEventStream
}) {
  // TODO: Handle destroy
  // TODO: Handle edit

  // TODO: Handle edit, destruction, and completion with event delegation

  const { text, completed } = todo

  // TODO: Consider action-based architecture
  const destroyClick$ = createEventStream()
  attachEventStream(updateTodos$, combine(
    (todos, index) => todos.slice().splice(index, 1),
    todos$,
    destroyClick$.map(() => index)
  ))

  const completedChange$ = createEventStream()
  attachEventStream(updateTodos$, combine(
    (todos, completed) => {
      const newTodos = todos.slice()
      newTodos[index] =  assign({}, todo, { completed })
      return newTodos
    },
    todos$,
    completedChange$.map(e => e.target.checked)
  ))

  const doubleClick$ = createEventStream()
  const blur$ = createEventStream()
  const keyPress$ = createEventStream()
  const enterKeyPress$ = keyPress$.filter(e => e.keyCode === keycode('Enter'))
  const escapeKeyPress$ = keyPress$.filter(e => e.keyCode === keycode('Escape'))

  const commitEdit$ = merge(blur$, enterKeyPress$).map(e => e.target.value)
  const abortEdit$ = escapeKeyPress$.const()

  attachEventStream(updateTodos$, combine(
    (todos, text) => {
      const newTodos = todos.slice()
      const trimmedText = text.trim()
      if (trimmedText.length === 0) {
        newTodos.splice(index, 1)
      }
      else {
        newTodos[index] = assign({}, todo, { text })
      }
      return newTodos
    },
    todos$,
    commitEdit$
  ))

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
        e:keypress={keyPress$}
        />
    </li>
  )
}

function TodosFooter({
  properties: {
    todos$,
    updateTodos$
  }
}) {
  const footerStyle$ = todos$.map(conditionalVisibility(todos => todos.length > 0))

  return (
    <footer class="footer" style={footerStyle$}>
      // This should be `0 items left` by default
      <span class="todo-count"><strong>0</strong> item left</span>
      // Remove this if you don't implement routing
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
      <ClearCompletedButton todos$={todos$} updateTodos$={updateTodos$} />
    </footer>
  )
}

function ClearCompletedButton({
  properties: { todos$, updateTodos$ },
  createEventStream,
  attachEventStream
}) {
  const click$ = createEventStream()
  attachEventStream(
    updateTodos$,
    click$.sample(todos$).map(todos => todos.filter(todo => todo.completed))
  )

  return <button class="clear-completed"
    e:click={click$}
    >Clear completed</button>
}

function conditionalVisibility(predicate) {
  return x => predicate(x) ? '': 'display: none'
}
