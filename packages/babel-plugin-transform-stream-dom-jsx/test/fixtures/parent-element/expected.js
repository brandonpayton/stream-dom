streamDom.element('div', {
  attributes: [],
  children: [
    streamDom.text('\n  '),
    streamDom.component(TestComponent, {
      attributes: [],
      children: []
    }),
    streamDom.text('\n  '),
    streamDom.element('hr', {
      attributes: [],
      children: []
    }),
    streamDom.text('\n  expected text\n')
  ]
})
