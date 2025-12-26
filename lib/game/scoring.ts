/**
 * Scoring System
 *
 * Manages score tracking for the Cat Stack game including:
 * - Score increment on cat stability (+1 point)
 * - Perfect landing detection (10-15% center offset)
 * - Perfect landing bonus (+2 points)
 * - High score persistence with localStorage
 * - Best score tracking for Reach the Top mode (lower is better)
 */

import {
  POINTS_PER_STACK,
  PERFECT_BONUS,
  PERFECT_THRESHOLD,
  HIGH_SCORE_KEY,
  REACH_TOP_BEST_KEY,
  PERFECT_DISPLAY_DURATION,
  GROUND_Y,
  GROUND_HEIGHT,
} from "@/lib/constants";
import { CatEntity, CAT_WIDTH } from "./cat";

/**
 * Represents the current scoring state.
 */
export interface ScoreState {
  /** Current score */
  score: number;
  /** High score from localStorage */
  highScore: number;
  /** Whether showing "Perfect!" text */
  showingPerfect: boolean;
  /** Time remaining for perfect display (ms) */
  perfectDisplayTime: number;
  /** X position where perfect was achieved (for display) */
  perfectX: number;
  /** Y position where perfect was achieved (for display) */
  perfectY: number;
  /** Best score for Reach the Top mode (lower is better), null if none */
  reachTopBest: number | null;
}

/**
 * Creates a new score state with loaded high score.
 */
export function createScoreState(): ScoreState {
  return {
    score: 0,
    highScore: loadHighScore(),
    showingPerfect: false,
    perfectDisplayTime: 0,
    perfectX: 0,
    perfectY: 0,
    reachTopBest: loadReachTopBest(),
  };
}

/**
 * Loads the high score from localStorage.
 * Returns 0 if no high score is saved or if localStorage is unavailable.
 */
export function loadHighScore(): number {
  if (typeof window === "undefined" || !window.localStorage) {
    return 0;
  }

  try {
    const stored = localStorage.getItem(HIGH_SCORE_KEY);
    if (stored === null) {
      return 0;
    }
    const parsed = parseInt(stored, 10);
    return isNaN(parsed) ? 0 : Math.max(0, parsed);
  } catch {
    return 0;
  }
}

/**
 * Saves the high score to localStorage.
 */
export function saveHighScore(score: number): void {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }

  try {
    localStorage.setItem(HIGH_SCORE_KEY, score.toString());
  } catch {
    // Ignore localStorage errors (quota exceeded, etc.)
  }
}

/**
 * Updates the high score if the current score beats it.
 * Returns true if high score was beaten.
 */
export function updateHighScore(scoreState: ScoreState): boolean {
  if (scoreState.score > scoreState.highScore) {
    scoreState.highScore = scoreState.score;
    saveHighScore(scoreState.highScore);
    return true;
  }
  return false;
}

// ============================================================================
// REACH THE TOP MODE BEST SCORE
// ============================================================================

/**
 * Loads the best score for Reach the Top mode from localStorage.
 * Returns null if no best score is saved or if localStorage is unavailable.
 * Note: Lower is better in this mode.
 */
export function loadReachTopBest(): number | null {
  if (typeof window === "undefined" || !window.localStorage) {
    return null;
  }

  try {
    const stored = localStorage.getItem(REACH_TOP_BEST_KEY);
    if (stored === null) {
      return null;
    }
    const parsed = parseInt(stored, 10);
    return isNaN(parsed) || parsed <= 0 ? null : parsed;
  } catch {
    return null;
  }
}

/**
 * Saves the best score for Reach the Top mode to localStorage.
 */
export function saveReachTopBest(catCount: number): void {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }

  try {
    localStorage.setItem(REACH_TOP_BEST_KEY, catCount.toString());
  } catch {
    // Ignore localStorage errors (quota exceeded, etc.)
  }
}

/**
 * Updates the best score for Reach the Top mode if the current score is better.
 * In this mode, lower is better (fewer cats = better performance).
 *
 * @param scoreState - The score state to update
 * @param catsUsed - Number of cats used to reach the top
 * @returns true if a new best was achieved
 */
export function updateReachTopBest(
  scoreState: ScoreState,
  catsUsed: number
): boolean {
  // If catsUsed is 0 or negative, it's not a valid win
  if (catsUsed <= 0) {
    return false;
  }

  // Check if this is a new best (lower is better)
  const isNewBest = scoreState.reachTopBest === null || catsUsed < scoreState.reachTopBest;

  if (isNewBest) {
    scoreState.reachTopBest = catsUsed;
    saveReachTopBest(catsUsed);
    return true;
  }

  return false;
}

/**
 * Gets the current best score for Reach the Top mode.
 * Returns null if no best score has been set.
 */
