import { describe, expect, it } from 'vitest'
import {
  CURATED_LEVELS,
  LEVEL_COUNT,
  createGame,
  findHint,
  getLevel,
  isValidGameState,
  swap,
} from './index'

function lineCapacity(blockers: number[], index: number, step: number): number {
  let count = 1
  for (const dir of [-1, 1]) {
    let at = index
    for (;;) {
      const next = at + dir * step
      if (
        next < 0 ||
        next >= 64 ||
        (step === 1 && Math.floor(next / 8) !== Math.floor(at / 8)) ||
        blockers[next]
      )
        break
      count++
      at = next
    }
  }
  return count
}

describe('10,000-level campaign', () => {
  it('validates all definitions and reachable generated objective layouts', () => {
    expect(LEVEL_COUNT).toBe(10_000)
    expect(CURATED_LEVELS).toHaveLength(20)
    for (let id = 1; id <= LEVEL_COUNT; id++) {
      const l = getLevel(id)
      const valid =
        l.id === id &&
        l.jelly.length === 64 &&
        l.blockers.length === 64 &&
        l.moves > 0 &&
        l.moves <= 50 &&
        l.starScores[0] === l.targetScore &&
        l.starScores[1] > l.starScores[0] &&
        l.starScores[2] > l.starScores[1] &&
        l.clearJelly === l.jelly.some(Boolean) &&
        l.clearBlockers === l.blockers.some(Boolean) &&
        [...l.jelly, ...l.blockers].every((n) => Number.isInteger(n) && n >= 0 && n <= 2)
      if (!valid) throw new Error(`Invalid level definition: ${id}`)
      if (id <= 20) continue
      if (l.jelly.filter(Boolean).length > 36 || l.blockers.filter(Boolean).length > 10)
        throw new Error(`Unbounded objectives: ${id}`)
      for (let i = 0; i < 64; i++) {
        if (l.jelly[i] && l.blockers[i])
          throw new Error(`Overlapping generated objectives: ${id}/${i}`)
        if (
          !l.blockers[i] &&
          Math.max(lineCapacity(l.blockers, i, 1), lineCapacity(l.blockers, i, 8)) < 3
        )
          throw new Error(`Isolated candy: ${id}/${i}`)
      }
      for (let r = 1; r <= 6; r++)
        for (let c = 1; c <= 6; c++)
          if (l.blockers[r * 8 + c]) throw new Error(`Blocked interior: ${id}`)
    }
  }, 60_000)

  it('initializes every level as a stable playable saved game', () => {
    for (let id = 1; id <= LEVEL_COUNT; id++) {
      const game = createGame(id, id * 104729)
      if (game.levelId !== id || !isValidGameState(game) || !findHint(game))
        throw new Error(`Unplayable starting board: ${id}`)
    }
  }, 60_000)

  it('regenerates identical definitions after bounded cache eviction', () => {
    for (const id of [21, 512, 9999, 10000]) {
      const expected = JSON.stringify(getLevel(id))
      for (let other = 1000; other < 1200; other++) getLevel(other)
      expect(JSON.stringify(getLevel(id))).toBe(expected)
    }
  })

  it.each([0, -1, 10001, 1.5, NaN, Infinity])('rejects unsupported level %s', (id) =>
    expect(() => getLevel(id)).toThrow(RangeError),
  )

  it('replays representative generated modes and difficulty boundaries to terminal states', () => {
    const ids = [...Array.from({ length: 10 }, (_, i) => 21 + i), 270, 271, 2020, 2021, 9999, 10000]
    for (const id of ids)
      for (const seed of [42, 1729, 104729]) {
        let game = createGame(id, seed)
        for (let turn = 0; game.status === 'playing' && turn < getLevel(id).moves; turn++) {
          const hint = findHint(game)!
          const result = swap(game, ...hint)
          expect(result.valid).toBe(true)
          expect(result).toEqual(swap(game, ...hint))
          game = result.game
          expect(isValidGameState(game)).toBe(true)
        }
        expect(game.status).not.toBe('playing')
      }
  }, 30_000)
})
