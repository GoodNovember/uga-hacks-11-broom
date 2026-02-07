<script>
  import { T } from '@threlte/core'
  import { getContext } from 'svelte';

  const handStuff = getContext("handLandmarker")

  let results = $derived.by(()=>{
    return handStuff?.results
  })

</script>

{#if results}
  {#each results.landmarks as hand, i}
    {#each hand as landmark, j}
      <T.Mesh position={[landmark.x - 0.5, -(landmark.y - 0.5), -landmark.z]}>
        <T.SphereGeometry args={[0.02, 16, 16]} />
        <T.MeshBasicMaterial color="red" />
      </T.Mesh>
    {/each}
  {/each}
{/if}
