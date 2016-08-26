streamDom.component(TestComponent, {
  attributes: [
    { name: "prop1", value: "expected-string" },
    { name: "prop2", value: 123 },
    { name: "prop3", value: expectedIdentifier },
    { namespace: "event", name: "click", value: handleClick },
    { namespace: "event", name: "customEvent", value: handleCustomEvent }
  ],
  children: []
});
