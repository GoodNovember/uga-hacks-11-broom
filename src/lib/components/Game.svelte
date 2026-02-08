<script>
  import { getContext } from "svelte"
  import { Canvas } from "@threlte/core"
  import GameScene from "./GameScene.svelte"
  import { score, maxScore, gameWon } from "$lib/stores/game.js"
  import HandsInstructions from "./HandsInstructions.svelte";

  const handLandmarkContext = getContext("handLandmarker")
  const isPaused = $derived(handLandmarkContext?.paused ?? false)
  const pauseProgress = $derived(handLandmarkContext?.pauseProgress ?? 0)

  let gameWasWon = $derived($maxScore > 0 && $score >= $maxScore)
  let handInstructionsDialog = $state()

  $effect(() => {
    if (gameWasWon) {
      // Small delay so the last ring "collected" feedback is visible
      const timeout = setTimeout(() => { 
        $gameWon = true
       }, 600)
      return () => clearTimeout(timeout)
    } else {
      $gameWon = false
    }
  })
</script>

<div class="game-canvas-container">
  <Canvas>
    <GameScene />
  </Canvas>

  {#if isPaused && !$gameWon}
    <div class="pause-overlay">
      <div class="pause-text">PAUSED</div>
      <!-- <div class="pause-hint">Open palm / Start / Esc to resume</div> -->
      {#if pauseProgress > 0}
        <div class="pause-progress">
          <div class="pause-progress-bar" style:width="{pauseProgress * 100}%"></div>
        </div>
      {/if}
    </div>
  {/if}
</div>

<dialog bind:this={handInstructionsDialog} class="hand-instructions-dialog">
  <HandsInstructions/>
</dialog>

<style>
  .game-canvas-container {
    width: 100%;
    height: 100dvh;
    position: relative;
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
  .pause-progress {
    margin-top: 1.5rem;
    width: 200px;
    height: 6px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
    overflow: hidden;
  }
  .pause-progress-bar {
    height: 100%;
    background: cyan;
    border-radius: 3px;
    transition: width 0.1s linear;
  }
</style>
