import { localStorageStream } from './local-storage-stream'
import { createEventStream, attachEventStream } from 'stream-dom'
import assign from 'lodash.assign'
import uuid from 'uuid'

import {
  TODO_CREATE,
  TODO_DESTROY,
  TODO_EDIT,
  TODO_TOGGLE,
  TODO_TOGGLE_ALL,
  TODO_DESTROY_ALL_COMPLETED
} from './todo-actions'

import { actionHandler } from './action-handler'

export function todoStore(key, action$) {
  const updatedTodos$ = createEventStream()
  const todos$ = localStorageStream(key, updatedTodos$, [])

  attachEventStream(
    updatedTodos$,
    action$.sample(
      (todos, action) => handleAction(todos, action),
      todos$, action$
    )
  )

  return todos$
}

const handleAction = actionHandler({
  [TODO_CREATE]: (todos, action) => todos.concat({
    id: uuid.v1(),
    text: action.text,
    completed: false
  }),
  [TODO_EDIT]: (todos, action) => {
    const index = findTodo(todos, action.id)
    const updatedTodos = todos.slice()
    updatedTodos.splice(index, 1, assign({}, todos[index], { text: action.text }))
    return updatedTodos
  },
  [TODO_DESTROY]: (todos, action) => {
    const index = findTodo(todos, action.id)
    const updatedTodos = todos.slice()
    updatedTodos.splice(index, 1)
    return updatedTodos
  },

  [TODO_TOGGLE]: (todos, action) => {
    const index = findTodo(todos, action.id)
    const updatedTodos = todos.slice()
    updatedTodos.splice(index, 1, assign({}, todos[index], { completed: action.completed }))
    return updatedTodos
  },

  [TODO_TOGGLE_ALL]: (todos, action) => {
    return todos.map(todo => assign({}, todo, { completed: action.completed }))
  },

  [TODO_DESTROY_ALL_COMPLETED]: todos => {
    return todos.filter(todo => !todo.completed)
  },
  default: (_, action) => {
    throw new Error(`Unhandled action '${action.type}'`)
  }
})

function findTodo(todos, id) {
  for (let i = 0; i < todos.length; ++i) {
    if (todos[i].id === id) {
      return i
    }
  }

  throw new Error(`Unable to find TODO with id '${id}'`)
}
