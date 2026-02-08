<script lang="ts">
  import { onMount, setContext } from "svelte";
  import { detectGesture, isOpenPalm, isThumbsUp } from "$lib/utils/handControls.js";
  import { gameWon } from "$lib/stores/game";

  let {
    mediaDevice,
    handLandmarker,
    children
  } = $props()

  let canvas = $state<HTMLCanvasElement | null>(null)
  let ctx = $state<CanvasRenderingContext2D | null>(null)
  let mediaElement = document.createElement("video")

  let activeResults = $state<HandLandmarkerResult | undefined | null>(null)
  let activePointing = $state(false)
  let activeGesture = $state<string | null>(null)
  let activeFingerDirection = $state<{x: number, y: number}>({x: 0, y: 0})
  let activePaused = $state(false)
  let activeThumbsUp = $state(false)
  let streamReady = $state(false)
  let videoAspect = $state(1.5)

  // Open-palm hold pause/unpause detection
  let palmHoldStart = 0
  const PAUSE_HOLD_MS = 1500 // hold open palm for 1.5s to toggle pause
  let pauseProgress = $state(0) // 0-1 progress for visual indicator
  let palmCooldown = false // must release palm before toggling again

  // Thumbs-up hold detection (for restart)
  let thumbsUpHoldStart = 0
  const THUMBS_UP_HOLD_MS = 1500
  let thumbsUpProgress = $state(0)
  let thumbsUpCooldown = false

  mediaElement.autoplay = true
  mediaElement.playsInline = true
  mediaElement.muted = true 
  $effect(()=>{
    mediaElement.srcObject = mediaDevice
    mediaElement.play().catch(() => {})
  })

  let handle = $state<number>(-1)

  type HandLandmarkerResult = {
    landmarks: Array<Array<{x: number, y: number, z: number}>>
  }

  function heartbeat(){
    handle = requestAnimationFrame(heartbeat)
    if(!mediaElement || !canvas || !ctx) return
    if(mediaElement.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return
    if(mediaElement.videoWidth <= 0 || mediaElement.videoHeight <= 0) return

    if(canvas.width !== mediaElement.videoWidth || canvas.height !== mediaElement.videoHeight){
      canvas.width = mediaElement.videoWidth
      canvas.height = mediaElement.videoHeight
      videoAspect = mediaElement.videoWidth / mediaElement.videoHeight
    }

    ctx.drawImage(mediaElement, 0, 0, canvas.width, canvas.height)
    if (!streamReady) streamReady = true

    if(handLandmarker){
      const results: HandLandmarkerResult = handLandmarker.detectForVideo(mediaElement, performance.now())
      activeResults = results
    }

    if(activeResults && activeResults.landmarks){
      for(const landmarks of activeResults.landmarks){
        if(!ctx || !canvas) continue
        const gesture = detectGesture(landmarks)
        const openPalm = isOpenPalm(landmarks)
        const thumbsUp = isThumbsUp(landmarks)

        const now = performance.now()

        // Open-palm hold pause/unpause detection (disabled during win screen)
        if (openPalm && !palmCooldown && !$gameWon) {
          if (palmHoldStart === 0) palmHoldStart = now
          const held = now - palmHoldStart
          pauseProgress = Math.min(held / PAUSE_HOLD_MS, 1)
          if (held >= PAUSE_HOLD_MS) {
            activePaused = !activePaused
            palmHoldStart = 0
            pauseProgress = 0
            palmCooldown = true // must release before toggling again
          }
        } else if (!openPalm) {
          palmHoldStart = 0
          pauseProgress = 0
          palmCooldown = false
        }

        // Thumbs-up hold detection (for restart on win screen)
        if (thumbsUp && !thumbsUpCooldown) {
          if (thumbsUpHoldStart === 0) thumbsUpHoldStart = now
          const held = now - thumbsUpHoldStart
          thumbsUpProgress = Math.min(held / THUMBS_UP_HOLD_MS, 1)
          activeThumbsUp = held >= THUMBS_UP_HOLD_MS
          if (activeThumbsUp) {
            thumbsUpHoldStart = 0
            thumbsUpProgress = 0
            thumbsUpCooldown = true
          }
        } else if (!thumbsUp) {
          thumbsUpHoldStart = 0
          thumbsUpProgress = 0
          activeThumbsUp = false
          thumbsUpCooldown = false
        }

        // When paused, suppress flight gestures
        if (activePaused) {
          activeGesture = null
          activePointing = false
        } else {
          activeGesture = gesture
          activePointing = gesture !== null
        }
        const color = activePointing ? "lime" : activePaused ? "cyan" : "red"

        // Draw all landmarks
        ctx.fillStyle = color
        for(const landmark of landmarks){
          const x = landmark.x * canvas.width
          const y = landmark.y * canvas.height
          ctx.beginPath()
          ctx.arc(x, y, 5, 0, 2 * Math.PI)
          ctx.fill()
        }

        // Draw finger direction when gesture active
        if(gesture){
          const mcp = landmarks[5]
          const tip = landmarks[8]
          const mcpX = mcp.x * canvas.width
          const mcpY = mcp.y * canvas.height
          const tipX = tip.x * canvas.width
          const tipY = tip.y * canvas.height

          // Direction vector
          const dirX = tipX - mcpX
          const dirY = tipY - mcpY
          const len = Math.sqrt(dirX * dirX + dirY * dirY)
          if(len > 0){
            const nx = dirX / len
            const ny = dirY / len

            // Store normalized direction for broom steering
            activeFingerDirection = { x: nx, y: ny }

            // Draw line from MCP through tip, extending as a ray
            const rayLen = 80
            const rayEndX = tipX + nx * rayLen
            const rayEndY = tipY + ny * rayLen

            // Main direction line
            ctx.strokeStyle = "lime"
            ctx.lineWidth = 3
            ctx.beginPath()
            ctx.moveTo(mcpX, mcpY)
            ctx.lineTo(rayEndX, rayEndY)
            ctx.stroke()

            // Arrowhead at ray end
            const arrowSize = 12
            const angle = Math.atan2(ny, nx)
            ctx.fillStyle = "lime"
            ctx.beginPath()
            ctx.moveTo(rayEndX, rayEndY)
            ctx.lineTo(
              rayEndX - arrowSize * Math.cos(angle - 0.4),
              rayEndY - arrowSize * Math.sin(angle - 0.4)
            )
            ctx.lineTo(
              rayEndX - arrowSize * Math.cos(angle + 0.4),
              rayEndY - arrowSize * Math.sin(angle + 0.4)
            )
            ctx.closePath()
            ctx.fill()

            // Direction indicator: small crosshair in top-left corner
            const indicatorSize = 40
            const indicatorX = 50
            const indicatorY = 50

            // Outer circle
            ctx.strokeStyle = "rgba(255,255,255,0.5)"
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.arc(indicatorX, indicatorY, indicatorSize, 0, 2 * Math.PI)
            ctx.stroke()

            // Center dot
            ctx.fillStyle = "rgba(255,255,255,0.5)"
            ctx.beginPath()
            ctx.arc(indicatorX, indicatorY, 3, 0, 2 * Math.PI)
            ctx.fill()

            // Direction dot (where finger is aiming)
            const aimX = indicatorX + nx * indicatorSize * 0.8
            const aimY = indicatorY + ny * indicatorSize * 0.8
            ctx.fillStyle = "lime"
            ctx.beginPath()
            ctx.arc(aimX, aimY, 6, 0, 2 * Math.PI)
            ctx.fill()

            // Line from center to aim
            ctx.strokeStyle = "lime"
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.moveTo(indicatorX, indicatorY)
            ctx.lineTo(aimX, aimY)
            ctx.stroke()
          }
        }
      }
    } else {
      activePointing = false
    }
  }

  onMount(()=>{
    if(canvas){
      ctx = canvas.getContext("2d")
    }
    handle = requestAnimationFrame(heartbeat)
    return () =>{
      cancelAnimationFrame(handle)
    }
  })


  setContext("handLandmarker", {
    get results(){
      return activeResults
    },
    get pointing(){
      return activePointing
    },
    get gesture(){
      return activeGesture
    },
    get fingerDirection(){
      return activeFingerDirection
    },
    get paused(){
      return activePaused
    },
    get pauseProgress(){
      return pauseProgress
    },
    get thumbsUp(){
      return activeThumbsUp
    },
    get thumbsUpProgress(){
      return thumbsUpProgress
    }
  })

</script>

<canvas class="active-camera-preview" bind:this={canvas} style:aspect-ratio={videoAspect}></canvas>

{#if !streamReady}
  <div class="loading-overlay">
    <div class="spinner"></div>
    <p class="loading-label">Starting camera stream...</p>
  </div>
{/if}

{#if !activePaused && pauseProgress > 0}
  <div class="palm-indicator">
    <svg width="60" height="60" viewBox="0 0 60 60">
      <circle cx="30" cy="30" r="26" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="4" />
      <circle cx="30" cy="30" r="26" fill="none" stroke="cyan" stroke-width="4"
        stroke-dasharray={2 * Math.PI * 26}
        stroke-dashoffset={2 * Math.PI * 26 * (1 - pauseProgress)}
        transform="rotate(-90 30 30)" />
    </svg>
    <span class="palm-label">II</span>
  </div>
{/if}

{@render children?.()}

<style>
  canvas {
    position: fixed;
    right: 1rem;
    bottom: 1rem;
    border-radius: 150px;
    border-top-left-radius: 1rem;
    height: 150px;
    border: 2pt solid white;
    z-index: 10;
  }
  .loading-overlay {
    position: fixed;
    inset: 0;
    background: #1a1a2e;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 20;
    gap: 1.5rem;
  }
  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(255, 215, 0, 0.2);
    border-top-color: #FFD700;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  .loading-label {
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.9rem;
    margin: 0;
  }
  .palm-indicator {
    position: fixed;
    top: 1.5rem;
    left: 50%;
    transform: translateX(-50%);
    z-index: 15;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
  }
  .palm-label {
    position: absolute;
    color: cyan;
    font-size: 1.2rem;
    font-weight: bold;
  }
</style>