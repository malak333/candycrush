import { SIZE } from './types'
import type { Level } from './types'
const cells = (test: (r: number, c: number) => boolean, strength = 1): number[] =>
  Array.from({ length: SIZE * SIZE }, (_, i) =>
    test(Math.floor(i / SIZE), i % SIZE) ? strength : 0,
  )
function level(
  id: number,
  name: string,
  description: string,
  moves: number,
  targetScore: number,
  jelly = cells(() => false),
  blockers = cells(() => false),
): Level {
  return {
    id,
    name,
    region: 'The Sweet Meadows',
    description,
    moves,
    targetScore,
    starScores: [targetScore, Math.ceil(targetScore * 1.6), Math.ceil(targetScore * 2.3)],
    jelly,
    blockers,
    clearJelly: jelly.some(Boolean),
    clearBlockers: blockers.some(Boolean),
  }
}
export const CURATED_LEVELS: readonly Level[] = [
  level(1, 'A Sweet Beginning', 'Match three sweets. Reach the score goal!', 22, 1800),
  level(
    2,
    'Jelly Garden',
    'Clear the jelly in the heart of the garden.',
    24,
    1600,
    cells((r, c) => r >= 2 && r <= 5 && c >= 2 && c <= 5),
  ),
  level(
    3,
    'Sugar Stripes',
    'Match four for a striped sweet and clear the jelly lanes.',
    25,
    2100,
    cells((r, c) => r === 2 || c === 5),
  ),
  level(
    4,
    'Frosted Corners',
    'Match beside frosting to break every block.',
    26,
    2200,
    undefined,
    cells((r, c) => (r === 1 || r === 6) && (c === 1 || c === 6)),
  ),
  level(5, 'Rainbow Picnic', 'Match five in a line to make a rainbow bonbon.', 25, 3300),
  level(
    6,
    'Berry Crossing',
    'An L or T match makes a wrapped sweet.',
    28,
    2600,
    cells((r, c) => r === 3 || c === 3),
  ),
  level(
    7,
    'Double Dip',
    'Thick jelly needs two matches to disappear.',
    30,
    2800,
    cells((r, c) => r >= 2 && r <= 5 && c >= 2 && c <= 5, 2),
  ),
  level(
    8,
    'Cookie Trail',
    'Follow the frosting trail with nearby matches.',
    29,
    3000,
    undefined,
    cells((r, c) => r === 4 && c >= 1 && c <= 6),
  ),
  level(
    9,
    'Orchard Glow',
    'Sweep the jelly from both sides of the orchard.',
    29,
    3200,
    cells((r, c) => (c === 1 || c === 6) && r >= 1 && r <= 6),
  ),
  level(
    10,
    'Candy Courtyard',
    'Clear the jelly and break the courtyard frosting.',
    32,
    3500,
    cells((r, c) => r >= 2 && r <= 5 && c >= 2 && c <= 5),
    cells((r, c) => (r === 1 || r === 6) && (c === 2 || c === 5)),
  ),
  level(
    11,
    'Marshmallow Mist',
    'Double frosting takes two nearby matches.',
    32,
    3800,
    undefined,
    cells((r, c) => (r === 2 || r === 5) && (c === 2 || c === 5), 2),
  ),
  level(12, 'Sugar Rush', 'Chain striped and wrapped sweets to raise your score.', 27, 5100),
  level(
    13,
    'Rosewater Rings',
    'Clear the jelly ring with powerful combinations.',
    33,
    4100,
    cells(
      (r, c) =>
        ((r === 1 || r === 6) && c >= 1 && c <= 6) || ((c === 1 || c === 6) && r >= 1 && r <= 6),
    ),
  ),
  level(
    14,
    'Creme Cascade',
    'Break the zigzag frosting and keep the cascades flowing.',
    34,
    4200,
    undefined,
    cells((r, c) => (r === 2 && c >= 1 && c <= 3) || (r === 5 && c >= 4 && c <= 6), 2),
  ),
  level(
    15,
    'Bonbon Boulevard',
    'Jelly lanes meet a frosted center.',
    34,
    4400,
    cells((_r, c) => c === 1 || c === 6),
    cells((r, c) => (r === 3 || r === 4) && (c === 3 || c === 4), 2),
  ),
  level(
    16,
    'Gumdrop Grove',
    'Clear all four patches of layered jelly.',
    34,
    4600,
    cells(
      (r, c) =>
        (r === 1 || r === 2 || r === 5 || r === 6) && (c === 1 || c === 2 || c === 5 || c === 6),
      2,
    ),
  ),
  level(
    17,
    'Twilight Truffles',
    'Frosting islands call for powerful combinations.',
    35,
    4800,
    undefined,
    cells((r, c) => (r === 1 || r === 3 || r === 5) && (c === 2 || c === 5), 2),
  ),
  level(
    18,
    'Ribbon Festival',
    'Unwrap the jelly ribbons around the frosting.',
    36,
    4900,
    cells((r, c) => r === 1 || r === 6 || ((c === 1 || c === 6) && r > 1 && r < 6)),
    cells((r, c) => (r === 3 || r === 4) && (c === 3 || c === 4), 2),
  ),
  level(
    19,
    'Cloudberry Castle',
    'Clear the castle courtyard and all its frosting.',
    38,
    5200,
    cells((r, c) => r >= 2 && r <= 5 && c >= 2 && c <= 5, 2),
    cells((r, c) => (r === 1 || r === 6) && (c === 1 || c === 3 || c === 4 || c === 6), 2),
  ),
  level(
    20,
    'The Sugar Spell',
    'Layered jelly, frosting, and a sparkling score.',
    40,
    5600,
    cells((r, c) => r >= 1 && r <= 6 && c >= 1 && c <= 6, 2),
    cells((r, c) => (r === 2 || r === 5) && (c === 2 || c === 5), 2),
  ),
]
export const LEVEL_COUNT = 10_000
const CHAPTER_NAMES = [
  'Moonlit Macarons',
  'Peach Blossom',
  'Toffee Harbor',
  'Velvet Vanilla',
  'Cherry Lanterns',
  'Coconut Clouds',
  'Lemon Stardust',
  'Maple Meadows',
  'Raspberry Ribbons',
  'Pistachio Palace',
  'Honeycomb Hills',
  'Midnight Meringue',
] as const
const MODE_NAMES = [
  'Sugar Sprint',
  'Jelly Trail',
  'Frosted Path',
  'Double Dip',
  'Sweet Crossing',
  'Sparkle Rush',
  'Ribbon Garden',
  'Cookie Castle',
  'Jelly Jubilee',
  'Grand Spell',
] as const
function mix(value: number): number {
  let n = Math.imul(value ^ (value >>> 16), 0x45d9f3b)
  n = Math.imul(n ^ (n >>> 16), 0x45d9f3b)
  return (n ^ (n >>> 16)) >>> 0
}
function rotate(index: number, turns: number): number {
  let r = Math.floor(index / SIZE),
    c = index % SIZE
  for (let turn = 0; turn < turns; turn++) [r, c] = [c, SIZE - 1 - r]
  return r * SIZE + c
}
function jellyRank(row: number, col: number, pattern: number): number {
  const r = row - 1,
    c = col - 1
  switch (pattern) {
    case 0:
      return Math.min(r, c, 5 - r, 5 - c)
    case 1:
      return Math.min(Math.abs(r - 2), Math.abs(c - 2))
    case 2:
      return Math.abs(r - c)
    case 3:
      return (r + c) % 2
    case 4:
      return Math.min((r - 1) ** 2 + (c - 1) ** 2, (r - 4) ** 2 + (c - 4) ** 2)
    case 5:
      return Math.abs(r - 2.5)
    case 6:
      return Math.abs(c - 2.5)
    default:
      return (r - 2.5) ** 2 + (c - 2.5) ** 2
  }
}
/** On-demand, deterministic definitions keep the 10,000-level campaign small. */
function generatedLevel(id: number): Level {
  const offset = id - CURATED_LEVELS.length - 1
  const mode = offset % 10,
    tier = Math.min(8, Math.floor(offset / 250))
  const layered = mode === 3 || mode === 6 || mode === 9
  const jellyCounts = [0, 12, 0, 18, 16, 0, 24, 0, 36, 36] as const
  const frostCounts = [0, 0, 5, 0, 4, 0, 6, 8, 0, 8] as const
  const jellyCount = Math.min(
    36,
    jellyCounts[mode]! + (jellyCounts[mode] ? Math.floor(tier / 2) : 0),
  )
  const frostCount = Math.min(
    10,
    frostCounts[mode]! + (frostCounts[mode] ? Math.floor(tier / 4) : 0),
  )
  const jelly = cells(() => false),
    blockers = cells(() => false)
  const interior: number[] = []
  for (let r = 1; r <= 6; r++) for (let c = 1; c <= 6; c++) interior.push(r * SIZE + c)
  const pattern = Math.floor(offset / 10) % 8
  interior.sort(
    (a, b) =>
      jellyRank(Math.floor(a / SIZE), a % SIZE, pattern) -
        jellyRank(Math.floor(b / SIZE), b % SIZE, pattern) ||
      mix(id * 67 + a) - mix(id * 67 + b) ||
      a - b,
  )
  for (const i of interior.slice(0, jellyCount)) jelly[i] = layered ? 2 : 1
  // Frost only outer edges; corner teeth appear after the whole edge is frosted.
  // The interior stays open and no unblocked corner is isolated by a tooth.
  const edge = Array.from({ length: SIZE }, (_, c) => 56 + c)
  edge.sort((a, b) => mix(id * 97 + a) - mix(id * 97 + b) || a - b)
  const teeth = id % 2 ? [48, 55] : [55, 48]
  const frostPositions = [...edge, ...teeth]
  const rotation = Math.floor(offset / 20) % 4
  for (const i of frostPositions.slice(0, frostCount))
    blockers[rotate(i, rotation)] = mode === 7 || mode === 9 || tier >= 4 ? 2 : 1
  const targetScore = 2800 + tier * 275 + mode * 160 + (id % 5) * 100
  const moves =
    28 +
    Math.floor(tier / 2) +
    (jellyCount >= 24 ? 4 : 0) +
    (layered ? 4 : 0) +
    (frostCount >= 8 ? 4 : 0)
  const chapter = Math.floor((id - 1) / 25) + 1
  const theme = CHAPTER_NAMES[(chapter - 1) % CHAPTER_NAMES.length]!
  const description = `Reach ${targetScore} points${jellyCount ? ' and clear every jelly layer' : ''}${frostCount ? ' and break all frosting' : ''}.`
  return {
    ...level(id, MODE_NAMES[mode]!, description, moves, targetScore, jelly, blockers),
    region: theme,
  }
}
const generatedCache = new Map<number, Level>()
export function getLevel(id: number): Level {
  if (!Number.isInteger(id) || id < 1 || id > LEVEL_COUNT)
    throw new RangeError(`Level must be between 1 and ${LEVEL_COUNT}.`)
  if (id <= CURATED_LEVELS.length) return CURATED_LEVELS[id - 1]!
  const cached = generatedCache.get(id)
  if (cached) return cached
  const result = generatedLevel(id)
  if (generatedCache.size >= 128) generatedCache.delete(generatedCache.keys().next().value!)
  generatedCache.set(id, result)
  return result
}
export function starsForScore(levelId: number, score: number): number {
  return getLevel(levelId).starScores.filter((threshold) => score >= threshold).length
}
