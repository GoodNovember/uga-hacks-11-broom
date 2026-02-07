<script>
  import { Canvas } from "@threlte/core"
  import GameScene from "./GameScene.svelte"
  import { score, maxScore } from "$lib/stores/game.js"
</script>

<div class="game-canvas-container">
  <Canvas>
    <GameScene />
  </Canvas>
  <div class="score-hud">
    <span class="score-label">Score</span>
    <span class="score-value">{$score}/{$maxScore}</span>
  </div>
</div>
<style>
  .game-canvas-container {
    width: 100%;
    height: 100dvh;
    position: relative;
  }
  .score-hud {
    position: absolute;
    top: 1.5rem;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    z-index: 5;
    pointer-events: none;
  }
  .score-label {
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.6);
    text-transform: uppercase;
    letter-spacing: 0.2em;
  }
  .score-value {
    font-size: 3rem;
    font-weight: bold;
    color: #FFD700;
    text-shadow: 0 0 15px rgba(255, 215, 0, 0.5);
  }
</style>
