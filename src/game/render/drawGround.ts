import { CANVAS_W, GROUND_Y, HUNTER_H } from "../constants";

/**
 * Draws the baseline and scrolling ground dashes. `scrollOffsetPx` advances with run speed.
 */
export function drawGround(
  ctx: CanvasRenderingContext2D,
  scrollOffsetPx: number
): void {
  const groundLineY = GROUND_Y + HUNTER_H;

  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, groundLineY);
  ctx.lineTo(CANVAS_W, groundLineY);
  ctx.stroke();

  ctx.fillStyle = "#555555";
  const dashSpacingPx = 70;
  const dashWidthPx = 20;
  const dashCount = 12;
  for (let i = 0; i < dashCount; i++) {
    const dashLeft =
      ((i * dashSpacingPx - scrollOffsetPx) % CANVAS_W + CANVAS_W) % CANVAS_W;
    ctx.fillRect(dashLeft, groundLineY + 5, dashWidthPx, 2);
  }
}
