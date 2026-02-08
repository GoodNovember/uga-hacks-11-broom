<script>
  import { useThrelte, useTask } from '@threlte/core'
  import { Vector3, Quaternion } from 'three'

  let { rigidBody } = $props()

  const { camera } = useThrelte()

  const cameraOffset = new Vector3(0, 3, -8)
  const lookOffset = new Vector3(0, 1, 5)
  const currentPos = new Vector3(0, 25, -10)
  const targetPos = new Vector3()
  const currentLookTarget = new Vector3()
  const smoothLookTarget = new Vector3()
  const bodyPos = new Vector3()
  const smoothBodyPos = new Vector3(0, 20, 0)
  const smoothBodyQuat = new Quaternion()
  const quat = new Quaternion()

  const BODY_LERP_SPEED = 20   // fast tracking of physics body (smooths discrete physics ticks)
  const CAM_LERP_SPEED = 4     // cinematic camera follow
  const LOOK_LERP_SPEED = 12   // smooth look-at to prevent orientation jitter
  let initialized = false

  useTask((delta) => {
    if (!rigidBody) return

    const pos = rigidBody.translation()
    const rot = rigidBody.rotation()
    bodyPos.set(pos.x, pos.y, pos.z)
    quat.set(rot.x, rot.y, rot.z, rot.w)

    // On first frame, snap to body position
    if (!initialized) {
      smoothBodyPos.copy(bodyPos)
      smoothBodyQuat.copy(quat)
      initialized = true
    }

    // Smooth the body position to bridge discrete physics ticks
    const bodyFactor = 1 - Math.exp(-BODY_LERP_SPEED * delta)
    smoothBodyPos.lerp(bodyPos, bodyFactor)
    smoothBodyQuat.slerp(quat, bodyFactor)

    // Ideal camera position: behind and above the smoothed broom position
    targetPos.copy(cameraOffset).applyQuaternion(smoothBodyQuat).add(smoothBodyPos)

    // Framerate-independent smooth camera interpolation
    const camFactor = 1 - Math.exp(-CAM_LERP_SPEED * delta)
    currentPos.lerp(targetPos, camFactor)

    // Look target: ahead of the smoothed broom position
    currentLookTarget.copy(lookOffset).applyQuaternion(smoothBodyQuat).add(smoothBodyPos)

    // Smooth the look-at target separately to prevent orientation jitter
    const lookFactor = 1 - Math.exp(-LOOK_LERP_SPEED * delta)
    smoothLookTarget.lerp(currentLookTarget, lookFactor)

    // Apply to camera
    camera.current.position.copy(currentPos)
    camera.current.lookAt(smoothLookTarget)
  })
</script>
