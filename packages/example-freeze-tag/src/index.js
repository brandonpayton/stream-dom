import { ViewApp } from './ViewApp'
import { mount, component } from 'stream-dom'

// mount(
//   <ViewApp />,
//   document.getElementById('app-container')
// )

mount(
  component(ViewApp),
  document.getElementById('app-container')
)