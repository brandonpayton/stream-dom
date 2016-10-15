# stream-dom

Declarative, reactive DOM construction with minimal magic.

[![Build Status](https://travis-ci.org/brandonpayton/stream-dom.svg?branch=master)](https://travis-ci.org/brandonpayton/stream-dom)

🚨 ATTENTION: This project is currently personal research and should not be used in production.

## Characteristics

* Clearly declare DOM element structures.
* Attributes, properties, and event listeners are specified separately and explicitly.
* All change is represented by reactive streams.
  * Attributes and properties may be bound to streams.
  * Event listeners are represented by streams.
  * Dynamic ranges of DOM elements are represented as streams of element declarations.
* Everything not represented by a reactive stream is treated as static content.

## Guiding principles

### Truth is simpler than the alternative.

Simplicity is the hallmark of truth. A library reflecting the reality of the underlying platform will ultimately be simpler to implement and use than something that bends, hides, or contradicts underlying truth for the sake of convenience. 

### The mental model must reflect the underlying platform.

The mental model required to use this library should be consistent with a mental model of the underlying platform.

### Minimize magic.

Code should say what it means and contain as little hidden meaning as possible.

## Motivation

There is a lot of interesting work being done with reactive UI. I've reviewed and worked with many approaches over the last year, and my thoughts and intuition are not at peace with anything I've reviewed so far. I found [Yolk](https://github.com/garbles/yolk) to be an interesting approach, but it required more diffing than seemed necessary and is now no longer maintained. The purpose of this project is to apply what I've learned from others and pursue a simpler, more efficient approach.
