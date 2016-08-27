import streamDom from './lib/stream-dom'

export function Banner({
  properties: { routes, activeRoute$, createRouteHref }
}) {
  const createTab = tabName => {
    const labelClass$ = activeRoute$
      .map(({name}) => tabName === name)
      .skipRepeats()
      .map(isActive => isActive ? 'tab active' : 'tab')

    return (
      <span class={labelClass$}>
        <a href={createRouteHref({ name: tabName })}>{tabName}</a>
      </span>
    )
  }

  return (
    <div class="banner">
      {routes.map(createTab)}
    </div>
  )
}
