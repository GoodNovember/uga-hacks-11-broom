<script>
  import { useThrelte, useTask } from '@threlte/core'
  import { Vector3, Quaternion } from 'three'

  let { rigidBody } = $props()

  const { camera } = useThrelte()

  const cameraOffset = new Vector3(0, 3, -8)
  const lookOffset = new Vector3(0, 1, 5)
  const currentPos = new Vector3(0, 25, -10)
  const targetPos = new Vector3()
  const lookTarget = new Vector3()
  const bodyPos = new Vector3()
  const quat = new Quaternion()

  const LERP_SPEED = 3

  useTask((delta) => {
    if (!rigidBody) return

    const pos = rigidBody.translation()
    const rot = rigidBody.rotation()
    bodyPos.set(pos.x, pos.y, pos.z)
    quat.set(rot.x, rot.y, rot.z, rot.w)

    // Ideal camera position: behind and above the broom
    targetPos.copy(cameraOffset).applyQuaternion(quat).add(bodyPos)

    // Framerate-independent smooth interpolation
    const lerpFactor = 1 - Math.exp(-LERP_SPEED * delta)
    currentPos.lerp(targetPos, lerpFactor)

    // Look target: ahead of the broom
    lookTarget.copy(lookOffset).applyQuaternion(quat).add(bodyPos)

    // Apply to camera
    camera.current.position.copy(currentPos)
    camera.current.lookAt(lookTarget)
  })
</script>
