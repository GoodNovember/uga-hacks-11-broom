<script>
  import { onMount } from "svelte";
  import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";
  import MediaDeviceViewer from "$lib/components/MediaDeviceViewer.svelte";

  let mediaDevices = $state([])
  let chooseCameraDialog = $state()
  let mediaDevice = $state()
  let handLandmarker = $state()

  let selectedMediaDeviceId = $state()

  async function populateVideoDevices(){
    await navigator.mediaDevices.getUserMedia({audio: false, video: true});   
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(device => device.kind === 'videoinput');
    mediaDevices = videoDevices
  }

  onMount(async () => {
    await populateVideoDevices()
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );
    handLandmarker = await HandLandmarker.createFromOptions(
    vision,
    {
      baseOptions: {
        modelAssetPath: "/models/hand_landmarker.task",
        delegate: "GPU"
      },
      numHands: 1,
      runningMode: "VIDEO"
    });
  })

  function showCameraSelectionDialog(){
    chooseCameraDialog?.showModal()
  }

  async function handleCloseCameraSelection(){
    if(!selectedMediaDeviceId) {
      throw new Error("No media device selected")
    }
    mediaDevice = await navigator.mediaDevices.getUserMedia({
      video: {
        deviceId: selectedMediaDeviceId
      }
    })
    
    chooseCameraDialog?.close()
  }

</script>

<dialog bind:this={chooseCameraDialog}>
  <p>Which Camera should be used?</p>
  <div>
    {#each mediaDevices as device}
      <div>
        <input type="radio" id={device.deviceId} name="webcam" value={device.deviceId} bind:group={selectedMediaDeviceId}>
        <label for={device.deviceId}>{device.label || `Camera ${device.deviceId}`}</label>
      </div>
    {:else}
      <p>No video devices found?</p>
      <button onclick={populateVideoDevices}>Retry</button>
    {/each}
  </div>
  <div>
    <button disabled={!selectedMediaDeviceId} onclick={handleCloseCameraSelection}>Close</button>
  </div>
</dialog>


{#if mediaDevice}
  <MediaDeviceViewer {mediaDevice} {handLandmarker} />
{:else}
  <div>
    <button onclick={showCameraSelectionDialog}>Choose Camera</button>
  </div>
{/if}
