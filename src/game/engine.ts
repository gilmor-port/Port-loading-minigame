// ─── constants ───────────────────────────────────────────────────────────────

export const CANVAS_W = 800;
export const CANVAS_H = 220;
const GROUND_Y = 170; // y of ground line
const HUNTER_X = 80;
const HUNTER_W = 36;
const HUNTER_H = 48;
const GRAVITY = 2600; // px / s²
const JUMP_VY = -720; // px / s
const INITIAL_SPEED = 320; // px / s
const SPEED_RAMP = 18; // px / s added per second of play
const MIN_OBSTACLE_GAP_MS = 900;
const MAX_OBSTACLE_GAP_MS = 2200;
const HIGH_SCORE_KEY = "bh_highscore";

// ─── types ───────────────────────────────────────────────────────────────────

export type GameState = "idle" | "running" | "gameOver";

interface Obstacle {
  x: number;
  w: number;
  h: number;
  double: boolean; // two bugs stacked
}

export interface GameSnapshot {
  state: GameState;
  score: number;
  highScore: number;
}

// ─── Port logo (inlined SVG as base64 data URL) ──────────────────────────────

const PORT_LOGO_SRC =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik03NSAyMzEuMjM4TDIwMC41NjIgMjMxLjIzOUw3NSAxMDUuNjgzVjIzMS4yMzhaTTc1IDI3NC43MTZWMjc1Qzc1IDMwMi42MTQgOTcuMzg1OCAzMjUgMTI1IDMyNUgzMjVWMTI1QzMyNSA5Ny4zODU4IDMwMi42MTQgNzUgMjc1IDc1SDI3NC43MjdMMjc0LjcyNiAyNzQuNzE1SDI3NC4yODJWMjc0LjcxN0w3NSAyNzQuNzE2Wk0yMjkuODkgNzVMMjI5Ljg5IDE5OS4wNzlMMTA1LjgwNSA3NUgyMjkuODlaIiBmaWxsPSIjMDUyZTE2Ii8+PC9zdmc+";

// ─── drawing helpers ─────────────────────────────────────────────────────────

function drawHunter(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  tick: number,
  running: boolean,
  logoImg: HTMLImageElement
) {
  const legPhase = running ? Math.sin(tick * 12) : 0;

  // body — black with a white outline
  ctx.fillStyle = "#111111";
  ctx.fillRect(x + 8, y, HUNTER_W - 16, HUNTER_H - 16);
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 8, y, HUNTER_W - 16, HUNTER_H - 16);

  // head — white circle with Port logo inside
  const headCx = x + HUNTER_W / 2;
  const headCy = y - 6;
  const headR = 14;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(headCx, headCy, headR, 0, Math.PI * 2);
  ctx.fill();
  // thin black border
  ctx.strokeStyle = "#111111";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // Port logo centred in the head circle
  if (logoImg.complete && logoImg.naturalWidth > 0) {
    const logoSize = headR * 1.5;
    ctx.drawImage(
      logoImg,
      headCx - logoSize / 2,
      headCy - logoSize / 2,
      logoSize,
      logoSize
    );
  }

  // legs — dark gray, animated when running
  ctx.fillStyle = "#333333";
  const lLeg = y + HUNTER_H - 16 + legPhase * 6;
  const rLeg = y + HUNTER_H - 16 - legPhase * 6;
  ctx.fillRect(x + 8, lLeg, 8, 16);
  ctx.fillRect(x + HUNTER_W - 16, rLeg, 8, 16);
  // white shoe highlights
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(x + 8, lLeg + 12, 10, 4);
  ctx.fillRect(x + HUNTER_W - 16, rLeg + 12, 10, 4);

  // net arm — white
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x + HUNTER_W - 4, y + 8);
  ctx.lineTo(x + HUNTER_W + 18, y + 4);
  ctx.stroke();
  // net circle — white stroke, semi-transparent fill
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  ctx.fillStyle = "rgba(255,255,255,0.15)";
  ctx.beginPath();
  ctx.arc(x + HUNTER_W + 18, y + 8, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

function drawBug(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  tick: number
) {
  const wingFlap = Math.sin(tick * 20) * 3;

  // body
  ctx.fillStyle = "#ef4444";
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h * 0.6, w * 0.3, h * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();

  // head
  ctx.fillStyle = "#fca5a5";
  ctx.beginPath();
  ctx.arc(x + w / 2, y + h * 0.18, w * 0.22, 0, Math.PI * 2);
  ctx.fill();

  // spots
  ctx.fillStyle = "#991b1b";
  ctx.beginPath();
  ctx.arc(x + w / 2 - 4, y + h * 0.55, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + w / 2 + 4, y + h * 0.65, 3, 0, Math.PI * 2);
  ctx.fill();

  // wings
  ctx.fillStyle = "rgba(254,202,202,0.7)";
  ctx.beginPath();
  ctx.ellipse(
    x + w / 2 - w * 0.35,
    y + h * 0.45 + wingFlap,
    w * 0.28,
    h * 0.22,
    -0.5,
    0,
    Math.PI * 2
  );
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(
    x + w / 2 + w * 0.35,
    y + h * 0.45 - wingFlap,
    w * 0.28,
    h * 0.22,
    0.5,
    0,
    Math.PI * 2
  );
  ctx.fill();

  // antennae
  ctx.strokeStyle = "#991b1b";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x + w / 2 - 4, y + h * 0.08);
  ctx.lineTo(x + w / 2 - 10, y - 4);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + w / 2 + 4, y + h * 0.08);
  ctx.lineTo(x + w / 2 + 10, y - 4);
  ctx.stroke();
}

