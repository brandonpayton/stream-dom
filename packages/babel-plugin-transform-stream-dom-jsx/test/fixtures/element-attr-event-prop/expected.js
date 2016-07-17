streamDom.element("div", {
  attributes: {
    id: "expected-id"
  },
  properties: {
    className: "expected-class"
  },
  eventStreams: {
    click: handleClick
  },
  children: []
});
