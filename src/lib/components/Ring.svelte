<script>
  import { T, useTask } from '@threlte/core'
  import { RigidBody, Collider } from '@threlte/rapier'
  import { score } from '$lib/stores/game.js'
  import { Vector3, Euler, Quaternion, DoubleSide } from 'three'

  let {
    position = [0, 0, 0],
    rotation = [0, 0, 0],
    ringRadius = 4,
    tubeRadius = 0.3,
    broomRigidBody = undefined
  } = $props()

  let scored = $state(false)

  function handleSensorEnter() {
    if (scored) return
    scored = true
    score.update(n => n + 1)
  }

  // Guide crosshair — always mounted, controlled via ref
  let horizRef = $state(null)
  let vertRef = $state(null)

  // Precompute inverse ring rotation for local-space transform
  const ringQuat = new Quaternion().setFromEuler(
    new Euler(rotation[0], rotation[1], rotation[2], 'XYZ')
  )
  const ringQuatInv = ringQuat.clone().invert()
  const ringPos = new Vector3(position[0], position[1], position[2])
  const tempVec = new Vector3()

  const GUIDE_RANGE = 80
  const GUIDE_FADE_START = 50
  const MAX_OFFSET = ringRadius * 0.85
  const velVec = new Vector3()
  const toRing = new Vector3()
  const ringNormal = new Vector3(0, 0, 1).applyQuaternion(ringQuat)

  useTask(() => {
    if (!horizRef || !vertRef) return

    if (!broomRigidBody || scored) {
      horizRef.visible = false
      vertRef.visible = false
      return
    }

    const bPos = broomRigidBody.translation()
    tempVec.set(bPos.x, bPos.y, bPos.z)

    // Distance from broom to ring center
    toRing.copy(ringPos).sub(tempVec)
    const dist = toRing.length()

    if (dist > GUIDE_RANGE) {
      horizRef.visible = false
      vertRef.visible = false
      return
    }

    // Fade: full opacity when close, fading out toward range limit
    let opacity
    if (dist < GUIDE_FADE_START) {
      opacity = 0.6
    } else {
      opacity = 0.6 * (1 - (dist - GUIDE_FADE_START) / (GUIDE_RANGE - GUIDE_FADE_START))
    }

    // Get broom velocity for trajectory prediction
    const bVel = broomRigidBody.linvel()
    velVec.set(bVel.x, bVel.y, bVel.z)
    const speed = velVec.length()

    // Ray-plane intersection: find where broom's velocity ray hits ring's plane
    // Ring plane: normal = ringNormal, point = ringPos
    // Ray: origin = bPos, direction = velVec
    const denom = velVec.dot(ringNormal)

    let localX, localY

    if (speed < 0.5 || Math.abs(denom) < 0.001) {
      // Broom is nearly stationary or moving parallel to ring plane
      // Fall back to position-based projection
      tempVec.set(bPos.x - ringPos.x, bPos.y - ringPos.y, bPos.z - ringPos.z)
      tempVec.applyQuaternion(ringQuatInv)
      localX = tempVec.x
      localY = tempVec.y
    } else {
      // Compute t where ray hits ring plane
      // t = dot(ringPos - bPos, normal) / dot(vel, normal)
      const t = toRing.dot(ringNormal) / denom

      if (t < 0) {
        // Ring is behind the broom (moving away) — hide guides
        horizRef.visible = false
        vertRef.visible = false
        return
      }

      // Intersection point in world space
      tempVec.set(
        bPos.x + velVec.x * t,
        bPos.y + velVec.y * t,
        bPos.z + velVec.z * t
      )

      // Convert to ring local space
      tempVec.sub(ringPos)
      tempVec.applyQuaternion(ringQuatInv)
      localX = tempVec.x
      localY = tempVec.y
    }

    const clampedY = Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, localY))
    const clampedX = Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, localX))

    horizRef.visible = true
    horizRef.position.y = clampedY
    horizRef.material.opacity = opacity

    vertRef.visible = true
    vertRef.position.x = clampedX
    vertRef.material.opacity = opacity
  })
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

  <!-- Horizontal guide: shows height alignment (always mounted, visibility controlled in useTask) -->
  <T.Mesh bind:ref={horizRef} visible={false}>
    <T.BoxGeometry args={[ringRadius * 1.8, 0.12, 0.12]} />
    <T.MeshBasicMaterial color="#ff2299" transparent opacity={0} depthTest={false} side={DoubleSide} />
  </T.Mesh>

  <!-- Vertical guide: shows lateral alignment -->
  <T.Mesh bind:ref={vertRef} visible={false}>
    <T.BoxGeometry args={[0.12, ringRadius * 1.8, 0.12]} />
    <T.MeshBasicMaterial color="#ff2299" transparent opacity={0} depthTest={false} side={DoubleSide} />
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
