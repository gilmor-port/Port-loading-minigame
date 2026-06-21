import {
  BIRD_FLY_Y,
  BIRD_SPAWN_CHANCE,
  CANVAS_H,
  CANVAS_W,
  GROUND_Y,
  GRAVITY,
  HIGH_SCORE_STORAGE_KEY,
  HUNTER_H,
  HUNTER_W,
  HUNTER_X,
  INITIAL_SCROLL_SPEED,
  JUMP_VY,
  MAX_BUGS_BEFORE_FORCED_BIRD,
  MAX_OBSTACLE_GAP_MS,
  MIN_OBSTACLE_GAP_MS,
  SCROLL_SPEED_RAMP,
  TETROMINO_FLY_Y,
} from "./constants";
import { PORT_LOGO_DARK_DATA_URL, PORT_LOGO_WHITE_DATA_URL } from "./portLogoAssets";
import { drawBird } from "./render/drawBird";
import { drawBug } from "./render/drawBug";
import { drawFlyingTetromino } from "./render/drawFlyingTetromino";
import { drawGround } from "./render/drawGround";
import { drawHunter, getHunterHeadHitRect } from "./render/drawHunter";
import type { GameSnapshot, GameState, Obstacle } from "./types";

/**
 * Main game loop: physics, obstacle spawns, collisions, rendering, HUD snapshots.
 */
export class GameEngine {
  private readonly ctx: CanvasRenderingContext2D;
  /** Reserved dark logo asset (hunter uses white-on-shirt only). */
  private readonly logoDarkImage: HTMLImageElement;
  private readonly logoWhiteImage: HTMLImageElement;
  private readonly onSnapshot: (snap: GameSnapshot) => void;

  private gameState: GameState = "idle";
  /** Vertical anchor Y passed into `drawHunter` (locked to `GROUND_Y` when grounded). */
  private hunterAnchorY = GROUND_Y;
  /** Vertical velocity while jumping (pixels per second). */
  private verticalVelocityPxPerSec = 0;
  private isGrounded = true;
  /** True while player holds duck on the ground. */
  private duckHeld = false;

  private obstacleList: Obstacle[] = [];
  /** How fast the world scrolls left (pixels per second). */
  private scrollSpeedPxPerSec = INITIAL_SCROLL_SPEED;
  private score = 0;
  private highScore = 0;
  /** Total seconds spent in the `running` state (used for score + speed ramp). */
  private runTimeSeconds = 0;
  /** Horizontal offset for ground dash pattern. */
  private groundDashScrollPx = 0;
  /** Milliseconds until the next obstacle may spawn. */
  private msUntilNextObstacle = 0;
  /** Consecutive ground-bug-only spawns since the last air hazard (Tetromino). */
  private bugsSinceLastBird = 0;
  /** Animation clock in seconds (walk, wings, typing). */
  private animTimeSeconds = 0;

  private rafId = 0;
  private lastFrameTimeMs = 0;

  constructor(canvas: HTMLCanvasElement, onSnapshot: (snap: GameSnapshot) => void) {
    this.ctx = canvas.getContext("2d")!;
    this.onSnapshot = onSnapshot;

    this.logoDarkImage = new Image();
    this.logoDarkImage.src = PORT_LOGO_DARK_DATA_URL;
    this.logoWhiteImage = new Image();
    this.logoWhiteImage.src = PORT_LOGO_WHITE_DATA_URL;

    this.highScore = parseInt(
      localStorage.getItem(HIGH_SCORE_STORAGE_KEY) ?? "0",
      10
    );
    this.scheduleNextObstacle();
    this.loop(0);
  }

  /** Picks a random gap until the next obstacle spawn. */
  private scheduleNextObstacle(): void {
    this.msUntilNextObstacle =
      MIN_OBSTACLE_GAP_MS +
      Math.random() * (MAX_OBSTACLE_GAP_MS - MIN_OBSTACLE_GAP_MS);
  }

  jump(): void {
    if (this.gameState === "idle") {
      this.startNewRun();
      return;
    }
    if (this.gameState === "gameOver") {
      this.restartRun();
      return;
    }
    if (this.isGrounded) {
      this.verticalVelocityPxPerSec = JUMP_VY;
      this.isGrounded = false;
    }
  }

