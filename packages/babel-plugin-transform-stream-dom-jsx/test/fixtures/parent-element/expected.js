streamDom.element('div', {
  attributes: {},
  properties: {},
  eventStreams: {},
  children: [
    streamDom.text('\n  '),
    streamDom.component(TestComponent, {
      properties: {},
      eventStreams: {},
      children: []
    }),
    streamDom.text('\n  '),
    streamDom.element('hr', {
      attributes: {},
      properties: {},
      eventStreams: {},
      children: []
    }),
    streamDom.text('\n  expected text\n')
  ]
})
