import most from 'most'
import queryString from './queryString'
import globalWindow from 'global/window'

export default function createHashRouter({window = globalWindow} = {}) {
  let hash$ = most
    .fromEvent('hashchange', window)
    .map(() => location.hash)
    .startWith(location.hash)

  // TODO: Simple typed params

  return {
    activeRoute$: hash$.map(hash => {
      let match = hash.match(/#([^?]*)(?:\??(.*))/) || []
      let routeName = match[1] || ''
      let routeParams = match[2] ? queryString.parse(match[2]) : {}

      return {
        name: routeName,
        params: routeParams
      }
    }),
    createRouteHref: ({ name, args }) => {
      let encodedName = encodeURIComponent(name)
      let encodedParams = args ? `?${encodeURIComponent(queryString.stringify(args))}` : ''
      return `#${encodedName}${encodedParams}`
    }
  }
}
