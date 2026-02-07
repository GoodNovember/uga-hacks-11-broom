<script>
  import { T } from '@threlte/core'
  import { World } from '@threlte/rapier'
  import Broom from './Broom.svelte'
  import ChaseCamera from './ChaseCamera.svelte'
  import Environment from './Environment.svelte'
  import Ring from './Ring.svelte'
  import { maxScore } from '$lib/stores/game';

  let broomRigidBody = $state(undefined)
  let totalRings = $state(20)

  // Seeded random for ring placement
  function seededRandom(seed) {
    let s = seed
    return () => {
      s = (s * 16807 + 0) % 2147483647
      return s / 2147483647
    }
  }

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
</script>

<T.FogExp2 attach="fog" args={["#87CEEB", 0.003]} />

<World gravity={[0, -9.81, 0]}>
  <Environment />

  <Broom bind:rigidBody={broomRigidBody} />

  {#each rings as ring}
    <Ring position={ring.position} rotation={ring.rotation} />
  {/each}

  {#if broomRigidBody}
    <ChaseCamera rigidBody={broomRigidBody} />
  {/if}
</World>
