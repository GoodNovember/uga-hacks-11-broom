<script>
  import { T } from '@threlte/core'
  import { RigidBody, Collider } from '@threlte/rapier'
  import { BackSide } from 'three'

  // Seeded pseudo-random for consistent layout
  function seededRandom(seed) {
    let s = seed
    return () => {
      s = (s * 16807 + 0) % 2147483647
      return s / 2147483647
    }
  }

  const rand = seededRandom(42)

  // Generate scattered trees
  const trees = Array.from({ length: 80 }, () => {
    const x = (rand() - 0.5) * 400
    const z = (rand() - 0.5) * 400
    const height = 4 + rand() * 8
    const trunkRadius = 0.3 + rand() * 0.3
    const canopyRadius = 1.5 + rand() * 2
    return { x, z, height, trunkRadius, canopyRadius }
  })

  // Generate some rocks/boulders
  const rocks = Array.from({ length: 30 }, () => {
    const x = (rand() - 0.5) * 400
    const z = (rand() - 0.5) * 400
    const radius = 0.5 + rand() * 2
    const scaleY = 0.5 + rand() * 0.5
    return { x, z, radius, scaleY }
  })

  // Generate tall towers/pillars to weave through
  const towers = Array.from({ length: 15 }, () => {
    const x = (rand() - 0.5) * 300
    const z = (rand() - 0.5) * 300
    const height = 15 + rand() * 30
    const radius = 1 + rand() * 1.5
    return { x, z, height, radius }
  })
</script>

<!-- Ambient light -->
<T.AmbientLight intensity={0.4} />

<!-- Directional light (sun) -->
<T.DirectionalLight position={[50, 100, 50]} intensity={1.2} />

<!-- Ground plane -->
<T.Group position={[0, 0, 0]}>
  <RigidBody type="fixed">
    <Collider shape="cuboid" args={[500, 0.5, 500]} />
    <T.Mesh position={[0, -0.5, 0]}>
      <T.BoxGeometry args={[1000, 1, 1000]} />
      <T.MeshStandardMaterial color="#4a7c4f" />
    </T.Mesh>
  </RigidBody>
</T.Group>

<!-- Sky sphere -->
<T.Mesh>
  <T.SphereGeometry args={[500, 32, 32]} />
  <T.MeshBasicMaterial color="#87CEEB" side={BackSide} />
</T.Mesh>

<!-- <Sky /> -->

<!-- Trees -->
{#each trees as tree}
  <T.Group position={[tree.x, 0, tree.z]}>
    <!-- Trunk -->
    <T.Mesh position={[0, tree.height / 2, 0]}>
      <T.CylinderGeometry args={[tree.trunkRadius, tree.trunkRadius * 1.2, tree.height, 6]} />
      <T.MeshStandardMaterial color="#5C4033" />
    </T.Mesh>
    <!-- Canopy -->
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

<!-- Towers to weave through -->
{#each towers as tower}
  <T.Group position={[tower.x, 0, tower.z]}>
    <T.Mesh position={[0, tower.height / 2, 0]}>
      <T.CylinderGeometry args={[tower.radius, tower.radius * 1.2, tower.height, 8]} />
      <T.MeshStandardMaterial color="#A0522D" />
    </T.Mesh>
    <!-- Cap on top -->
    <T.Mesh position={[0, tower.height, 0]}>
      <T.SphereGeometry args={[tower.radius * 1.3, 8, 8]} />
      <T.MeshStandardMaterial color="#C4A35A" />
    </T.Mesh>
  </T.Group>
{/each}
