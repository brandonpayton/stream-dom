suite(`streamDom`, function () {
  test(`prop maps to a stream of property values`)

  suite(`render`, function () {
    test(`text`)
    test(`element`)
    test(`component`)
  })

  suite(`renderItems`, function () {
    test(`replacementStream used for unidentified items`)
    test(`orderedListStream used for identified items`)
  })

  suite(`renderItems with identified items`, function () {
    test(`orderedListStream used for identified items`)
  })

  suite(`renderItemStreams`, function () {
    test(`requires identified items`)
    test(`orderedListStream used`)
  })

  suite(`mount`, function () {
    test(`adds stream to the DOM`)
    test(`removes stream from the DOM when dispose handle invoked`)
    test(`removes stream from the DOM when the stream ends`)
  })

  suite(`declaration`, function () {
    test(`declares an element`)
    test(`declares a component`)
  })
})
