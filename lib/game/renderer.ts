/**
 * Canvas Rendering Utilities
 *
 * Provides drawing utilities for the Cat Stack game including:
 * - Cat body rendering with rounded rectangles
 * - Cat ears, eyes, whiskers, and mouth
 * - Expression variations (neutral, surprised, happy, worried)
 * - Variant color application
 * - Ground platform rendering
 * - Pendulum cat preview rendering
 * - Start screen UI
 * - Mode selection screen UI
 * - Gameplay HUD (Classic and Reach the Top modes)
 * - Win line rendering for Reach the Top mode
 * - Win screen UI with confetti celebration
 * - Game over screen UI with Change Mode button
 * - Perfect landing display
 */

import {
  CatEntity,
  CatExpression,
  CatVariant,
  CAT_VARIANTS,
  CAT_WIDTH,
  CAT_HEIGHT,
} from "./cat";
import { PendulumState, getCurrentPendulumPosition } from "./pendulum";
import { ScoreState } from "./scoring";
import { CANVAS_WIDTH, CANVAS_HEIGHT, GROUND_HEIGHT, GROUND_Y, PENDULUM_Y, WIN_LINE_Y, WIN_LINE_COLOR } from "@/lib/constants";

/**
 * Rectangle bounds interface for button hit-testing.
 */
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Mode button bounds constants for hit-testing.
 * These are exported so they can be used by input.ts for button detection.
 */
export const MODE_BUTTON_BOUNDS: { classic: Rect; reachTheTop: Rect; back: Rect } = {
  classic: {
    x: CANVAS_WIDTH / 2 - 280,
    y: 420,
    width: 560,
    height: 160,
  },
  reachTheTop: {
    x: CANVAS_WIDTH / 2 - 280,
    y: 620,
    width: 560,
    height: 160,
  },
  back: {
    x: 30,
    y: 30,
    width: 100,
    height: 50,
  },
};

/**
 * Win screen button bounds constants for hit-testing.
 * These are exported so they can be used by input.ts for button detection.
 */
export const WIN_SCREEN_BUTTON_BOUNDS: { playAgain: Rect; changeMode: Rect } = {
  playAgain: {
    x: CANVAS_WIDTH / 2 - 150,
    y: CANVAS_HEIGHT / 2 + 80,
    width: 300,
    height: 60,
  },
  changeMode: {
    x: CANVAS_WIDTH / 2 - 150,
    y: CANVAS_HEIGHT / 2 + 160,
    width: 300,
    height: 60,
  },
};

/**
 * Game over screen button bounds constants for hit-testing.
 * These are exported so they can be used by input.ts for button detection.
 */
export const GAME_OVER_BUTTON_BOUNDS: { restart: Rect; changeMode: Rect } = {
  restart: {
    x: CANVAS_WIDTH / 2 - 150,
    y: CANVAS_HEIGHT / 2 + 100,
    width: 300,
    height: 55,
  },
  changeMode: {
    x: CANVAS_WIDTH / 2 - 150,
    y: CANVAS_HEIGHT / 2 + 170,
    width: 300,
    height: 55,
  },
};

// ============================================================================
// CONFETTI PARTICLE SYSTEM
// ============================================================================

/**
 * Represents a single confetti particle.
 */
export interface ConfettiParticle {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  rotation: number;
  rotationSpeed: number;
  color: string;
  size: number;
  shape: "square" | "circle" | "triangle";
}

/**
 * Pastel colors for confetti matching the game's aesthetic.
 */
const CONFETTI_COLORS = [
  "#FFB6B6", // Soft pink
  "#B6E6B6", // Soft mint
  "#B6D4FF", // Soft blue
  "#FFE6B6", // Soft gold
  "#E6B6FF", // Soft lavender
  "#FFD4A3", // Soft peach
  "#A3E6E6", // Soft cyan
];

/**
 * Creates an array of confetti particles for the celebration effect.
 *
 * @param count - Number of particles to create
 * @returns Array of confetti particles
 */
export function createConfettiParticles(count: number): ConfettiParticle[] {
  const particles: ConfettiParticle[] = [];

  for (let i = 0; i < count; i++) {
    const shapes: ("square" | "circle" | "triangle")[] = ["square", "circle", "triangle"];
    particles.push({
      x: Math.random() * CANVAS_WIDTH,
      y: -20 - Math.random() * 100, // Start above screen
      velocityX: (Math.random() - 0.5) * 4,
      velocityY: 2 + Math.random() * 3,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.2,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: 8 + Math.random() * 8,
      shape: shapes[Math.floor(Math.random() * shapes.length)],
    });
  }

  return particles;
}

/**
 * Updates confetti particle positions and rotations.
 *
 * @param particles - Array of confetti particles to update
 * @param deltaTime - Time since last update in milliseconds
 */
export function updateConfettiParticles(
  particles: ConfettiParticle[],
  deltaTime: number
): void {
  const gravity = 0.1;
  const drag = 0.99;

  for (const particle of particles) {
    // Apply velocity
    particle.x += particle.velocityX;
    particle.y += particle.velocityY;

    // Apply gravity
    particle.velocityY += gravity;

    // Apply drag (air resistance)
    particle.velocityX *= drag;

    // Add slight wobble
    particle.velocityX += (Math.random() - 0.5) * 0.3;

    // Update rotation
    particle.rotation += particle.rotationSpeed;

    // Wrap around horizontally
    if (particle.x < -20) {
      particle.x = CANVAS_WIDTH + 20;
    } else if (particle.x > CANVAS_WIDTH + 20) {
      particle.x = -20;
    }

    // Reset particle if it falls off screen
    if (particle.y > CANVAS_HEIGHT + 50) {
      particle.y = -20 - Math.random() * 50;
      particle.x = Math.random() * CANVAS_WIDTH;
      particle.velocityY = 2 + Math.random() * 3;
    }
  }
}

/**
 * Renders confetti particles on the canvas.
 *
 * @param ctx - The canvas rendering context
 * @param particles - Array of confetti particles to render
 */
export function renderConfetti(
  ctx: CanvasRenderingContext2D,
  particles: ConfettiParticle[]
): void {
  for (const particle of particles) {
    ctx.save();
    ctx.translate(particle.x, particle.y);
    ctx.rotate(particle.rotation);
    ctx.fillStyle = particle.color;

    const halfSize = particle.size / 2;

    switch (particle.shape) {
      case "square":
        ctx.fillRect(-halfSize, -halfSize, particle.size, particle.size);
        break;

      case "circle":
        ctx.beginPath();
        ctx.arc(0, 0, halfSize, 0, Math.PI * 2);
        ctx.fill();
        break;

      case "triangle":
        ctx.beginPath();
        ctx.moveTo(0, -halfSize);
        ctx.lineTo(halfSize, halfSize);
        ctx.lineTo(-halfSize, halfSize);
        ctx.closePath();
        ctx.fill();
        break;
    }

    ctx.restore();
  }
}

/**
 * Renders a cat entity on the canvas with a subtle drop shadow for visibility.
 */
