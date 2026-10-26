import { isValidGameState, LEVEL_COUNT } from '../game'
import type { GameState } from '../game'
export const STORAGE_KEY = 'sugar-spell.progress.v1'
const VERSION = 1,
  MAX_LEVEL = LEVEL_COUNT,
  MAX_SCORE = 1_000_000_000
export interface Progress {
  unlocked: number
  stars: Record<number, number>
  best: Record<number, number>
  sound: boolean
  tutorialSeen: boolean
  savedGame: GameState | null
}
export function defaultProgress(): Progress {
  return { unlocked: 1, stars: {}, best: {}, sound: true, tutorialSeen: false, savedGame: null }
}
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
function integerIn(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= min && value <= max
}
function scoreMap(value: unknown, max: number): value is Record<number, number> {
  if (!isRecord(value)) return false
  const entries = Object.entries(value)
  return (
    entries.length <= MAX_LEVEL &&
    entries.every(
      ([key, score]) =>
        /^[1-9]\d*$/.test(key) && integerIn(Number(key), 1, MAX_LEVEL) && integerIn(score, 0, max),
    )
  )
}
function normalize(value: unknown): Progress | null {
  if (
    !isRecord(value) ||
    !integerIn(value.unlocked, 1, MAX_LEVEL) ||
    !scoreMap(value.stars, 3) ||
    !scoreMap(value.best, MAX_SCORE) ||
    typeof value.sound !== 'boolean' ||
    typeof value.tutorialSeen !== 'boolean'
  )
    return null
  return {
    unlocked: value.unlocked,
    stars: { ...value.stars },
    best: { ...value.best },
    sound: value.sound,
    tutorialSeen: value.tutorialSeen,
    savedGame:
      isValidGameState(value.savedGame) && value.savedGame.levelId <= value.unlocked
        ? value.savedGame
        : null,
  }
}
export function loadProgress(): Progress {
  try {
    if (typeof localStorage === 'undefined') return defaultProgress()
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === null || stored.length > 1_000_000) return defaultProgress()
    const parsed: unknown = JSON.parse(stored)
    if (!isRecord(parsed) || parsed.version !== VERSION) return defaultProgress()
    return normalize(parsed) ?? defaultProgress()
  } catch {
    return defaultProgress()
  }
}
export function saveProgress(progress: Progress): boolean {
  try {
    if (typeof localStorage === 'undefined') return false
    const safe = normalize(progress)
    if (!safe) return false
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: VERSION, ...safe }))
    return true
  } catch {
    return false
  }
}
