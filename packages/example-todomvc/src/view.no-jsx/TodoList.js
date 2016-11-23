import { merge } from 'most'
import { subject } from 'most-subject'

import { streamDom } from '../stream-dom'
import { findSelectorTarget } from './findSelectorTarget'
import * as actions from '../model/todo-actions'

export function TodoList({ todos$ }) {
  // Using a subject to resolve a circular dependency on editing ID
  const editingId$ = subject()

  const todoUi = ({ id, text, completed = false }) => {
    return component(h => h('li.todo', {
      attrs: { id, completed },
      classes: { editing: editingId$.map(editingId => id === editingId) }
    }, [
      h('div.view', [
        h('input.toggle', {
          attrs: { type: 'checkbox', checked: completed }
        }),
        h('label', [ text ]),
        h('button.destroy')
      ]),
      h('input.edit', { attrs: { value: text } })
    ]))
  }

  return component(
    h => h('ul.todo-list', { nodeName: 'root' }, [
      todos$.map(todos => todos.map(todoUi))
    ]),
    nodes => {
      const { root } = nodes

      const findTodoSelectorTarget = findSelectorTarget('.todo')

      const beginEdit$ = root.on('dblclick')
        .filter(e => e.target.matches('.todo label'))
        .filter(findTodoSelectorTarget)

      const editFieldKeyDown$ = root.on('keydown')
        .filter(e => e.target.matches('.edit'))
        .filter(findTodoSelectorTarget)
        .multicast()

      const commitEdit$ = editFieldKeyDown$
        .filter(e => e.key === 'Enter')
        .multicast()

      const abortEdit$ = merge(
        editFieldKeyDown$.filter(e => e.key === 'Escape'),
        root.on('blur', { capture: true })
          .filter(e => e.target.matches('.edit'))
      )

      merge(
        beginEdit$.map(e => e.selectorTarget.id),
        abortEdit$.constant(null)
      )
      .observe(editingId => {
        editingId$.next(editingId)

        if (editingId !== null) {
          const inputNode = document.querySelector(`#${editingId} .edit`)
          inputNode.focus()
          inputNode.selectionStart = inputNode.value.length
        }
      })

      return {
        edit$: commitEdit$.map(e => {
          const { id } = e.selectorTarget
          const trimmedText = e.target.value.trim()
          return trimmedText.length === 0 ? actions.destroy(id) : actions.edit(id, trimmedText)
        }),
        toggle$: root.on('change')
          .filter(e => e.target.matches('.toggle'))
          .filter(findTodoSelectorTarget)
          .map(e => actions.toggle(e.selectorTarget.id, e.target.checked)),
        destroy$: root.on('click')
          .filter(findTodoSelectorTarget)
          .filter(e => e.target.matches('.destroy'))
          .map(e => actions.destroy(e.selectorTarget.id))
      }
    }
  )
}
