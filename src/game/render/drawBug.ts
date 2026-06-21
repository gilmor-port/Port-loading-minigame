/**
 * Cyber-bug obstacle: angular body, mechanical wings, visor, antenna tips.
 */
export function drawBug(
  ctx: CanvasRenderingContext2D,
  left: number,
  top: number,
  width: number,
  height: number,
  animTimeSec: number
): void {
  const centerX = left + width / 2;
  const glowPulse = 0.5 + 0.5 * Math.sin(animTimeSec * 8);
  const wingFlapOffsetY = Math.sin(animTimeSec * 22) * 4;

  const wingWidth = width * 0.55;
  const wingHeight = height * 0.28;
  const wingAnchorY = top + height * 0.35;

  for (const side of [-1, 1] as const) {
    const wingPivotX = centerX + side * (width * 0.08);
    const flapY = side * wingFlapOffsetY;
    ctx.save();
    ctx.translate(wingPivotX, wingAnchorY + flapY);
    ctx.rotate(side * 0.25);
    ctx.fillStyle = "#1a1a1a";
    ctx.strokeStyle = "#00ffcc";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.rect(-wingWidth, -wingHeight / 2, wingWidth, wingHeight);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "rgba(0,255,204,0.4)";
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(-wingWidth * 0.8, 0);
    ctx.lineTo(-wingWidth * 0.2, 0);
    ctx.moveTo(-wingWidth * 0.5, -wingHeight * 0.4);
    ctx.lineTo(-wingWidth * 0.5, wingHeight * 0.4);
    ctx.stroke();
    ctx.restore();
  }

  const thoraxCenterX = centerX;
  const thoraxCenterY = top + height * 0.55;
  const thoraxHalfW = width * 0.38;
  const thoraxHalfH = height * 0.38;
  ctx.fillStyle = "#111111";
  ctx.strokeStyle = "#00ffcc";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(thoraxCenterX - thoraxHalfW, thoraxCenterY);
  ctx.lineTo(thoraxCenterX - thoraxHalfW * 0.5, thoraxCenterY - thoraxHalfH);
  ctx.lineTo(thoraxCenterX + thoraxHalfW * 0.5, thoraxCenterY - thoraxHalfH);
  ctx.lineTo(thoraxCenterX + thoraxHalfW, thoraxCenterY);
  ctx.lineTo(thoraxCenterX + thoraxHalfW * 0.5, thoraxCenterY + thoraxHalfH);
  ctx.lineTo(thoraxCenterX - thoraxHalfW * 0.5, thoraxCenterY + thoraxHalfH);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  const legRowFractions = [-0.25, 0, 0.25];
  for (const side of [-1, 1] as const) {
    for (let legIndex = 0; legIndex < legRowFractions.length; legIndex++) {
      const legAttachY = top + height * (0.42 + legRowFractions[legIndex]);
      const legWiggle =
        Math.sin(animTimeSec * 14 + legIndex * 1.2) * 3 * side;
      const knee = {
        x: thoraxCenterX + side * thoraxHalfW * 1.4,
        y: legAttachY + legWiggle,
      };
      const foot = {
        x: thoraxCenterX + side * thoraxHalfW * 2.1,
        y: legAttachY + 5 + legWiggle * 0.5,
      };
      ctx.strokeStyle = "#444444";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(thoraxCenterX + side * thoraxHalfW * 0.9, legAttachY);
      ctx.lineTo(knee.x, knee.y);
      ctx.lineTo(foot.x, foot.y);
      ctx.stroke();
      ctx.fillStyle = "#00ffcc";
      ctx.beginPath();
      ctx.arc(knee.x, knee.y, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const headCenterX = centerX;
  const headCenterY = top + height * 0.14;
  const headRadius = width * 0.26;
  ctx.fillStyle = "#1a1a1a";
  ctx.strokeStyle = "#00ffcc";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.rect(
    headCenterX - headRadius,
    headCenterY - headRadius,
    headRadius * 2,
    headRadius * 2
  );
  ctx.fill();
  ctx.stroke();

  const visorAlpha = 0.7 + glowPulse * 0.3;
  ctx.fillStyle = `rgba(0,255,204,${visorAlpha})`;
  ctx.fillRect(
    headCenterX - headRadius * 0.7,
    headCenterY - headRadius * 0.15,
    headRadius * 1.4,
    headRadius * 0.3
  );
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(headCenterX - headRadius * 0.35, headCenterY, 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(headCenterX + headRadius * 0.35, headCenterY, 1.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#555555";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(headCenterX - headRadius * 0.5, headCenterY - headRadius);
  ctx.lineTo(headCenterX - headRadius * 0.5 - 5, headCenterY - headRadius - 6);
  ctx.lineTo(headCenterX - headRadius * 0.5 - 8, headCenterY - headRadius - 4);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(headCenterX + headRadius * 0.5, headCenterY - headRadius);
  ctx.lineTo(headCenterX + headRadius * 0.5 + 5, headCenterY - headRadius - 6);
  ctx.lineTo(headCenterX + headRadius * 0.5 + 8, headCenterY - headRadius - 4);
  ctx.stroke();

  ctx.fillStyle = `rgba(0,255,204,${visorAlpha})`;
  ctx.beginPath();
  ctx.arc(
    headCenterX - headRadius * 0.5 - 8,
    headCenterY - headRadius - 4,
    2,
    0,
    Math.PI * 2
  );
  ctx.fill();
  ctx.beginPath();
  ctx.arc(
    headCenterX + headRadius * 0.5 + 8,
    headCenterY - headRadius - 4,
    2,
    0,
    Math.PI * 2
  );
  ctx.fill();
}
