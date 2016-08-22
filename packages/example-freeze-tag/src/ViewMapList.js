import streamDom from 'stream-dom'

export function ViewMapList({ properties: { activeRoute } }) {
  return (
    <div>
      <h1>Map List</h1>
      <div>
        params: {JSON.stringify(activeRoute.params)}
      </div>
    </div>
  )
}
