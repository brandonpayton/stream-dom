export function localStorageStream ({
  key,
  action$,
  actionReducer,
  defaultValue
}) {
  const storedValue = tryParse(localStorage.getItem(key))
  const initialValue = storedValue === null ? defaultValue : storedValue

  return action$
    .scan(actionReducer, initialValue)
    .skipRepeats()
    .tap(value => localStorage.setItem(key, JSON.stringify(value)))
}

function tryParse (str) {
  try {
    return JSON.parse(str)
  } catch (err) {
    return null
  }
}
