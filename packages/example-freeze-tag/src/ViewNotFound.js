import streamDom from 'stream-dom'

export function ViewNotFound({ properties: { activeRoute } }) {
  return (
    <div>
      <h1>Route not found: {activeRoute.name}</h1>
      <div>
        params: {JSON.stringify(activeRoute.params)}
      </div>
    </div>
  )
}
