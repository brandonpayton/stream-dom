streamDom.element("img", {
  attributes: [
    { namespace: "event", name: "click", value: clickHandler },
    { namespace: "event", name: "load", value: loadHandler }
  ],
  children: []
});
