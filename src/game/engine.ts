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
const BIRD_SPAWN_CHANCE = 0.38;
/** After this many bug-only spawns in a row, the next obstacle is always a bird */
const MAX_BUGS_BEFORE_FORCED_BIRD = 3;
/** Bird top Y — overlaps standing torso/chest, clears ducked hitbox */
const BIRD_FLY_Y = GROUND_Y - 28;
const HIGH_SCORE_KEY = "bh_highscore";

// ─── types ───────────────────────────────────────────────────────────────────

export type GameState = "idle" | "running" | "gameOver";

type ObstacleKind = "bug" | "bird";

interface Obstacle {
  kind: ObstacleKind;
  x: number;
  w: number;
  h: number;
  double: boolean; // two bugs stacked (bugs only)
  /** top Y for flying birds */
  flyY?: number;
}

export interface GameSnapshot {
  state: GameState;
  score: number;
  highScore: number;
}

// ─── Port logo (inlined SVG as base64 data URL) ──────────────────────────────

// dark fill — used for the head circle background (if needed in future)
const PORT_LOGO_SRC =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik03NSAyMzEuMjM4TDIwMC41NjIgMjMxLjIzOUw3NSAxMDUuNjgzVjIzMS4yMzhaTTc1IDI3NC43MTZWMjc1Qzc1IDMwMi42MTQgOTcuMzg1OCAzMjUgMTI1IDMyNUgzMjVWMTI1QzMyNSA5Ny4zODU4IDMwMi42MTQgNzUgMjc1IDc1SDI3NC43MjdMMjc0LjcyNiAyNzQuNzE1SDI3NC4yODJWMjc0LjcxN0w3NSAyNzQuNzE2Wk0yMjkuODkgNzVMMjI5Ljg5IDE5OS4wNzlMMTA1LjgwNSA3NUgyMjkuODlaIiBmaWxsPSIjMDUyZTE2Ii8+PC9zdmc+";
// white fill — used on the dark shirt so the logo is visible
const PORT_LOGO_WHITE_SRC =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik03NSAyMzEuMjM4TDIwMC41NjIgMjMxLjIzOUw3NSAxMDUuNjgzVjIzMS4yMzhaTTc1IDI3NC43MTZWMjc1Qzc1IDMwMi42MTQgOTcuMzg1OCAzMjUgMTI1IDMyNUgzMjVWMTI1QzMyNSA5Ny4zODU4IDMwMi42MTQgNzUgMjc1IDc1SDI3NC43MjdMMjc0LjcyNiAyNzQuNzE1SDI3NC4yODJWMjc0LjcxN0w3NSAyNzQuNzE2Wk0yMjkuODkgNzVMMjI5Ljg5IDE5OS4wNzlMMTA1LjgwNSA3NUgyMjkuODlaIiBmaWxsPSJ3aGl0ZSIvPjwvc3ZnPg==";

// ─── drawing helpers ─────────────────────────────────────────────────────────

