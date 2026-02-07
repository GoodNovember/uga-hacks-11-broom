<script>
  import { onMount } from "svelte";

  let {
    mediaDevice,
    handLandmarker
  } = $props()

  let canvas = $state()
  let ctx = $state()
  let mediaElement = document.createElement("video")

  let activeResults = $state(null)

  mediaElement.autoplay = true
  mediaElement.playsInline = true
  mediaElement.muted = true 
  $effect(()=>{
    mediaElement.srcObject = mediaDevice
    mediaElement.play().catch(() => {})
  })

  let handle = $state()

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
      const results = handLandmarker.detectForVideo(mediaElement, performance.now())
      activeResults = results
    }

    function drawLandmarks(landmarks, color){
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
    ctx = canvas.getContext("2d")
    handle = requestAnimationFrame(heartbeat)
    return () =>{
      cancelAnimationFrame(handle)
    }
  })

</script>

<div>
  <canvas bind:this={canvas}></canvas>
</div>

{#if activeResults}
  <pre>{JSON.stringify(activeResults, null, 2)}</pre>
{/if}