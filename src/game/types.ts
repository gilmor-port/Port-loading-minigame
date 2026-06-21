/**
 * Public and internal game state shapes used by the engine and React HUD.
 */

export type GameState = "idle" | "running" | "gameOver";

export type ObstacleKind = "bug" | "bird";

/** One obstacle moving left across the screen. */
export interface Obstacle {
  kind: ObstacleKind;
  /** Left edge X in world space. */
  x: number;
  w: number;
  h: number;
  /** If true, two bug sprites are stacked (bugs only). */
  double: boolean;
  /** Top Y for flying birds (bugs use ground placement instead). */
  flyY?: number;
}

/** Snapshot pushed to the UI each animation frame. */
export interface GameSnapshot {
  state: GameState;
  score: number;
  highScore: number;
}
