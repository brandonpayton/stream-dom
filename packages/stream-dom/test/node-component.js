suite(`nodes/component`, function () {
  test(`static props and output`)
  test(`dynamic props and output`)
  test(`feedback streams`)

  suite(`ComponentNodeDescriptor`, function () {
    test(`name property`)
    test(`extractContents`)
    test(`deleteContents`)
    test(`getBeforeNode`)
    test(`expose`)
  })

  suite(`input`, function () {
    suite(`propTypes validation`, function () {
      test(`required`)
      test(`any`)
      test(`boolean`)
      test(`string`)
      test(`number`)
      test(`object`)
      test(`array`)
      test(`children`)
      test(`stream`)
      test(`feedback`)
    })

    test(`relays declared properties`)
    test(`validates declared properties`)
    test(`filters out undeclared properties`)
    test(`ensures streams wrapped with streamDom`)
    test(`leaves wrapped streams intact`)
    test(`identifies feedback streams`)
    test(`ensures input streams are multicast`)
  })

  suite(`create structure`, function () {
    test(`provides a scope with the component's default namespace`)
    test(`returns the root node descriptor`)
    test(`provides a map of named nodes`)
  })

  suite(`output`, function () {
    test(`wraps output streams`)
    test(`leaves wrapped streams intact`)
    test(`ensures output streams are multicast`)
    test(`attaches feedback streams`)
  })
})
