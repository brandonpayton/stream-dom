import { Stream, merge } from 'most'
import { Subject, subject, holdSubject } from 'most-subject'

export type Subject<T> = Subject<T>

export type DomEvent = Event | CustomEvent | { target: Element }

// TODO: Consider exposing that these are subjects
export function createEventStream<T>(): Subject<T> {
  return subject<T>()
}

export function createMemoryEventStream<T>(): Subject<T> {
  return holdSubject<T>()
}

// TODO: Consider better name for this
export function attachEventStream<T>(to$: Subject<T>, from$: Stream<T>): void {
  from$
    .observe(e => to$.next(e))
    .then(undefined, error => console.error(error))
}

interface CustomEventInit {
  bubbles?: boolean,
  cancelable?: boolean,
  detail?: Object
}

export function createCustomEvent(
  document: HTMLDocument,
  eventName: string,
  customEventInit: CustomEventInit = {}
): CustomEvent {
  if (typeof CustomEvent === 'function') {
    return new CustomEvent(eventName, customEventInit)
  }
  else {
    const customEvent = document.createEvent('CustomEvent')
    const { bubbles = false, cancelable = false, detail = null } = customEventInit
    customEvent.initCustomEvent(eventName, bubbles, cancelable, detail)
    return customEvent
  }
}
