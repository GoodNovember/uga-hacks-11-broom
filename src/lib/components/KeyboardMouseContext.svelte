<script>
  import { onMount, setContext } from "svelte"

  let { children } = $props()

  // Input state
  let keys = new Set()
  let mouseX = 0          // accumulated mouse steering, decays over time
  let paused = $state(false)

  const MOUSE_SENSITIVITY = 0.003
  const MOUSE_DECAY = 0.85       // how fast mouse steering returns to center per frame
  const MOUSE_CLAMP = 1.0

  // Derived input values (reactive via getters)
  let currentGesture = $state(null)
  let currentDirection = $state({ x: 0, y: 0 })

  function updateGesture() {
    const w = keys.has('w') || keys.has('arrowup')
    const space = keys.has(' ')
    const shift = keys.has('shift')

    if (w && space) {
      currentGesture = "rise"
    } else if (w && shift) {
      currentGesture = "lower"
    } else if (w) {
      currentGesture = "point"
    } else {
      currentGesture = null
    }
  }

  function updateDirection() {
    // Keyboard A/D override
    const a = keys.has('a') || keys.has('arrowleft')
    const d = keys.has('d') || keys.has('arrowright')

    let x = -mouseX
    if (a) x = 1
    if (d) x = -1

    currentDirection = { x, y: 0 }
  }

  function onKeyDown(e) {
    if (e.key === 'Escape') {
      paused = !paused
      if (paused) document.exitPointerLock?.()
      return
    }
    keys.add(e.key.toLowerCase())
    updateGesture()
    updateDirection()
  }

  function onKeyUp(e) {
    keys.delete(e.key.toLowerCase())
    updateGesture()
    updateDirection()
  }

  function onMouseMove(e) {
    if (!document.pointerLockElement) return
    mouseX += e.movementX * MOUSE_SENSITIVITY
    mouseX = Math.max(-MOUSE_CLAMP, Math.min(MOUSE_CLAMP, mouseX))
    updateDirection()
  }

  function onClick() {
    if (paused) return
    document.body.requestPointerLock?.()
  }

  // Decay mouse steering back to center
  let decayHandle = -1
  function decayLoop() {
    decayHandle = requestAnimationFrame(decayLoop)
    mouseX *= MOUSE_DECAY
    if (Math.abs(mouseX) < 0.001) mouseX = 0
    updateDirection()
  }

  onMount(() => {
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('click', onClick)
    decayHandle = requestAnimationFrame(decayLoop)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('click', onClick)
      cancelAnimationFrame(decayHandle)
      document.exitPointerLock?.()
    }
  })

  setContext("handLandmarker", {
    get results() { return null },
    get pointing() { return currentGesture !== null },
    get gesture() { return currentGesture },
    get fingerDirection() { return currentDirection },
    get paused() { return paused },
    get pauseProgress() { return 0 },
    get thumbsUp() { return false },
    get thumbsUpProgress() { return 0 }
  })
</script>

{@render children?.()}
