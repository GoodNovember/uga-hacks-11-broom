<script lang="ts">
  import { onMount } from "svelte";
  import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";
  import HandLandmarkerContext from "$lib/components/HandLandmarkContext.svelte";
  import Game from "$lib/components/Game.svelte";
  import StartScreen from "$lib/components/StartScreen.svelte";
  import StartScreenUI from "$lib/components/StartScreenUI.svelte";
  import { Canvas } from "@threlte/core";
  import KeyboardMouseContext from "$lib/components/KeyboardMouseContext.svelte";
  import GamepadContext from "$lib/components/GamepadContext.svelte";
  import TouchContext from "$lib/components/TouchContext.svelte";
  import { gameState, inputMode } from "$lib/stores/game";

  let mediaDevices: MediaDeviceInfo[] = $state([])
  let chooseCameraDialog = $state<HTMLDialogElement>()
  let mediaDevice = $state()
  let handLandmarker = $state()

  let selectedMediaDeviceId = $state()

  let modelReady = $state(false)
  let cameraReady = $state(false)

  // Feature detection flags
  let hasCamera = $state(false)
  let hasPointer = $state(typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches)
  let hasGamepad = $state(false)
  let hasTouch = $state(typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0))

  onMount(() => {
    // Detect cameras — need a brief getUserMedia call first so the browser
    // populates the device list (some browsers hide devices until permission is granted)
    if (navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
          stream.getTracks().forEach(t => t.stop())
          return navigator.mediaDevices.enumerateDevices()
        })
        .then(devices => {
          hasCamera = devices.some(d => d.kind === 'videoinput')
        })
        .catch(() => {})
    }

    // Detect gamepads (already connected or newly connected)
    if (navigator.getGamepads) {
      hasGamepad = Array.from(navigator.getGamepads()).some(g => g !== null)
    }
    const onGamepadConnected = () => { hasGamepad = true }
    const onGamepadDisconnected = () => {
      hasGamepad = navigator.getGamepads
        ? Array.from(navigator.getGamepads()).some(g => g !== null)
        : false
    }
    window.addEventListener('gamepadconnected', onGamepadConnected)
    window.addEventListener('gamepaddisconnected', onGamepadDisconnected)

    return () => {
      window.removeEventListener('gamepadconnected', onGamepadConnected)
      window.removeEventListener('gamepaddisconnected', onGamepadDisconnected)
    }
  })

  // Load hand tracking in the background immediately
  onMount(async () => {
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
    modelReady = true
  })

  // Transition to playing once both model and camera are ready
  $effect(() => {
    if ($gameState === 'loading' && modelReady && cameraReady) {
      $gameState = 'playing'
    }
  })

  async function populateVideoDevices(){
    await navigator.mediaDevices.getUserMedia({audio: false, video: true});
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(device => device.kind === 'videoinput');
    mediaDevices = videoDevices
  }

  function handlePlay() {
    $inputMode = 'hands'
    $gameState = 'loading'
    showCameraSelectionDialog()
  }

  function handlePlayKeyboard() {
    $inputMode = 'keyboard'
    $gameState = 'playing'
  }

  function handlePlayGamepad() {
    $inputMode = 'gamepad'
    $gameState = 'playing'
  }

  function handlePlayTouch() {
    $inputMode = 'touch'
    $gameState = 'playing'
  }

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

{#if $gameState === 'playing' && $inputMode === 'hands' && mediaDevice}
  <HandLandmarkerContext {mediaDevice} {handLandmarker} >
    <Game />
  </HandLandmarkerContext>
{:else if $gameState === 'playing' && $inputMode === 'keyboard'}
  <KeyboardMouseContext>
    <Game />
  </KeyboardMouseContext>
{:else if $gameState === 'playing' && $inputMode === 'gamepad'}
  <GamepadContext>
    <Game />
  </GamepadContext>
{:else if $gameState === 'playing' && $inputMode === 'touch'}
  <TouchContext>
    <Game />
  </TouchContext>
{:else}
  <div class="start-canvas-container">
    <Canvas>
      <StartScreen />
    </Canvas>
    <StartScreenUI onPlay={handlePlay} onPlayKeyboard={handlePlayKeyboard} onPlayGamepad={handlePlayGamepad} onPlayTouch={handlePlayTouch} {hasCamera} {hasPointer} {hasGamepad} {hasTouch} />
    {#if $gameState === 'loading'}
      <div class="loading-indicator">
        {#if !modelReady}
          Loading hand tracking...
        {:else if !cameraReady}
          Waiting for camera...
        {/if}
      </div>
    {/if}
  </div>
{/if}

<style>
  .start-canvas-container {
    width: 100%;
    height: 100dvh;
    position: relative;
  }

  .loading-indicator {
    position: absolute;
    bottom: 2rem;
    left: 50%;
    transform: translateX(-50%);
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.9rem;
    z-index: 10;
  }
</style>
