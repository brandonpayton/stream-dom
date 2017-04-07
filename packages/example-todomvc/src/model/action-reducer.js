export function create (reducerMap) {
  return (model, action) => action.type in reducerMap
    ? reducerMap[action.type](model, action)
    : model
}
