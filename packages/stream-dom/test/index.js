suite(`streamDom`, function () {
  test(`prop maps to a stream of property values`)

  suite(`render`, function () {
    test(`text`)
    test(`element`)
    test(`component`)
  })

  suite(`renderItems`, function () {
    test(`replacing entire list with each event`)
    test(`replacing only changed items`)
  })

  suite(`renderItemStreams`, function () {
    test(`render items with targeted updates`)
    test(`moves items to match list order`)
    test(`adds items to match the list`)
    test(`removes items to match the list`)
    test(`adds and removes items to match the list`)
    test(`adds, moves, and removes items to match the list`)
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
