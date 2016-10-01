import { combine } from 'most'
import keycode from 'keycode'

import { streamDom } from '../stream-dom'
import * as actions from '../model/todo-actions'
import { TodoList } from './TodoList'

export function App({
  properties: {
    todos$: allTodos$,
    locationHash$,
    filter$,
    filterRoutes: {
      hashShowActive,
      hashShowCompleted,
      hashDefault
    }
  },
  eventStreams: {
    todoAction
  },
  createEventStream,
  attachEventStream
}) {
  const todos$ = combine(
    (allTodos, filter) => allTodos.filter(filter),
    allTodos$,
    filter$
  )

  const keyPressNewTodo$ = createEventStream()
  const newTodoEnter$ = keyPressNewTodo$.filter(e => e.keyCode === keycode('Enter'))
  attachEventStream(todoAction, newTodoEnter$
    .map(e => e.target.value.trim())
    .filter(text => text.length > 0)
    .map(text => actions.create(text))
  )
  newTodoEnter$.observe(e => e.target.value = '')

  const changeToggleAll$ = createEventStream()
  attachEventStream(todoAction, changeToggleAll$.map(e => actions.toggleAll(e.target.checked)))

  const activeCount$ = allTodos$.filter(todo => !todo.completed).map(todos => todos.length)
  const footerStyle$ = allTodos$.map(conditionalVisibility(allTodos => allTodos.length > 0))

  const clickClearCompleted$ = createEventStream()
  attachEventStream(todoAction, clickClearCompleted$.map(() => actions.destroyAllCompleted()))

  return (
    <div>
      <section class="todoapp">
        <header class="header">
          <h1>todos</h1>
          <input class="new-todo" placeholder="What needs to be done?" autofocus
            e:keypress={keyPressNewTodo$}
            />
        </header>
        <section class="main">
          <input id="toggle-all" class="toggle-all" type="checkbox" e:change={changeToggleAll$} />
          <label for="toggle-all">Mark all as complete</label>
          <TodoList todos$={todos$} e:todoAction={todoAction} />
        </section>
        <footer class="footer" style={footerStyle$}>
          <span class="todo-count"><strong>{activeCount$}</strong> items left</span>
          <ul class="filters">
            <li>
              <a href={hashDefault} class={locationHash$.map(selectedHash(hashDefault))}>All</a>
            </li>
            <li>
              <a href={hashShowActive} class={locationHash$.map(selectedHash(hashShowActive))}>Active</a>
            </li>
            <li>
              <a href={hashShowCompleted} class={locationHash$.map(selectedHash(hashShowCompleted))}>Completed</a>
            </li>
          </ul>
          <button class="clear-completed" e:click={clickClearCompleted$}>Clear completed</button>
        </footer>
      </section>
      <footer class="info">
        <p>Double-click to edit a todo</p>
        <p>Created by <a href="https://github.com/brandonpayton">Brandon Payton</a></p>
      </footer>
    </div>
  )
}

function conditionalVisibility(predicate) {
  return x => predicate(x) ? '': 'display: none'
}

function selectedHash(hash) {
  return selectedHash => selectedHash === hash ? 'selected' : ''
}
