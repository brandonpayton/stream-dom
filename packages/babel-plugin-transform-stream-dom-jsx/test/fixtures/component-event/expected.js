streamDom.component(TestComponent, {
  attributes: [
    { namespace: "event", name: "click", value: handleClick },
    { namespace: "event", name: "customEvent", value: handleCustomEvent }
  ],
  children: []
});
