<script lang="ts">
  import { getContext } from 'svelte'
  import { T } from '@threlte/core'
  import { World } from '@threlte/rapier'
  import Broom from './Broom.svelte'
  import ChaseCamera from './ChaseCamera.svelte'
  import Environment from './Environment.svelte'
  import Ring from './Ring.svelte'
  import { maxScore, score, gameWon, gameKey } from '$lib/stores/game'
  import type { RigidBody } from '@threlte/rapier'
  import { Suspense, HTML, HUD, useViewport } from '@threlte/extras';

  let broomRigidBody = $state<RigidBody | undefined>(undefined)
  let totalRings = $state(10)

  const handLandmarkContext = getContext("handLandmarker")

  const isPaused = $derived.by(()=> handLandmarkContext?.paused)

  // Seeded random for ring placement
  function seededRandom(seed: number) {
    let s = seed
    return () => {
      s = (s * 16807 + 0) % 2147483647
      return s / 2147483647
    }
  }

  const vp = useViewport()

  $inspect(vp)

  const rand = seededRandom(123)

  const rings = $derived.by(()=> Array.from({ length: totalRings }, () => {
    const x = (rand() - 0.5) * 250
    const z = (rand() - 0.5) * 250
    const y = 10 + rand() * 40
    // Slight random tilt so they're not all flat
    const rx = (rand() - 0.5) * 0.6
    const ry = rand() * Math.PI * 2
    const rz = (rand() - 0.5) * 0.6
    return { position: [x, y, z], rotation: [rx, ry, rz] }
  }))

  $effect(()=>{
    $maxScore = totalRings
  })

  function handlePlayAgain() {
    $score = 0
    $gameWon = false
    $gameKey += 1
  }
</script>

<T.FogExp2 attach="fog" args={["#87CEEB", 0.003]} />


<Suspense>
  <World gravity={[0, -9.81, 0]}>
    <Environment />
    <Broom bind:rigidBody={broomRigidBody} />
    {#key $gameKey}
      {#each rings as ring}
        <Ring position={ring.position} rotation={ring.rotation} {broomRigidBody} />
      {/each}
    {/key}
    {#if broomRigidBody}
      <ChaseCamera rigidBody={broomRigidBody} />
    {/if}
    {#if !isPaused}
      <HUD>
        <HTML center>
          <div class="score-hud">
            Rings Collected: <span class="current score">{$score}</span> / <span class="max score">{$maxScore}</span>
          </div>
        </HTML>
      </HUD>
    {:else}
      <HUD>
        <HTML center>
          <div class="pause-overlay">
            <div class="pause-text">PAUSED</div>
          </div>
        </HTML>
      </HUD>
    {/if}

    {#if $gameWon}
      <HUD>
        <HTML center>
          <div class="congrats-overlay">
            <div class="congrats-card">
              <div class="congrats-sparkle">&#10024;</div>
              <h1 class="congrats-title">Congratulations!</h1>
              <p class="congrats-subtitle">You collected all {$maxScore} rings!</p>
              <div class="congrats-score">{$score} / {$maxScore}</div>
              <button class="congrats-btn" onclick={handlePlayAgain}>Play Again</button>
            </div>
          </div>
        </HTML>
      </HUD>
    {/if}
  </World>

  
  {#snippet fallback()}
    <T.Mesh>
      <T.BoxGeometry args={[1, 1, 3]} />
      <T.MeshStandardMaterial color="magenta" />
    </T.Mesh>
  {/snippet}
</Suspense>


<style>
  .score-hud {
    color: white;
    font-family: sans-serif;
    font-size: 1.2rem;
    white-space: nowrap;
  }
  .score-hud .score {
    font-weight: bold;
    color: #FFD700;
    text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
  }
  .score-hud .current {
    color: #ffe3a6;
  }
  .congrats-overlay {
    position: absolute;
    inset: 0;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(6px);
    animation: fadeIn 0.5s ease-out;
    user-select: none;
  }

  .congrats-card {
    text-align: center;
    padding: 3rem 4rem;
    border-radius: 1.5rem;
    background: radial-gradient(ellipse at top, rgba(255, 215, 0, 0.15), transparent 70%),
                rgba(20, 20, 40, 0.85);
    border: 1px solid rgba(255, 215, 0, 0.3);
    box-shadow: 0 0 60px rgba(255, 215, 0, 0.15);
    animation: scaleIn 0.4s ease-out;
  }

  .congrats-sparkle {
    font-size: 3rem;
    margin-bottom: 0.5rem;
    animation: pulse 1.5s ease-in-out infinite;
  }

  .congrats-title {
    font-size: 3rem;
    font-weight: 800;
    margin: 0 0 0.5rem;
    background: linear-gradient(135deg, #FFD700, #FFA500);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .congrats-subtitle {
    font-size: 1.2rem;
    color: rgba(255, 255, 255, 0.8);
    margin: 0 0 1.5rem;
  }

  .congrats-score {
    font-size: 2.5rem;
    font-weight: bold;
    color: #FFD700;
    text-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
    margin-bottom: 2rem;
  }

  .congrats-btn {
    padding: 0.8rem 2.5rem;
    font-size: 1.1rem;
    font-weight: 600;
    border: none;
    border-radius: 0.75rem;
    background: linear-gradient(135deg, #FFD700, #FFA500);
    color: #1a1a2e;
    cursor: pointer;
    transition: transform 0.15s, box-shadow 0.15s;
  }

  .congrats-btn:hover {
    transform: scale(1.05);
    box-shadow: 0 0 25px rgba(255, 215, 0, 0.4);
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes scaleIn {
    from { transform: scale(0.8); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }

  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.2); }
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
</style>