import { merge } from 'most'

export function createLocalStorageStreamMap(keyStreamMap) {
  const keys = Object.keys(keyStreamMap)

  const keyStreams = keys.map(key => keyStreamMap[key].map(value => [ key, value ]))
  const initialValue = keys.reduce(
    (initialValue, key) => initialValue[key] = JSON.parse(localStorage.get(key)),
    {}
  )

  return merge(...keyStreams)
    .tap(([ key, value ]) => localStorage.setItem(key, JSON.stringify(value)))
    .scan((currentValue, [ key, value ]) => {
      return Object.assign({}, currentValue, { [key]: value })
    }, initialValue)
}

export function createLocalStorageStream({
  key,
  update$,
  defaultValue = null
}) {
  const initialValue = JSON.parse(localStorage.getItem(key))
  return update$
    .tap(value => localStorage.setItem(key, JSON.stringify(value)))
    .startWith(initialValue !== null ? initialValue : defaultValue)
}