export function renderCat(
  ctx: CanvasRenderingContext2D,
  cat: CatEntity
): void {
  const { body, variant, expression, squishFactor } = cat;
  const { x, y } = body.position;
  const angle = body.angle;

  ctx.save();

  // Transform to cat position and rotation
  ctx.translate(x, y);
  ctx.rotate(angle);

  // Apply squish effect (compress vertically, expand horizontally)
  const scaleX = 1 + (1 - squishFactor) * 0.3;
  const scaleY = squishFactor;
  ctx.scale(scaleX, scaleY);

  // Add subtle drop shadow for visibility
  ctx.shadowColor = "rgba(0, 0, 0, 0.15)";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 4;

  // Draw the cat body (shadow applies here)
  drawCatBody(ctx, variant);

  // Reset shadow for details
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // Draw ears and face without shadow
  drawCatEars(ctx, variant);
  drawCatFace(ctx, variant, expression);

  ctx.restore();
}

/**
 * Renders the pendulum cat preview (the cat about to be dropped).
 */
export function renderPendulumCat(
  ctx: CanvasRenderingContext2D,
  pendulum: PendulumState,
  variant: CatVariant
): void {
  const pos = getCurrentPendulumPosition(pendulum);

  ctx.save();

  // Transform to pendulum position (no rotation)
  ctx.translate(pos.x, pos.y);

  // Add subtle shadow for pendulum cat
  ctx.shadowColor = "rgba(0, 0, 0, 0.1)";
  ctx.shadowBlur = 6;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 2;

  // Draw the cat with neutral expression
  drawCatBody(ctx, variant);

  // Reset shadow for details
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  drawCatEars(ctx, variant);
  drawCatFace(ctx, variant, "neutral");

  ctx.restore();

  // Draw a subtle drop indicator line
  ctx.save();
  ctx.strokeStyle = "rgba(150, 150, 150, 0.3)";
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y + CAT_HEIGHT / 2 + 5);
  ctx.lineTo(pos.x, GROUND_Y - GROUND_HEIGHT / 2);
  ctx.stroke();
  ctx.restore();
}

/**
 * Draws the cat's rounded rectangle body.
 */
export function drawCatBody(
  ctx: CanvasRenderingContext2D,
  variant: CatVariant
): void {
  const colors = CAT_VARIANTS[variant];
  const halfWidth = CAT_WIDTH / 2;
  const halfHeight = CAT_HEIGHT / 2;
  const cornerRadius = 15;

  // Draw main body
  ctx.fillStyle = colors.bodyColor;
  ctx.beginPath();

  // Draw rounded rectangle manually for better compatibility
  ctx.moveTo(-halfWidth + cornerRadius, -halfHeight);
  ctx.lineTo(halfWidth - cornerRadius, -halfHeight);
  ctx.quadraticCurveTo(halfWidth, -halfHeight, halfWidth, -halfHeight + cornerRadius);
  ctx.lineTo(halfWidth, halfHeight - cornerRadius);
  ctx.quadraticCurveTo(halfWidth, halfHeight, halfWidth - cornerRadius, halfHeight);
  ctx.lineTo(-halfWidth + cornerRadius, halfHeight);
  ctx.quadraticCurveTo(-halfWidth, halfHeight, -halfWidth, halfHeight - cornerRadius);
  ctx.lineTo(-halfWidth, -halfHeight + cornerRadius);
  ctx.quadraticCurveTo(-halfWidth, -halfHeight, -halfWidth + cornerRadius, -halfHeight);

  ctx.closePath();
  ctx.fill();

  // Draw subtle outline for definition
  ctx.strokeStyle = "rgba(0, 0, 0, 0.15)";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Draw variant-specific patterns
  if (variant === "orangeTabby" && colors.stripeColor) {
    drawTabbyStripes(ctx, colors.stripeColor);
  } else if (variant === "tuxedo") {
    drawTuxedoPattern(ctx, colors.accentColor);
  } else if (variant === "calico" && colors.patches) {
    drawCalicoPatches(ctx, colors.patches);
  }
}

/**
 * Draws tabby stripes on the cat body.
 */
