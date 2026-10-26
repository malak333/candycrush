import { SIZE } from './types';
import type { Level } from './types';
const cells = (test: (r: number, c: number) => boolean, strength = 1): number[] => Array.from({ length: SIZE * SIZE }, (_, i) => test(Math.floor(i / SIZE), i % SIZE) ? strength : 0);
function level(id: number, name: string, description: string, moves: number, targetScore: number, jelly = cells(() => false), blockers = cells(() => false)): Level {
 return { id, name, description, moves, targetScore, starScores: [targetScore, Math.ceil(targetScore * 1.6), Math.ceil(targetScore * 2.3)], jelly, blockers, clearJelly: jelly.some(Boolean), clearBlockers: blockers.some(Boolean) };
}
export const LEVELS: readonly Level[] = [
 level(1, 'A Sweet Beginning', 'Match three sweets. Reach the score goal!', 22, 1800),
 level(2, 'Jelly Garden', 'Clear the jelly in the heart of the garden.', 24, 1600, cells((r,c) => r >= 2 && r <= 5 && c >= 2 && c <= 5)),
 level(3, 'Sugar Stripes', 'Match four for a striped sweet and clear the jelly lanes.', 25, 2100, cells((r,c) => r === 2 || c === 5)),
 level(4, 'Frosted Corners', 'Match beside frosting to break every block.', 26, 2200, undefined, cells((r,c) => (r === 1 || r === 6) && (c === 1 || c === 6))),
 level(5, 'Rainbow Picnic', 'Match five in a line to make a rainbow bonbon.', 25, 3300),
 level(6, 'Berry Crossing', 'An L or T match makes a wrapped sweet.', 28, 2600, cells((r,c) => r === 3 || c === 3)),
 level(7, 'Double Dip', 'Thick jelly needs two matches to disappear.', 30, 2800, cells((r,c) => r >= 2 && r <= 5 && c >= 2 && c <= 5, 2)),
 level(8, 'Cookie Trail', 'Follow the frosting trail with nearby matches.', 29, 3000, undefined, cells((r,c) => r === 4 && c >= 1 && c <= 6)),
 level(9, 'Orchard Glow', 'Sweep the jelly from both sides of the orchard.', 29, 3200, cells((r,c) => (c === 1 || c === 6) && r >= 1 && r <= 6)),
 level(10, 'Candy Courtyard', 'Clear the jelly and break the courtyard frosting.', 32, 3500, cells((r,c) => r >= 2 && r <= 5 && c >= 2 && c <= 5), cells((r,c) => (r === 1 || r === 6) && (c === 2 || c === 5))),
 level(11, 'Marshmallow Mist', 'Double frosting takes two nearby matches.', 32, 3800, undefined, cells((r,c) => (r === 2 || r === 5) && (c === 2 || c === 5), 2)),
 level(12, 'Sugar Rush', 'Chain striped and wrapped sweets to raise your score.', 27, 5100),
 level(13, 'Rosewater Rings', 'Clear the jelly ring with powerful combinations.', 33, 4100, cells((r,c) => ((r === 1 || r === 6) && c >= 1 && c <= 6) || ((c === 1 || c === 6) && r >= 1 && r <= 6))),
 level(14, 'Creme Cascade', 'Break the zigzag frosting and keep the cascades flowing.', 34, 4200, undefined, cells((r,c) => (r === 2 && c >= 1 && c <= 3) || (r === 5 && c >= 4 && c <= 6), 2)),
 level(15, 'Bonbon Boulevard', 'Jelly lanes meet a frosted center.', 34, 4400, cells((_r,c) => c === 1 || c === 6), cells((r,c) => (r === 3 || r === 4) && (c === 3 || c === 4), 2)),
 level(16, 'Gumdrop Grove', 'Clear all four patches of layered jelly.', 34, 4600, cells((r,c) => (r === 1 || r === 2 || r === 5 || r === 6) && (c === 1 || c === 2 || c === 5 || c === 6), 2)),
 level(17, 'Twilight Truffles', 'Frosting islands call for powerful combinations.', 35, 4800, undefined, cells((r,c) => (r === 1 || r === 3 || r === 5) && (c === 2 || c === 5), 2)),
 level(18, 'Ribbon Festival', 'Unwrap the jelly ribbons around the frosting.', 36, 4900, cells((r,c) => (r === 1 || r === 6) || ((c === 1 || c === 6) && r > 1 && r < 6)), cells((r,c) => (r === 3 || r === 4) && (c === 3 || c === 4), 2)),
 level(19, 'Cloudberry Castle', 'Clear the castle courtyard and all its frosting.', 38, 5200, cells((r,c) => r >= 2 && r <= 5 && c >= 2 && c <= 5, 2), cells((r,c) => (r === 1 || r === 6) && (c === 1 || c === 3 || c === 4 || c === 6), 2)),
 level(20, 'The Sugar Spell', 'Layered jelly, frosting, and a sparkling score.', 40, 5600, cells((r,c) => r >= 1 && r <= 6 && c >= 1 && c <= 6, 2), cells((r,c) => (r === 2 || r === 5) && (c === 2 || c === 5), 2)),
];
export function getLevel(id: number): Level { return LEVELS.find(item => item.id === id) ?? LEVELS[0]!; }
export function starsForScore(levelId: number, score: number): number { return getLevel(levelId).starScores.filter(threshold => score >= threshold).length; }
