# Goal

To learn about monadic streams and create a compelling example of their benefits.

# Project

A game of freeze tag.

## Dependencies

* Find or write simple immutable data structure lib with Map and List structures

## First iteration

* Single board
* Player is "it"
* Victory is achieved when all others are frozen
* Controlled via hardcoded keybindings
* Game may be paused

### Implementation

* Use DOM to create canvas
* Renderer initialized with <canvas> and board
* Board
  * Load via HTTP
  * Save via HTTP
  * Board does not change (for first iteration)
* Characters
  * All have same velocity (for first iteration)
  * Provide direction per frame if not frozen
* Editor
  * Drag walls
  * Command stack with reversible commands


# Misc

* Configure eslint to report missing semicolons