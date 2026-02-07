<script lang="ts">
  import { onMount } from "svelte";
  import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";
  import HandLandmarkerContext from "$lib/components/HandLandmarkContext.svelte";
  import Game from "$lib/components/Game.svelte";

  let mediaDevices: MediaDeviceInfo[] = $state([])
  let chooseCameraDialog = $state<HTMLDialogElement>()
  let mediaDevice = $state()
  let handLandmarker = $state()

  let selectedMediaDeviceId = $state()

  // Loading stages
  let loadingStage = $state<"idle" | "wasm" | "model" | "camera" | "ready">("idle")
  let modelReady = $state(false)
  let cameraReady = $state(false)

  $effect(() => {
    if (modelReady && cameraReady) loadingStage = "ready"
  })

  async function populateVideoDevices(){
    await navigator.mediaDevices.getUserMedia({audio: false, video: true});
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(device => device.kind === 'videoinput');
    mediaDevices = videoDevices
  }

  onMount(async () => {
    // await populateVideoDevices()
    loadingStage = "wasm"
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );
    loadingStage = "model"
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
    modelReady = true
  })

  async function showCameraSelectionDialog(){
    await populateVideoDevices()
    const saved = localStorage.getItem("selectedCamera")
    if (saved && mediaDevices.some(d => d.deviceId === saved)) {
      selectedMediaDeviceId = saved
    }
    chooseCameraDialog?.showModal()
  }

  async function handleCloseCameraSelection(){
    if(!selectedMediaDeviceId) {
      throw new Error("No media device selected")
    }
    loadingStage = "camera"
    mediaDevice = await navigator.mediaDevices.getUserMedia({
      video: {
        deviceId: selectedMediaDeviceId
      }
    })
    localStorage.setItem("selectedCamera", String(selectedMediaDeviceId))
    cameraReady = true
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


{#if loadingStage === "ready" && mediaDevice}
  <HandLandmarkerContext {mediaDevice} {handLandmarker} >
    <Game />
  </HandLandmarkerContext>
{:else}
  <div class="full-screen">
    <div class="loading-container">
      {#if !cameraReady}
        <button onclick={showCameraSelectionDialog}>Choose a Camera</button>
      {/if}
<!-- 
      {#if loadingStage !== "idle" && loadingStage !== "ready"}
        <div class="progress-section">
          <div class="progress-bar-track">
            <div
              class="progress-bar-fill"
              style="width: {loadingStage === 'wasm' ? '20' : loadingStage === 'model' ? '50' : loadingStage === 'camera' ? (modelReady ? '90' : '70') : '100'}%"
            ></div>
          </div>
          <p class="loading-text">
            {#if loadingStage === "wasm"}
              Loading vision engine...
            {:else if loadingStage === "model"}
              Loading hand tracking model...
            {:else if loadingStage === "camera" && !modelReady}
              Loading hand tracking model...
            {:else if loadingStage === "camera"}
              Starting camera...
            {/if}
          </p>
        </div>
      {/if} -->
    </div>
  </div>
{/if}

<style>
  .full-screen {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    background: #1a1a2e;
  }
  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2rem;
  }
  .loading-container button {
    padding: 0.8rem 2rem;
    font-size: 1.1rem;
    border-radius: 8px;
    border: 2px solid #FFD700;
    background: transparent;
    color: #FFD700;
    cursor: pointer;
    transition: background 0.2s;
  }
  .loading-container button:hover {
    background: rgba(255, 215, 0, 0.15);
  }
  .progress-section {
    width: 280px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
  }
  .progress-bar-track {
    width: 100%;
    height: 6px;
    background: rgba(255, 255, 255, 0.15);
    border-radius: 3px;
    overflow: hidden;
  }
  .progress-bar-fill {
    height: 100%;
    background: #FFD700;
    border-radius: 3px;
    transition: width 0.4s ease;
  }
  .loading-text {
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.85rem;
    margin: 0;
  }
</style>
