export function localStorageStream(
  key,
  update$,
  defaultValue = null
) {
  const initialValue = tryParse(localStorage.getItem(key))
  return update$
    .skipRepeats()
    .tap(value => localStorage.setItem(key, JSON.stringify(value)))
    .startWith(initialValue !== null ? initialValue : defaultValue)
}

function tryParse(str) {
  try {
    return JSON.parse(str)
  }
  catch (err) {
    return null
  }
}
