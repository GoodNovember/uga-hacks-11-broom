<script>
  import { onMount } from "svelte"
  import { T } from '@threlte/core'
  let {
    hand,
    index
  } = $props()

  onMount(()=>{
    console.log("hand", hand)
  })
</script>

{#if hand}
  <T.Group name={"hand-" + index}>
    {#each hand as landmark, j}
      <T.Mesh position={[landmark.x - 0.5, -(landmark.y - 0.5), -landmark.z]}>
        <T.SphereGeometry args={[0.02, 16, 16]} />
        <T.MeshBasicMaterial color="red" />
      </T.Mesh>
    {/each}
  </T.Group>
{/if}