function drawHunter(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  tick: number,
  running: boolean,
  ducking: boolean,
  _logoImg: HTMLImageElement,
  logoWhiteImg: HTMLImageElement
) {
  const legPhase = running && !ducking ? Math.sin(tick * 12) : 0;
  const blinkOpen = Math.sin(tick * 3.7) > -0.97; // eyes close briefly to blink
  const squat = ducking ? 22 : 0; // crouch: lower torso, compress

  // ── shirt / body ──
  const bodyX = x + 6;
  const bodyY = y + 2 + squat;
  const bodyW = HUNTER_W - 12;
  const bodyH = ducking ? HUNTER_H - 18 - 14 : HUNTER_H - 18;
  ctx.fillStyle = "#111111";
  ctx.fillRect(bodyX, bodyY, bodyW, bodyH);
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 1;
  ctx.strokeRect(bodyX, bodyY, bodyW, bodyH);

  // collar V-shape
  ctx.strokeStyle = "#cccccc";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(bodyX + bodyW * 0.3, bodyY);
  ctx.lineTo(bodyX + bodyW * 0.5, bodyY + 5);
  ctx.lineTo(bodyX + bodyW * 0.7, bodyY);
  ctx.stroke();

  // Port logo on shirt — white version so it shows on dark fabric
  if (logoWhiteImg.complete && logoWhiteImg.naturalWidth > 0) {
    const logoSize = Math.min(bodyW, bodyH) * 0.7;
    ctx.drawImage(
      logoWhiteImg,
      bodyX + (bodyW - logoSize) / 2,
      bodyY + (bodyH - logoSize) / 2,
      logoSize,
      logoSize
    );
  }

  // ── legs ──
  ctx.fillStyle = "#333333";
  const legH = ducking ? 10 : 16;
  const legYBase = y + HUNTER_H - (ducking ? 10 : 16);
  const lLeg = legYBase + legPhase * (ducking ? 2 : 6);
  const rLeg = legYBase - legPhase * (ducking ? 2 : 6);
  ctx.fillRect(x + 8, lLeg, 8, legH);
  ctx.fillRect(x + HUNTER_W - 16, rLeg, 8, legH);
  // shoe highlights
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(x + 7, lLeg + legH - 4, 11, 4);
  ctx.fillRect(x + HUNTER_W - 17, rLeg + legH - 4, 11, 4);

  // ── neck ──
  ctx.fillStyle = "#e8c9a0";
  ctx.fillRect(x + HUNTER_W / 2 - 4, bodyY - (ducking ? 2 : 5), 8, ducking ? 4 : 7);

  // ── head ──
  const headCx = x + HUNTER_W / 2;
  const headCy = y - 8 + squat * 0.85;
  const headRx = ducking ? 11 : 13;
  const headRy = ducking ? 9 : 12;
  // skin
  ctx.fillStyle = "#e8c9a0";
  ctx.beginPath();
  ctx.ellipse(headCx, headCy, headRx, headRy, 0, 0, Math.PI * 2);
  ctx.fill();
  // outline
  ctx.strokeStyle = "#c8a878";
  ctx.lineWidth = 1;
  ctx.stroke();

  // hair (dark top)
  ctx.fillStyle = "#222222";
  ctx.beginPath();
  ctx.ellipse(headCx, headCy - headRy * 0.35, headRx, headRy * 0.7, 0, Math.PI, 0);
  ctx.fill();
  // small side tufts
  ctx.beginPath();
  ctx.arc(headCx - headRx + 2, headCy - 4, 4, Math.PI * 0.8, Math.PI * 1.6);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(headCx + headRx - 2, headCy - 4, 4, Math.PI * 1.4, Math.PI * 0.2);
  ctx.fill();

  // eyes
  const eyeY = headCy + 1;
  const eyeOffX = 5;
  if (blinkOpen) {
    // whites
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.ellipse(headCx - eyeOffX, eyeY, 3.5, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(headCx + eyeOffX, eyeY, 3.5, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    // pupils
    ctx.fillStyle = "#111111";
    ctx.beginPath();
    ctx.arc(headCx - eyeOffX + 0.5, eyeY, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(headCx + eyeOffX + 0.5, eyeY, 1.8, 0, Math.PI * 2);
    ctx.fill();
    // eye shine
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(headCx - eyeOffX + 1, eyeY - 1, 0.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(headCx + eyeOffX + 1, eyeY - 1, 0.7, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // closed blink — thin lines
    ctx.strokeStyle = "#333333";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(headCx - eyeOffX - 3, eyeY);
    ctx.lineTo(headCx - eyeOffX + 3, eyeY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(headCx + eyeOffX - 3, eyeY);
    ctx.lineTo(headCx + eyeOffX + 3, eyeY);
    ctx.stroke();
  }

  // eyebrows
  ctx.strokeStyle = "#222222";
  ctx.lineWidth = 1.5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(headCx - eyeOffX - 3, eyeY - 4.5);
  ctx.lineTo(headCx - eyeOffX + 3, eyeY - 5);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(headCx + eyeOffX - 3, eyeY - 5);
  ctx.lineTo(headCx + eyeOffX + 3, eyeY - 4.5);
  ctx.stroke();

  // nose
  ctx.strokeStyle = "#c8a878";
  ctx.lineWidth = 1;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(headCx - 1, eyeY + 2);
  ctx.lineTo(headCx - 2, eyeY + 5);
  ctx.lineTo(headCx + 2, eyeY + 5);
  ctx.stroke();

  // smile
  ctx.strokeStyle = "#a0785a";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(headCx, eyeY + 6, 4, 0.2, Math.PI - 0.2);
  ctx.stroke();

  // ── net arm ──
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2.5;
  ctx.lineCap = "butt";
  ctx.beginPath();
  if (ducking) {
    ctx.moveTo(bodyX + bodyW - 2, bodyY + bodyH * 0.5);
    ctx.lineTo(bodyX + bodyW + 10, bodyY + bodyH * 0.85);
  } else {
    ctx.moveTo(bodyX + bodyW - 2, bodyY + 6);
    ctx.lineTo(bodyX + bodyW + 16, bodyY + 2);
  }
  ctx.stroke();
  // net hoop
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  const ncY = ducking ? bodyY + bodyH * 0.75 : bodyY + 8;
  const ncX = ducking ? bodyX + bodyW + 10 : bodyX + bodyW + 16;
  ctx.beginPath();
  ctx.arc(ncX, ncY, ducking ? 6 : 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // net mesh lines
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 0.8;
  const nc = { x: ncX, y: ncY };
  const nr = ducking ? 6 : 9;
  ctx.beginPath();
  ctx.moveTo(nc.x - nr, nc.y);
  ctx.lineTo(nc.x + nr, nc.y);
  ctx.moveTo(nc.x, nc.y - nr);
  ctx.lineTo(nc.x, nc.y + nr);
  ctx.moveTo(nc.x - nr * 0.67, nc.y - nr * 0.67);
  ctx.lineTo(nc.x + nr * 0.67, nc.y + nr * 0.67);
  ctx.moveTo(nc.x + nr * 0.67, nc.y - nr * 0.67);
  ctx.lineTo(nc.x - nr * 0.67, nc.y + nr * 0.67);
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
  const cx = x + w / 2;
  const pulse = 0.5 + 0.5 * Math.sin(tick * 8); // 0–1 glow pulse
  const wingFlap = Math.sin(tick * 22) * 4;

  // ── mechanical wings (behind body) ──
  const wingW = w * 0.55;
  const wingH = h * 0.28;
  const wingY = y + h * 0.35;
  for (const side of [-1, 1]) {
    const wx = cx + side * (w * 0.08);
    const wFlap = side * wingFlap;
    ctx.save();
    ctx.translate(wx, wingY + wFlap);
    ctx.rotate(side * 0.25);
    // outer panel
    ctx.fillStyle = "#1a1a1a";
    ctx.strokeStyle = "#00ffcc";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.rect(-wingW, -wingH / 2, wingW, wingH);
    ctx.fill();
    ctx.stroke();
    // circuit vein lines on wing
    ctx.strokeStyle = "rgba(0,255,204,0.4)";
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(-wingW * 0.8, 0);
    ctx.lineTo(-wingW * 0.2, 0);
    ctx.moveTo(-wingW * 0.5, -wingH * 0.4);
    ctx.lineTo(-wingW * 0.5, wingH * 0.4);
    ctx.stroke();
    ctx.restore();
  }

  // ── thorax (angular hexagonal body) ──
  const bx = cx;
  const by = y + h * 0.55;
  const bw = w * 0.38;
  const bh = h * 0.38;
  ctx.fillStyle = "#111111";
  ctx.strokeStyle = "#00ffcc";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(bx - bw, by);
  ctx.lineTo(bx - bw * 0.5, by - bh);
  ctx.lineTo(bx + bw * 0.5, by - bh);
  ctx.lineTo(bx + bw, by);
  ctx.lineTo(bx + bw * 0.5, by + bh);
  ctx.lineTo(bx - bw * 0.5, by + bh);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // chest circuit line
  ctx.strokeStyle = `rgba(0,255,204,${0.3 + pulse * 0.5})`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(bx - bw * 0.4, by);
  ctx.lineTo(bx + bw * 0.4, by);
  ctx.moveTo(bx, by - bh * 0.6);
  ctx.lineTo(bx, by + bh * 0.6);
  ctx.stroke();

  // ── mechanical legs (3 per side, jointed) ──
  const legPositions = [-0.25, 0, 0.25];
  for (const side of [-1, 1]) {
    for (let i = 0; i < legPositions.length; i++) {
      const legY = y + h * (0.42 + legPositions[i]);
      const legPhase = Math.sin(tick * 14 + i * 1.2) * 3 * side;
      const knee = { x: cx + side * bw * 1.4, y: legY + legPhase };
      const foot = { x: cx + side * bw * 2.1, y: legY + 5 + legPhase * 0.5 };
      ctx.strokeStyle = "#444444";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx + side * bw * 0.9, legY);
      ctx.lineTo(knee.x, knee.y);
      ctx.lineTo(foot.x, foot.y);
      ctx.stroke();
      // joint dot
      ctx.fillStyle = "#00ffcc";
      ctx.beginPath();
      ctx.arc(knee.x, knee.y, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ── head (armoured square with visor) ──
  const hx = cx;
  const hy = y + h * 0.14;
  const hr = w * 0.26;
  ctx.fillStyle = "#1a1a1a";
  ctx.strokeStyle = "#00ffcc";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.rect(hx - hr, hy - hr, hr * 2, hr * 2);
  ctx.fill();
  ctx.stroke();
  // visor slit (glowing)
  const visorAlpha = 0.7 + pulse * 0.3;
  ctx.fillStyle = `rgba(0,255,204,${visorAlpha})`;
  ctx.fillRect(hx - hr * 0.7, hy - hr * 0.15, hr * 1.4, hr * 0.3);
  // eye LEDs inside visor
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(hx - hr * 0.35, hy, 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(hx + hr * 0.35, hy, 1.8, 0, Math.PI * 2);
  ctx.fill();

  // ── sensor antennae ──
  ctx.strokeStyle = "#555555";
  ctx.lineWidth = 1.2;
  // left
  ctx.beginPath();
  ctx.moveTo(hx - hr * 0.5, hy - hr);
  ctx.lineTo(hx - hr * 0.5 - 5, hy - hr - 6);
  ctx.lineTo(hx - hr * 0.5 - 8, hy - hr - 4);
  ctx.stroke();
  // right
  ctx.beginPath();
  ctx.moveTo(hx + hr * 0.5, hy - hr);
  ctx.lineTo(hx + hr * 0.5 + 5, hy - hr - 6);
  ctx.lineTo(hx + hr * 0.5 + 8, hy - hr - 4);
  ctx.stroke();
  // sensor tips (glowing)
  ctx.fillStyle = `rgba(0,255,204,${visorAlpha})`;
  ctx.beginPath();
  ctx.arc(hx - hr * 0.5 - 8, hy - hr - 4, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(hx + hr * 0.5 + 8, hy - hr - 4, 2, 0, Math.PI * 2);
  ctx.fill();
}

function drawBird(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  tick: number
) {
  const flap = Math.sin(tick * 18) * 0.35;
  const cx = x + w / 2;
  const cy = y + h * 0.45;

  // wings (behind)
  ctx.fillStyle = "#2a2a2a";
  ctx.strokeStyle = "#888888";
  ctx.lineWidth = 1;
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(cx + side * w * 0.15, cy);
    ctx.rotate(side * flap);
    ctx.beginPath();
    ctx.ellipse(side * w * 0.35, 0, w * 0.38, h * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // body
  ctx.fillStyle = "#3a3a3a";
  ctx.strokeStyle = "#aaaaaa";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(cx, cy + h * 0.08, w * 0.28, h * 0.32, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // head
  ctx.fillStyle = "#444444";
  ctx.beginPath();
  ctx.arc(x + w * 0.72, y + h * 0.38, h * 0.22, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // beak
  ctx.fillStyle = "#ffaa44";
  ctx.beginPath();
  ctx.moveTo(x + w * 0.88, y + h * 0.36);
  ctx.lineTo(x + w * 1.05, y + h * 0.42);
  ctx.lineTo(x + w * 0.88, y + h * 0.48);
  ctx.closePath();
  ctx.fill();

  // eye
  ctx.fillStyle = "#111111";
  ctx.beginPath();
  ctx.arc(x + w * 0.78, y + h * 0.34, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(x + w * 0.79, y + h * 0.33, 0.7, 0, Math.PI * 2);
  ctx.fill();

  // tail
  ctx.strokeStyle = "#666666";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.12, cy);
  ctx.lineTo(x - w * 0.08, y + h * 0.55);
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
  private logoWhiteImg: HTMLImageElement;
  private state: GameState = "idle";
  private hunterY = GROUND_Y;
  private vy = 0;
  private grounded = true;
  private duckHeld = false;
  private obstacles: Obstacle[] = [];
  private speed = INITIAL_SPEED;
  private score = 0;
  private highScore = 0;
  private elapsed = 0; // total running seconds
  private groundOffset = 0;
  private nextObstacleIn = 0;
  private bugsSinceBird = 0;
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
    this.logoWhiteImg = new Image();
    this.logoWhiteImg.src = PORT_LOGO_WHITE_SRC;
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

  /** Hold ↓ on the ground to duck under birds */
  setDuck(down: boolean) {
    this.duckHeld = down;
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
    this.duckHeld = false;
    this.obstacles = [];
    this.bugsSinceBird = 0;
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
      const spawnBird =
        this.bugsSinceBird >= MAX_BUGS_BEFORE_FORCED_BIRD ||
        Math.random() < BIRD_SPAWN_CHANCE;
      if (spawnBird) {
        this.obstacles.push({
          kind: "bird",
          x: CANVAS_W + 30,
          w: 40,
          h: 26,
          double: false,
          flyY: BIRD_FLY_Y,
        });
        this.bugsSinceBird = 0;
      } else {
        const isDouble = Math.random() < 0.3;
        const h = isDouble ? 64 : 32 + Math.random() * 20;
        this.obstacles.push({
          kind: "bug",
          x: CANVAS_W + 20,
          w: 28,
          h,
          double: isDouble,
        });
        this.bugsSinceBird += 1;
      }
      this.scheduleNextObstacle();
    }

    // move & cull obstacles
    for (const obs of this.obstacles) {
      obs.x -= this.speed * dt;
    }
    this.obstacles = this.obstacles.filter((o) => o.x + o.w > -10);

    // collision
    const hx = HUNTER_X + 12;
    const hw = HUNTER_W - 24;
    const ducked = this.grounded && this.duckHeld;
    const hy = ducked ? this.hunterY + 28 : this.hunterY + 4;
    const hh = ducked ? 22 : HUNTER_H - 8;
    for (const obs of this.obstacles) {
      let obsY: number;
      let obsH = obs.h;
      if (obs.kind === "bird") {
        obsY = obs.flyY ?? BIRD_FLY_Y;
      } else {
        obsY = GROUND_Y + HUNTER_H - obs.h;
      }
      if (
        hx < obs.x + obs.w &&
        hx + hw > obs.x &&
        hy < obsY + obsH &&
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
    const showDuck = this.state === "running" && this.grounded && this.duckHeld;
    drawHunter(
      ctx,
      HUNTER_X,
      this.hunterY,
      this.tick,
      runningAnim,
      showDuck,
      this.logoImg,
      this.logoWhiteImg
    );

    // obstacles
    for (const obs of this.obstacles) {
      if (obs.kind === "bird") {
        const flyY = obs.flyY ?? BIRD_FLY_Y;
        drawBird(ctx, obs.x, flyY, obs.w, obs.h, this.tick);
      } else {
        const obsY = GROUND_Y + HUNTER_H - obs.h;
        if (obs.double) {
          drawBug(ctx, obs.x, obsY, obs.w, obs.h / 2, this.tick);
          drawBug(ctx, obs.x, obsY + obs.h / 2 + 2, obs.w, obs.h / 2, this.tick);
        } else {
          drawBug(ctx, obs.x, obsY, obs.w, obs.h, this.tick);
        }
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
        "SPACE / ↑ jump · ↓ duck birds",
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
