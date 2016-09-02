export class Point2 {
  constructor({ x, y }) {
    this.x = x
    this.y = y
  }

  map(f) {
    return new Point2({
      x: f(this.x),
      y: f(this.y)
    })
  }
}
