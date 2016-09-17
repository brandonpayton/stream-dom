import {createEventStream, attachEventStream, bindEventStream} from 'stream-dom/eventing'
import { just } from 'most'
import {click} from '@most/dom-event'
import {assert} from 'chai'

describe('stream-dom eventing infrastructure', function () {
  it('proxies event stream', function (done) {
    const clickProxy$ = createEventStream()
    attachEventStream(clickProxy$, click(document.body).take(1))
    bindEventStream(clickProxy$)

    clickProxy$
      .reduce((eventTypes, event) => [ ...eventTypes, event.type ], [])
      .then(eventTypes => assert.deepEqual(eventTypes, [ 'click' ]))
      .then(done, done)

    document.body.click()
  })

  it('can bind a proxy to multiple event streams', function (done) {
    const proxy$ = createEventStream()

    proxy$
      .reduce((events, event) => events.concat(event), [])
      .then(events => assert.deepEqual(events, [ 'click', 'just' ]))
      .then(done, done)

    attachEventStream(proxy$, click(document.body).map(() => 'click').take(1))
    attachEventStream(proxy$, just('just'))
    bindEventStream(proxy$)

    document.body.click()
  })
})
