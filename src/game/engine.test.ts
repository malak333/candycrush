import { describe, expect, it } from 'vitest';
import { COLORS, LEVELS, SIZE, createGame, findHint, getLevel, isValidGameState, remainingBlockers, remainingJelly, starsForScore, swap, useBooster as applyBooster } from './index';
import type { GameState, Special } from './types';
function fixture(): GameState {
 const game = createGame(1, 8128);
 game.board.forEach((cell, i) => { if (cell) { cell.color = (Math.floor(i / SIZE) * 2 + i % SIZE) % COLORS; cell.special = 'none'; } }); return game;
}
function color(game: GameState, indices: number[], value: number): void { indices.forEach(i => { game.board[i]!.color = value; }); }
function assertStable(game: GameState): void {
 expect(game.board).toHaveLength(64);
 const ids = game.board.flatMap(cell => cell ? [cell.id] : []); expect(new Set(ids).size).toBe(ids.length);
 game.board.forEach((cell, i) => { expect(cell === null).toBe(game.blockers[i]! > 0); if (cell) expect(cell.color).toBeGreaterThanOrEqual(0); });
 expect(isValidGameState(game)).toBe(true); if (game.status === 'playing') expect(findHint(game)).not.toBeNull();
}
describe('seeded generation and levels', () => {
 it('replays seeds deterministically', () => {
  expect(createGame(3, 'sugar')).toEqual(createGame(3, 'sugar')); expect(createGame(3, 'sugar').board).not.toEqual(createGame(3, 'spice').board); expect(createGame(1, 0)).toEqual(createGame(1, 1));
 });
 it('starts every level stable and playable with fresh quotas', () => {
  expect(LEVELS).toHaveLength(20);
  for (const level of LEVELS) for (let seed = 1; seed <= 8; seed++) {
   const game = createGame(level.id, seed); assertStable(game); expect(game.movesLeft).toBe(level.moves); expect(game.score).toBe(0);
   expect(game.boosters).toEqual({ hammer: 3, shuffle: 2 }); expect(remainingJelly(game)).toBe(level.jelly.reduce((a,b) => a+b, 0)); expect(remainingBlockers(game)).toBe(level.blockers.reduce((a,b) => a+b, 0));
  }
 });
 it('rejects malformed saves and impossible statuses', () => {
  const game = createGame(2, 2); expect(isValidGameState(JSON.parse(JSON.stringify(game)))).toBe(true);
  for (const value of [null, {}, [], { ...game, score: NaN }, { ...game, rngState: 0 }, { ...game, nextId: 1 }, { ...game, status: 'won' }, { ...game, movesLeft: -1 }, { ...game, jelly: [0] }, { ...game, boosters: { hammer: 100, shuffle: 2 } }]) expect(isValidGameState(value)).toBe(false);
  const duplicate = structuredClone(game); duplicate.board[1] = { ...duplicate.board[0]! }; expect(isValidGameState(duplicate)).toBe(false);
  const malformed = structuredClone(game); malformed.board[0]!.color = 6; expect(isValidGameState(malformed)).toBe(false);
 });
});
describe('swaps and shapes', () => {
 it('rejects illegal or nonmatching swaps for free', () => {
  const game = fixture(), before = JSON.stringify(game);
  for (const [a,b] of [[0,2], [7,8], [-1,0], [0,64], [0,1], [NaN,1]]) { const result = swap(game, a!, b!); expect(result.valid).toBe(false); expect(result.game).toBe(game); }
  expect(JSON.stringify(game)).toBe(before);
 });
 it.each([['striped-h', [24,25,27]], ['color-bomb', [24,25,27,28]]] as [Special, number[]][])('creates %s from a long line', (special, indices) => {
  const game = fixture(); color(game, indices, 0); color(game, [26], 1); color(game, [34], 0);
  const before = JSON.stringify(game), result = swap(game, 26, 34); expect(result.valid).toBe(true); expect(result.game.movesLeft).toBe(game.movesLeft - 1);
  expect(result.events.some(event => event.type === 'special' && event.special === special)).toBe(true); expect(JSON.stringify(game)).toBe(before); assertStable(result.game);
 });
 it('creates a wrapped sweet for T intersections', () => {
  const game = fixture(); color(game, [11,19,26,28,35], 0); color(game, [27], 1); const result = swap(game, 27, 35);
  expect(result.valid).toBe(true); expect(result.events.some(event => event.type === 'special' && event.special === 'wrapped')).toBe(true); assertStable(result.game);
 });
 it('wins if the objective completes on the last move', () => {
  const game = createGame(1, 5), hint = findHint(game)!; game.movesLeft = 1; game.score = getLevel(1).targetScore - 1; const result = swap(game, ...hint);
  expect(result.game.status).toBe('won'); expect(result.game.movesLeft).toBe(0); expect(result.events.some(event => event.type === 'win')).toBe(true); expect(swap(result.game, ...hint).valid).toBe(false);
 });
 it('rewards efficient wins with a remaining-move bonus', () => {
  const game = createGame(1, 5); game.score = getLevel(1).targetScore - 1; const result = swap(game, ...findHint(game)!);
  const clearedScore = result.events.filter(event => event.type === 'clear').reduce((sum, event) => sum + (event.value ?? 0), 0);
  expect(result.game.score).toBe(game.score + clearedScore + result.game.movesLeft * 150); assertStable(result.game);
 });
 it('loses on the last move with unfinished objectives', () => { const game = createGame(20, 4); game.movesLeft = 1; expect(swap(game, ...findHint(game)!).game.status).toBe('lost'); });
});
describe('specials and boosters', () => {
 it('color bombs remove their swapped color', () => {
  const game = fixture(); game.board[0]!.special = 'color-bomb'; const chosen = game.board[1]!.color;
  const removed = game.board.flatMap((cell, i) => cell && (cell.color === chosen || i === 0) ? [cell.id] : []), result = swap(game, 0, 1);
  expect(result.valid).toBe(true); const remaining = new Set(result.game.board.flatMap(cell => cell ? [cell.id] : [])); removed.forEach(id => expect(remaining.has(id)).toBe(false)); assertStable(result.game);
 });
 it.each([['striped-h', 'striped-v'], ['striped-h', 'wrapped'], ['wrapped', 'wrapped'], ['color-bomb', 'striped-v'], ['color-bomb', 'wrapped'], ['color-bomb', 'color-bomb']] as [Special, Special][])('combines %s with %s', (a, b) => {
  const game = fixture(); game.board[27]!.special = a; game.board[28]!.special = b; const result = swap(game, 27, 28);
  expect(result.valid).toBe(true); expect(result.game.score).toBeGreaterThan(0); expect(result.events.some(event => event.type === 'special')).toBe(true); assertStable(result.game);
 });
 it('a hammer triggers the full stripe line', () => {
  const game = fixture(); game.board[27]!.special = 'striped-h'; const ids = game.board.slice(24, 32).map(cell => cell!.id), result = applyBooster(game, 'hammer', 27);
  const remaining = new Set(result.game.board.flatMap(cell => cell ? [cell.id] : [])); ids.forEach(id => expect(remaining.has(id)).toBe(false)); expect(result.game.movesLeft).toBe(game.movesLeft); expect(result.game.boosters.hammer).toBe(2);
 });
 it('validates hammer targets and enforces quotas', () => {
  let game = createGame(20, 13); expect(applyBooster(game, 'hammer').valid).toBe(false); expect(applyBooster(game, 'hammer', 64).valid).toBe(false);
  expect(game.blockers[18]).toBe(2); expect(swap(game, 18, 19).valid).toBe(false);
  for (const index of [18, 18, 21]) { const result = applyBooster(game, 'hammer', index); expect(result.valid).toBe(true); expect(result.game.movesLeft).toBe(game.movesLeft); game = result.game; }
  expect(game.blockers[18]).toBe(0); expect(game.boosters.hammer).toBe(0); expect(applyBooster(game, 'hammer', 0).valid).toBe(false); assertStable(game);
 });
 it('clears stationary jelly layers through gravity', () => {
  const game = createGame(7, 55), index = 18; expect(game.jelly[index]).toBe(2); const result = applyBooster(game, 'hammer', index);
  expect(result.game.jelly[index]).toBeLessThan(2); expect(result.events.some(event => event.type === 'jelly' && event.indices.includes(index))).toBe(true); expect(game.jelly[index]).toBe(2); assertStable(result.game);
 });
 it('reshuffles dead boards deterministically without spending moves', () => {
  const game = fixture(); expect(findHint(game)).toBeNull(); const first = applyBooster(game, 'shuffle'); expect(first).toEqual(applyBooster(game, 'shuffle'));
  expect(first.valid).toBe(true); expect(first.game.movesLeft).toBe(game.movesLeft); expect(first.game.boosters.shuffle).toBe(1); assertStable(first.game);
 });
});
describe('campaign replay', () => {
 it('retains stable serializable boards through seeded complete games', () => {
  for (const level of LEVELS) for (let seed = 10; seed < 13; seed++) {
   let game = createGame(level.id, seed);
   for (let turn = 0; game.status === 'playing' && turn < level.moves; turn++) {
    const hint = findHint(game)!, before = JSON.stringify(game), result = swap(game, ...hint);
    expect(result.valid).toBe(true); expect(JSON.stringify(game)).toBe(before); expect(result.game.score).toBeGreaterThan(game.score); expect(result.game.movesLeft).toBe(game.movesLeft - 1); expect(swap(game, ...hint)).toEqual(result);
    game = result.game; assertStable(game);
   }
   expect(game.status).not.toBe('playing');
  }
 }, 20_000);
 it('awards stars at exact thresholds', () => {
  for (const level of LEVELS) { expect(starsForScore(level.id, level.targetScore - 1)).toBe(0); level.starScores.forEach((threshold, index) => expect(starsForScore(level.id, threshold)).toBe(index + 1)); }
 });
});
