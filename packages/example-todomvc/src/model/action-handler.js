export function actionHandler(handlerMap) {
  return (model, action) => {
    if (action.type in handlerMap) {
      return handlerMap[action.type](model, action)
    }
    else if ('default' in handlerMap) {
      return handlerMap.default(model, action)
    }
    else {
      return model
    }
  }
}
