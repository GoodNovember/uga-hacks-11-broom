<script>
  import { T } from '@threlte/core'
  import { getContext } from 'svelte';
    import ThreeDHand from './ThreeDHand.svelte';

  const handStuff = getContext("handLandmarker")

  let results = $derived.by(()=>{
    return handStuff?.results
  })

</script>

{#if results}
  {#each results.landmarks as hand, i}
    <ThreeDHand {hand} index={i} />
  {/each}
{/if}
