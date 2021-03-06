import { combine, merge } from 'most'
import { domEvent } from '@most/dom-event'
import classnames from 'classnames'

import { h, component, types } from 'stream-dom'
import * as actions from '../model/todo-actions'
import { TodoList } from './TodoList'

const input = {
  todos$: types.observable,
  locationHash$: types.observable,
  filter$: types.observable,
  filterRoutes: types.object
}

function structure ({
  todos$: allTodos$,
  locationHash$,
  filter$,
  filterRoutes: {
    hashShowActive,
    hashShowCompleted,
    hashDefault
  }
}) {
  // TODO: Rename to filteredTodos$
  const todos$ = combine(
    (allTodos, filter) => allTodos.filter(filter),
    allTodos$,
    filter$
  )

  const activeCount$ = allTodos$.map(
    todos => todos.reduce((count, t) => count + (t.completed ? 0 : 1), 0)
  )
  const completedCount$ = allTodos$.map(
    todos => todos.reduce((count, t) => count + (t.completed ? 1 : 0), 0)
  )

  const footerStyle$ = allTodos$.map(
    todos => todos.length === 0 ? `display: none` : ``
  )
  const clearCompletedStyle$ = completedCount$.map(
    completedCount => completedCount === 0 ? `display: none` : ``
  )

  return (<div>
    <section class="todoapp">
      <header class="header">
        <h1>todos</h1>
        <input node-name="newTodo"
          class="new-todo"
          placeholder="What needs to be done?"
          autofocus/>
      </header>
      <section class="main">
        <input node-name="toggleAll"
          id="toggle-all" type="checkbox" class="toggle-all"/>
        <label for="toggle-all">Mark all as complete</label>
        <TodoList node-name="todoList" todos$={todos$} />
      </section>
      <footer class="footer" style={footerStyle$}>
        <span class="todo-count">
          <strong>{activeCount$} items left</strong>
        </span>
        <ul class="filters">
          <FilterListItem hash={hashDefault} locationHash$={locationHash$} label="All" />
          <FilterListItem hash={hashShowActive} locationHash$={locationHash$} label="Active" />
          <FilterListItem hash={hashShowCompleted} locationHash$={locationHash$} label="Completed" />
        </ul>
        <button node-name="clearCompleted"
          type="button"
          class="clear-completed"
          style={clearCompletedStyle$}>Clear Completed</button>
      </footer>
    </section>
    <footer class="info">
      <p>Double-click to edit a todo</p>
      <p>Created by <a href="https://github.com/brandonpayton">Brandon Payton</a></p>
    </footer>
  </div>)
}

function output ({
  newTodo,
  toggleAll,
  clearCompleted,
  todoList
}) {
  const newTodo$ = domEvent(`keypress`, newTodo)
    .filter(e => e.key === `Enter`)
    .map(e => {
      const text = e.target.value.trim()
      e.target.value = ``
      return text
    })
    .filter(text => text.length > 0)
    .map(text => actions.create(text))

  const toggleAll$ = domEvent(`change`, toggleAll).map(
    e => actions.toggleAll(e.target.checked)
  )

  const clearCompleted$ = domEvent(`click`, clearCompleted).map(
    () => actions.destroyAllCompleted()
  )

  return {
    action$: merge(newTodo$, toggleAll$, clearCompleted$, todoList.action$)
  }
}

export const App = component({ input, structure, output })

const FilterListItem = component({
  input: {
    hash: types.string,
    locationHash$: types.observable,
    label: types.string
  },
  structure: ({ hash, locationHash$, label }) => {
    const class$ = locationHash$.map(currentHash => classnames({
      selected: hash === currentHash
    }))

    return (<li>
      <a href={hash} class={class$}>{label}</a>
    </li>)
  }
})
