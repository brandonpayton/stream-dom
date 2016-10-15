* Consider adopting hyperscript interface
* Consider whether JSX or simply hyperscript interface is preferable
* Flesh out component events and communication
* Consider making `context` available to components for things like a `store` property
* Support custom update strategy for element streams
* Full unit tests
* Allow properties to be declared with components
* Support stream interop
* Make applying inline styles easier
* Make updating classList easier
* Implement and use object spread for attributes
* Consider changing initialization to objects to avoid cost of closure
* There is an odd timing issue between `attachEventStream` and `observe`. Fix this issue.
* Switch to declare/bind component model
    * Structure is declared first
    * Binding is applied after
