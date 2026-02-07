<script lang="ts">
  import { onMount, setContext } from "svelte";
  import { detectGesture, isFist } from "$lib/utils/handControls.js";

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
  let streamReady = $state(false)
  let videoAspect = $state(1.5)

  // Double-fist pause detection
  let wasFist = false
  let fistTimestamps: number[] = []
  const DOUBLE_FIST_WINDOW = 1500 // ms

  // Unpause requires holding point gesture for a bit
  let pointStartTime = 0
  const UNPAUSE_HOLD_MS = 600

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
        const fist = isFist(landmarks)

        // Double-fist pause detection
        const now = performance.now()
        if (fist && !wasFist) {
          // Transition INTO fist
          fistTimestamps.push(now)
          // Prune old timestamps
          fistTimestamps = fistTimestamps.filter(t => now - t < DOUBLE_FIST_WINDOW)
          if (fistTimestamps.length >= 3) {
            activePaused = !activePaused
            fistTimestamps = []
          }
        }
        wasFist = fist

        // Pointing (index finger) held for a moment unpauses
        if (activePaused && gesture === "point") {
          if (pointStartTime === 0) pointStartTime = now
          if (now - pointStartTime > UNPAUSE_HOLD_MS) {
            activePaused = false
            pointStartTime = 0
          }
        } else {
          pointStartTime = 0
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

{#if activePaused}
  <div class="pause-overlay">
    <div class="pause-text">PAUSED</div>
    <div class="pause-hint">Point to resume ☝️</div>
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
  .pause-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 5;
    pointer-events: none;
  }
  .pause-text {
    font-size: 4rem;
    font-weight: bold;
    color: white;
    letter-spacing: 0.3em;
    text-shadow: 0 0 20px rgba(0, 200, 255, 0.8);
  }
  .pause-hint {
    margin-top: 1rem;
    font-size: 1.2rem;
    color: rgba(255, 255, 255, 0.7);
  }
</style>