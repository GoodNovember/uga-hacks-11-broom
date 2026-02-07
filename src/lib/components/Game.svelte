<script>
  import { Canvas } from "@threlte/core"
  import GameScene from "./GameScene.svelte"
  import { score, maxScore, gameWon } from "$lib/stores/game.js"

  let gameWasWon = $derived($maxScore > 0 && $score >= $maxScore)

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

  function handlePlayAgain() {
    score.set(0)
    $gameWon = false
  }
</script>

<div class="game-canvas-container">
  <Canvas>
    <GameScene />
  </Canvas>
</div>

<style>
  .game-canvas-container {
    width: 100%;
    height: 100dvh;
    position: relative;
  }
</style>
