export const TODO_CREATE = `create`
export const TODO_DESTROY = `destroy`
export const TODO_EDIT = `edit`
export const TODO_TOGGLE = `toggle`
export const TODO_TOGGLE_ALL = `toggle-all`
export const TODO_DESTROY_ALL_COMPLETED = `destroy-all-completed`

export function create (text) {
  return {
    type: TODO_CREATE,
    text
  }
}

export function destroy (id) {
  return {
    type: TODO_DESTROY,
    id
  }
}

export function edit (id, text) {
  return {
    type: TODO_EDIT,
    id,
    text
  }
}

export function toggle (id, completed) {
  return {
    type: TODO_TOGGLE,
    id,
    completed
  }
}

export function toggleAll (completed) {
  return {
    type: TODO_TOGGLE_ALL,
    completed
  }
}

export function destroyAllCompleted () {
  return {
    type: TODO_DESTROY_ALL_COMPLETED
  }
}
