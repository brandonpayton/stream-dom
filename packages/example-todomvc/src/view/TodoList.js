import { combine, merge } from 'most'
import { domEvent } from '@most/dom-event'
import classnames from 'classnames'

import { h, component, inputTypes, renderItemStreams } from 'stream-dom'
import { delegatedEvent } from './eventing'
import * as actions from '../model/todo-actions'


const TodoItem = component({
  input: {
    // TODO: Would a generic `value` type be appropriate?
    id: inputTypes.any,
    text: inputTypes.observable,
    completed: inputTypes.observable,
    editing: inputTypes.observable
  },

  structure: ({ id, text, completed, editing }) => {
    // TODO: startWith should probably be at parent level
    const class$ = editing.startWith(false).map(editing => classnames({
      todo: true,
      editing
    }))

    return (<li id={id} class={class$}>
      <div class="view">
        <input type="checkbox" checked={completed} class="toggle" />
        <label>{text}</label>
        <button type="button" class="destroy" />
      </div>
      <input node-name="textInput" class="edit" value={text} />
    </li>)
  },

  output: ({ textInput }, { editing }) => {
    // TODO: This abuses the output declaration. How to better declare these effects?
    editing.skipRepeats().observe(editing => {
      if (editing) {
        // HACK: Schedule focus because textInput isn't yet displayed
        // TODO: Explore declarative side-effect path, possibly input-structure-output-sideEffects
        setTimeout(() => {
          textInput.focus()
          textInput.selectionStart = textInput.value.length
        })
      }
    })
  }
})

export const TodoList = component({
  input: {
    todos$: inputTypes.observable,
    editingId$: inputTypes.feedback
  },

  structure: ({ todos$, editingId$ }) => (<ul node-name="root" class="todo-list">
    {renderItemStreams({
      identify: todo => todo.id,
      render: todo$ => <TodoItem
        id={todo$.map(t => t.id)}
        text={todo$.map(t => t.text)}
        completed={todo$.map(t => t.completed)}
        editing={combine(
          (todo, editingId) => todo.id === editingId,
          todo$,
          editingId$
        )}
      />
    }, todos$)}
  </ul>),

  output: namedNodes => {
    const { root } = namedNodes

    // TODO: Improve name
    const delegatedTodoEventTransform = delegatedEvent('.todo')

    const beginEdit$ = domEvent('dblclick', root)
      .filter(e => e.target.matches('.todo label'))
      .thru(delegatedTodoEventTransform)

    const editFieldKeyDown$ = domEvent('keydown', root)
      .filter(e => e.target.matches('.edit'))
      .thru(delegatedTodoEventTransform)
      .multicast()

    const commitEdit$ = editFieldKeyDown$
      .filter(e => e.key === 'Enter')
      .multicast()

    const abortEdit$ = merge(
      editFieldKeyDown$.filter(e => e.key === 'Escape'),
      domEvent('blur', root, { capture: true })
        .filter(e => e.target.matches('.edit'))
    )

    return {
      editingId$: merge(
        beginEdit$.map(e => e.selectorTarget.id),
        merge(commitEdit$, abortEdit$).constant(null)
      ),

      action$: merge(
        commitEdit$.map(e => {
          const { id } = e.selectorTarget
          const trimmedText = e.target.value.trim()
          return trimmedText.length === 0 ? actions.destroy(id) : actions.edit(id, trimmedText)
        }),
        domEvent('change', root)
          .filter(e => e.target.matches('.toggle'))
          .thru(delegatedTodoEventTransform)
          .map(e => actions.toggle(e.selectorTarget.id, e.target.checked)),
        domEvent('click', root)
          .thru(delegatedTodoEventTransform)
          .filter(e => e.target.matches('.destroy'))
          .map(e => actions.destroy(e.selectorTarget.id))
      )
    }
  }
})
