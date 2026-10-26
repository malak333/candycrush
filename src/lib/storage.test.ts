import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createGame, LEVEL_COUNT } from '../game'
import { defaultProgress, loadProgress, saveProgress, STORAGE_KEY } from './storage'
let data: Map<string, string>
const store = (overrides: Record<string, unknown> = {}) => {
  data.set(STORAGE_KEY, JSON.stringify({ version: 1, ...defaultProgress(), ...overrides }))
}
beforeEach(() => {
  data = new Map()
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => data.set(key, value),
  })
})
afterEach(() => vi.unstubAllGlobals())
describe('progress storage', () => {
  it('roundtrips complete 10,000-level progress without treating it as corrupt', () => {
    const complete = {
      ...defaultProgress(),
      unlocked: LEVEL_COUNT,
      stars: Object.fromEntries(Array.from({ length: LEVEL_COUNT }, (_, i) => [i + 1, 3])),
      best: Object.fromEntries(
        Array.from({ length: LEVEL_COUNT }, (_, i) => [i + 1, 1_000_000_000]),
      ),
      savedGame: createGame(LEVEL_COUNT, 12345),
    }
    expect(saveProgress(complete)).toBe(true)
    expect(data.get(STORAGE_KEY)!.length).toBeGreaterThan(100_000)
    expect(loadProgress()).toEqual(complete)
  })
  it('returns independent defaults when no save exists', () => {
    const first = loadProgress()
    first.stars[1] = 3
    expect(loadProgress()).toEqual(defaultProgress())
  })
  it('roundtrips progress and a validated deterministic board', () => {
    const progress = {
      ...defaultProgress(),
      unlocked: 2,
      stars: { 1: 3 },
      best: { 1: 1200 },
      savedGame: createGame(1, 12345),
    }
    expect(saveProgress(progress)).toBe(true)
    expect(loadProgress()).toEqual(progress)
    expect(JSON.parse(data.get(STORAGE_KEY)!).version).toBe(1)
  })
  it.each(['{broken', 'null', '[]', '{}'])(
    'recovers from malformed or incomplete save: %s',
    (raw) => {
      data.set(STORAGE_KEY, raw)
      expect(loadProgress()).toEqual(defaultProgress())
    },
  )
  it('rejects unsupported versions and incomplete progress', () => {
    store({ version: 2, unlocked: 5 })
    expect(loadProgress()).toEqual(defaultProgress())
    data.set(STORAGE_KEY, JSON.stringify({ version: 1, unlocked: 5, stars: {}, best: {} }))
    expect(loadProgress()).toEqual(defaultProgress())
  })
  it('discards a damaged board while retaining validated progress', () => {
    store({ unlocked: 3, stars: { 1: 3 }, savedGame: { board: [] } })
    expect(loadProgress()).toEqual({ ...defaultProgress(), unlocked: 3, stars: { 1: 3 } })
  })
  it('rejects a truncated board generated from a real saved game', () => {
    const game = createGame(1, 12345)
    store({ savedGame: { ...game, board: game.board.slice(0, 63) } })
    expect(loadProgress().savedGame).toBeNull()
  })
  it('drops a board above the unlocked level without discarding earned progress', () => {
    store({ unlocked: 2, stars: { 1: 2 }, savedGame: createGame(3, 15) })
    expect(loadProgress()).toEqual({ ...defaultProgress(), unlocked: 2, stars: { 1: 2 } })
  })
  it.each([
    { unlocked: -1 },
    { unlocked: 10001 },
    { unlocked: 1.5 },
    { stars: { 1: 4 } },
    { best: { 1: -5 } },
    { best: { strange: 100 } },
    { sound: 'yes' },
    { tutorialSeen: null },
  ])('rejects invalid metadata %j', (invalid) => {
    store(invalid)
    expect(loadProgress()).toEqual(defaultProgress())
  })
  it('rejects non-finite numbers', () => {
    expect(saveProgress({ ...defaultProgress(), best: { 1: Infinity } })).toBe(false)
    expect(saveProgress({ ...defaultProgress(), unlocked: NaN })).toBe(false)
    data.set(
      STORAGE_KEY,
      '{"version":1,"unlocked":1e999,"stars":{},"best":{},"sound":true,"tutorialSeen":false,"savedGame":null}',
    )
    expect(loadProgress()).toEqual(defaultProgress())
  })
  it('handles disabled and full storage', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('storage blocked')
      },
      setItem: () => {
        throw new Error('quota exceeded')
      },
    })
    expect(loadProgress()).toEqual(defaultProgress())
    expect(saveProgress(defaultProgress())).toBe(false)
  })
})