  /** Hold ↓ on the ground to duck under flying Tetrominos. */
  setDuck(down: boolean): void {
    this.duckHeld = down;
  }

  /** First start: begin running and hop off the ground for feedback. */
  private startNewRun(): void {
    this.gameState = "running";
    this.verticalVelocityPxPerSec = JUMP_VY;
    this.isGrounded = false;
  }

  /** Reset world after game over. */
  private restartRun(): void {
    this.gameState = "running";
    this.hunterAnchorY = GROUND_Y;
    this.verticalVelocityPxPerSec = 0;
    this.isGrounded = true;
    this.duckHeld = false;
    this.obstacleList = [];
    this.bugsSinceLastBird = 0;
    this.scrollSpeedPxPerSec = INITIAL_SCROLL_SPEED;
    this.score = 0;
    this.runTimeSeconds = 0;
    this.scheduleNextObstacle();
  }

  private updateSimulation(dtSeconds: number): void {
    if (this.gameState !== "running") return;

    this.runTimeSeconds += dtSeconds;
    this.scrollSpeedPxPerSec =
      INITIAL_SCROLL_SPEED + this.runTimeSeconds * SCROLL_SPEED_RAMP;
    this.score = Math.floor(this.runTimeSeconds * 10);
    this.animTimeSeconds += dtSeconds;
    this.groundDashScrollPx =
      (this.groundDashScrollPx + this.scrollSpeedPxPerSec * dtSeconds) % CANVAS_W;

    this.verticalVelocityPxPerSec += GRAVITY * dtSeconds;
    this.hunterAnchorY += this.verticalVelocityPxPerSec * dtSeconds;
    if (this.hunterAnchorY >= GROUND_Y) {
      this.hunterAnchorY = GROUND_Y;
      this.verticalVelocityPxPerSec = 0;
      this.isGrounded = true;
    }

    this.msUntilNextObstacle -= dtSeconds * 1000;
    if (this.msUntilNextObstacle <= 0) {
      const spawnAirHazard =
        this.bugsSinceLastBird >= MAX_BUGS_BEFORE_FORCED_BIRD ||
        Math.random() < BIRD_SPAWN_CHANCE;
      if (spawnAirHazard) {
        this.obstacleList.push({
          kind: "tetromino",
          x: CANVAS_W + 30,
          w: 54,
          h: 36,
          double: false,
          flyY: TETROMINO_FLY_Y,
          tetVariant: Math.floor(Math.random() * 7),
        });
        this.bugsSinceLastBird = 0;
      } else {
        const isDoubleStack = Math.random() < 0.3;
        const bugHeightPx = isDoubleStack ? 64 : 32 + Math.random() * 20;
        this.obstacleList.push({
          kind: "bug",
          x: CANVAS_W + 20,
          w: 28,
          h: bugHeightPx,
          double: isDoubleStack,
        });
        this.bugsSinceLastBird += 1;
      }
      this.scheduleNextObstacle();
    }

    for (const obstacle of this.obstacleList) {
      obstacle.x -= this.scrollSpeedPxPerSec * dtSeconds;
    }
    this.obstacleList = this.obstacleList.filter((o) => o.x + o.w > -10);

    const hunterHitLeft = HUNTER_X + 12;
    const hunterHitWidth = HUNTER_W - 24;
    const isDucked = this.isGrounded && this.duckHeld;
    const hunterHitTop = isDucked ? this.hunterAnchorY + 28 : this.hunterAnchorY + 4;
    const hunterHitHeight = isDucked ? 22 : HUNTER_H - 8;

    const headHit = getHunterHeadHitRect(HUNTER_X, this.hunterAnchorY, isDucked);

    for (const obstacle of this.obstacleList) {
      let obstacleTopY: number;
      const obstacleHeight = obstacle.h;
      if (obstacle.kind === "bird" || obstacle.kind === "tetromino") {
        obstacleTopY = obstacle.flyY ?? BIRD_FLY_Y;
      } else {
        obstacleTopY = GROUND_Y + HUNTER_H - obstacle.h;
      }
      const useHeadOnly = obstacle.kind === "tetromino";
      const boxLeft = useHeadOnly ? headHit.x : hunterHitLeft;
      const boxTop = useHeadOnly ? headHit.y : hunterHitTop;
      const boxW = useHeadOnly ? headHit.w : hunterHitWidth;
      const boxH = useHeadOnly ? headHit.h : hunterHitHeight;
      const overlapX =
        boxLeft < obstacle.x + obstacle.w && boxLeft + boxW > obstacle.x;
      const overlapY =
        boxTop < obstacleTopY + obstacleHeight &&
        boxTop + boxH > obstacleTopY;
      if (overlapX && overlapY) {
        this.enterGameOver();
        return;
      }
    }
  }

