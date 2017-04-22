suite(`nodes/component`, function () {
  test(`static props and output`)
  test(`dynamic props and output`)
  test(`feedback streams`)

  suite(`ComponentNodeDescriptor`, function () {
    test(`name property`)
    test(`extractContents`)
    test(`deleteContents`)
    test(`getBeforeNode`)
    test(`getNextSiblingNode`)
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

    test(`relays declared inputs`)
    test(`ignores undeclared inputs`)
    test(`validates declared inputs`)
    test(`filters out undeclared inputs`)
    test(`identifies feedback streams`)
    test(`ensures input streams are multicast`)
  })

  suite(`create structure`, function () {
    test(`provides a scope with the component's default namespace`)
    test(`returns the root node descriptor`)
    test(`provides a map of named nodes`)
  })

  suite(`output`, function () {
    test(`ensures output streams are multicast`)
    test(`attaches feedback streams`)
  })
})
