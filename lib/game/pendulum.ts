/**
 * Pendulum System
 *
 * Manages the swinging pendulum motion for dropping cats.
 * The pendulum uses sinusoidal motion: x = centerX + amplitude * sin(time * speed)
 *
 * Features:
 * - Smooth sinusoidal swing motion
 * - Configurable amplitude and period
 * - Difficulty progression (speed increases)
 * - Position calculation based on game time
 */

import {
  CANVAS_WIDTH,
  SWING_AMPLITUDE,
  SWING_PERIOD,
  SPEED_INCREASE_FACTOR,
  PENDULUM_Y,
} from "@/lib/constants";

/**
 * Represents the current state of the pendulum.
 */
export interface PendulumState {
  /** The center X position (pivot point) */
  centerX: number;
  /** The Y position of the pendulum */
  y: number;
  /** The swing amplitude in pixels */
  amplitude: number;
  /** The base period in milliseconds */
  basePeriod: number;
  /** Speed multiplier (increases with difficulty) */
  speedMultiplier: number;
  /** Current difficulty level (0 = base, increases at thresholds) */
  difficultyLevel: number;
  /** Accumulated time for position calculation */
  accumulatedTime: number;
}

/**
 * Position result from pendulum calculation.
 */
export interface PendulumPosition {
  x: number;
  y: number;
}

/**
 * Creates a new pendulum with default settings.
 */
export function createPendulum(): PendulumState {
  return {
    centerX: CANVAS_WIDTH / 2,
    y: PENDULUM_Y,
    amplitude: CANVAS_WIDTH * SWING_AMPLITUDE,
    basePeriod: SWING_PERIOD,
    speedMultiplier: 1.0,
    difficultyLevel: 0,
    accumulatedTime: 0,
  };
}

/**
 * Calculates the pendulum position at a given time.
 * Uses sinusoidal motion: x = centerX + amplitude * sin(time * speed)
 *
 * @param pendulum - The pendulum state
 * @param time - Time in milliseconds (from game start or accumulated)
 * @returns The X and Y position of the pendulum
 */
export function getPendulumPosition(
  pendulum: PendulumState,
  time: number
): PendulumPosition {
  // Calculate angular frequency: omega = 2 * PI / period
  // With speed multiplier applied to make it faster at higher difficulties
  const effectivePeriod = pendulum.basePeriod / pendulum.speedMultiplier;
  const omega = (2 * Math.PI) / effectivePeriod;

  // Calculate X position using sinusoidal motion
  const x = pendulum.centerX + pendulum.amplitude * Math.sin(omega * time);

  return {
    x,
    y: pendulum.y,
  };
}

/**
 * Updates the pendulum's accumulated time.
 * Call this each frame with deltaTime in milliseconds.
 *
 * @param pendulum - The pendulum state to update
 * @param deltaTimeMs - Time since last frame in milliseconds
 */
export function updatePendulum(
  pendulum: PendulumState,
  deltaTimeMs: number
): void {
  // Cap delta time to prevent jumps when tab loses focus (max ~2 frames at 60fps)
  const cappedDelta = Math.min(deltaTimeMs, 33);
  pendulum.accumulatedTime += cappedDelta;
}

/**
 * Gets the current pendulum position based on accumulated time.
 *
 * @param pendulum - The pendulum state
 * @returns The current X and Y position
 */
export function getCurrentPendulumPosition(
  pendulum: PendulumState
): PendulumPosition {
  return getPendulumPosition(pendulum, pendulum.accumulatedTime);
}

/**
 * Increases the pendulum difficulty by applying speed increase.
 * Call this when reaching difficulty thresholds.
 *
 * Adjusts accumulated time to maintain the current pendulum position,
 * preventing the pendulum from "jumping" when speed changes.
 *
 * @param pendulum - The pendulum state to modify
 * @param newLevel - The new difficulty level to set
 */
export function increasePendulumDifficulty(
  pendulum: PendulumState,
  newLevel: number
): void {
  const oldSpeedMultiplier = pendulum.speedMultiplier;
  const newSpeedMultiplier = Math.pow(1 + SPEED_INCREASE_FACTOR, newLevel);

  // Adjust accumulated time to maintain the same angular position
  // sin(oldOmega * oldTime) = sin(newOmega * newTime)
  // => newTime = oldTime * (oldSpeed / newSpeed)
  if (newSpeedMultiplier !== oldSpeedMultiplier) {
    pendulum.accumulatedTime =
      pendulum.accumulatedTime * (oldSpeedMultiplier / newSpeedMultiplier);
  }

  pendulum.difficultyLevel = newLevel;
  pendulum.speedMultiplier = newSpeedMultiplier;
}

/**
 * Optionally increases amplitude at higher difficulty levels.
 * Can be used for additional challenge.
 *
 * @param pendulum - The pendulum state to modify
 * @param amplitudeIncrease - Additional amplitude as a fraction of screen width
 */
export function increasePendulumAmplitude(
  pendulum: PendulumState,
  amplitudeIncrease: number
): void {
  pendulum.amplitude = CANVAS_WIDTH * (SWING_AMPLITUDE + amplitudeIncrease);
}

/**
 * Resets the pendulum to its initial state.
 * Useful for game restart.
 *
 * @param pendulum - The pendulum state to reset
 */
export function resetPendulum(pendulum: PendulumState): void {
  pendulum.amplitude = CANVAS_WIDTH * SWING_AMPLITUDE;
  pendulum.speedMultiplier = 1.0;
  pendulum.difficultyLevel = 0;
  pendulum.accumulatedTime = 0;
}

/**
 * Renders the pendulum cat preview on canvas.
 * This shows where the next cat will be dropped.
 *
 * @param ctx - Canvas rendering context
 * @param pendulum - The pendulum state
 * @param renderCatFn - Function to render a cat at position
 */
export function renderPendulumCat(
  ctx: CanvasRenderingContext2D,
  pendulum: PendulumState,
  catEntity: { body: { position: { x: number; y: number }; angle: number } }
): void {
  const pos = getCurrentPendulumPosition(pendulum);

  // Update the cat entity's position for rendering
  // Note: This is a preview cat, not a physics body
  catEntity.body.position.x = pos.x;
  catEntity.body.position.y = pos.y;
  catEntity.body.angle = 0;
}

/**
 * Checks if a given number of stacked cats should trigger difficulty increase.
 *
 * @param stackedCats - Number of successfully stacked cats
 * @param currentLevel - Current difficulty level
 * @param thresholds - Array of threshold values
 * @returns The new difficulty level (same as current if no threshold crossed)
 */
export function checkDifficultyThreshold(
  stackedCats: number,
  currentLevel: number,
  thresholds: number[]
): number {
  let newLevel = 0;

  for (let i = 0; i < thresholds.length; i++) {
    if (stackedCats >= thresholds[i]) {
      newLevel = i + 1;
    }
  }

  return newLevel;
}