function drawGround(ctx: CanvasRenderingContext2D, offset: number) {
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y + HUNTER_H);
  ctx.lineTo(CANVAS_W, GROUND_Y + HUNTER_H);
  ctx.stroke();

  // moving dashes on the ground
  ctx.fillStyle = "#555555";
  for (let i = 0; i < 12; i++) {
    const dotX = ((i * 70 - offset) % CANVAS_W + CANVAS_W) % CANVAS_W;
    ctx.fillRect(dotX, GROUND_Y + HUNTER_H + 5, 20, 2);
  }
}

// ─── engine class ────────────────────────────────────────────────────────────

export class GameEngine {
  private ctx: CanvasRenderingContext2D;
  private logoImg: HTMLImageElement;
  private state: GameState = "idle";
  private hunterY = GROUND_Y;
  private vy = 0;
  private grounded = true;
  private obstacles: Obstacle[] = [];
  private speed = INITIAL_SPEED;
  private score = 0;
  private highScore = 0;
  private elapsed = 0; // total running seconds
  private groundOffset = 0;
  private nextObstacleIn = 0;
  private tick = 0; // for animations
  private rafId = 0;
  private lastTime = 0;
  private onUpdate: (snap: GameSnapshot) => void;

  constructor(
    canvas: HTMLCanvasElement,
    onUpdate: (snap: GameSnapshot) => void
  ) {
    this.ctx = canvas.getContext("2d")!;
    this.onUpdate = onUpdate;
    this.logoImg = new Image();
    this.logoImg.src = PORT_LOGO_SRC;
    this.highScore = parseInt(localStorage.getItem(HIGH_SCORE_KEY) ?? "0", 10);
    this.scheduleNextObstacle();
    this.loop(0);
  }

  private scheduleNextObstacle() {
    this.nextObstacleIn =
      MIN_OBSTACLE_GAP_MS +
      Math.random() * (MAX_OBSTACLE_GAP_MS - MIN_OBSTACLE_GAP_MS);
  }

  jump() {
    if (this.state === "idle") {
      this.start();
      return;
    }
    if (this.state === "gameOver") {
      this.restart();
      return;
    }
    if (this.grounded) {
      this.vy = JUMP_VY;
      this.grounded = false;
    }
  }

  private start() {
    this.state = "running";
    this.vy = JUMP_VY;
    this.grounded = false;
  }

  private restart() {
    this.state = "running";
    this.hunterY = GROUND_Y;
    this.vy = 0;
    this.grounded = true;
    this.obstacles = [];
    this.speed = INITIAL_SPEED;
    this.score = 0;
    this.elapsed = 0;
    this.scheduleNextObstacle();
  }

