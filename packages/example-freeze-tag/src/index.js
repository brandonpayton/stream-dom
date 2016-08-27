import { ViewApp } from './ViewApp'
import streamDom from './lib/stream-dom'

// mount(
//   <ViewApp />,
//   document.getElementById('app-container')
// )

streamDom.mount(
  streamDom.component(ViewApp),
  document.getElementById('app-container')
)