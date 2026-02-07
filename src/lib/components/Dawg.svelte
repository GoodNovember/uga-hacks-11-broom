<script>
  import { T } from "@threlte/core";
  import { useSuspense } from "@threlte/extras";
  import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
  import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'

  let { fallback, error, children, ref = $bindable(), ...props } = $props();

  const suspend = useSuspense()

  const gl = new GLTFLoader()

  const dl = new DRACOLoader()

  dl.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/')

  gl.setDRACOLoader(dl)

  function loadGltf(url) {
    return new Promise((resolve, reject) => {
      gl.load(
        url,
        (gltf) => {
          resolve(gltf)
        },
        undefined,
        (err) => reject(err)
      );
    });
  }

  const gltfPromise = suspend(loadGltf("/gltf/dawg-transformed.glb"))

</script>

<T.Group bind:ref dispose={false} {...props}>
  {#await gltfPromise}
    {@render fallback?.()}
  {:then gltf}
    <T.Object3D is={gltf.scene} />
  {:catch err}
    {@render error?.({ error: err })}
  {/await}
  {@render children?.({ ref })}
</T.Group>