  private update(dt: number) {
    if (this.state !== "running") return;

    this.elapsed += dt;
    this.speed = INITIAL_SPEED + this.elapsed * SPEED_RAMP;
    this.score = Math.floor(this.elapsed * 10);
    this.tick += dt;
    this.groundOffset = (this.groundOffset + this.speed * dt) % CANVAS_W;

    // gravity
    this.vy += GRAVITY * dt;
    this.hunterY += this.vy * dt;
    if (this.hunterY >= GROUND_Y) {
      this.hunterY = GROUND_Y;
      this.vy = 0;
      this.grounded = true;
    }

    // spawn obstacles
    this.nextObstacleIn -= dt * 1000;
    if (this.nextObstacleIn <= 0) {
      const isDouble = Math.random() < 0.3;
      const h = isDouble ? 64 : 32 + Math.random() * 20;
      this.obstacles.push({
        x: CANVAS_W + 20,
        w: 28,
        h,
        double: isDouble,
      });
      this.scheduleNextObstacle();
    }

    // move & cull obstacles
    for (const obs of this.obstacles) {
      obs.x -= this.speed * dt;
    }
    this.obstacles = this.obstacles.filter((o) => o.x + o.w > -10);

    // collision
    const hx = HUNTER_X + 12;
    const hy = this.hunterY + 4;
    const hw = HUNTER_W - 24;
    const hh = HUNTER_H - 8;
    for (const obs of this.obstacles) {
      const obsY = GROUND_Y + HUNTER_H - obs.h;
      if (
        hx < obs.x + obs.w &&
        hx + hw > obs.x &&
        hy < obsY + obs.h &&
        hy + hh > obsY
      ) {
        this.die();
        return;
      }
    }
  }

  private die() {
    this.state = "gameOver";
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem(HIGH_SCORE_KEY, String(this.highScore));
    }
  }

  private draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    // background — near-black
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    drawGround(ctx, this.groundOffset);

    // hunter
    const runningAnim = this.state === "running" && this.grounded;
    drawHunter(ctx, HUNTER_X, this.hunterY, this.tick, runningAnim, this.logoImg);

    // obstacles
    for (const obs of this.obstacles) {
      const obsY = GROUND_Y + HUNTER_H - obs.h;
      if (obs.double) {
        drawBug(ctx, obs.x, obsY, obs.w, obs.h / 2, this.tick);
        drawBug(ctx, obs.x, obsY + obs.h / 2 + 2, obs.w, obs.h / 2, this.tick);
      } else {
        drawBug(ctx, obs.x, obsY, obs.w, obs.h, this.tick);
      }
    }

    // overlays
    ctx.textAlign = "center";
    if (this.state === "idle") {
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 36px monospace";
      ctx.fillText("BUG HUNTER", CANVAS_W / 2, CANVAS_H / 2 - 24);
      ctx.font = "18px monospace";
      ctx.fillStyle = "#aaaaaa";
      ctx.fillText(
        "Press SPACE / ↑ or tap to start",
        CANVAS_W / 2,
        CANVAS_H / 2 + 12
      );
    }

    if (this.state === "gameOver") {
      ctx.fillStyle = "rgba(0,0,0,0.65)";
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 30px monospace";
      ctx.fillText("SQUASHED!", CANVAS_W / 2, CANVAS_H / 2 - 28);
      ctx.fillStyle = "#cccccc";
      ctx.font = "18px monospace";
      ctx.fillText(`Score: ${this.score}`, CANVAS_W / 2, CANVAS_H / 2 + 4);
      ctx.fillStyle = "#aaaaaa";
      ctx.font = "16px monospace";
      ctx.fillText(
        "Press SPACE / ↑ or tap to restart",
        CANVAS_W / 2,
        CANVAS_H / 2 + 30
      );
    }
  }

  private loop = (now: number) => {
    const dt = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;

    this.update(dt);
    this.draw();
    this.onUpdate({
      state: this.state,
      score: this.score,
      highScore: this.highScore,
    });

    this.rafId = requestAnimationFrame(this.loop);
  };

  destroy() {
    cancelAnimationFrame(this.rafId);
  }
}
