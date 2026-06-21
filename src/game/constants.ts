/**
 * Shared numeric tuning for the canvas size, world layout, physics, and spawns.
 * All distances are in CSS pixels unless noted.
 */

/** Canvas width (world units match 1:1 with backing store pixels). */
export const CANVAS_W = 800;
/** Canvas height. */
export const CANVAS_H = 220;

/** World Y where the hunter stands / lands (feet baseline). */
export const GROUND_Y = 170;

/** Hunter hitbox / sprite anchor (left of the 36px-wide figure). */
export const HUNTER_X = 80;
export const HUNTER_W = 36;
export const HUNTER_H = 48;

/** Gravity applied while airborne (pixels per second²). */
export const GRAVITY = 2600;
/** Upward velocity on jump (pixels per second). */
export const JUMP_VY = -720;

/** Scroll speed at game start (pixels per second). */
export const INITIAL_SCROLL_SPEED = 320;
/** Added to scroll speed per second of survival (pixels per second²). */
export const SCROLL_SPEED_RAMP = 18;

/** Random delay range before the next obstacle (milliseconds). */
export const MIN_OBSTACLE_GAP_MS = 900;
export const MAX_OBSTACLE_GAP_MS = 2200;

/** Chance a spawn is a bird instead of a bug (when not forced). */
export const BIRD_SPAWN_CHANCE = 0.38;
/**
 * After this many bug-only spawns in a row, the next spawn is always a bird
 * so the player cannot ignore the duck mechanic forever.
 */
export const MAX_BUGS_BEFORE_FORCED_BIRD = 3;

/**
 * World-space top Y of the bird’s bounding box. Smaller Y = higher on screen.
 * Tuned to pass above the standing head while still threatening the jump arc.
 */
export const BIRD_FLY_Y = GROUND_Y - 40;

/**
 * Top Y for flying Tetrominos — tuned against `getHunterHeadHitRect`: overlaps the
 * standing head but stays below the ducked head (smaller Y = higher on screen).
 */
export const TETROMINO_FLY_Y = GROUND_Y - 35;

/** localStorage key for persisted high score. */
export const HIGH_SCORE_STORAGE_KEY = "bh_highscore";
