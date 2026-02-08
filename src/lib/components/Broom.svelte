<script>
  import { T } from '@threlte/core'
  import { getContext } from 'svelte'
  import { RigidBody, Collider, usePhysicsTask } from '@threlte/rapier'
  import { Vector3, Quaternion, Euler } from 'three'
  import Dawg from './Dawg.svelte'

  let { rigidBody = $bindable() } = $props()

  const handStuff = getContext("handLandmarker")

  // Tuning
  const FORWARD_SPEED = 15
  const VELOCITY_LERP_SPEED = 12       // per-second rate (framerate-independent)
  const RISE_SPEED = 6                  // vertical speed when rising
  const LOWER_SPEED = 6                 // vertical speed when lowering
  const YAW_RATE = 4.5                  // rad/s max turning (bumped to compensate for curve)
  const ROTATION_LERP_SPEED = 5         // per-second rate (framerate-independent)
  const TURN_DEAD_ZONE = 0.08          // ignore tiny deflections
  const TURN_EXPONENT = 2.5            // power curve: higher = more center precision

  const localForward = new Vector3(0, 0, 1)
  const quat = new Quaternion()
  const targetQuat = new Quaternion()
  const targetEuler = new Euler()

  // Accumulated yaw (rate-based)
  let currentYaw = 0

  // Smoothed finger direction
  let smoothDirX = 0
  let smoothDirY = 0
  const DIR_SMOOTH_SPEED = 10  // per-second rate (framerate-independent)

  usePhysicsTask((delta) => {
    if (!rigidBody) return

    const gesture = handStuff?.gesture

    if (!gesture) {
      // Not pointing — freeze in place
      rigidBody.setLinvel({ x: 0, y: 0, z: 0 }, true)
      rigidBody.setAngvel({ x: 0, y: 0, z: 0 }, true)
      rigidBody.setGravityScale(0, true)
      return
    }

    rigidBody.setGravityScale(0, true)

    // Get finger direction from context
    const dir = handStuff?.fingerDirection ?? { x: 0, y: 0 }

    // Smooth the direction to avoid jitter (framerate-independent)
    const dirFactor = 1 - Math.exp(-DIR_SMOOTH_SPEED * delta)
    smoothDirX += (dir.x - smoothDirX) * dirFactor
    smoothDirY += (dir.y - smoothDirY) * dirFactor

    // Non-linear response curve: dead zone + power curve
    // Small deflections → nearly straight, large deflections → sharp turns
    let raw = smoothDirX
    if (Math.abs(raw) < TURN_DEAD_ZONE) raw = 0
    const yawInput = Math.sign(raw) * Math.pow(Math.abs(raw), TURN_EXPONENT)

    // Yaw: rate-based (finger left/right = continuous turning)
    currentYaw += yawInput * YAW_RATE * delta

    // Build target orientation (pitch fixed at 0)
    targetEuler.set(0, currentYaw, 0, 'YXZ')
    targetQuat.setFromEuler(targetEuler)

    const rot = rigidBody.rotation()
    quat.set(rot.x, rot.y, rot.z, rot.w)
    const rotFactor = 1 - Math.exp(-ROTATION_LERP_SPEED * delta)
    quat.slerp(targetQuat, rotFactor)

    // Apply rotation directly
    rigidBody.setRotation({ x: quat.x, y: quat.y, z: quat.z, w: quat.w }, true)
    rigidBody.setAngvel({ x: 0, y: 0, z: 0 }, true)

    // Forward velocity along heading (horizontal only)
    const worldForward = localForward.clone().applyQuaternion(quat)
    // Determine vertical speed from gesture
    let verticalSpeed = 0
    if (gesture === "rise") verticalSpeed = RISE_SPEED
    else if (gesture === "lower") verticalSpeed = -LOWER_SPEED

    const targetVel = {
      x: worldForward.x * FORWARD_SPEED,
      y: verticalSpeed,
      z: worldForward.z * FORWARD_SPEED
    }

    const velFactor = 1 - Math.exp(-VELOCITY_LERP_SPEED * delta)
    const currentVel = rigidBody.linvel()
    rigidBody.setLinvel(
      {
        x: currentVel.x + (targetVel.x - currentVel.x) * velFactor,
        y: currentVel.y + (targetVel.y - currentVel.y) * velFactor,
        z: currentVel.z + (targetVel.z - currentVel.z) * velFactor
      },
      true
    )
  })
</script>

<T.Group position={[0, 20, 0]}>
  <RigidBody
    type="dynamic"
    gravityScale={0}
    linearDamping={0}
    angularDamping={0}
    bind:rigidBody
  >
    <Collider shape="cuboid" args={[0.15, 0.1, 0.8]} />
    <Dawg >
      {#snippet fallback()}
        <T.Mesh>
          <T.BoxGeometry args={[0.3, 0.2, 1.6]} />
          <T.MeshStandardMaterial color="red" />
        </T.Mesh>
      {/snippet}
    </Dawg> 
  </RigidBody>
</T.Group>
