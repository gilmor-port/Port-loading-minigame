import { HUNTER_H, HUNTER_W } from "../constants";

const SHIRT_COLOR = "#111111";
const SKIN_COLOR = "#e8c9a0";
const SKIN_OUTLINE = "#c8a878";
const SLEEVE_COLOR = "#151515";
const LAPTOP_STROKE = "#c4c8d0";

/**
 * Draws the runner: shirt + Port logo, legs, arms, silver “_|” laptop edge, hands, head.
 *
 * @param hunterLeft - Sprite anchor X (same convention as collision box).
 * @param hunterTop - Sprite anchor Y (feet / baseline region).
 * @param animTimeSec - Monotonic seconds for walk / blink / typing motion.
 * @param isRunningOnGround - True while grounded run cycle plays.
 * @param isDucking - True when player holds duck on the ground.
 * @param _unusedDarkLogo - Reserved (dark logo asset); shirt uses `logoWhite` only.
 * @param logoWhite - White Port mark for the black shirt.
 */
export function drawHunter(
  ctx: CanvasRenderingContext2D,
  hunterLeft: number,
  hunterTop: number,
  animTimeSec: number,
  isRunningOnGround: boolean,
  isDucking: boolean,
  _unusedDarkLogo: HTMLImageElement,
  logoWhite: HTMLImageElement
): void {
  const legSwingPhase =
    isRunningOnGround && !isDucking ? Math.sin(animTimeSec * 12) : 0;
  const eyesOpen = Math.sin(animTimeSec * 3.7) > -0.97;
  const crouchSquashDownPx = isDucking ? 22 : 0;

  // ── Torso (shirt) ─────────────────────────────────────────────────────────
  const torsoLeft = hunterLeft + 6;
  const torsoTop = hunterTop + 2 + crouchSquashDownPx;
  const torsoWidth = HUNTER_W - 12;
  const torsoHeight = isDucking ? HUNTER_H - 18 - 14 : HUNTER_H - 18;

  ctx.fillStyle = SHIRT_COLOR;
  ctx.fillRect(torsoLeft, torsoTop, torsoWidth, torsoHeight);
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 1;
  ctx.strokeRect(torsoLeft, torsoTop, torsoWidth, torsoHeight);

  ctx.strokeStyle = "#cccccc";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(torsoLeft + torsoWidth * 0.3, torsoTop);
  ctx.lineTo(torsoLeft + torsoWidth * 0.5, torsoTop + 5);
  ctx.lineTo(torsoLeft + torsoWidth * 0.7, torsoTop);
  ctx.stroke();

  // ── Legs ─────────────────────────────────────────────────────────────────
  ctx.fillStyle = "#333333";
  const legHeightPx = isDucking ? 10 : 16;
  const legRowBaseY = hunterTop + HUNTER_H - (isDucking ? 10 : 16);
  const leftLegTop = legRowBaseY + legSwingPhase * (isDucking ? 2 : 6);
  const rightLegTop = legRowBaseY - legSwingPhase * (isDucking ? 2 : 6);
  ctx.fillRect(hunterLeft + 8, leftLegTop, 8, legHeightPx);
  ctx.fillRect(hunterLeft + HUNTER_W - 16, rightLegTop, 8, legHeightPx);

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(hunterLeft + 7, leftLegTop + legHeightPx - 4, 11, 4);
  ctx.fillRect(hunterLeft + HUNTER_W - 17, rightLegTop + legHeightPx - 4, 11, 4);

  // ── Neck ───────────────────────────────────────────────────────────────────
  ctx.fillStyle = SKIN_COLOR;
  ctx.fillRect(
    hunterLeft + HUNTER_W / 2 - 4,
    torsoTop - (isDucking ? 2 : 5),
    8,
    isDucking ? 4 : 7
  );

  // ── Laptop layout (edge-on “_|”, deck + lid; hands/wrists share bob) ─────
  const shirtToLaptopGapPx = isDucking ? 4 : 6;
  const laptopDeckWidthPx = isDucking ? 28 : 36;
  const laptopBandHeightPx = isDucking ? 7 : 8;
  const laptopLeftX = torsoLeft + torsoWidth + shirtToLaptopGapPx;
  const laptopBandTopY =
    torsoTop + (isDucking ? torsoHeight * 0.46 : torsoHeight * 0.4) + 4;

  const laptopDeckStrokeY = laptopBandTopY + laptopBandHeightPx * 0.55;
  const laptopLidStrokeLengthPx = isDucking ? 17 : 21;

  const typingHandAmplitudePx = isDucking ? 2.2 : 2.8;
  const typingHandPhase = animTimeSec * 13;
  const leftHandBobOffsetY = Math.sin(typingHandPhase) * typingHandAmplitudePx;
  const rightHandBobOffsetY =
    Math.sin(typingHandPhase + Math.PI) * typingHandAmplitudePx;

  const handPadWidthPx = 12;
  const handPadHeightPx = 6;
  const handsPadTopY = laptopDeckStrokeY - 6.5;

  const leftHandPadLeft = laptopLeftX + laptopDeckWidthPx * 0.06;
  const rightHandPadLeft = laptopLeftX +
    Math.max(
      laptopDeckWidthPx * 0.52,
      laptopDeckWidthPx - handPadWidthPx - 3
    );

  const leftWristX = leftHandPadLeft + handPadWidthPx * 0.5;
  const rightWristX = rightHandPadLeft + handPadWidthPx * 0.5;
  const leftWristY = handsPadTopY + leftHandBobOffsetY + 0.9;
  const rightWristY = handsPadTopY + rightHandBobOffsetY + 0.9;

  const rightShoulderX = torsoLeft + torsoWidth - 2;
  const rightShoulderY = torsoTop + (isDucking ? torsoHeight * 0.3 : 7);
  const leftShoulderX = torsoLeft + 2;
  const leftShoulderY = torsoTop + (isDucking ? torsoHeight * 0.32 : 8);
  const armSwingOffset =
    isRunningOnGround && !isDucking ? Math.sin(animTimeSec * 12) * 0.5 : 0;

  const rightElbowX = (rightShoulderX + rightWristX) * 0.5 + 4;
  const rightElbowY =
    rightShoulderY + (rightWristY - rightShoulderY) * 0.55 + armSwingOffset;
  const leftElbowX = (leftShoulderX + leftWristX) * 0.5 + 6;
  const leftElbowY =
    leftShoulderY +
    (leftWristY - leftShoulderY) * 0.52 -
    armSwingOffset * 0.2;

  // Sleeves + forearms (under logo; wrists match animated hand pads)
  ctx.strokeStyle = SLEEVE_COLOR;
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(rightShoulderX, rightShoulderY);
  ctx.quadraticCurveTo(rightShoulderX + 5, rightShoulderY + 8, rightElbowX, rightElbowY);
  ctx.lineTo(rightWristX, rightWristY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(leftShoulderX, leftShoulderY);
  ctx.quadraticCurveTo(leftShoulderX + 10, leftShoulderY + 7, leftElbowX, leftElbowY);
  ctx.lineTo(leftWristX, leftWristY);
  ctx.stroke();

  ctx.strokeStyle = SKIN_COLOR;
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  ctx.moveTo(rightElbowX, rightElbowY);
  ctx.lineTo(rightWristX, rightWristY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(leftElbowX, leftElbowY);
  ctx.lineTo(leftWristX, leftWristY);
  ctx.stroke();

  // ── Port logo (after arms so it paints over forearms on the shirt) ────────
  if (logoWhite.complete && logoWhite.naturalWidth > 0) {
    const logoSizePx = Math.min(torsoWidth - 2, torsoHeight * 0.58);
    const logoLeft = torsoLeft + (torsoWidth - logoSizePx) / 2;
    let logoTop = torsoTop + torsoHeight * 0.22;
    const logoMaxTop = torsoTop + torsoHeight - logoSizePx - 2;
    if (logoTop > logoMaxTop) logoTop = Math.max(torsoTop + 4, logoMaxTop);
    ctx.drawImage(logoWhite, logoLeft, logoTop, logoSizePx, logoSizePx);
  }

  // ── Laptop stroke (silver “_|”: deck then lid at outer hinge) ───────────
  ctx.strokeStyle = LAPTOP_STROKE;
  ctx.lineWidth = isDucking ? 4.2 : 5;
  ctx.lineCap = "square";
  ctx.lineJoin = "miter";
  ctx.beginPath();
  ctx.moveTo(laptopLeftX, laptopDeckStrokeY);
  ctx.lineTo(laptopLeftX + laptopDeckWidthPx, laptopDeckStrokeY);
  ctx.lineTo(
    laptopLeftX + laptopDeckWidthPx,
    laptopDeckStrokeY - laptopLidStrokeLengthPx
  );
  ctx.stroke();

  // ── Hand pads on deck (same vertical bob as wrists) ──────────────────────
  ctx.fillStyle = SKIN_COLOR;
  ctx.strokeStyle = SKIN_OUTLINE;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(
    leftHandPadLeft,
    handsPadTopY + leftHandBobOffsetY,
    handPadWidthPx,
    handPadHeightPx,
    2
  );
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.roundRect(
    rightHandPadLeft,
    handsPadTopY + rightHandBobOffsetY,
    handPadWidthPx,
    handPadHeightPx,
    2
  );
  ctx.fill();
  ctx.stroke();

  // ── Head (faces run direction +X) ─────────────────────────────────────────
  const headCenterX = hunterLeft + HUNTER_W / 2;
  const headCenterY = hunterTop - 8 + crouchSquashDownPx * 0.85;
  const headRadiusX = isDucking ? 11 : 13;
  const headRadiusY = isDucking ? 9 : 12;

  ctx.fillStyle = SKIN_COLOR;
  ctx.beginPath();
  ctx.ellipse(headCenterX, headCenterY, headRadiusX, headRadiusY, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = SKIN_OUTLINE;
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = "#222222";
  ctx.beginPath();
  ctx.ellipse(
    headCenterX,
    headCenterY - headRadiusY * 0.35,
    headRadiusX,
    headRadiusY * 0.7,
    0,
    Math.PI,
    0
  );
  ctx.fill();
  ctx.beginPath();
  ctx.arc(
    headCenterX - headRadiusX + 2,
    headCenterY - 4,
    4,
    Math.PI * 0.8,
    Math.PI * 1.6
  );
  ctx.fill();
  ctx.beginPath();
  ctx.arc(
    headCenterX + headRadiusX - 2,
    headCenterY - 4,
    4,
    Math.PI * 1.4,
    Math.PI * 0.2
  );
  ctx.fill();

  const eyeRowY = headCenterY + 1;
  const eyeSpacingX = 5;

  if (eyesOpen) {
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.ellipse(headCenterX - eyeSpacingX, eyeRowY, 3.5, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(headCenterX + eyeSpacingX, eyeRowY, 3.5, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#111111";
    ctx.beginPath();
    ctx.arc(headCenterX - eyeSpacingX + 1.4, eyeRowY + 0.2, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(headCenterX + eyeSpacingX + 1.4, eyeRowY + 0.2, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(headCenterX - eyeSpacingX + 2, eyeRowY - 0.5, 0.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(headCenterX + eyeSpacingX + 2, eyeRowY - 0.5, 0.7, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.strokeStyle = "#333333";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(headCenterX - eyeSpacingX - 3, eyeRowY);
    ctx.lineTo(headCenterX - eyeSpacingX + 3, eyeRowY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(headCenterX + eyeSpacingX - 3, eyeRowY);
    ctx.lineTo(headCenterX + eyeSpacingX + 3, eyeRowY);
    ctx.stroke();
  }

  ctx.strokeStyle = "#222222";
  ctx.lineWidth = 1.5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(headCenterX - eyeSpacingX - 3, eyeRowY - 4.5);
  ctx.lineTo(headCenterX - eyeSpacingX + 3, eyeRowY - 5);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(headCenterX + eyeSpacingX - 3, eyeRowY - 5);
  ctx.lineTo(headCenterX + eyeSpacingX + 3, eyeRowY - 4.5);
  ctx.stroke();

  ctx.strokeStyle = SKIN_OUTLINE;
  ctx.lineWidth = 1;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(headCenterX - 1, eyeRowY + 2);
  ctx.lineTo(headCenterX - 2, eyeRowY + 5);
  ctx.lineTo(headCenterX + 2, eyeRowY + 5);
  ctx.stroke();

  ctx.strokeStyle = "#a0785a";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(headCenterX, eyeRowY + 6, 4, 0.2, Math.PI - 0.2);
  ctx.stroke();
}

/**
 * Axis-aligned bounds of the runner’s head ellipse in `drawHunter`.
 * Keep these formulas in sync when the head pose or squash changes.
 */
export function getHunterHeadHitRect(
  hunterLeft: number,
  hunterTop: number,
  isDucking: boolean
): { x: number; y: number; w: number; h: number } {
  const crouchSquashDownPx = isDucking ? 22 : 0;
  const headCenterX = hunterLeft + HUNTER_W / 2;
  const headCenterY = hunterTop - 8 + crouchSquashDownPx * 0.85;
  const headRadiusX = isDucking ? 11 : 13;
  const headRadiusY = isDucking ? 9 : 12;
  return {
    x: headCenterX - headRadiusX,
    y: headCenterY - headRadiusY,
    w: headRadiusX * 2,
    h: headRadiusY * 2,
  };
}
