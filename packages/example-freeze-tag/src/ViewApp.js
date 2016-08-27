import streamDom from './lib/stream-dom'
import { Banner } from './Banner'
import { ViewMapEditor } from './ViewMapEditor'
import { ViewMapList } from './ViewMapList'
import { ViewNotFound } from './ViewNotFound'

import createHashRouter from './lib/createHashRouter'

export function ViewApp() {

  const { activeRoute$, createRouteHref } = createHashRouter()
  const views = {
    'edit': ViewMapEditor,
    'list': ViewMapList,
    '': ViewMapList
  }

  const activeView$ = activeRoute$.map(activeRoute => {
    const View = views[activeRoute.name] || ViewNotFound
    return [ <View activeRoute={activeRoute} /> ]
  })

  return (
    <div>
      <div class="bannerContainer">
        <Banner routes={Object.keys(views)} activeRoute$={activeRoute$} createRouteHref={createRouteHref} />
      </div>
      <div class="main">
        {activeView$}
      </div>
    </div>
  )
}
