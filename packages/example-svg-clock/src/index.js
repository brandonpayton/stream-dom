import { h, mount, component, types } from 'stream-dom'
import { periodic } from 'most'

const Clock = component({
  input: {
    // TODO: Consider allowing static values that are implicitly lifted to a one-event stream
    time$: types.observable
  },
  structure: ({ time$ }) => {
    const radius = 100
    function hand ({ lengthRatio, rotation$, color, width }) {
      const handLength = lengthRatio * radius
      const tailLength = 0.1 * handLength

      const angle$ = rotation$.map(
        rotation => rotation * 2 * Math.PI
      ).multicast()
      const opposingAngle$ = angle$.map(angle => angle + Math.PI).multicast()

      return {
        x1: opposingAngle$.map(a => tailLength * Math.sin(a)),
        y1: opposingAngle$.map(a => tailLength * Math.cos(a)),
        x2: angle$.map(a => handLength * Math.sin(a)),
        y2: angle$.map(a => handLength * Math.cos(a)),
        stroke: color,
        'stroke-width': width
      }
    }

    const hourHand = hand({
      lengthRatio: 0.65,
      rotation$: time$.map(date => date.getHours() % 12 / 12),
      color: `#268bd2`,
      width: 4
    })
    const minuteHand = hand({
      lengthRatio: 0.85,
      rotation$: time$.map(date => date.getMinutes() % 60 / 60),
      color: `#b58900`,
      width: 3
    })
    const secondHand = hand({
      lengthRatio: 0.9,
      rotation$: time$.map(date => date.getSeconds() % 60 / 60),
      color: `#dc322f`,
      width: 2
    })

    // TODO: Log issue to support namespace-named elements in JSX in Visual Studio Code
    return <svg:svg viewBox="-150 -150 300 300" class="clock" style="background: #073642">
      <g transform="scale(1, -1)">
        <circle cx="0" cy="0" r="100" stroke="#93a1a1" stroke-width="2" fill="none"/>
        <line {...hourHand} />
        <line {...minuteHand} />
        <line {...secondHand} />
      </g>
    </svg:svg>
  }
})

mount(document.body, null, <Clock time$={periodic(1000).map(() => new Date())} />)
