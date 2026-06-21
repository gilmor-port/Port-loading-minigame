/**
 * Public entry for the canvas game: re-exports types/constants and `GameEngine`.
 * Implementation lives in `constants.ts`, `types.ts`, `GameEngine.ts`, and `render/`.
 */

export { CANVAS_W, CANVAS_H } from "./constants";
export type { GameSnapshot, GameState } from "./types";
export { GameEngine } from "./GameEngine";
