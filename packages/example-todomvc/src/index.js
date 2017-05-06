import { domEvent } from '@most/dom-event'
import { declare, mount, component, propTypes } from 'stream-dom'

import { App } from './view/App'
import { todoStore } from './model/todo-store'

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

const AppRoot = component({
  input: {
    action$: propTypes.feedback
  },
  structure: inputs => {
    const { action$ } = inputs
    const todos$ = todoStore('stream-dom-todomvc-todos', action$)

    return declare(App, {
      nodeName: 'app',
      props: { todos$, locationHash$, filterRoutes, filter$ }
    })
  },
  output: ({ app }) => ({
    action$: app.action$
  })
})

mount(document.body, null, declare(AppRoot))
