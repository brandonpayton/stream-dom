import Immutable from 'immutable';
import Point2D from 'kld-affine/lib/Point2D';
import wrapToRange from './wrap-to-range';

export const tileTypes = {
  EMPTY_TILE: 0,
  WALLED_TILE: 1
}

export default class Map {
  constructor({ numColumns, numRows, tiles }) {
    function createTileList(numColumns, numRows) {
      let defaultColumn = Immutable.List.of(new Array(numColumns).fill(tileTypes.EMPTY_TILE));
      return new Immutable.List(new Array(numRows).fill(defaultColumn));
    }

    this.numColumns = numColumns;
    this.numRows = numRows;
    this.tiles = tiles
      ? Immutable.fromJS(tiles)
      : createTileList(numColumns, numRows);
  }

  updateTiles({ rectangle: { x, y, width, height }, tileType }) {
    let updatedTiles = this.tiles;

    for(let column = x, lastColumn = x + width - 1; column <= lastColumn; ++column) {
      for (let row = y, lastRow = y + height - 1; row <= lastRow; ++row) {
        // TODO: Is it more efficient to make a mutable version, update, and return an immutable version?
        updatedTiles = updatedTiles.set(column, updatedTiles.get(column).set(row, tileType));
      }
    }

    return Object.assign(
      Object.create(Object.getPrototypeOf(this)),
      this,
      { tiles: updatedTiles }
    );
  }

  wrapPosition(position) {
    return new Point2D(
      wrapToRange(position.x, 0, this.numColumns),
      wrapToRange(position.y, 0, this.numRows)
    );
  }

  toJSON() {
    return {
      numColumns: this.numColumns,
      numRows: this.numRows,
      tiles: this.tiles.toJSON()
    };
  }
}