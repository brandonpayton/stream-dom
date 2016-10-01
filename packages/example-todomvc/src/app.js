import { domEvent } from '@most/dom-event'
import { createEventStream } from 'stream-dom'

import { App } from './view/App'
import { streamDom } from './stream-dom'
import { todoStore } from './model/todo-store'

const action$ = createEventStream()
const todos$ = todoStore('stream-dom-todomvc-todos', action$)

const locationHash$ = domEvent('hashchange', window)
  .map(() => location.hash)
  .startWith(location.hash)

const filterRoutes = {
  hashDefault: '#/',
  hashShowActive: '#/active',
  hashShowCompleted: '#/completed'
}
location.hash = filterRoutes.hashDefault
const filter$ = locationHash$.map(hash => (
  hash === filterRoutes.hashShowActive ? todo => !todo.completed :
  hash === filterRoutes.hashShowCompleted ? todo => todo.completed :
  () => true
))

streamDom.mount(
  <App todos$={todos$} e:todoAction={action$}
    locationHash$={locationHash$} filterRoutes={filterRoutes} filter$={filter$}
    />,
  document.body
)
