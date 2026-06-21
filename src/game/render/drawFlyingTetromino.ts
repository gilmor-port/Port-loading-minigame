/**
 * Flying Tetromino air hazard (replaces the bird in gameplay). Same bounding box
 * contract as `drawBird`: `(left, top)` is the obstacle’s top-left, mirrored so the
 * piece moves visually toward the hunter.
 *
 * `variant` is 0–6 for I, O, T, L, J, S, Z (NES-style colors).
 */

const TETROMINO_CELLS: readonly (readonly [number, number][])[] = [
  // I
  [
    [0, 1],
    [1, 1],
    [2, 1],
    [3, 1],
  ],
  // O
  [
    [0, 0],
    [1, 0],
    [0, 1],
    [1, 1],
  ],
  // T
  [
    [1, 0],
    [0, 1],
    [1, 1],
    [2, 1],
  ],
  // L
  [
    [0, 0],
    [0, 1],
    [0, 2],
    [1, 2],
  ],
  // J
  [
    [1, 0],
    [1, 1],
    [1, 2],
    [0, 2],
  ],
  // S
  [
    [1, 0],
    [2, 0],
    [0, 1],
    [1, 1],
  ],
  // Z
  [
    [0, 0],
    [1, 0],
    [1, 1],
    [2, 1],
  ],
];

const TETROMINO_FILL: readonly string[] = [
  "#00e8e8", // I
  "#f5e000", // O
  "#b020f0", // T
  "#f5a000", // L
  "#3050f0", // J
  "#20e020", // S
  "#f02040", // Z
];

export function drawFlyingTetromino(
  ctx: CanvasRenderingContext2D,
  left: number,
  top: number,
  width: number,
  height: number,
  animTimeSec: number,
  variant: number
): void {
  const idx = ((variant % 7) + 7) % 7;
  const cells = TETROMINO_CELLS[idx];
  const fill = TETROMINO_FILL[idx];

  let minC = Infinity;
  let minR = Infinity;
  let maxC = -Infinity;
  let maxR = -Infinity;
  for (const [c, r] of cells) {
    minC = Math.min(minC, c);
    minR = Math.min(minR, r);
    maxC = Math.max(maxC, c);
    maxR = Math.max(maxR, r);
  }
  const gridW = maxC - minC + 1;
  const gridH = maxR - minR + 1;
  const padding = 3;
  const cellSize = Math.min(
    (width - padding * 2) / gridW,
    (height - padding * 2) / gridH
  );
  const originX = (width - cellSize * gridW) / 2 - minC * cellSize;
  const originY = (height - cellSize * gridH) / 2 - minR * cellSize;

  const wobble = Math.sin(animTimeSec * 11) * 0.11;

  ctx.save();
  ctx.translate(left + width, top);
  ctx.scale(-1, 1);
  ctx.translate(width * 0.5, height * 0.5);
  ctx.rotate(wobble);
  ctx.translate(-width * 0.5, -height * 0.5);

  const r = Math.max(1.2, cellSize * 0.18);
  for (const [c, rCell] of cells) {
    const x = originX + c * cellSize;
    const y = originY + rCell * cellSize;
    const inset = Math.max(0.5, cellSize * 0.08);
    ctx.fillStyle = fill;
    ctx.strokeStyle = "rgba(0,0,0,0.45)";
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.roundRect(x + inset, y + inset, cellSize - inset * 2, cellSize - inset * 2, r);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.22)";
    ctx.fillRect(
      x + inset + cellSize * 0.12,
      y + inset + cellSize * 0.12,
      cellSize * 0.35,
      cellSize * 0.2
    );
  }

  ctx.restore();
}
