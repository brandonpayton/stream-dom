import { combine, merge } from 'most'

import { h, component, propTypes } from 'stream-dom'
import * as actions from '../model/todo-actions'
import { TodoList } from './TodoList'

const inputs = {
  todos$: propTypes.stream,
  locationHash$: propTypes.stream,
  filter$: propTypes.stream,
  filterRoutes: propTypes.object
}

function declareStructure ({
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

  return h('div', [
    h('section.todo-app', [
      h('header.header', [
        h('h1', [ 'todos' ]),
        h('input.new-todo', {
          nodeName: 'newTodo',
          attrs: {
            placeholder: 'What needs to be done?',
            autofocus: true
          }
        })
      ]),
      h('section.main', [
        h('input.toggle-all#toggle-all', {
          nodeName: 'toggleAll',
          attrs: { type: 'checkbox' }
        }),
        h('label', {
          attrs: { for: 'toggle-all' }
        }, [
          'Mark all as complete'
        ]),
        h(TodoList, {
          nodeName: 'todoList',
          props: { todos$ }
        })
      ]),
      h('footer.footer', {
        style: {
          display: allTodos$.map(todos => todos.length === 0 ? 'none' : '')
        }
      }, [
        h('span.todo-count', [
          h('strong', [ activeCount$ ]),
          ' items left'
        ]),
        h('ul.filters', [
          h('li', [
            h(FilterListItem, { props: { hash: hashDefault, locationHash$, label: 'All' } }),
            h(FilterListItem, { props: { hash: hashShowActive, locationHash$, label: 'Active' } }),
            h(FilterListItem, { props: { hash: hashShowCompleted, locationHash$, label: 'Completed' } })
          ])
        ]),
        h('button.clear-completed', {
          nodeName: 'clearCompleted'
        }, [ 'Clear completed' ])
      ])
    ]),
    h('footer.info', [
      h('p', [ 'Double-click to edit a todo' ]),
      h('p', [
        'Created by ',
        h('a', { attrs: { href: 'https://github.com/brandonpayton' } }, [ 'Brandon Payton' ])
      ])
    ])
  ])
}

function declareOutput ({
  newTodo,
  toggleAll,
  clearCompleted,
  todoList
}) {
  return {
    action$: merge(
      newTodo.on('keypress')
        .filter(e => e.key === 'Enter')
        .map(e => {
          const text = e.target.value.trim()
          e.target.value = ''
          return text
        })
        .filter(text => text.length > 0)
        .map(text => actions.create(text)),
      toggleAll.on('change')
        .map(e => actions.toggleAll(e.target.checked)),
      clearCompleted.on('click')
        .map(() => actions.destroyAllCompleted()),
      todoList.edit$,
      todoList.toggle$,
      todoList.destroy$
    )
  }
}

export const App = component(inputs, declareStructure, declareOutput)

const FilterListItem = component(
  {
    hash: propTypes.string,
    locationHash$: propTypes.stream,
    label: propTypes.string
  },
  ({ hash, locationHash$, label }) => h('a', {
    attrs: { href: hash },
    classes: {
      selected: locationHash$.map(currentHash => hash === currentHash)
    }
  }, [ label ])
)
