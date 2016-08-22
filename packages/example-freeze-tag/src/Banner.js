import { element, text } from 'stream-dom'

export function Banner({
  properties: { routes, activeRoute$, createRouteHref }
}) {
  const createTab = tabName => element('span', {
    attributes: {
      class: activeRoute$
        .map(({name}) => tabName === name)
        .skipRepeats()
        .map(isActive => isActive ? 'tab active' : 'tab')
    },
    children: [
      element('a', {
        attributes: { href: createRouteHref({ name: tabName }) },
        children: [ text(tabName) ]
      }),
      // TODO: DEV: Update styles so this padding is not needed
      text(' ')
    ]
  })

  return element('div', {
    attributes: { class: 'banner' },
    children: routes.map(createTab)
  })
}
