# stream-dom

🚨 EXPERIMENTAL 🚨

Pursuing reactive UI construction with simplicity and minimal magic.

For now, this is simply a place to research and work through my ideas.  

## Motivation

There is a lot of interesting work being done around reactive UI. I've reviewed and worked with many approaches over the last year. In particular, I've been enjoying reading and working with [Yolk](https://github.com/garbles/yolk) and feel it is headed in a good direction. But regardless of implementation, my thoughts and intuition are not completely at peace with anything I've seen so far. The purpose of this project is to apply what I've learned from others and pursue my intuition that we could be doing this with more simplicity and efficiency.

## Guiding principles

### Truth is simpler than the alternative.

Simplicity is the hallmark of truth. A library reflecting the reality of the underlying platform will ultimately be simpler to implement and use than something that bends or contradicts underlying truth for the sake of convenience. 

### The mental model must reflect the underlying platform.

The mental model required to use this library should be consistent with a mental model of the underlying platform.

### Minimize magic.

Code should say what it means and contain as little hidden meaning as possible.

## Initial thoughts on implementation

Virtual hyperscript lacks sufficient meaning to capture the intention of the developer. Due to only taking a single `properties` argument, the implementation must make judgements about which properties map to DOM attributes, properties, and event listeners. As a maintainer, I do not wish to bear the maintenance burden nor do I believe it is necessary, and as a consumer, I do not wish to be subject to the authors' judgement calls or to be required to upgrade the library to support new elements, attributes, events, and properties. It is much better to say what you mean than to rely on another to say what they think you mean. This directness is something I appreciate about the [dom-layer](https://github.com/crysalead-js/dom-layer#the-tags-options) interface.

Provide an interface that supports explicitly specifying attributes, properties, and event listeners.  

If something changes over time, represent it as an event stream. Anything that is not represented by an event stream can be treated as static content for the life of its container.

Updating the UI should not require creating and diffing a complete virtual DOM tree. The UI declaration should be enough to make direct updates. Localized virtual DOM trees may be a useful patching strategy.

To be performant, this approach will likely require control of the stream event scheduler.
