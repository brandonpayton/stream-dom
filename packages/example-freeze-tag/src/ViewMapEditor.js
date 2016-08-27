import streamDom from './lib/stream-dom'
import MapCanvas from './MapCanvas'
import Map, {tileTypes} from './lib/Map'

export function ViewMapEditor({ properties: { activeRoute }, createEventStream }) {
  const map = new Map({ numRows: 30, numColumns: 30 })

  const change$ = createEventStream()

  const tileType$ = change$
    .tap(event => console.log(event))
    .filter(({ target }) =>
      target.matches('[name=tileType]') && target.checked
    )
    .map(({ target }) => Number(target.value))
    // TODO: DRY this with `startWith` and the corresponding `checked` attribute
    .startWith(tileTypes.WALLED_TILE)

  return (
    <div>
      <h1>Map Editor</h1>
      <div>
        params: {JSON.stringify(activeRoute.params)}
        <MapCanvas map={map} tileType$={tileType$} />
      </div>
      <form e:change={change$}>
        <label>
          <input type="radio" name="tileType" value={tileTypes.WALLED_TILE} checked />
          Add
        </label>
        <label>
          <input type="radio" name="tileType" value={tileTypes.EMPTY_TILE} />
          Remove
        </label>
      </form>
    </div>
  )
}
