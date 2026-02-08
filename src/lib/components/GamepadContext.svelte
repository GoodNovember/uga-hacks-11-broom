<script>
  import { onMount, setContext } from "svelte"

  let { children } = $props()

  let currentGesture = $state(null)
  let currentDirection = $state({ x: 0, y: 0 })
  let paused = $state(false)
  let gamepadConnected = $state(false)

  const DEADZONE = 0.25

  let pollHandle = -1

  // Radial deadzone: applies to the full 2D stick vector, then remaps magnitude
  function applyRadialDeadzone(x, y) {
    const mag = Math.sqrt(x * x + y * y)
    if (mag < DEADZONE) return { x: 0, y: 0, magnitude: 0 }
    const remapped = (mag - DEADZONE) / (1 - DEADZONE)
    const nx = x / mag
    const ny = y / mag
    return { x: nx * remapped, y: ny * remapped, magnitude: remapped }
  }

  let prevStartPressed = false

  function poll() {
    pollHandle = requestAnimationFrame(poll)

    const gamepads = navigator.getGamepads()
    const gp = gamepads[0] || gamepads[1] || gamepads[2] || gamepads[3]
    if (!gp) {
      gamepadConnected = false
      return
    }

    if (!gamepadConnected) gamepadConnected = true

    const [
      button00_A,
      button01_B,
      button02_Home,
      button03_X,
      button04_Y,
      button05_unknown,
      button06_L1,
      button07_R1,
      button08_L2,
      button09_R2,
      button10_select,
      button11_start,
      button12_unknown,
      button13_L3,
      button14_R3,
      button15_unknown
    ] = gp.buttons

    const rawX = gp.axes[0] ?? 0
    const rawY = gp.axes[1] ?? 0
    const stick = applyRadialDeadzone(rawX, rawY)
    const forward = stick.magnitude > 0

    const rise = button06_L1?.pressed || button07_R1?.pressed
    const lower = (button08_L2?.value ?? 0) > 0.1 || (button09_R2?.value ?? 0) > 0.1
    const startPressed = button11_start?.pressed

    // Pause toggle on start button (edge-triggered)
    if (startPressed && !prevStartPressed) {
      paused = !paused
    }
    prevStartPressed = !!startPressed

    if (paused) {
      currentGesture = null
      currentDirection = { x: 0, y: 0 }
      return
    }

    // Gesture from stick + bumpers/triggers
    if (forward && rise) {
      currentGesture = "rise"
    } else if (forward && lower) {
      currentGesture = "lower"
    } else if (forward) {
      currentGesture = "point"
    } else {
      currentGesture = null
    }

    // Steering from left stick X (inverted to match convention)
    currentDirection = { x: -stick.x, y: 0 }
  }

  onMount(() => {
    pollHandle = requestAnimationFrame(poll)
    return () => cancelAnimationFrame(pollHandle)
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

{#if !gamepadConnected}
  <div class="gamepad-prompt">
    <p>Press any button on your controller to connect</p>
  </div>
{/if}

{@render children?.()}

<style>
  .gamepad-prompt {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.8);
    z-index: 20;
  }
  .gamepad-prompt p {
    color: rgba(255, 255, 255, 0.8);
    font-size: 1.5rem;
    animation: pulse 2s ease-in-out infinite;
  }
  @keyframes pulse {
    0%, 100% { opacity: 0.6; }
    50% { opacity: 1; }
  }
</style>
