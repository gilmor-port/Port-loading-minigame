/**
 * Bird silhouette (filled, light plumage). Kept intact for reference; the live air
 * hazard is a Tetromino — see `drawFlyingTetromino.ts`. Mirrored so the beak points
 * into the scroll direction (obstacles move left toward the hunter).
 */
export function drawBird(
  ctx: CanvasRenderingContext2D,
  left: number,
  top: number,
  width: number,
  height: number,
  animTimeSec: number
): void {
  const wingFlapAngle = Math.sin(animTimeSec * 18) * 0.35;

  ctx.save();
  ctx.translate(left + width, top);
  ctx.scale(-1, 1);

  const centerX = width / 2;
  const centerY = height * 0.45;

  // Light plumage (reads on near-black playfield)
  const wingFill = "#e6e8ef";
  const wingStroke = "#a8b0c0";
  const bodyFill = "#f7f8fc";
  const bodyStroke = "#c5cad6";
  const headFill = "#eef0f6";
  const headStroke = "#aeb6c4";
  const tailStroke = "#94a3b8";

  ctx.fillStyle = wingFill;
  ctx.strokeStyle = wingStroke;
  ctx.lineWidth = 1;
  for (const side of [-1, 1] as const) {
    ctx.save();
    ctx.translate(centerX + side * width * 0.15, centerY);
    ctx.rotate(side * wingFlapAngle);
    ctx.beginPath();
    ctx.ellipse(
      side * width * 0.35,
      0,
      width * 0.38,
      height * 0.22,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  ctx.fillStyle = bodyFill;
  ctx.strokeStyle = bodyStroke;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(
    centerX,
    centerY + height * 0.08,
    width * 0.28,
    height * 0.32,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = headFill;
  ctx.strokeStyle = headStroke;
  ctx.beginPath();
  ctx.arc(width * 0.72, height * 0.38, height * 0.22, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#f59e0b";
  ctx.strokeStyle = "#d97706";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(width * 0.88, height * 0.36);
  ctx.lineTo(width * 1.05, height * 0.42);
  ctx.lineTo(width * 0.88, height * 0.48);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#1e293b";
  ctx.beginPath();
  ctx.arc(width * 0.78, height * 0.34, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(width * 0.79, height * 0.33, 0.7, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = tailStroke;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(width * 0.12, centerY);
  ctx.lineTo(-width * 0.08, height * 0.55);
  ctx.stroke();

  ctx.restore();
}