export function getReachTopBest(scoreState: ScoreState): number | null {
  return scoreState.reachTopBest;
}

/**
 * Checks if the given cat count would be a new best for Reach the Top mode.
 *
 * @param scoreState - The score state to check against
 * @param catsUsed - Number of cats used
 * @returns true if this would be a new best (or if no previous best exists)
 */
export function isNewReachTopBest(
  scoreState: ScoreState,
  catsUsed: number
): boolean {
  if (catsUsed <= 0) {
    return false;
  }
  return scoreState.reachTopBest === null || catsUsed < scoreState.reachTopBest;
}

// ============================================================================
// CLASSIC MODE SCORING
// ============================================================================

/**
 * Calculates the horizontal offset between a landing cat and its target.
 * The target is either the cat below or the ground center.
 *
 * @param landingCat - The cat that just landed
 * @param catBelow - The cat below, or null if landing on ground
 * @returns The absolute horizontal offset in pixels
 */
export function calculateLandingOffset(
  landingCat: CatEntity,
  catBelow: CatEntity | null
): number {
  const landingX = landingCat.body.position.x;

  if (catBelow) {
    // Calculate offset from cat below center
    const targetX = catBelow.body.position.x;
    return Math.abs(landingX - targetX);
  } else {
    // Calculate offset from ground center (canvas center)
    // For first cat, we compare to ground center
    const groundCenterX = 360; // CANVAS_WIDTH / 2
    return Math.abs(landingX - groundCenterX);
  }
}

/**
 * Checks if a landing is considered "perfect" (within threshold).
 * Perfect threshold is 12.5% of cat width.
 *
 * @param offset - The horizontal offset in pixels
 * @returns True if the landing is perfect
 */
export function isPerfectLanding(offset: number): boolean {
  const perfectThresholdPixels = CAT_WIDTH * PERFECT_THRESHOLD;
  return offset <= perfectThresholdPixels;
}

/**
 * Awards points for a stable cat and checks for perfect landing.
 *
 * @param scoreState - The score state to update
 * @param stableCat - The cat that just became stable
 * @param catBelow - The cat below (or null for ground landing)
 * @returns Object indicating if points were awarded and if it was perfect
 */
export function awardStabilityPoints(
  scoreState: ScoreState,
  stableCat: CatEntity,
  catBelow: CatEntity | null
): { pointsAwarded: number; isPerfect: boolean } {
  // Award base points
  let pointsAwarded = POINTS_PER_STACK;
  scoreState.score += POINTS_PER_STACK;

  // Check for perfect landing
  const offset = calculateLandingOffset(stableCat, catBelow);
  const isPerfect = isPerfectLanding(offset);

  if (isPerfect) {
    // Award bonus points
    pointsAwarded += PERFECT_BONUS;
    scoreState.score += PERFECT_BONUS;

    // Trigger perfect display
    scoreState.showingPerfect = true;
    scoreState.perfectDisplayTime = PERFECT_DISPLAY_DURATION;
    scoreState.perfectX = stableCat.body.position.x;
    scoreState.perfectY = stableCat.body.position.y - CAT_WIDTH / 2 - 30;
  }

  // Update high score if beaten
  updateHighScore(scoreState);

  return { pointsAwarded, isPerfect };
}

/**
 * Updates the perfect display timer.
 * Call this each frame with deltaTime in milliseconds.
 *
 * @param scoreState - The score state to update
 * @param deltaTimeMs - Time since last frame in milliseconds
 */
export function updatePerfectDisplay(
  scoreState: ScoreState,
  deltaTimeMs: number
): void {
  if (!scoreState.showingPerfect) {
    return;
  }

  scoreState.perfectDisplayTime -= deltaTimeMs;

  if (scoreState.perfectDisplayTime <= 0) {
    scoreState.showingPerfect = false;
    scoreState.perfectDisplayTime = 0;
  }
}

/**
 * Resets the score state for a new game.
 * High score and reach top best are preserved.
 */
export function resetScore(scoreState: ScoreState): void {
  scoreState.score = 0;
  scoreState.showingPerfect = false;
  scoreState.perfectDisplayTime = 0;
  scoreState.perfectX = 0;
  scoreState.perfectY = 0;
  // High score and reachTopBest are preserved
}

/**
 * Gets the current score.
 */
export function getScore(scoreState: ScoreState): number {
  return scoreState.score;
}

/**
 * Gets the high score.
 */
export function getHighScore(scoreState: ScoreState): number {
  return scoreState.highScore;
}

/**
 * Checks if the current score beats the high score.
 */
export function isNewHighScore(scoreState: ScoreState): boolean {
  return scoreState.score > 0 && scoreState.score >= scoreState.highScore;
}
