import { domEvent } from '@most/dom-event'
import { createEventStream } from 'stream-dom'

import { App } from './view/App'
import { streamDom } from './stream-dom'
import { todoStore } from './model/todo-store'

// TODO: Fix style-loader config to avoid referencing node_modules
import 'style!raw!../node_modules/todomvc-common/base.css'
import 'style!raw!../node_modules/todomvc-app-css/index.css'

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
