<script>
  import { T } from '@threlte/core'
  import { RigidBody, Collider } from '@threlte/rapier'
  import { score } from '$lib/stores/game.js'

  let {
    position = [0, 0, 0],
    rotation = [0, 0, 0],
    ringRadius = 4,
    tubeRadius = 0.3
  } = $props()

  let scored = $state(false)

  function handleSensorEnter() {
    if (scored) return
    scored = true
    score.update(n => n + 1)
  }
</script>

<T.Group position.x={position[0]} position.y={position[1]} position.z={position[2]}
         rotation.x={rotation[0]} rotation.y={rotation[1]} rotation.z={rotation[2]}>
  <!-- Visual torus -->
  <T.Mesh>
    <T.TorusGeometry args={[ringRadius, tubeRadius, 16, 32]} />
    <T.MeshStandardMaterial
      color={scored ? "#44ff44" : "#FFD700"}
      emissive={scored ? "#22aa22" : "#FF8C00"}
      emissiveIntensity={scored ? 0.3 : 0.5}
    />
  </T.Mesh>

  <!-- Sensor collider at center to detect fly-throughs -->
  <RigidBody type="fixed">
    <Collider
      sensor
      shape="ball"
      args={[ringRadius * 0.7]}
      onsensorenter={handleSensorEnter}
    />
  </RigidBody>
</T.Group>
