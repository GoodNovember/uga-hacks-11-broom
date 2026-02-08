<script>
  import { onMount, setContext } from "svelte"

  let { children } = $props()

  let currentGesture = $state(null)
  let currentDirection = $state({ x: 0, y: 0 })
  let paused = $state(false)

  const DEADZONE = 0.25
  const STICK_RADIUS = 60   // max travel in px

  // Touch tracking
  let stickTouchId = $state(null)
  let stickBaseX = 0
  let stickBaseY = 0
  let stickDeltaX = $state(0)
  let stickDeltaY = $state(0)

  let risePressed = $state(false)
  let lowerPressed = $state(false)
  let riseTouchId = null
  let lowerTouchId = null

  // Radial deadzone (same as GamepadContext)
  function applyRadialDeadzone(x, y) {
    const mag = Math.sqrt(x * x + y * y)
    if (mag < DEADZONE) return { x: 0, y: 0, magnitude: 0 }
    const remapped = (mag - DEADZONE) / (1 - DEADZONE)
    const nx = x / mag
    const ny = y / mag
    return { x: nx * remapped, y: ny * remapped, magnitude: remapped }
  }

  function updateFromStick() {
    const normX = stickDeltaX / STICK_RADIUS
    const normY = stickDeltaY / STICK_RADIUS
    const stick = applyRadialDeadzone(normX, normY)
    const forward = stick.magnitude > 0

    if (forward && risePressed) {
      currentGesture = "rise"
    } else if (forward && lowerPressed) {
      currentGesture = "lower"
    } else if (forward) {
      currentGesture = "point"
    } else {
      currentGesture = null
    }

    // Invert X to match gamepad convention
    currentDirection = { x: -stick.x, y: 0 }
  }

  // --- Joystick handlers ---
  function onStickStart(e) {
    if (stickTouchId !== null) return
    const touch = e.changedTouches[0]
    stickTouchId = touch.identifier
    const rect = e.currentTarget.getBoundingClientRect()
    stickBaseX = rect.left + rect.width / 2
    stickBaseY = rect.top + rect.height / 2
    stickDeltaX = 0
    stickDeltaY = 0
    updateFromStick()
    e.preventDefault()
  }

  function onStickMove(e) {
    for (const touch of e.changedTouches) {
      if (touch.identifier === stickTouchId) {
        let dx = touch.clientX - stickBaseX
        let dy = touch.clientY - stickBaseY
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist > STICK_RADIUS) {
          dx = (dx / dist) * STICK_RADIUS
          dy = (dy / dist) * STICK_RADIUS
        }
        stickDeltaX = dx
        stickDeltaY = dy
        updateFromStick()
      }
    }
    e.preventDefault()
  }

  function onStickEnd(e) {
    for (const touch of e.changedTouches) {
      if (touch.identifier === stickTouchId) {
        stickTouchId = null
        stickDeltaX = 0
        stickDeltaY = 0
        updateFromStick()
      }
    }
    e.preventDefault()
  }

  // --- Button handlers ---
  function onRiseStart(e) {
    riseTouchId = e.changedTouches[0].identifier
    risePressed = true
    updateFromStick()
    e.preventDefault()
  }
  function onRiseEnd(e) {
    for (const touch of e.changedTouches) {
      if (touch.identifier === riseTouchId) {
        riseTouchId = null
        risePressed = false
        updateFromStick()
      }
    }
    e.preventDefault()
  }

  function onLowerStart(e) {
    lowerTouchId = e.changedTouches[0].identifier
    lowerPressed = true
    updateFromStick()
    e.preventDefault()
  }
  function onLowerEnd(e) {
    for (const touch of e.changedTouches) {
      if (touch.identifier === lowerTouchId) {
        lowerTouchId = null
        lowerPressed = false
        updateFromStick()
      }
    }
    e.preventDefault()
  }

  function togglePause(e) {
    paused = !paused
    if (paused) {
      currentGesture = null
      currentDirection = { x: 0, y: 0 }
    }
    e.preventDefault()
  }

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

<!-- Touch controls overlay -->
{#if !paused}
  <!-- Virtual joystick (left) -->
  <div
    class="stick-base"
    ontouchstart={onStickStart}
    ontouchmove={onStickMove}
    ontouchend={onStickEnd}
    ontouchcancel={onStickEnd}
  >
    <div class="stick-ring"></div>
    <div
      class="stick-knob"
      style="transform: translate({stickDeltaX}px, {stickDeltaY}px)"
    ></div>
  </div>

  <!-- Ascend / Descend buttons (right) -->
  <div class="action-buttons">
    <button
      class="action-btn"
      class:active={risePressed}
      ontouchstart={onRiseStart}
      ontouchend={onRiseEnd}
      ontouchcancel={onRiseEnd}
    >&#9650;</button>
    <button
      class="action-btn"
      class:active={lowerPressed}
      ontouchstart={onLowerStart}
      ontouchend={onLowerEnd}
      ontouchcancel={onLowerEnd}
    >&#9660;</button>
  </div>
{/if}

<!-- Pause button (always visible) -->
<button class="pause-btn" ontouchstart={togglePause}>
  <!-- {paused ? '&#9654;' : '&#10074;&#10074;'} -->
  {paused ? '▶' : '❙❙'}
</button>

<style>
  .stick-base {
    position: fixed;
    bottom: 2.5rem;
    left: 2.5rem;
    width: 150px;
    height: 150px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.08);
    border: 2px solid rgba(255, 255, 255, 0.2);
    touch-action: none;
    pointer-events: all;
    z-index: 30;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .stick-ring {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    position: absolute;
  }

  .stick-knob {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: rgba(255, 215, 0, 0.5);
    border: 2px solid rgba(255, 215, 0, 0.7);
    pointer-events: none;
    transition: background 0.1s;
  }

  .action-buttons {
    position: fixed;
    bottom: 2.5rem;
    right: 2.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    z-index: 30;
    pointer-events: all;
    touch-action: none;
  }

  .action-btn {
    width: 70px;
    height: 70px;
    border-radius: 50%;
    border: 2px solid rgba(255, 255, 255, 0.3);
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.7);
    font-size: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    touch-action: none;
    pointer-events: all;
    -webkit-user-select: none;
    user-select: none;
  }

  .action-btn.active {
    background: rgba(255, 215, 0, 0.35);
    border-color: rgba(255, 215, 0, 0.7);
    color: rgba(255, 215, 0, 0.9);
  }

  .pause-btn {
    position: fixed;
    top: 1rem;
    right: 1rem;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: 2px solid rgba(255, 255, 255, 0.3);
    background: rgba(0, 0, 0, 0.4);
    color: rgba(255, 255, 255, 0.7);
    font-size: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    touch-action: none;
    pointer-events: all;
    z-index: 30;
    -webkit-user-select: none;
    user-select: none;
  }
</style>
