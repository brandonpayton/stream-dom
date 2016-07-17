streamDom.component(TestComponent, {
  properties: {
    prop1: "expected-string",
    prop2: 123,
    prop3: expectedIdentifier
  },
  eventStreams: {
    click: handleClick,
    customEvent: handleCustomEvent
  },
  children: []
});
