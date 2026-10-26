import { COLORS, SIZE } from './types'
import type { ActionResult, Booster, Candy, GameEvent, GameState, Special } from './types'
import { getLevel, LEVEL_COUNT } from './levels'
const COUNT = SIZE * SIZE
const SPECIALS: readonly Special[] = ['none', 'striped-h', 'striped-v', 'wrapped', 'color-bomb']
interface Run {
  indices: number[]
  axis: 'h' | 'v'
}
interface Match {
  indices: number[]
  runs: Run[]
}
const inBounds = (i: number): boolean => Number.isInteger(i) && i >= 0 && i < COUNT
const adjacent = (a: number, b: number): boolean =>
  inBounds(a) &&
  inBounds(b) &&
  Math.abs(Math.floor(a / SIZE) - Math.floor(b / SIZE)) + Math.abs((a % SIZE) - (b % SIZE)) === 1
function clone(game: GameState): GameState {
  return {
    ...game,
    board: game.board.map((c) => (c ? { ...c } : null)),
    jelly: [...game.jelly],
    blockers: [...game.blockers],
    boosters: { ...game.boosters },
  }
}
function seedNumber(seed: number | string): number {
  if (typeof seed === 'number') return (Number.isFinite(seed) ? seed >>> 0 : 1) || 1
  let hash = 2166136261
  for (let i = 0; i < seed.length; i++) hash = Math.imul(hash ^ seed.charCodeAt(i), 16777619)
  return hash >>> 0 || 1
}
function random(game: GameState): number {
  let n = game.rngState
  n ^= n << 13
  n ^= n >>> 17
  n ^= n << 5
  game.rngState = n >>> 0 || 1
  return game.rngState / 4294967296
}
function candy(game: GameState, color = Math.floor(random(game) * COLORS)): Candy {
  return { id: game.nextId++, color, special: 'none' }
}
function matchColor(cell: Candy | null | undefined): number {
  return cell && cell.special !== 'color-bomb' ? cell.color : -1
}
function matches(board: (Candy | null)[]): Match[] {
  const runs: Run[] = []
  for (const axis of ['h', 'v'] as const) {
    for (let line = 0; line < SIZE; line++) {
      let start = 0
      while (start < SIZE) {
        const at = (pos: number): number => (axis === 'h' ? line * SIZE + pos : pos * SIZE + line)
        const color = matchColor(board[at(start)])
        let end = start + 1
        while (color >= 0 && end < SIZE && matchColor(board[at(end)]) === color) end++
        if (color >= 0 && end - start >= 3)
          runs.push({ axis, indices: Array.from({ length: end - start }, (_, p) => at(start + p)) })
        start = end
      }
    }
  }
  const groups: Match[] = []
  for (const run of runs) {
    const group: Match = { indices: [...run.indices], runs: [run] }
    for (let i = groups.length - 1; i >= 0; i--) {
      if (groups[i]!.indices.some((index) => group.indices.includes(index))) {
        const other = groups.splice(i, 1)[0]!
        group.indices = [...new Set([...group.indices, ...other.indices])]
        group.runs.push(...other.runs)
      }
    }
    groups.push(group)
  }
  return groups
}
function combo(a: Candy, b: Candy): boolean {
  return (
    a.special === 'color-bomb' ||
    b.special === 'color-bomb' ||
    (a.special !== 'none' && b.special !== 'none')
  )
}
export function findHint(game: GameState): [number, number] | null {
  if (game.status !== 'playing') return null
  for (let a = 0; a < COUNT; a++) {
    for (const b of [a + 1, a + SIZE]) {
      if (
        !adjacent(a, b) ||
        !game.board[a] ||
        !game.board[b] ||
        game.blockers[a] ||
        game.blockers[b]
      )
        continue
      if (combo(game.board[a]!, game.board[b]!)) return [a, b]
      const board = [...game.board]
      ;[board[a], board[b]] = [board[b]!, board[a]!]
      if (matches(board).some((group) => group.indices.includes(a) || group.indices.includes(b)))
        return [a, b]
    }
  }
  return null
}
function freshBoard(game: GameState, preserve = false): void {
  for (let i = 0; i < COUNT; i++) {
    if (game.blockers[i]) {
      game.board[i] = null
      continue
    }
    const start = Math.floor(random(game) * COLORS)
    let color = start
    for (let offset = 0; offset < COLORS; offset++) {
      color = (start + offset) % COLORS
      if (
        i % SIZE >= 2 &&
        matchColor(game.board[i - 1]) === color &&
        matchColor(game.board[i - 2]) === color
      )
        continue
      if (
        i >= SIZE * 2 &&
        matchColor(game.board[i - SIZE]) === color &&
        matchColor(game.board[i - SIZE * 2]) === color
      )
        continue
      break
    }
    const old = game.board[i]
    game.board[i] = preserve && old ? { ...old, color } : candy(game, color)
  }
}
function ensurePlayable(game: GameState, events: GameEvent[]): void {
  if (findHint(game)) return
  const indices = game.board.flatMap((c, i) => (c && !game.blockers[i] ? [i] : []))
  for (let attempt = 0; attempt < 100; attempt++) {
    for (let p = indices.length - 1; p > 0; p--) {
      const q = Math.floor(random(game) * (p + 1))
      const a = indices[p]!,
        b = indices[q]!
      ;[game.board[a], game.board[b]] = [game.board[b]!, game.board[a]!]
    }
    if (!matches(game.board).length && findHint(game)) {
      events.push({ type: 'shuffle', indices })
      return
    }
  }
  for (let attempt = 0; attempt < 100; attempt++) {
    freshBoard(game, true)
    if (!matches(game.board).length && findHint(game)) {
      events.push({ type: 'shuffle', indices })
      return
    }
  }
  for (let r = 0; r < SIZE - 1; r++)
    for (let c = 0; c < SIZE - 2; c++) {
      const p = [
        r * SIZE + c,
        r * SIZE + c + 1,
        r * SIZE + c + 2,
        (r + 1) * SIZE + c,
        (r + 1) * SIZE + c + 1,
        (r + 1) * SIZE + c + 2,
      ]
      if (p.some((i) => !game.board[i] || game.board[i]!.special !== 'none')) continue
      const old = p.map((i) => game.board[i]!.color)
      for (let a = 0; a < COLORS; a++)
        for (let b = 0; b < COLORS; b++) {
          if (a === b) continue
          for (let d = 0; d < COLORS; d++)
            for (let e = 0; e < COLORS; e++) {
              const colors = [a, b, a, d, a, e]
              p.forEach((i, k) => {
                game.board[i]!.color = colors[k]!
              })
              if (!matches(game.board).length && findHint(game)) {
                events.push({ type: 'shuffle', indices })
                return
              }
            }
        }
      p.forEach((i, k) => {
        game.board[i]!.color = old[k]!
      })
    }
  throw new Error('This board layout has no playable arrangement.')
}
export function createGame(levelId = 1, seed: number | string = Date.now()): GameState {
  const level = getLevel(levelId)
  const game: GameState = {
    levelId: level.id,
    board: Array<Candy | null>(COUNT).fill(null),
    jelly: [...level.jelly],
    blockers: [...level.blockers],
    movesLeft: level.moves,
    score: 0,
    status: 'playing',
    rngState: seedNumber(seed),
    nextId: 1,
    boosters: { hammer: 3, shuffle: 2 },
  }
  freshBoard(game)
  ensurePlayable(game, [])
  return game
}
export function remainingJelly(game: GameState): number {
  return game.jelly.reduce((sum, n) => sum + n, 0)
}
export function remainingBlockers(game: GameState): number {
  return game.blockers.reduce((sum, n) => sum + n, 0)
}
function area(center: number, radius: number): number[] {
  const result: number[] = [],
    row = Math.floor(center / SIZE),
    col = center % SIZE
  for (let r = Math.max(0, row - radius); r <= Math.min(SIZE - 1, row + radius); r++)
    for (let c = Math.max(0, col - radius); c <= Math.min(SIZE - 1, col + radius); c++)
      result.push(r * SIZE + c)
  return result
}
function line(index: number, axis: 'h' | 'v'): number[] {
  return Array.from({ length: SIZE }, (_, n) =>
    axis === 'h' ? Math.floor(index / SIZE) * SIZE + n : n * SIZE + (index % SIZE),
  )
}
function neighbors(index: number): number[] {
  return [index - 1, index + 1, index - SIZE, index + SIZE].filter((i) => adjacent(index, i))
}
function mostCommon(game: GameState): number {
  const counts = Array<number>(COLORS).fill(0)
  for (const cell of game.board)
    if (cell && cell.special !== 'color-bomb') counts[cell.color] = counts[cell.color]! + 1
  return counts.indexOf(Math.max(...counts))
}
function applyClear(
  game: GameState,
  initial: Set<number>,
  created: Map<number, Special>,
  wave: number,
  events: GameEvent[],
): void {
  const hit = new Set([...initial].filter(inBounds)),
    queue = [...hit]
  const add = (indices: number[]): void => {
    for (const i of indices)
      if (inBounds(i) && !hit.has(i)) {
        hit.add(i)
        queue.push(i)
      }
  }
  for (let q = 0; q < queue.length; q++) {
    const i = queue[q]!,
      cell = game.board[i]
    if (!cell || created.has(i) || cell.special === 'none') continue
    events.push({ type: 'special', indices: [i], special: cell.special })
    if (cell.special === 'striped-h') add(line(i, 'h'))
    if (cell.special === 'striped-v') add(line(i, 'v'))
    if (cell.special === 'wrapped') add(area(i, 1))
    if (cell.special === 'color-bomb') {
      const color = mostCommon(game)
      add(game.board.flatMap((c, p) => (c?.color === color ? [p] : [])))
    }
  }
  const damaged = new Set<number>(),
    jelly: number[] = [],
    cleared: number[] = []
  for (const i of hit) {
    if (game.blockers[i]) damaged.add(i)
    const cell = game.board[i]
    if (!cell) continue
    cleared.push(i)
    for (const next of neighbors(i)) if (game.blockers[next]) damaged.add(next)
    if (game.jelly[i]! > 0) {
      game.jelly[i] = game.jelly[i]! - 1
      jelly.push(i)
    }
    const special = created.get(i)
    game.board[i] = special ? { ...cell, special } : null
    if (special) events.push({ type: 'special', indices: [i], special })
  }
  for (const i of damaged) game.blockers[i] = game.blockers[i]! - 1
  const gained = cleared.length * 60 * Math.min(wave, 4) + damaged.size * 100 + jelly.length * 40
  game.score += gained
  if (cleared.length) events.push({ type: 'clear', indices: cleared, value: gained })
  if (damaged.size) events.push({ type: 'blocker', indices: [...damaged], value: damaged.size })
  if (jelly.length) events.push({ type: 'jelly', indices: jelly, value: jelly.length })
}
function gravity(game: GameState, events: GameEvent[]): void {
  const spawned: number[] = []
  for (let col = 0; col < SIZE; col++) {
    let bottom = SIZE - 1
    while (bottom >= 0) {
      if (game.blockers[bottom * SIZE + col]) {
        bottom--
        continue
      }
      let top = bottom
      while (top > 0 && !game.blockers[(top - 1) * SIZE + col]) top--
      const saved: Candy[] = []
      for (let row = bottom; row >= top; row--) {
        const cell = game.board[row * SIZE + col]
        if (cell) saved.push(cell)
      }
      for (let row = bottom, p = 0; row >= top; row--, p++) {
        const index = row * SIZE + col
        if (p < saved.length) game.board[index] = saved[p]!
        else {
          game.board[index] = candy(game)
          spawned.push(index)
        }
      }
      bottom = top - 1
    }
  }
  if (spawned.length) events.push({ type: 'spawn', indices: spawned })
}
function matchPlan(
  groups: Match[],
  game: GameState,
  preferred: number[],
): { hit: Set<number>; created: Map<number, Special> } {
  const hit = new Set<number>(),
    created = new Map<number, Special>()
  for (const group of groups) {
    group.indices.forEach((i) => hit.add(i))
    let special: Special = 'none'
    if (group.runs.some((run) => run.indices.length >= 5)) special = 'color-bomb'
    else if (
      group.runs.some((run) => run.axis === 'h') &&
      group.runs.some((run) => run.axis === 'v')
    )
      special = 'wrapped'
    else if (group.runs.some((run) => run.indices.length === 4))
      special = group.runs[0]!.axis === 'h' ? 'striped-h' : 'striped-v'
    if (special === 'none') continue
    const intersection = group.indices.filter(
      (i) => group.runs.filter((run) => run.indices.includes(i)).length > 1,
    )
    const candidates = [
      ...preferred.filter((i) => group.indices.includes(i)),
      ...intersection,
      ...group.indices,
    ]
    const anchor = candidates.find((i) => game.board[i]?.special === 'none')
    if (anchor !== undefined) created.set(anchor, special)
  }
  return { hit, created }
}
function settle(
  game: GameState,
  events: GameEvent[],
  preferred: number[] = [],
  first?: Set<number>,
): void {
  for (let wave = 1; wave <= 64; wave++) {
    const plan =
      wave === 1 && first
        ? { hit: first, created: new Map<number, Special>() }
        : matchPlan(matches(game.board), game, preferred)
    if (!plan.hit.size) return
    applyClear(game, plan.hit, plan.created, wave, events)
    gravity(game, events)
    preferred = []
  }
  freshBoard(game, true)
  events.push({ type: 'shuffle', indices: game.board.flatMap((c, i) => (c ? [i] : [])) })
}
function finish(game: GameState, events: GameEvent[]): void {
  const level = getLevel(game.levelId)
  if (
    game.score >= level.targetScore &&
    (!level.clearJelly || remainingJelly(game) === 0) &&
    (!level.clearBlockers || remainingBlockers(game) === 0)
  ) {
    game.score += game.movesLeft * 150
    game.status = 'won'
    events.push({ type: 'win', indices: [], value: game.score })
  } else if (game.movesLeft <= 0) {
    game.status = 'lost'
    events.push({ type: 'lose', indices: [], value: game.score })
  } else ensurePlayable(game, events)
}
function combination(game: GameState, a: number, b: number, events: GameEvent[]): Set<number> {
  const first = game.board[a]!,
    second = game.board[b]!
  const hit = new Set<number>([a, b])
  const add = (indices: number[]): void => {
    indices.forEach((i) => hit.add(i))
  }
  events.push({
    type: 'special',
    indices: [a, b],
    special: first.special === 'none' ? second.special : first.special,
  })
  if (first.special === 'color-bomb' || second.special === 'color-bomb') {
    if (first.special === 'color-bomb' && second.special === 'color-bomb')
      add(Array.from({ length: COUNT }, (_, i) => i))
    else {
      const other = first.special === 'color-bomb' ? second : first
      for (let i = 0; i < COUNT; i++)
        if (game.board[i]?.color === other.color && game.board[i]?.special !== 'color-bomb') {
          hit.add(i)
          if (other.special === 'wrapped') game.board[i] = { ...game.board[i]!, special: 'wrapped' }
          else if (other.special === 'striped-h' || other.special === 'striped-v')
            game.board[i] = { ...game.board[i]!, special: i % 2 ? 'striped-h' : 'striped-v' }
        }
    }
    if (first.special === 'color-bomb') game.board[a] = { ...first, special: 'none' }
    if (second.special === 'color-bomb') game.board[b] = { ...second, special: 'none' }
    return hit
  }
  game.board[a] = { ...first, special: 'none' }
  game.board[b] = { ...second, special: 'none' }
  if (first.special === 'wrapped' && second.special === 'wrapped') {
    add(area(a, 2))
    add(area(b, 2))
  } else if (first.special === 'wrapped' || second.special === 'wrapped') {
    const row = Math.floor(b / SIZE),
      col = b % SIZE
    for (let d = -1; d <= 1; d++) {
      if (row + d >= 0 && row + d < SIZE) add(line((row + d) * SIZE + col, 'h'))
      if (col + d >= 0 && col + d < SIZE) add(line(row * SIZE + col + d, 'v'))
    }
  } else {
    add(line(a, 'h'))
    add(line(a, 'v'))
    add(line(b, 'h'))
    add(line(b, 'v'))
  }
  return hit
}
export function swap(game: GameState, a: number, b: number): ActionResult {
  const invalid = (): ActionResult => ({
    game,
    valid: false,
    events: [{ type: 'invalid', indices: [a, b].filter(inBounds) }],
  })
  if (
    game.status !== 'playing' ||
    !adjacent(a, b) ||
    game.blockers[a] ||
    game.blockers[b] ||
    !game.board[a] ||
    !game.board[b]
  )
    return invalid()
  const next = clone(game),
    events: GameEvent[] = [{ type: 'swap', indices: [a, b] }]
  ;[next.board[a], next.board[b]] = [next.board[b]!, next.board[a]!]
  const special = combo(next.board[a]!, next.board[b]!)
  if (
    !special &&
    !matches(next.board).some((group) => group.indices.includes(a) || group.indices.includes(b))
  )
    return invalid()
  next.movesLeft--
  settle(next, events, [b, a], special ? combination(next, a, b, events) : undefined)
  finish(next, events)
  return { game: next, valid: true, events }
}
export function useBooster(game: GameState, booster: Booster, index?: number): ActionResult {
  if (
    game.status !== 'playing' ||
    (booster !== 'hammer' && booster !== 'shuffle') ||
    game.boosters[booster] <= 0
  )
    return { game, valid: false, events: [] }
  if (
    booster === 'hammer' &&
    (index === undefined || !inBounds(index) || (!game.board[index] && !game.blockers[index]))
  )
    return { game, valid: false, events: [] }
  const next = clone(game),
    events: GameEvent[] = []
  next.boosters[booster]--
  if (booster === 'hammer') settle(next, events, [], new Set([index!]))
  else {
    const indices = next.board.flatMap((cell, i) => (cell ? [i] : []))
    for (let p = indices.length - 1; p > 0; p--) {
      const q = Math.floor(random(next) * (p + 1)),
        a = indices[p]!,
        b = indices[q]!
      ;[next.board[a], next.board[b]] = [next.board[b]!, next.board[a]!]
    }
    events.push({ type: 'shuffle', indices })
    settle(next, events)
  }
  finish(next, events)
  return { game: next, valid: true, events }
}
function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
function integer(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= min && value <= max
}
export function isValidGameState(value: unknown): value is GameState {
  if (!record(value) || !integer(value.levelId, 1, LEVEL_COUNT)) return false
  const level = getLevel(value.levelId)
  if (
    !integer(value.movesLeft, 0, level.moves) ||
    !integer(value.score, 0, 1_000_000_000) ||
    !integer(value.rngState, 1, 0xffffffff) ||
    !integer(value.nextId, 1, 1_000_000_000)
  )
    return false
  if (
    !['playing', 'won', 'lost'].includes(value.status as string) ||
    !record(value.boosters) ||
    !integer(value.boosters.hammer, 0, 3) ||
    !integer(value.boosters.shuffle, 0, 2)
  )
    return false
  if (
    !Array.isArray(value.board) ||
    value.board.length !== COUNT ||
    !Array.isArray(value.jelly) ||
    value.jelly.length !== COUNT ||
    !Array.isArray(value.blockers) ||
    value.blockers.length !== COUNT
  )
    return false
  const ids = new Set<number>()
  for (let i = 0; i < COUNT; i++) {
    if (
      !integer(value.jelly[i], 0, level.jelly[i]!) ||
      !integer(value.blockers[i], 0, level.blockers[i]!)
    )
      return false
    const cell: unknown = value.board[i]
    if (value.blockers[i]) {
      if (cell !== null) return false
      continue
    }
    if (
      !record(cell) ||
      !integer(cell.id, 1, value.nextId - 1) ||
      ids.has(cell.id) ||
      !integer(cell.color, 0, COLORS - 1) ||
      !SPECIALS.includes(cell.special as Special)
    )
      return false
    ids.add(cell.id)
  }
  const game = value as unknown as GameState
  if (matches(game.board).length) return false
  const complete =
    game.score >= level.targetScore &&
    (!level.clearJelly || remainingJelly(game) === 0) &&
    (!level.clearBlockers || remainingBlockers(game) === 0)
  if (game.status === 'won') return complete
  if (game.status === 'lost') return game.movesLeft === 0 && !complete
  return game.movesLeft > 0 && !complete && findHint(game) !== null
}
