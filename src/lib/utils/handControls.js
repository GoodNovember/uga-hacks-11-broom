/**
 * Hand gesture detection for broom flight controls.
 *
 * Gestures:
 *   "point"  — index only         → fly forward, turn with finger angle
 *   "rise"   — index + middle     → fly forward + rise, turn with finger angle
 *   "lower"  — index + middle + ring → fly forward + descend, turn with finger angle
 *   null     — no gesture         → stop
 *
 * MediaPipe landmark indices:
 *   0 = WRIST
 *   5 = INDEX_MCP, 6 = INDEX_PIP, 7 = INDEX_DIP, 8 = INDEX_TIP
 *   9 = MIDDLE_MCP, 10 = MIDDLE_PIP, 11 = MIDDLE_DIP, 12 = MIDDLE_TIP
 *   13 = RING_MCP, 14 = RING_PIP, 15 = RING_DIP, 16 = RING_TIP
 *   17 = PINKY_MCP, 18 = PINKY_PIP, 19 = PINKY_DIP, 20 = PINKY_TIP
 *
 * @typedef {{ x: number, y: number, z: number }} Landmark
 * @typedef {"point" | "rise" | "lower" | null} FlightGesture
 */

/**
 * 3D distance between two landmarks (uses x, y, and z for perspective robustness).
 * @param {Landmark} a
 * @param {Landmark} b
 */
function dist(a, b) {
  const dx = a.x - b.x
  const dy = a.y - b.y
  const dz = (a.z || 0) - (b.z || 0)
  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}

/**
 * Compute the angle (in degrees) at joint B given three points A-B-C.
 * @param {Landmark} a
 * @param {Landmark} b
 * @param {Landmark} c
 */
function jointAngle(a, b, c) {
  const baX = a.x - b.x, baY = a.y - b.y, baZ = (a.z || 0) - (b.z || 0)
  const bcX = c.x - b.x, bcY = c.y - b.y, bcZ = (c.z || 0) - (b.z || 0)
  const dot = baX * bcX + baY * bcY + baZ * bcZ
  const magBA = Math.sqrt(baX * baX + baY * baY + baZ * baZ)
  const magBC = Math.sqrt(bcX * bcX + bcY * bcY + bcZ * bcZ)
  if (magBA === 0 || magBC === 0) return 180
  const cosAngle = dot / (magBA * magBC)
  return Math.acos(Math.max(-1, Math.min(1, cosAngle))) * (180 / Math.PI)
}

/**
 * Check if a finger is extended by looking at the angle at PIP joint.
 * @param {Landmark[]} lm
 * @param {number} mcp
 * @param {number} pip
 * @param {number} dip
 * @param {number} tip
 * @param {number} threshold - angle in degrees above which finger is "extended"
 */
function isFingerExtended(lm, mcp, pip, dip, tip, threshold) {
  const pipAngle = jointAngle(lm[mcp], lm[pip], lm[dip])
  return pipAngle > threshold
}

/**
 * Detect the current flight gesture.
 *
 * @param {Landmark[] | null | undefined} landmarks
 * @returns {FlightGesture}
 */
export function detectGesture(landmarks) {
  if (!landmarks || landmarks.length < 21) return null

  const index = isFingerExtended(landmarks, 5, 6, 7, 8, 140)
  const middle = isFingerExtended(landmarks, 9, 10, 11, 12, 160)
  const ring = isFingerExtended(landmarks, 13, 14, 15, 16, 160)
  const pinky = isFingerExtended(landmarks, 17, 18, 19, 20, 160)

  if (!index) return null

  // All fingers open → halt (treat like no gesture)
  if (index && middle && ring && pinky) return null

  // Index + middle + ring → lower
  if (index && middle && ring) return "lower"

  // Index + middle only → rise
  if (index && middle && !ring) return "rise"

  // Index only → point (fly level)
  if (index && !middle && !ring && !pinky) return "point"

  return null
}

// Keep isPointing as a convenience wrapper
/** @param {Landmark[] | null | undefined} landmarks */
export function isPointing(landmarks) {
  return detectGesture(landmarks) !== null
}

/**
 * Check if the hand is in a fist (all fingers curled).
 * @param {Landmark[] | null | undefined} landmarks
 * @returns {boolean}
 */
export function isFist(landmarks) {
  if (!landmarks || landmarks.length < 21) return false
  const index = isFingerExtended(landmarks, 5, 6, 7, 8, 140)
  const middle = isFingerExtended(landmarks, 9, 10, 11, 12, 160)
  const ring = isFingerExtended(landmarks, 13, 14, 15, 16, 160)
  const pinky = isFingerExtended(landmarks, 17, 18, 19, 20, 160)
  return !index && !middle && !ring && !pinky
}
