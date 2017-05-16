import { domEvent } from '@most/dom-event'
import { h, mount, component, types } from 'stream-dom'

import { App } from './view/App'
import { todoStore } from './model/todo-store'

const locationHash$ = domEvent(`hashchange`, window)
    .map(() => location.hash)
    .startWith(location.hash)

const filterRoutes = {
  hashDefault: `#/`,
  hashShowActive: `#/active`,
  hashShowCompleted: `#/completed`
}
location.hash = filterRoutes.hashDefault
const filter$ = locationHash$.map(hash => (
  hash === filterRoutes.hashShowActive ? todo => !todo.completed :
  hash === filterRoutes.hashShowCompleted ? todo => todo.completed :
  () => true
))

const AppRoot = component({
  input: {
    action$: types.feedback
  },
  structure: inputs => {
    const { action$ } = inputs
    const todos$ = todoStore(
      `stream-dom-todomvc-todos`,
      action$.tap(a => console.log(`Action: `, a))
    )

    return h(App, {
      nodeName: `app`,
      input: { todos$, locationHash$, filterRoutes, filter$ }
    })
  },
  output: ({ app }) => ({
    action$: app.action$
  })
})

mount(document.body, null, h(AppRoot))
