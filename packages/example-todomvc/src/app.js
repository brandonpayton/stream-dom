import { AppView } from './AppView'
import { streamDom } from './stream-dom'
import { createEventStream } from 'stream-dom'

import { todoStore } from './model/todo-store'

const action$ = createEventStream()
const todos$ = todoStore('stream-dom-todomvc-todos', action$)

// TODO: Move action$ to event listener
streamDom.mount(<AppView todos$={todos$} action$={action$} />, document.body)
