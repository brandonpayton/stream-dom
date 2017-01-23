suite(`nodes/dom`, function () {
  suite(`element`, function () {
    test(`no children, attributes, or properties`)
    test(`static attributes`)
    test(`dynamic attributes`)
    test(`static and dynamic attributes`)
    test(`static properties`)
    test(`static and dynamic properties`)
    test(`static attributes and properties`)
    test(`static and dynamic attributes and properties`)
    test(`children`)
    test(`children and static attributes`)
    test(`children and dynamic attributes`)
    test(`children and static and dynamic attributes`)
    test(`children and static properties`)
    test(`children and dynamic properties`)
    test(`children and static and dynamic properties`)
    test(`children and static attributes and properties`)
    test(`children and dynamic attributes and properties`)
    test(`children and static and dynamic attributes and properties`)
  })

  suite(`DomNodeDescriptor`, function () {
    test(`name property`)
    test(`extractContents`)
    test(`deleteContents`)
    test(`getBeforeNode`)
    test(`expose`)
  })

  suite(`ElementNodeDescriptor`, function () {
    test(`name property`)
    test(`childDescriptors`)

    suite(`expose`, function () {
      test(`domNode`)
      test(`on`)
    })
  })

  suite(`text`, function () {
    test(`creates a text node`)
  })

  suite(`TextNodeDescriptor`, function () {
    test(`domNode`)
  })
})
