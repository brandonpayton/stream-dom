import {createEventStream, attachEventStream} from 'stream-dom/eventing'
import {click} from '@most/dom-event'
import {assert} from 'chai'

describe('stream-dom eventing infrastructure', function () {
  it('proxies event handler', function (done) {
    const clickProxy$ = createEventStream()
    attachEventStream(clickProxy$, click(document.body).take(1))

    clickProxy$
      .reduce((eventTypes, event) => [ ...eventTypes, event.type ], [])
      .then(eventTypes => {
        assert.deepEqual(eventTypes, [ 'click' ])
      })
      .then(done, done)

    document.body.click()
  })
})
