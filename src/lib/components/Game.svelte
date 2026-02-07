<script>
  import { Canvas } from "@threlte/core"
  import GameScene from "./GameScene.svelte"
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
    border: 1rem solid pink;    
  }
</style>