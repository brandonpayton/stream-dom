import streamDom from 'stream-dom'
import {Point2} from './lib/Point2'
import {tileTypes} from './lib/Map'
import {combine, just} from 'most'


export default function MapCanvas({
  properties: { map, tileType$ },
  createEventStream
}) {
  // TODO: Switch from "Point" to "Position"
  function eventToPoint(event) {
    return new Point2({
      x: Math.floor(event.offsetX / event.target.offsetWidth * map.numColumns),
      y: Math.floor(event.offsetY / event.target.offsetHeight * map.numRows)
    })
  }

  function toRectangle(point1, point2) {
    return {
      x: Math.min(point1.x, point2.x),
      y: Math.min(point1.y, point2.y),
      width: Math.abs(point2.x - point1.x) + 1,
      height: Math.abs(point2.y - point1.y) + 1
    }
  }

  const mount$ = createEventStream()
  const mouseDown$ = createEventStream()
  const mouseMove$ = createEventStream()
  const mouseUp$ = createEventStream()

  mount$.observe(({ target: domNode }) => {
    const mapCanvasNode = domNode.querySelector('[data-id=map-canvas]')
    const mapCanvas2d = mapCanvasNode.getContext('2d')
    const drawingCanvasNode = domNode.querySelector('[data-id=drawing-canvas]')
    const drawingCanvas2d = drawingCanvasNode.getContext('2d')

    const tileWidth = mapCanvasNode.width / map.numColumns
    const tileHeight = mapCanvasNode.height / map.numRows

    mapCanvas2d.fillStyle = '#77ddff'
    drawingCanvas2d.fillStyle = 'rgba(128, 0, 128, 0.7)'

    const rectangle$$ = mouseDown$
      .map(eventToPoint)
      .map(startPoint => mouseMove$
        .map(eventToPoint)
        .map(endPoint => toRectangle(startPoint, endPoint))
        .until(mouseUp$)
      )
      .multicast()

    rectangle$$
      .chain(rectangle$ => rectangle$.concat(just(null)))
      .observe(r => {
        drawingCanvas2d.clearRect(0, 0, drawingCanvasNode.width, drawingCanvasNode.height)

        if (r) {
          drawingCanvas2d.fillRect(r.x * tileWidth, r.y * tileHeight, r.width * tileWidth, r.height * tileHeight)
        }
      })

    combine((...args) => args, rectangle$$.join(), tileType$)
      .sampleWith(mouseUp$)
      .scan((map, [ rectangle, tileType ]) => {
        return map.updateTiles({ rectangle, tileType })
      }, map)
      .observe(map => {
        mapCanvas2d.clearRect(0, 0, mapCanvasNode.width, mapCanvasNode.height)

        map.tiles.forEach((columnList, i) => {
          columnList.forEach((tile, j) => {
            if (tile === tileTypes.WALLED_TILE) {
              mapCanvas2d.fillRect(i * tileWidth, j * tileHeight, tileWidth, tileHeight)
            }
          })
        })
      })
  })

  return (
    <div style="position: relative" e:mount={mount$}>
      <canvas data-id="map-canvas" width="400" height="400" style="background: black" />
      <canvas data-id="drawing-canvas" width="400" height="400" style="position: absolute; top: 0; left: 0"
        e:mousedown={mouseDown$}
        e:mousemove={mouseMove$}
        e:mouseup={mouseUp$}
        />
    </div>
  )
}
