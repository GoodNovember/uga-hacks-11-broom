let audioContext = null
let gainNode = null
let sourceNode = null
let audioBuffer = null
let playing = false
let muted = false

const sfxCache = {}

export async function ensureContext() {
  if (!audioContext) {
    audioContext = new AudioContext()
    gainNode = audioContext.createGain()
    gainNode.connect(audioContext.destination)
  }
  if (audioContext.state === 'suspended') {
    await audioContext.resume()
  }
}

async function loadBuffer() {
  if (audioBuffer) return
  const response = await fetch('/wav/Sketchbook 2025-11-12.ogg')
  const arrayBuffer = await response.arrayBuffer()
  audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
}

async function loadSfx(url) {
  if (sfxCache[url]) return sfxCache[url]
  const response = await fetch(url)
  const arrayBuffer = await response.arrayBuffer()
  sfxCache[url] = await audioContext.decodeAudioData(arrayBuffer)
  return sfxCache[url]
}

export async function startMusic() {
  if (playing) return
  await ensureContext()
  await loadBuffer()

  sourceNode = audioContext.createBufferSource()
  sourceNode.buffer = audioBuffer
  sourceNode.loop = true
  sourceNode.connect(gainNode)
  gainNode.gain.value = muted ? 0 : 1
  sourceNode.start(0)
  playing = true
}

export function stopMusic() {
  if (!playing || !sourceNode) return
  sourceNode.stop()
  sourceNode.disconnect()
  sourceNode = null
  playing = false
}

export function setMuted(value) {
  muted = value
  if (gainNode) {
    gainNode.gain.value = muted ? 0 : 1
  }
}

export function isMuted() {
  return muted
}

export async function playSfx(url) {
  await ensureContext()
  const buffer = await loadSfx(url)
  const source = audioContext.createBufferSource()
  source.buffer = buffer
  source.connect(audioContext.destination)
  source.start(0)
}
