import { writable } from 'svelte/store'

export const score = writable(0)
export const maxScore = writable(0)
export const isPaused = writable(false)
export const gameWon = writable(false)
export const gameKey = writable(0)