  private enterGameOver(): void {
    this.gameState = "gameOver";
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem(HIGH_SCORE_STORAGE_KEY, String(this.highScore));
    }
  }

  private renderFrame(): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    drawGround(ctx, this.groundDashScrollPx);

    const playRunCycle = this.gameState === "running" && this.isGrounded;
    const showDuckPose =
      this.gameState === "running" && this.isGrounded && this.duckHeld;
    drawHunter(
      ctx,
      HUNTER_X,
      this.hunterAnchorY,
      this.animTimeSeconds,
      playRunCycle,
      showDuckPose,
      this.logoDarkImage,
      this.logoWhiteImage
    );

    for (const obstacle of this.obstacleList) {
      if (obstacle.kind === "tetromino") {
        const flyY = obstacle.flyY ?? BIRD_FLY_Y;
        drawFlyingTetromino(
          ctx,
          obstacle.x,
          flyY,
          obstacle.w,
          obstacle.h,
          this.animTimeSeconds,
          obstacle.tetVariant ?? 0
        );
      } else if (obstacle.kind === "bird") {
        const flyY = obstacle.flyY ?? BIRD_FLY_Y;
        drawBird(ctx, obstacle.x, flyY, obstacle.w, obstacle.h, this.animTimeSeconds);
      } else {
        const bugTopY = GROUND_Y + HUNTER_H - obstacle.h;
        if (obstacle.double) {
          const halfH = obstacle.h / 2;
          drawBug(ctx, obstacle.x, bugTopY, obstacle.w, halfH, this.animTimeSeconds);
          drawBug(
            ctx,
            obstacle.x,
            bugTopY + halfH + 2,
            obstacle.w,
            halfH,
            this.animTimeSeconds
          );
        } else {
          drawBug(
            ctx,
            obstacle.x,
            bugTopY,
            obstacle.w,
            obstacle.h,
            this.animTimeSeconds
          );
        }
      }
    }

    ctx.textAlign = "center";
    if (this.gameState === "idle") {
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 36px monospace";
      ctx.fillText("BUG HUNTER", CANVAS_W / 2, CANVAS_H / 2 - 24);
      ctx.font = "18px monospace";
      ctx.fillStyle = "#aaaaaa";
      ctx.fillText(
        "SPACE / ↑ jump · ↓ duck Tetris pieces",
        CANVAS_W / 2,
        CANVAS_H / 2 + 12
      );
    }

    if (this.gameState === "gameOver") {
      ctx.fillStyle = "rgba(0,0,0,0.65)";
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 30px monospace";
      ctx.fillText("SQUASHED!", CANVAS_W / 2, CANVAS_H / 2 - 34);
      ctx.fillStyle = "#cccccc";
      ctx.font = "18px monospace";
      ctx.fillText(`Score: ${this.score}`, CANVAS_W / 2, CANVAS_H / 2 - 4);
      ctx.fillStyle = "#aaaaaa";
      ctx.fillText(`Best: ${this.highScore}`, CANVAS_W / 2, CANVAS_H / 2 + 18);
      ctx.font = "16px monospace";
      ctx.fillText(
        "Press SPACE / ↑ or tap to restart",
        CANVAS_W / 2,
        CANVAS_H / 2 + 44
      );
    }
  }

  private loop = (nowMs: number): void => {
    const dtSeconds = Math.min((nowMs - this.lastFrameTimeMs) / 1000, 0.05);
    this.lastFrameTimeMs = nowMs;

    this.updateSimulation(dtSeconds);
    this.renderFrame();
    this.onSnapshot({
      state: this.gameState,
      score: this.score,
      highScore: this.highScore,
    });

    this.rafId = requestAnimationFrame(this.loop);
  };

  destroy(): void {
    cancelAnimationFrame(this.rafId);
  }
}
