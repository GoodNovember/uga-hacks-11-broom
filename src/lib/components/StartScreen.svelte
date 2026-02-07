<script>
  import { T, useThrelte, useTask } from '@threlte/core'
  import { Suspense } from '@threlte/extras'
  import Dawg from './Dawg.svelte'
  import { Vector3 } from 'three'
  import { BackSide } from 'three'

  const { camera } = useThrelte()

  // Flight path parameters
  const PATH_RADIUS = 40
  const PATH_Y_BASE = 20
  const PATH_Y_AMP = 5
  const PATH_SPEED = 0.3

  // Camera orbit parameters
  const ORBIT_RADIUS = 4
  const ORBIT_HEIGHT = 1
  const ORBIT_SPEED = 0.15

  let pathT = $state(0)
  let cameraAngle = $state(0)
  let dawgRef = $state()

  const dawgPosition = new Vector3()
  const targetCamPos = new Vector3()
  const smoothLookTarget = new Vector3(0, PATH_Y_BASE, 0)

  const CAM_LERP_SPEED = 4

  // Seeded pseudo-random (same as Environment.svelte)
  function seededRandom(seed) {
    let s = seed
    return () => {
      s = (s * 16807 + 0) % 2147483647
      return s / 2147483647
    }
  }

  const rand = seededRandom(42)

  const trees = Array.from({ length: 80 }, () => {
    const x = (rand() - 0.5) * 400
    const z = (rand() - 0.5) * 400
    const height = 4 + rand() * 8
    const trunkRadius = 0.3 + rand() * 0.3
    const canopyRadius = 1.5 + rand() * 2
    return { x, z, height, trunkRadius, canopyRadius }
  })

  const rocks = Array.from({ length: 30 }, () => {
    const x = (rand() - 0.5) * 400
    const z = (rand() - 0.5) * 400
    const radius = 0.5 + rand() * 2
    const scaleY = 0.5 + rand() * 0.5
    return { x, z, radius, scaleY }
  })

  const towers = Array.from({ length: 15 }, () => {
    const x = (rand() - 0.5) * 300
    const z = (rand() - 0.5) * 300
    const height = 15 + rand() * 30
    const radius = 1 + rand() * 1.5
    return { x, z, height, radius }
  })

  useTask((delta) => {
    pathT += delta * PATH_SPEED

    // Figure-8 (lemniscate) path
    const x = PATH_RADIUS * Math.sin(pathT)
    const z = PATH_RADIUS * Math.sin(pathT) * Math.cos(pathT)
    const y = PATH_Y_BASE + PATH_Y_AMP * Math.sin(pathT * 2)

    dawgPosition.set(x, y, z)

    // Tangent for facing direction
    const dx = PATH_RADIUS * Math.cos(pathT)
    const dz = PATH_RADIUS * Math.cos(2 * pathT)
    const dawgYaw = Math.atan2(dx, dz)

    // Update Dawg transform
    if (dawgRef) {
      dawgRef.position.set(x, y, z)
      dawgRef.rotation.y = dawgYaw
    }

    // Camera orbit around dawg
    cameraAngle += delta * ORBIT_SPEED

    const camX = x + ORBIT_RADIUS * Math.cos(cameraAngle)
    const camZ = z + ORBIT_RADIUS * Math.sin(cameraAngle)
    const camY = y + ORBIT_HEIGHT

    targetCamPos.set(camX, camY, camZ)

    // Framerate-independent smooth camera (same technique as ChaseCamera)
    const lerpFactor = 1 - Math.exp(-CAM_LERP_SPEED * delta)
    camera.current.position.lerp(targetCamPos, lerpFactor)
    smoothLookTarget.lerp(dawgPosition, lerpFactor)
    camera.current.lookAt(smoothLookTarget)
  })
</script>

<T.FogExp2 attach="fog" args={["#87CEEB", 0.003]} />

<!-- Lighting -->
<T.AmbientLight intensity={0.4} />
<T.DirectionalLight position={[50, 100, 50]} intensity={1.2} />

<!-- Ground (no physics) -->
<T.Mesh position={[0, -0.5, 0]}>
  <T.BoxGeometry args={[1000, 1, 1000]} />
  <T.MeshStandardMaterial color="#4a7c4f" />
</T.Mesh>

<!-- Sky sphere -->
<T.Mesh>
  <T.SphereGeometry args={[500, 32, 32]} />
  <T.MeshBasicMaterial color="#87CEEB" side={BackSide} />
</T.Mesh>

<!-- Trees -->
{#each trees as tree}
  <T.Group position={[tree.x, 0, tree.z]}>
    <T.Mesh position={[0, tree.height / 2, 0]}>
      <T.CylinderGeometry args={[tree.trunkRadius, tree.trunkRadius * 1.2, tree.height, 6]} />
      <T.MeshStandardMaterial color="#5C4033" />
    </T.Mesh>
    <T.Mesh position={[0, tree.height + tree.canopyRadius * 0.6, 0]}>
      <T.ConeGeometry args={[tree.canopyRadius, tree.canopyRadius * 2, 6]} />
      <T.MeshStandardMaterial color="#2D5A1E" />
    </T.Mesh>
  </T.Group>
{/each}

<!-- Rocks -->
{#each rocks as rock}
  <T.Mesh position={[rock.x, rock.radius * rock.scaleY, rock.z]} scale={[1, rock.scaleY, 1]}>
    <T.SphereGeometry args={[rock.radius, 8, 6]} />
    <T.MeshStandardMaterial color="#888888" />
  </T.Mesh>
{/each}

<!-- Towers -->
{#each towers as tower}
  <T.Group position={[tower.x, 0, tower.z]}>
    <T.Mesh position={[0, tower.height / 2, 0]}>
      <T.CylinderGeometry args={[tower.radius, tower.radius * 1.2, tower.height, 8]} />
      <T.MeshStandardMaterial color="#A0522D" />
    </T.Mesh>
    <T.Mesh position={[0, tower.height, 0]}>
      <T.SphereGeometry args={[tower.radius * 1.3, 8, 8]} />
      <T.MeshStandardMaterial color="#C4A35A" />
    </T.Mesh>
  </T.Group>
{/each}

<!-- Dawg character flying on the path -->
<Suspense>
  <T.Group bind:ref={dawgRef}>
    <Dawg>
      {#snippet fallback()}
        <T.Mesh>
          <T.BoxGeometry args={[0.3, 0.2, 1.6]} />
          <T.MeshStandardMaterial color="red" />
        </T.Mesh>
      {/snippet}
    </Dawg>
  </T.Group>

  {#snippet fallback()}
    <T.Mesh position={[0, 20, 0]}>
      <T.BoxGeometry args={[0.3, 0.2, 1.6]} />
      <T.MeshStandardMaterial color="red" />
    </T.Mesh>
  {/snippet}
</Suspense>
