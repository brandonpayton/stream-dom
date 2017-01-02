import { combine, merge } from 'most'

import { streamDom } from '../stream-dom'
import * as actions from '../model/todo-actions'
import { TodoList } from './TodoList'

export function App ({
  todos$: allTodos$,
  locationHash$,
  filter$,
  filterRoutes: {
    hashShowActive,
    hashShowCompleted,
    hashDefault
  }
}) {
  const todos$ = combine(
    (allTodos, filter) => allTodos.filter(filter),
    allTodos$,
    filter$
  )

  const activeCount$ = allTodos$.map(
    todos => todos.reduce((count, t) => count + (t.completed ? 0 : 1), 0)
  )

  return component(
    h => (
      <div>
        <section class="todo-app">
          <header class="header">
            <h1>todos</h1>
            <input node-name="newTodo" class="new-todo" placeholder="What needs to be done?" autofocus={true} />
          </header>,
          <section class="main">
            <input node-name="toggleAll" id="toggle-all" class="toggle-all" type="checkbox" />
            <label for="toggle-all">Mark all as complete</label>
            <TodoList node-name="todoList" todos$={todos$} />
          </section>
          <footer class="footer" style={allTodos$.map(todos => todos.length === 0 ? 'display: none' : '')}>
            <span class="todo-count"><strong>{activeCount$}</strong> items left</span>
            <ul class="filters">
              <FilterListItem hash={hashDefault} locationHash$={locationHash$} label="All" />
              <FilterListItem hash={hashShowActive} locationHash$={locationHash$} label="Active" />
              <FilterListItem hash={hashShowCompleted} locationHash$={locationHash$} label="Completed" />
            </ul>
            <button class="clear-completed">Clear completed</button>
          </footer>
        </section>
        <footer class="info">
          <p>Double-click to edit a todo</p>
          <p>Created by <a href="https://github.com/brandonpayton">Brandon Payton</a></p>
        </footer>
      </div>
    ),
    nodes => {
      const { newTodo, toggleAll, clearCompleted, todoList } = nodes

      return {
        action$: merge(
          newTodo.events.keypress
            .filter(e => e.key === 'Enter')
            .map(e => {
              const text = e.target.value.trim()
              e.target.value = ''
              return text
            })
            .filter(text => text.length > 0)
            .map(text => actions.create(text)),
          toggleAll.events.change
            .map(e => actions.toggleAll(e.target.checked)),
          clearCompleted.events.click
            .map(() => actions.destroyAllCompleted()),
          todoList.edit$,
          todoList.toggle$,
          todoList.destroy$
        )
      }
    }
  )
}

function FilterListItem({ hash, locationHash$, label }) {
  const class$ = locationHash$.map(
    currentHash => hash === currentHash ? 'selected' : ''
  )

  return h => <a href={hash} class={class$}>{label}</a>
}
