<script lang="ts">
  import { onMount, setContext } from "svelte";

  let {
    mediaDevice,
    handLandmarker,
    children
  } = $props()

  let canvas = $state<HTMLCanvasElement | null>(null)
  let ctx = $state<CanvasRenderingContext2D | null>(null)
  let mediaElement = document.createElement("video")

  let activeResults = $state<HandLandmarkerResult | undefined | null>(null)

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
    }

    ctx.drawImage(mediaElement, 0, 0, canvas.width, canvas.height)

    if(handLandmarker){
      const results: HandLandmarkerResult = handLandmarker.detectForVideo(mediaElement, performance.now())
      activeResults = results
    }

    function drawLandmarks(landmarks :Array<{x: number, y: number, z: number}>, color: string){
      if(!ctx) return
      if(!canvas) return
      ctx.fillStyle = color
      for(const landmark of landmarks){
        const x = landmark.x * canvas.width
        const y = landmark.y * canvas.height
        ctx.beginPath()
        ctx.arc(x, y, 5, 0, 2 * Math.PI)
        ctx.fill()
      }
    }

    if(activeResults && activeResults.landmarks){
      for(const landmarks of activeResults.landmarks){
        drawLandmarks(landmarks, "red")
      }
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
    }
  })

</script>

<canvas class="active-camera-preview" bind:this={canvas}></canvas>

{@render children?.()}

<style>
  canvas {
    position: absolute;
    right: 1rem;
    bottom: 1rem;
    border-radius: 150px;
    aspect-ratio: 1.5 / 1;
    height: 150px;
    border: 2pt solid white;
  }
</style>