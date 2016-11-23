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

mount(
  streamDom(
    h => h(App, { nodeName: 'app', props: { todos$, locationHash$, filterRoutes, filter$ } }),
    nodes => {
      nodes.app.events.action.observe(a => action$.next(a))
    }
  ),
  document.body
)

const appProps = { todos$, locationHash$, filterRoutes, filter$ }
mount(
  streamDom(
    h => <App node-name="app" {...appProps} />,
    nodes => {
      nodes.app.action.observe(a => action$.next(a))
    }
  ),
  document.body
)