function drawTabbyStripes(ctx: CanvasRenderingContext2D, stripeColor: string): void {
  ctx.fillStyle = stripeColor;

  // Draw 3 curved stripes
  const stripeWidth = 6;
  const stripeSpacing = 18;

  for (let i = -1; i <= 1; i++) {
    const xOffset = i * stripeSpacing;

    ctx.beginPath();
    ctx.ellipse(xOffset, -5, stripeWidth / 2, 15, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Draws tuxedo pattern (white chest).
 */
function drawTuxedoPattern(ctx: CanvasRenderingContext2D, accentColor: string): void {
  ctx.fillStyle = accentColor;

  // White chest/belly area
  ctx.beginPath();
  ctx.ellipse(0, 10, 20, 18, 0, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Draws calico patches on the cat body.
 */
function drawCalicoPatches(
  ctx: CanvasRenderingContext2D,
  patches: { color: string; positions: { x: number; y: number }[] }[]
): void {
  for (const patch of patches) {
    ctx.fillStyle = patch.color;
    for (const pos of patch.positions) {
      ctx.beginPath();
      ctx.ellipse(pos.x, pos.y, 12, 10, Math.random() * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/**
 * Draws the cat's triangle ears.
 */
export function drawCatEars(
  ctx: CanvasRenderingContext2D,
  variant: CatVariant
): void {
  const colors = CAT_VARIANTS[variant];
  const halfHeight = CAT_HEIGHT / 2;

  // Ear dimensions
  const earWidth = 14;
  const earHeight = 18;
  const earSpacing = 20;

  // Left ear
  ctx.fillStyle = colors.bodyColor;
  ctx.beginPath();
  ctx.moveTo(-earSpacing - earWidth / 2, -halfHeight);
  ctx.lineTo(-earSpacing, -halfHeight - earHeight);
  ctx.lineTo(-earSpacing + earWidth / 2, -halfHeight);
  ctx.closePath();
  ctx.fill();

  // Left ear inner
  ctx.fillStyle = colors.noseColor || "#FFB6B6";
  ctx.beginPath();
  ctx.moveTo(-earSpacing - earWidth / 4, -halfHeight);
  ctx.lineTo(-earSpacing, -halfHeight - earHeight * 0.6);
  ctx.lineTo(-earSpacing + earWidth / 4, -halfHeight);
  ctx.closePath();
  ctx.fill();

  // Right ear
  ctx.fillStyle = colors.bodyColor;
  ctx.beginPath();
  ctx.moveTo(earSpacing - earWidth / 2, -halfHeight);
  ctx.lineTo(earSpacing, -halfHeight - earHeight);
  ctx.lineTo(earSpacing + earWidth / 2, -halfHeight);
  ctx.closePath();
  ctx.fill();

  // Right ear inner
  ctx.fillStyle = colors.noseColor || "#FFB6B6";
  ctx.beginPath();
  ctx.moveTo(earSpacing - earWidth / 4, -halfHeight);
  ctx.lineTo(earSpacing, -halfHeight - earHeight * 0.6);
  ctx.lineTo(earSpacing + earWidth / 4, -halfHeight);
  ctx.closePath();
  ctx.fill();
}

/**
 * Draws the cat's face (eyes, nose, whiskers, mouth) with expression variations.
 */
export function drawCatFace(
  ctx: CanvasRenderingContext2D,
  variant: CatVariant,
  expression: CatExpression
): void {
  const colors = CAT_VARIANTS[variant];

  // Draw eyes based on expression
  drawEyes(ctx, expression);

  // Draw nose
  drawNose(ctx, colors.noseColor || "#FFB6B6");

  // Draw whiskers
  drawWhiskers(ctx);

  // Draw mouth based on expression
  drawMouth(ctx, expression);
}

/**
 * Draws the cat's eyes based on expression.
 */
function drawEyes(ctx: CanvasRenderingContext2D, expression: CatExpression): void {
  const eyeSpacing = 14;
  const eyeY = -8;

  switch (expression) {
    case "neutral":
      // Normal oval eyes
      ctx.fillStyle = "#333333";
      ctx.beginPath();
      ctx.ellipse(-eyeSpacing, eyeY, 5, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(eyeSpacing, eyeY, 5, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      // Eye highlights
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.ellipse(-eyeSpacing - 1, eyeY - 2, 2, 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(eyeSpacing - 1, eyeY - 2, 2, 2, 0, 0, Math.PI * 2);
      ctx.fill();
      break;

    case "surprised":
      // Wide round eyes
      ctx.fillStyle = "#333333";
      ctx.beginPath();
      ctx.arc(-eyeSpacing, eyeY, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(eyeSpacing, eyeY, 8, 0, Math.PI * 2);
      ctx.fill();

      // Large white reflections
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(-eyeSpacing - 2, eyeY - 2, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(eyeSpacing - 2, eyeY - 2, 3, 0, Math.PI * 2);
      ctx.fill();
      break;

    case "happy":
      // Closed happy eyes (curved lines)
      ctx.strokeStyle = "#333333";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";

      // Left eye - happy curve
      ctx.beginPath();
      ctx.arc(-eyeSpacing, eyeY + 2, 6, Math.PI * 0.2, Math.PI * 0.8);
      ctx.stroke();

      // Right eye - happy curve
      ctx.beginPath();
      ctx.arc(eyeSpacing, eyeY + 2, 6, Math.PI * 0.2, Math.PI * 0.8);
      ctx.stroke();
      break;

    case "worried":
      // Slanted worried eyes
      ctx.fillStyle = "#333333";

      // Left eye - slanted down towards center
      ctx.save();
      ctx.translate(-eyeSpacing, eyeY);
      ctx.rotate(0.2);
      ctx.beginPath();
      ctx.ellipse(0, 0, 5, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Right eye - slanted down towards center
      ctx.save();
      ctx.translate(eyeSpacing, eyeY);
      ctx.rotate(-0.2);
      ctx.beginPath();
      ctx.ellipse(0, 0, 5, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Worried eyebrow lines
      ctx.strokeStyle = "#333333";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";

      ctx.beginPath();
      ctx.moveTo(-eyeSpacing - 5, eyeY - 10);
      ctx.lineTo(-eyeSpacing + 2, eyeY - 8);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(eyeSpacing + 5, eyeY - 10);
      ctx.lineTo(eyeSpacing - 2, eyeY - 8);
      ctx.stroke();

      // Small highlights
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.ellipse(-eyeSpacing - 1, eyeY - 2, 1.5, 1.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(eyeSpacing - 1, eyeY - 2, 1.5, 1.5, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
  }
}

/**
 * Draws the cat's nose.
 */
function drawNose(ctx: CanvasRenderingContext2D, color: string): void {
  ctx.fillStyle = color;

  // Small triangle nose
  ctx.beginPath();
  ctx.moveTo(0, 2);
  ctx.lineTo(-4, 8);
  ctx.lineTo(4, 8);
  ctx.closePath();
  ctx.fill();
}

/**
 * Draws the cat's whiskers.
 */
function drawWhiskers(ctx: CanvasRenderingContext2D): void {
  ctx.strokeStyle = "#333333";
  ctx.lineWidth = 1.5;
  ctx.lineCap = "round";

  const whiskerY = 10;
  const whiskerLength = 18;

  // Left whiskers
  ctx.beginPath();
  ctx.moveTo(-12, whiskerY - 3);
  ctx.lineTo(-12 - whiskerLength, whiskerY - 6);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-12, whiskerY);
  ctx.lineTo(-12 - whiskerLength, whiskerY);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-12, whiskerY + 3);
  ctx.lineTo(-12 - whiskerLength, whiskerY + 6);
  ctx.stroke();

  // Right whiskers
  ctx.beginPath();
  ctx.moveTo(12, whiskerY - 3);
  ctx.lineTo(12 + whiskerLength, whiskerY - 6);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(12, whiskerY);
  ctx.lineTo(12 + whiskerLength, whiskerY);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(12, whiskerY + 3);
  ctx.lineTo(12 + whiskerLength, whiskerY + 6);
  ctx.stroke();
}

/**
 * Draws the cat's mouth based on expression.
 */
function drawMouth(ctx: CanvasRenderingContext2D, expression: CatExpression): void {
  ctx.strokeStyle = "#333333";
  ctx.lineWidth = 2;
  ctx.lineCap = "round";

  const mouthY = 14;

  switch (expression) {
    case "neutral":
      // Small smile
      ctx.beginPath();
      ctx.arc(0, mouthY - 4, 6, Math.PI * 0.2, Math.PI * 0.8);
      ctx.stroke();
      break;

    case "surprised":
      // Open mouth (O shape)
      ctx.fillStyle = "#333333";
      ctx.beginPath();
      ctx.ellipse(0, mouthY + 2, 5, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Inner pink
      ctx.fillStyle = "#FF9999";
      ctx.beginPath();
      ctx.ellipse(0, mouthY + 2, 3, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      break;

    case "happy":
      // Big smile
      ctx.beginPath();
      ctx.arc(0, mouthY - 6, 10, Math.PI * 0.15, Math.PI * 0.85);
      ctx.stroke();

      // Blush marks
      ctx.fillStyle = "rgba(255, 150, 150, 0.4)";
      ctx.beginPath();
      ctx.ellipse(-22, 8, 6, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(22, 8, 6, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      break;

    case "worried":
      // Wavy/squiggly worried mouth
      ctx.beginPath();
      ctx.moveTo(-8, mouthY);
      ctx.quadraticCurveTo(-4, mouthY - 4, 0, mouthY);
      ctx.quadraticCurveTo(4, mouthY + 4, 8, mouthY);
      ctx.stroke();
      break;
  }
}

/**
 * Renders the ground platform with polished appearance.
 */
export function renderGround(ctx: CanvasRenderingContext2D): void {
  const groundTop = GROUND_Y - GROUND_HEIGHT / 2;
  const cornerRadius = 20;

  // Main ground body (mint green pastel)
  ctx.fillStyle = "#B8E6B8";
  ctx.beginPath();

  // Draw rounded top rectangle
  ctx.moveTo(0, groundTop + cornerRadius);
  ctx.lineTo(0, GROUND_Y + GROUND_HEIGHT / 2);
  ctx.lineTo(CANVAS_WIDTH, GROUND_Y + GROUND_HEIGHT / 2);
  ctx.lineTo(CANVAS_WIDTH, groundTop + cornerRadius);
  ctx.quadraticCurveTo(CANVAS_WIDTH, groundTop, CANVAS_WIDTH - cornerRadius, groundTop);
  ctx.lineTo(cornerRadius, groundTop);
  ctx.quadraticCurveTo(0, groundTop, 0, groundTop + cornerRadius);

  ctx.closePath();
  ctx.fill();

  // Subtle top highlight for depth
  ctx.fillStyle = "#C8F0C8";
  ctx.fillRect(0, groundTop, CANVAS_WIDTH, 4);

  // Subtle grass line on top
  ctx.fillStyle = "#9CD69C";
  ctx.fillRect(0, groundTop + 4, CANVAS_WIDTH, 6);

  // Add some grass tufts (fixed positions for stability)
  ctx.fillStyle = "#7BC67B";
  const grassOffsets = [5, 12, 3, 18, 8, 15, 2, 10, 17, 6, 14, 1, 19, 7, 11];
  let offsetIndex = 0;
  for (let x = 20; x < CANVAS_WIDTH; x += 50) {
    drawGrassTuft(ctx, x + grassOffsets[offsetIndex % grassOffsets.length], groundTop);
    offsetIndex++;
  }
}

/**
 * Draws a small grass tuft decoration.
 */
function drawGrassTuft(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.beginPath();
  ctx.moveTo(x - 4, y);
  ctx.quadraticCurveTo(x - 6, y - 8, x - 2, y - 12);
  ctx.quadraticCurveTo(x, y - 6, x, y);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x, y - 10, x + 2, y - 14);
  ctx.quadraticCurveTo(x + 4, y - 8, x + 4, y);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(x + 4, y);
  ctx.quadraticCurveTo(x + 6, y - 8, x + 8, y - 10);
  ctx.quadraticCurveTo(x + 6, y - 4, x + 8, y);
  ctx.fill();
}

/**
 * Renders all cats in a list.
 */
export function renderCats(
  ctx: CanvasRenderingContext2D,
  cats: CatEntity[]
): void {
  for (const cat of cats) {
    renderCat(ctx, cat);
  }
}

// ============================================================================
// UI RENDERING
// ============================================================================

/**
 * Renders the start screen UI.
 * Displays game title, high score, and "Tap to Play" prompt.
 */
export function renderStartScreen(
  ctx: CanvasRenderingContext2D,
  highScore: number
): void {
  const centerX = CANVAS_WIDTH / 2;
  const titleY = 300;

  // Draw semi-transparent overlay with soft pink tint
  ctx.fillStyle = "rgba(255, 245, 245, 0.9)";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Draw decorative cat silhouette behind title
  ctx.save();
  ctx.translate(centerX, titleY - 80);
  ctx.scale(2, 2);
  drawDecorativeCat(ctx);
  ctx.restore();

  // Game title with shadow for depth
  ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
  ctx.font = "bold 72px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Cat Stack", centerX + 3, titleY + 3);

  // Title text (coral/pink)
  ctx.fillStyle = "#FF6B6B";
  ctx.fillText("Cat Stack", centerX, titleY);

  // Subtitle
  ctx.fillStyle = "#888888";
  ctx.font = "28px Arial, sans-serif";
  ctx.fillText("Stack cats as high as you can!", centerX, titleY + 60);

  // High score display
  if (highScore > 0) {
    ctx.fillStyle = "#FFB366";
    ctx.font = "bold 36px Arial, sans-serif";
    ctx.fillText(`Best: ${highScore}`, centerX, titleY + 150);
  }

  // Tap to play prompt (pulsing effect based on time)
  const pulseScale = 1 + 0.05 * Math.sin(Date.now() / 300);
  ctx.save();
  ctx.translate(centerX, titleY + 250);
  ctx.scale(pulseScale, pulseScale);

  ctx.fillStyle = "#7BC67B";
  ctx.font = "bold 42px Arial, sans-serif";
  ctx.fillText("Tap to Play", 0, 0);

  ctx.restore();

  // Draw decorative paw prints
  drawPawPrint(ctx, 100, 800, 0.8);
  drawPawPrint(ctx, 620, 850, 0.6);
  drawPawPrint(ctx, 200, 950, 0.7);
  drawPawPrint(ctx, 520, 1000, 0.5);
}

/**
 * Renders the mode selection screen UI.
 * Displays "Choose Mode" title, mode buttons, instructions, and back button.
 */
export function renderModeSelectScreen(
  ctx: CanvasRenderingContext2D
): void {
  const centerX = CANVAS_WIDTH / 2;
  const titleY = 200;

  // Draw semi-transparent overlay with soft pink tint (matching start screen)
  ctx.fillStyle = "rgba(255, 245, 245, 0.95)";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Draw back button
  drawBackButton(ctx, MODE_BUTTON_BOUNDS.back);

  // Draw decorative cat silhouette behind title
  ctx.save();
  ctx.translate(centerX, titleY - 60);
  ctx.scale(1.5, 1.5);
  drawDecorativeCat(ctx);
  ctx.restore();

  // Title with shadow for depth
  ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
  ctx.font = "bold 56px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Choose Mode", centerX + 2, titleY + 2);

  // Title text (coral/pink)
  ctx.fillStyle = "#FF6B6B";
  ctx.fillText("Choose Mode", centerX, titleY);

  // Subtitle
  ctx.fillStyle = "#888888";
  ctx.font = "24px Arial, sans-serif";
  ctx.fillText("Select your game mode", centerX, titleY + 50);

  // Draw Classic Mode button
  drawModeButton(
    ctx,
    MODE_BUTTON_BOUNDS.classic,
    "Classic Mode",
    "Stack cats for points!",
    "Cats fall = Game over",
    "#FFB366", // Orange accent
    drawStackIcon
  );

  // Draw Reach the Top button
  drawModeButton(
    ctx,
    MODE_BUTTON_BOUNDS.reachTheTop,
    "Reach the Top",
    "Build to the goal line!",
    "Fewer cats = Better score",
    "#7BC67B", // Green accent (mint)
    drawGoalIcon
  );

  // Draw instructions section at the bottom
  drawInstructionsSection(ctx);

  // Draw decorative paw prints
  drawPawPrint(ctx, 80, 1100, 0.6);
  drawPawPrint(ctx, 640, 1150, 0.5);
  drawPawPrint(ctx, 150, 1200, 0.4);
}

/**
 * Draws the back button for the mode select screen.
 */
function drawBackButton(ctx: CanvasRenderingContext2D, bounds: Rect): void {
  const { x, y, width, height } = bounds;
  const cornerRadius = 12;

  // Button shadow
  ctx.shadowColor = "rgba(0, 0, 0, 0.1)";
  ctx.shadowBlur = 6;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 2;

  // Button background
  ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
  drawRoundedRect(ctx, x, y, width, height, cornerRadius);
  ctx.fill();

  // Reset shadow
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;

  // Button border
  ctx.strokeStyle = "rgba(0, 0, 0, 0.1)";
  ctx.lineWidth = 1;
  drawRoundedRect(ctx, x, y, width, height, cornerRadius);
  ctx.stroke();

  // Arrow and text
  ctx.fillStyle = "#888888";
  ctx.font = "bold 18px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("< Back", x + width / 2, y + height / 2);
}

/**
 * Draws the instructions section at the bottom of the mode select screen.
 */
function drawInstructionsSection(ctx: CanvasRenderingContext2D): void {
  const centerX = CANVAS_WIDTH / 2;
  const startY = 830;
  const padding = 25;
  const boxWidth = 600;
  const boxHeight = 240;
  const cornerRadius = 20;

  // Background box
  ctx.shadowColor = "rgba(0, 0, 0, 0.1)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 3;

  ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
  drawRoundedRect(ctx, centerX - boxWidth / 2, startY, boxWidth, boxHeight, cornerRadius);
  ctx.fill();

  // Reset shadow
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;

  // Section title
  ctx.fillStyle = "#FF6B6B";
  ctx.font = "bold 24px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("How to Play", centerX, startY + 35);

  // Instructions content
  ctx.fillStyle = "#666666";
  ctx.font = "18px Arial, sans-serif";
  ctx.textAlign = "left";
  const textX = centerX - boxWidth / 2 + padding + 10;

  const instructions = [
    { icon: "👆", text: "Tap or Click to drop cats" },
    { icon: "⌨️", text: "Spacebar also works!" },
    { icon: "🎯", text: "Time your drops carefully" },
    { icon: "⚡", text: "Speed increases as you stack!" },
  ];

  instructions.forEach((instruction, index) => {
    const lineY = startY + 75 + index * 38;
    ctx.font = "20px Arial, sans-serif";
    ctx.fillText(instruction.icon, textX, lineY);
    ctx.font = "18px Arial, sans-serif";
    ctx.fillStyle = "#555555";
    ctx.fillText(instruction.text, textX + 35, lineY);
  });

  // Scoring tips on the right side
  ctx.textAlign = "left";
  const rightX = centerX + 30;

  const tips = [
    { icon: "✅", text: "+1 for each stacked cat" },
    { icon: "⭐", text: "+2 bonus for perfect drops!" },
    { icon: "😿", text: "Game over if cats fall!" },
  ];

  tips.forEach((tip, index) => {
    const lineY = startY + 75 + index * 38;
    ctx.font = "20px Arial, sans-serif";
    ctx.fillStyle = "#666666";
    ctx.fillText(tip.icon, rightX, lineY);
    ctx.font = "18px Arial, sans-serif";
    ctx.fillStyle = "#555555";
    ctx.fillText(tip.text, rightX + 35, lineY);
  });
}

/**
 * Draws a mode selection button with icon and description.
 */
function drawModeButton(
  ctx: CanvasRenderingContext2D,
  bounds: Rect,
  title: string,
  description1: string,
  description2: string,
  accentColor: string,
  iconDrawer: (ctx: CanvasRenderingContext2D, x: number, y: number) => void
): void {
  const { x, y, width, height } = bounds;
  const cornerRadius = 20;

  // Button shadow
  ctx.shadowColor = "rgba(0, 0, 0, 0.15)";
  ctx.shadowBlur = 12;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 4;

  // Button background (white with slight tint)
  ctx.fillStyle = "#FFFFFF";
  drawRoundedRect(ctx, x, y, width, height, cornerRadius);
  ctx.fill();

  // Reset shadow
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // Accent color left border
  ctx.fillStyle = accentColor;
  ctx.beginPath();
  ctx.moveTo(x + cornerRadius, y);
  ctx.lineTo(x + 12, y);
  ctx.lineTo(x + 12, y + height);
  ctx.lineTo(x + cornerRadius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - cornerRadius);
  ctx.lineTo(x, y + cornerRadius);
  ctx.quadraticCurveTo(x, y, x + cornerRadius, y);
  ctx.closePath();
  ctx.fill();

  // Button border
  ctx.strokeStyle = "rgba(0, 0, 0, 0.1)";
  ctx.lineWidth = 2;
  drawRoundedRect(ctx, x, y, width, height, cornerRadius);
  ctx.stroke();

  // Draw icon on the left side
  iconDrawer(ctx, x + 60, y + height / 2);

  // Title text
  ctx.fillStyle = "#333333";
  ctx.font = "bold 32px Arial, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(title, x + 120, y + 45);

  // Description line 1
  ctx.fillStyle = "#666666";
  ctx.font = "22px Arial, sans-serif";
  ctx.fillText(description1, x + 120, y + 85);

  // Description line 2 (smaller, italicized look)
  ctx.fillStyle = "#888888";
  ctx.font = "18px Arial, sans-serif";
  ctx.fillText(description2, x + 120, y + 115);

  // Arrow indicator on right
  ctx.fillStyle = "#CCCCCC";
  ctx.font = "bold 28px Arial, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(">", x + width - 25, y + height / 2);
}

/**
 * Draws a stack icon (for Classic Mode).
 */
function drawStackIcon(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.save();
  ctx.translate(x, y);

  // Draw 3 stacked rectangles (cats)
  const boxWidth = 35;
  const boxHeight = 18;
  const spacing = 4;

  // Bottom cat (orange)
  ctx.fillStyle = "#FFD4A3";
  drawRoundedRect(ctx, -boxWidth / 2, spacing + boxHeight / 2, boxWidth, boxHeight, 4);
  ctx.fill();
  ctx.strokeStyle = "rgba(0, 0, 0, 0.2)";
  ctx.lineWidth = 1;
  drawRoundedRect(ctx, -boxWidth / 2, spacing + boxHeight / 2, boxWidth, boxHeight, 4);
  ctx.stroke();

  // Middle cat (gray)
  ctx.fillStyle = "#D0D0D0";
  drawRoundedRect(ctx, -boxWidth / 2, -boxHeight / 2, boxWidth, boxHeight, 4);
  ctx.fill();
  ctx.strokeStyle = "rgba(0, 0, 0, 0.2)";
  drawRoundedRect(ctx, -boxWidth / 2, -boxHeight / 2, boxWidth, boxHeight, 4);
  ctx.stroke();

  // Top cat (white)
  ctx.fillStyle = "#F5F5F5";
  drawRoundedRect(ctx, -boxWidth / 2, -spacing - boxHeight * 1.5, boxWidth, boxHeight, 4);
  ctx.fill();
  ctx.strokeStyle = "rgba(0, 0, 0, 0.2)";
  drawRoundedRect(ctx, -boxWidth / 2, -spacing - boxHeight * 1.5, boxWidth, boxHeight, 4);
  ctx.stroke();

  ctx.restore();
}

/**
 * Draws a goal/flag icon (for Reach the Top Mode).
 */
function drawGoalIcon(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.save();
  ctx.translate(x, y);

  // Pole
  ctx.fillStyle = "#8B7355";
  ctx.fillRect(-2, -25, 4, 50);

  // Flag
  ctx.fillStyle = "#7BC67B";
  ctx.beginPath();
  ctx.moveTo(2, -25);
  ctx.lineTo(30, -15);
  ctx.lineTo(2, -5);
  ctx.closePath();
  ctx.fill();

  // Flag highlight
  ctx.fillStyle = "#9CD69C";
  ctx.beginPath();
  ctx.moveTo(2, -25);
  ctx.lineTo(20, -18);
  ctx.lineTo(2, -12);
  ctx.closePath();
  ctx.fill();

  // Small star on flag
  ctx.fillStyle = "#FFFFFF";
  drawSmallStar(ctx, 12, -15, 4, 2);

  ctx.restore();
}

/**
 * Draws a small star.
 */
function drawSmallStar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  outerRadius: number,
  innerRadius: number
): void {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = (i * Math.PI) / 5 - Math.PI / 2;
    const px = x + radius * Math.cos(angle);
    const py = y + radius * Math.sin(angle);

    if (i === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  }
  ctx.closePath();
  ctx.fill();
}

/**
 * Draws a decorative cat silhouette for the start screen.
 */
function drawDecorativeCat(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = "rgba(255, 180, 180, 0.3)";

  // Body
  ctx.beginPath();
  ctx.ellipse(0, 15, 35, 25, 0, 0, Math.PI * 2);
  ctx.fill();

  // Head
  ctx.beginPath();
  ctx.arc(0, -15, 25, 0, Math.PI * 2);
  ctx.fill();

  // Ears
  ctx.beginPath();
  ctx.moveTo(-20, -30);
  ctx.lineTo(-12, -50);
  ctx.lineTo(-5, -30);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(20, -30);
  ctx.lineTo(12, -50);
  ctx.lineTo(5, -30);
  ctx.closePath();
  ctx.fill();
}

/**
 * Draws a decorative paw print.
 */
function drawPawPrint(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  ctx.fillStyle = "rgba(255, 180, 180, 0.2)";

  // Main pad
  ctx.beginPath();
  ctx.ellipse(0, 10, 18, 15, 0, 0, Math.PI * 2);
  ctx.fill();

  // Toe pads
  const toePadPositions = [
    { x: -12, y: -8 },
    { x: 0, y: -12 },
    { x: 12, y: -8 },
  ];

  for (const pos of toePadPositions) {
    ctx.beginPath();
    ctx.ellipse(pos.x, pos.y, 8, 8, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Renders the gameplay HUD for Classic mode.
 * Displays current score and high score in the top corner.
 */
export function renderHUD(
  ctx: CanvasRenderingContext2D,
  score: number,
  highScore: number
): void {
  const padding = 30;
  const textX = padding;
  const scoreY = 60;

  // Draw score background with slight shadow
  ctx.shadowColor = "rgba(0, 0, 0, 0.1)";
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 2;

  ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
  drawRoundedRect(ctx, padding - 15, scoreY - 40, 180, 100, 15);
  ctx.fill();

  // Reset shadow
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // Current score label
  ctx.fillStyle = "#888888";
  ctx.font = "20px Arial, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("Score", textX, scoreY - 15);

  // Current score value
  ctx.fillStyle = "#FF6B6B";
  ctx.font = "bold 42px Arial, sans-serif";
  ctx.fillText(score.toString(), textX, scoreY + 25);

  // High score (smaller, below current score)
  ctx.fillStyle = "#A8A8A8";
  ctx.font = "16px Arial, sans-serif";
  ctx.fillText(`Best: ${highScore}`, textX, scoreY + 55);
}

/**
 * Renders the win line for "Reach the Top" mode.
 * Draws a dashed horizontal line at WIN_LINE_Y with a "GOAL" label.
 *
 * @param ctx - The canvas rendering context
 */
export function renderWinLine(ctx: CanvasRenderingContext2D): void {
  ctx.save();

  // Add subtle glow effect for the win line
  ctx.shadowColor = WIN_LINE_COLOR;
  ctx.shadowBlur = 8;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // Draw the dashed win line
  ctx.strokeStyle = WIN_LINE_COLOR;
  ctx.lineWidth = 3;
  ctx.setLineDash([15, 10]); // Dashed pattern: 15px dash, 10px gap

  ctx.beginPath();
  ctx.moveTo(0, WIN_LINE_Y);
  ctx.lineTo(CANVAS_WIDTH, WIN_LINE_Y);
  ctx.stroke();

  // Reset line dash for other drawings
  ctx.setLineDash([]);

  // Reset shadow
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;

  // Draw "GOAL" label on the right side
  ctx.fillStyle = WIN_LINE_COLOR;
  ctx.font = "bold 20px Arial, sans-serif";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.fillText("GOAL", CANVAS_WIDTH - 15, WIN_LINE_Y - 18);

  // Draw small flag icon next to the label
  drawWinLineFlag(ctx, CANVAS_WIDTH - 80, WIN_LINE_Y - 18);

  ctx.restore();
}

/**
 * Draws a small flag icon for the win line.
 */
function drawWinLineFlag(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.save();
  ctx.translate(x, y);

  // Pole
  ctx.fillStyle = "#8B7355";
  ctx.fillRect(-1, -8, 2, 16);

  // Flag
  ctx.fillStyle = WIN_LINE_COLOR;
  ctx.beginPath();
  ctx.moveTo(1, -8);
  ctx.lineTo(12, -3);
  ctx.lineTo(1, 2);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/**
 * Renders the HUD for "Reach the Top" mode.
 * Displays "Cats: X" prominently and "Lost: Y" in smaller text.
 *
 * @param ctx - The canvas rendering context
 * @param catsDropped - Total number of cats dropped
 * @param catsLost - Number of cats that fell off screen
 */
export function renderReachTheTopHUD(
  ctx: CanvasRenderingContext2D,
  catsDropped: number,
  catsLost: number
): void {
  const padding = 30;
  const textX = padding;
  const hudY = 60;

  // Draw HUD background with slight shadow
  ctx.shadowColor = "rgba(0, 0, 0, 0.1)";
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 2;

  ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
  drawRoundedRect(ctx, padding - 15, hudY - 40, 180, 100, 15);
  ctx.fill();

  // Reset shadow
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // Cats dropped label
  ctx.fillStyle = "#888888";
  ctx.font = "20px Arial, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("Cats:", textX, hudY - 15);

  // Cats dropped value (prominent, in mint green to match win line)
  ctx.fillStyle = WIN_LINE_COLOR;
  ctx.font = "bold 42px Arial, sans-serif";
  ctx.fillText(catsDropped.toString(), textX + 70, hudY - 15);

  // Cats lost label and value (smaller, in muted color)
  ctx.fillStyle = "#A8A8A8";
  ctx.font = "16px Arial, sans-serif";
  ctx.fillText(`Lost: ${catsLost}`, textX, hudY + 30);

  // Stacked cats indicator (optional helpful info)
  const stacked = catsDropped - catsLost;
  ctx.fillStyle = "#7BC67B";
  ctx.font = "16px Arial, sans-serif";
  ctx.fillText(`Stacked: ${stacked}`, textX, hudY + 55);
}

/**
 * Renders the "Perfect!" text feedback.
 */
export function renderPerfectFeedback(
  ctx: CanvasRenderingContext2D,
  scoreState: ScoreState
): void {
  if (!scoreState.showingPerfect) {
    return;
  }

  // Calculate fade and scale based on remaining time
  const progress = scoreState.perfectDisplayTime / 1500; // Assuming 1500ms duration
  const alpha = Math.min(1, progress * 2); // Fade out in last 50%
  const scale = 1 + (1 - progress) * 0.3; // Scale up as time passes

  ctx.save();
  ctx.translate(scoreState.perfectX, scoreState.perfectY);
  ctx.scale(scale, scale);
  ctx.globalAlpha = alpha;

  // Draw "Perfect!" text with glow effect
  ctx.fillStyle = "#FFD700";
  ctx.font = "bold 36px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Glow/shadow
  ctx.shadowColor = "#FFD700";
  ctx.shadowBlur = 15;
  ctx.fillText("Perfect!", 0, 0);

  // Stars around text
  ctx.fillStyle = "#FFD700";
  const starPositions = [
    { x: -60, y: -5 },
    { x: 60, y: -5 },
    { x: -40, y: 15 },
    { x: 40, y: 15 },
  ];

  for (const pos of starPositions) {
    drawStar(ctx, pos.x, pos.y, 5, 3);
  }

  ctx.restore();
}

/**
 * Draws a small star shape.
 */
function drawStar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  outerRadius: number,
  innerRadius: number
): void {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = (i * Math.PI) / 5 - Math.PI / 2;
    const px = x + radius * Math.cos(angle);
    const py = y + radius * Math.sin(angle);

    if (i === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  }
  ctx.closePath();
  ctx.fill();
}

/**
 * Renders the game over screen UI.
 * Displays "Game Over" message, final score, high score, and action buttons.
 */
export function renderGameOverScreen(
  ctx: CanvasRenderingContext2D,
  score: number,
  highScore: number,
  isNewHighScore: boolean
): void {
  const centerX = CANVAS_WIDTH / 2;
  const centerY = CANVAS_HEIGHT / 2;

  // Draw semi-transparent overlay
  ctx.fillStyle = "rgba(50, 50, 50, 0.7)";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Draw panel background with shadow (expanded height for buttons)
  ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
  ctx.shadowBlur = 20;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 10;

  ctx.fillStyle = "#FFF5F5";
  drawRoundedRect(ctx, centerX - 200, centerY - 180, 400, 420, 30);
  ctx.fill();

  // Reset shadow
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // Draw panel border
  ctx.strokeStyle = "#FF9999";
  ctx.lineWidth = 4;
  drawRoundedRect(ctx, centerX - 200, centerY - 180, 400, 420, 30);
  ctx.stroke();

  // Game Over text
  ctx.fillStyle = "#FF6B6B";
  ctx.font = "bold 56px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Game Over", centerX, centerY - 110);

  // Score label
  ctx.fillStyle = "#888888";
  ctx.font = "24px Arial, sans-serif";
  ctx.fillText("Score", centerX, centerY - 40);

  // Final score
  ctx.fillStyle = "#FF6B6B";
  ctx.font = "bold 64px Arial, sans-serif";
  ctx.fillText(score.toString(), centerX, centerY + 15);

  // High score section
  if (isNewHighScore) {
    // New high score celebration
    ctx.fillStyle = "#FFD700";
    ctx.font = "bold 28px Arial, sans-serif";
    ctx.fillText("New Best!", centerX, centerY + 70);

    // Draw stars
    ctx.fillStyle = "#FFD700";
    drawStar(ctx, centerX - 80, centerY + 70, 10, 5);
    drawStar(ctx, centerX + 80, centerY + 70, 10, 5);
  } else {
    // Regular high score display
    ctx.fillStyle = "#A8A8A8";
    ctx.font = "22px Arial, sans-serif";
    ctx.fillText(`Best: ${highScore}`, centerX, centerY + 70);
  }

  // Draw Restart button
  drawGameOverButton(
    ctx,
    GAME_OVER_BUTTON_BOUNDS.restart,
    "Play Again",
    "#7BC67B"
  );

  // Draw Change Mode button
  drawGameOverButton(
    ctx,
    GAME_OVER_BUTTON_BOUNDS.changeMode,
    "Change Mode",
    "#FFB366"
  );

  // Sad cat face at top of panel
  ctx.save();
  ctx.translate(centerX, centerY - 220);
  drawSadCatFace(ctx);
  ctx.restore();
}

/**
 * Draws a button for the game over screen.
 */
function drawGameOverButton(
  ctx: CanvasRenderingContext2D,
  bounds: Rect,
  label: string,
  color: string
): void {
  const { x, y, width, height } = bounds;
  const cornerRadius = 15;

  // Button shadow
  ctx.shadowColor = "rgba(0, 0, 0, 0.15)";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 3;

  // Button background
  ctx.fillStyle = color;
  drawRoundedRect(ctx, x, y, width, height, cornerRadius);
  ctx.fill();

  // Reset shadow
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // Button text
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 24px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x + width / 2, y + height / 2);
}

/**
 * Renders the win screen UI for "Reach the Top" mode.
 * Displays celebratory message, cat count, best score, and action buttons.
 *
 * @param ctx - The canvas rendering context
 * @param catsUsed - Number of cats used to reach the top
 * @param bestScore - Previous best score (lower is better), null if no previous best
 */
export function renderWinScreen(
  ctx: CanvasRenderingContext2D,
  catsUsed: number,
  bestScore: number | null
): void {
  const centerX = CANVAS_WIDTH / 2;
  const centerY = CANVAS_HEIGHT / 2;

  // Draw semi-transparent overlay with celebratory tint
  ctx.fillStyle = "rgba(245, 255, 245, 0.85)";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Draw panel background with shadow
  ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
  ctx.shadowBlur = 25;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 10;

  ctx.fillStyle = "#FFFFF5";
  drawRoundedRect(ctx, centerX - 220, centerY - 200, 440, 450, 30);
  ctx.fill();

  // Reset shadow
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // Draw panel border (mint green to match win line)
  ctx.strokeStyle = WIN_LINE_COLOR;
  ctx.lineWidth = 4;
  drawRoundedRect(ctx, centerX - 220, centerY - 200, 440, 450, 30);
  ctx.stroke();

  // Happy cat face at top of panel
  ctx.save();
  ctx.translate(centerX, centerY - 240);
  drawHappyCatFace(ctx);
  ctx.restore();

  // Celebratory title "You reached the top!"
  ctx.fillStyle = WIN_LINE_COLOR;
  ctx.font = "bold 44px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("You reached the top!", centerX, centerY - 120);

  // Cat count with emphasis
  ctx.fillStyle = "#666666";
  ctx.font = "28px Arial, sans-serif";
  ctx.fillText("with", centerX, centerY - 60);

  // Big cat count number
  ctx.fillStyle = "#FFD700"; // Gold for emphasis
  ctx.font = "bold 72px Arial, sans-serif";
  ctx.fillText(catsUsed.toString(), centerX, centerY + 5);

  // "cats!" text
  ctx.fillStyle = "#666666";
  ctx.font = "bold 32px Arial, sans-serif";
  ctx.fillText(catsUsed === 1 ? "cat!" : "cats!", centerX, centerY + 55);

  // Best score section
  const isNewBest = bestScore === null || catsUsed < bestScore;
  if (isNewBest) {
    // New best celebration
    ctx.fillStyle = "#FFD700";
    ctx.font = "bold 24px Arial, sans-serif";
    ctx.fillText("New Best!", centerX, centerY + 100);

    // Draw stars around "New Best!"
    ctx.fillStyle = "#FFD700";
    drawStar(ctx, centerX - 70, centerY + 100, 8, 4);
    drawStar(ctx, centerX + 70, centerY + 100, 8, 4);
  } else if (bestScore !== null) {
    // Show previous best
    ctx.fillStyle = "#A8A8A8";
    ctx.font = "20px Arial, sans-serif";
    ctx.fillText(`Best: ${bestScore} cats`, centerX, centerY + 100);
  }

  // Draw Play Again button
  drawWinScreenButton(
    ctx,
    WIN_SCREEN_BUTTON_BOUNDS.playAgain,
    "Play Again",
    WIN_LINE_COLOR
  );

  // Draw Change Mode button
  drawWinScreenButton(
    ctx,
    WIN_SCREEN_BUTTON_BOUNDS.changeMode,
    "Change Mode",
    "#FFB366"
  );
}

/**
 * Draws a button for the win screen.
 */
function drawWinScreenButton(
  ctx: CanvasRenderingContext2D,
  bounds: Rect,
  label: string,
  color: string
): void {
  const { x, y, width, height } = bounds;
  const cornerRadius = 15;

  // Button shadow
  ctx.shadowColor = "rgba(0, 0, 0, 0.15)";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 3;

  // Button background
  ctx.fillStyle = color;
  drawRoundedRect(ctx, x, y, width, height, cornerRadius);
  ctx.fill();

  // Reset shadow
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // Button text
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 26px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x + width / 2, y + height / 2);
}

/**
 * Draws a happy cat face for the win screen.
 */
function drawHappyCatFace(ctx: CanvasRenderingContext2D): void {
  // Face circle (soft gold)
  ctx.fillStyle = "#FFE6B6";
  ctx.beginPath();
  ctx.arc(0, 0, 40, 0, Math.PI * 2);
  ctx.fill();

  // Ears
  ctx.beginPath();
  ctx.moveTo(-28, -28);
  ctx.lineTo(-18, -55);
  ctx.lineTo(-8, -28);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(28, -28);
  ctx.lineTo(18, -55);
  ctx.lineTo(8, -28);
  ctx.closePath();
  ctx.fill();

  // Inner ears
  ctx.fillStyle = "#FFB6B6";
  ctx.beginPath();
  ctx.moveTo(-22, -32);
  ctx.lineTo(-18, -46);
  ctx.lineTo(-12, -32);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(22, -32);
  ctx.lineTo(18, -46);
  ctx.lineTo(12, -32);
  ctx.closePath();
  ctx.fill();

  // Happy closed eyes (curved lines)
  ctx.strokeStyle = "#333333";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";

  // Left eye - happy curve
  ctx.beginPath();
  ctx.arc(-12, -8, 8, Math.PI * 0.2, Math.PI * 0.8);
  ctx.stroke();

  // Right eye - happy curve
  ctx.beginPath();
  ctx.arc(12, -8, 8, Math.PI * 0.2, Math.PI * 0.8);
  ctx.stroke();

  // Blush marks
  ctx.fillStyle = "rgba(255, 150, 150, 0.5)";
  ctx.beginPath();
  ctx.ellipse(-25, 5, 8, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(25, 5, 8, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Nose
  ctx.fillStyle = "#FFB6B6";
  ctx.beginPath();
  ctx.moveTo(0, 5);
  ctx.lineTo(-5, 12);
  ctx.lineTo(5, 12);
  ctx.closePath();
  ctx.fill();

  // Happy smile
  ctx.strokeStyle = "#333333";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(0, 12, 12, Math.PI * 0.15, Math.PI * 0.85);
  ctx.stroke();
}

/**
 * Draws a sad cat face for the game over screen.
 */
function drawSadCatFace(ctx: CanvasRenderingContext2D): void {
  // Face circle
  ctx.fillStyle = "#FFD4A3";
  ctx.beginPath();
  ctx.arc(0, 0, 35, 0, Math.PI * 2);
  ctx.fill();

  // Ears
  ctx.beginPath();
  ctx.moveTo(-25, -25);
  ctx.lineTo(-15, -50);
  ctx.lineTo(-5, -25);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(25, -25);
  ctx.lineTo(15, -50);
  ctx.lineTo(5, -25);
  ctx.closePath();
  ctx.fill();

  // Inner ears
  ctx.fillStyle = "#FFB6B6";
  ctx.beginPath();
  ctx.moveTo(-20, -28);
  ctx.lineTo(-15, -42);
  ctx.lineTo(-10, -28);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(20, -28);
  ctx.lineTo(15, -42);
  ctx.lineTo(10, -28);
  ctx.closePath();
  ctx.fill();

  // Sad eyes (downturned)
  ctx.strokeStyle = "#333333";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";

  // Left eye
  ctx.beginPath();
  ctx.arc(-10, -5, 6, Math.PI * 1.2, Math.PI * 1.8);
  ctx.stroke();

  // Right eye
  ctx.beginPath();
  ctx.arc(10, -5, 6, Math.PI * 1.2, Math.PI * 1.8);
  ctx.stroke();

  // Nose
  ctx.fillStyle = "#FFB6B6";
  ctx.beginPath();
  ctx.moveTo(0, 5);
  ctx.lineTo(-4, 10);
  ctx.lineTo(4, 10);
  ctx.closePath();
  ctx.fill();

  // Sad mouth
  ctx.strokeStyle = "#333333";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 22, 8, Math.PI * 1.2, Math.PI * 1.8);
  ctx.stroke();
}

/**
 * Helper function to draw a rounded rectangle path.
 */
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}
