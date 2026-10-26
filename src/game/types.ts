export const SIZE = 8;
export const COLORS = 6;
export type Special = 'none' | 'striped-h' | 'striped-v' | 'wrapped' | 'color-bomb';
export type GameStatus = 'playing' | 'won' | 'lost';
export type Booster = 'hammer' | 'shuffle';
export interface Candy { id: number; color: number; special: Special }
export interface Level { id: number; name: string; description: string; moves: number; targetScore: number; starScores: [number, number, number]; jelly: number[]; blockers: number[]; clearJelly: boolean; clearBlockers: boolean }
export interface GameState { levelId: number; board: (Candy | null)[]; jelly: number[]; blockers: number[]; movesLeft: number; score: number; status: GameStatus; rngState: number; nextId: number; boosters: Record<Booster, number> }
export interface GameEvent { type: 'swap' | 'invalid' | 'clear' | 'spawn' | 'special' | 'shuffle' | 'win' | 'lose' | 'blocker' | 'jelly'; indices: number[]; value?: number; special?: Special }
export interface ActionResult { game: GameState; valid: boolean; events: GameEvent[] }
