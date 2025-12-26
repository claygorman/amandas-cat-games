/**
 * Tower Management System
 *
 * Manages the cat tower including:
 * - Tracking all cats in the tower
 * - Detecting fallen cats (game over condition in classic mode)
 * - Monitoring tower stability and wobble
 * - Managing cat expressions based on tower state
 * - Difficulty progression based on successfully stacked cats
 * - Sticky landing mechanics for "Reach the Top" mode
 * - Win condition detection for "Reach the Top" mode
 */

import Matter from "matter-js";
import {
  CatEntity,
  CatBodyData,
  setCatExpression,
  updateCatStability,
  isCatStable,
  getCatSpeed,
  isCatSticky,
  CAT_HEIGHT,
  CAT_WIDTH,
} from "./cat";
import {
  PhysicsEngine,
  isBodyOffScreen,
  getBodySpeed,
  checkStickyCondition,
  makeCatStatic,
  startSettling,
  resetSettling,
  removeBody,
} from "./physics";
import {
  PendulumState,
  getCurrentPendulumPosition,
  increasePendulumDifficulty,
  checkDifficultyThreshold,
} from "./pendulum";
import {
  STABILITY_VELOCITY_THRESHOLD,
  WOBBLE_VELOCITY_THRESHOLD,
  DIFFICULTY_THRESHOLDS,
  WIN_LINE_Y,
} from "@/lib/constants";
import { GameMode } from "./state";

/**
 * Tower state for tracking the cat stack.
 */
export interface TowerState {
  /** All cats currently in the tower (including falling) */
  cats: CatEntity[];
  /** The cat currently on the pendulum (preview) */
  pendulumCat: CatEntity | null;
  /** Number of successfully stacked (stable) cats */
  stackedCount: number;
  /** Whether the tower is currently wobbling */
  isWobbling: boolean;
  /** Whether a cat has fallen (game over trigger in classic mode) */
  hasFallenCat: boolean;
  /** Current difficulty level */
  difficultyLevel: number;
}

/**
 * Creates a new tower state.
 */
export function createTowerState(): TowerState {
  return {
    cats: [],
    pendulumCat: null,
    stackedCount: 0,
    isWobbling: false,
    hasFallenCat: false,
    difficultyLevel: 0,
  };
}

/**
 * Adds a cat to the tower (when dropped from pendulum).
 */
export function addCatToTower(tower: TowerState, cat: CatEntity): void {
  tower.cats.push(cat);
  // Set expression to surprised during fall
  setCatExpression(cat, "surprised");
}

// ============================================================================
// CLASSIC MODE: Push-Down Mechanics
// ============================================================================

/**
 * Checks if a newly dropped cat is aligned with the previous cat (or ground for first cat).
 * For Classic mode where cats push down from the top.
 *
 * @param newCat - The newly dropped cat
 * @param previousCat - The previous cat in the tower (null for first cat)
 * @returns true if aligned within threshold, false otherwise
 */
export function isClassicCatAligned(
  newCat: CatEntity,
  previousCat: CatEntity | null
): boolean {
  // First cat is always aligned (landing on ground)
  if (previousCat === null) {
    return true;
  }

  const newX = newCat.body.position.x;
  const prevX = previousCat.body.position.x;

  // Calculate horizontal offset
  const offset = Math.abs(newX - prevX);

  // Allow up to 80% of cat width offset for alignment
  // This is very forgiving - only extreme misalignment triggers game over
  const alignmentThreshold = CAT_WIDTH * 0.8;

  return offset <= alignmentThreshold;
}

/**
 * Pushes all cats in the tower down by one cat height.
 * Called when a new aligned cat is dropped in Classic mode.
 *
 * @param tower - The tower state
 */
export function pushTowerDown(tower: TowerState): void {
  for (const cat of tower.cats) {
    // Move cat body down by CAT_HEIGHT
    Matter.Body.setPosition(cat.body, {
      x: cat.body.position.x,
      y: cat.body.position.y + CAT_HEIGHT,
    });
  }
}

/**
 * Checks if the tower has reached the ground (game win for classic mode).
 * This happens when the bottom-most cat touches the ground.
 *
 * @param tower - The tower state
 * @param groundY - The Y position of the ground surface
 * @returns true if tower has reached the ground
 */
export function hasTowerReachedGround(
  tower: TowerState,
  groundY: number
): boolean {
  if (tower.cats.length === 0) {
    return false;
  }

  // Find the bottom-most cat
  let lowestY = -Infinity;
  for (const cat of tower.cats) {
    const catBottom = cat.body.position.y + CAT_HEIGHT / 2;
    if (catBottom > lowestY) {
      lowestY = catBottom;
    }
  }

  // Check if bottom cat is at or below ground level
  return lowestY >= groundY;
}

/**
 * Gets the previous (most recently dropped) cat for alignment checking.
 *
 * @param tower - The tower state
 * @returns The most recently added cat, or null if tower is empty
 */
export function getPreviousCat(tower: TowerState): CatEntity | null {
  if (tower.cats.length === 0) {
    return null;
  }
  // Return the second-to-last cat (the one before the newly dropped cat)
  // Or the last cat if we haven't added the new one yet
  return tower.cats[tower.cats.length - 1];
}

/**
 * Sets the pendulum preview cat.
 */
export function setPendulumCat(tower: TowerState, cat: CatEntity): void {
  tower.pendulumCat = cat;
}

/**
 * Updates tower state each frame for classic mode.
 * Monitors cat positions, stability, and expressions.
 *
 * @param tower - The tower state to update
 * @param deltaTimeMs - Time since last frame in milliseconds
 * @returns Object indicating if any significant state changes occurred
 */
export function updateTower(
  tower: TowerState,
  deltaTimeMs: number
): { gameOver: boolean; newlyStableCats: CatEntity[]; difficultyIncreased: boolean } {
  let gameOver = false;
  const newlyStableCats: CatEntity[] = [];
  let difficultyIncreased = false;

  // Check for fallen cats (off bottom, left, or right of screen)
  for (const cat of tower.cats) {
    if (isBodyOffScreen(cat.body)) {
      tower.hasFallenCat = true;
      gameOver = true;
      break;
    }
  }

  if (gameOver) {
    return { gameOver, newlyStableCats, difficultyIncreased };
  }

  // Update stability and expressions for each cat
  let anyWobbling = false;

  for (const cat of tower.cats) {
    const wasStable = isCatStable(cat);
    updateCatStability(cat, deltaTimeMs);
    const nowStable = isCatStable(cat);

    // Check for newly stable cat
    if (!wasStable && nowStable) {
      newlyStableCats.push(cat);
      tower.stackedCount++;

      // Check for difficulty threshold
      const newLevel = checkDifficultyThreshold(
        tower.stackedCount,
        tower.difficultyLevel,
        DIFFICULTY_THRESHOLDS
      );

      if (newLevel > tower.difficultyLevel) {
        tower.difficultyLevel = newLevel;
        difficultyIncreased = true;
      }
    }

    // Update expression based on stability
    const speed = getCatSpeed(cat);

    if (nowStable) {
      setCatExpression(cat, "happy");
    } else if (speed > WOBBLE_VELOCITY_THRESHOLD) {
      setCatExpression(cat, "worried");
      anyWobbling = true;
    } else if (cat.expression !== "surprised") {
      // Keep surprised during initial fall, then neutral while settling
      setCatExpression(cat, "neutral");
    }
  }

  tower.isWobbling = anyWobbling;

  return { gameOver, newlyStableCats, difficultyIncreased };
}

/**
 * Result of updating tower in "Reach the Top" mode.
 */
export interface ReachTheTopUpdateResult {
  /** Cats that fell off screen and were removed */
  fallenCats: CatEntity[];
  /** Cats that became sticky (static) this frame */
  newlyStickyCats: CatEntity[];
  /** Number of sticky cats in tower */
  stickyCatCount: number;
}

/**
 * Updates tower state for "Reach the Top" mode with sticky landing mechanics.
 * In this mode:
 * - Cats that fall off are removed but don't trigger game over
 * - Cats with sufficient overlap become static after settling
 * - Cats with insufficient overlap will slide/fall off
 *
 * @param tower - The tower state to update
 * @param physics - Physics engine for body management
 * @param deltaTimeMs - Time since last frame in milliseconds
 * @returns Object with update results
 */
export function updateTowerReachTheTop(
  tower: TowerState,
  physics: PhysicsEngine,
  deltaTimeMs: number
): ReachTheTopUpdateResult {
  const fallenCats: CatEntity[] = [];
  const newlyStickyCats: CatEntity[] = [];
  let stickyCatCount = 0;

  // Track cats to remove (fallen off screen)
  const catsToRemove: CatEntity[] = [];

  for (const cat of tower.cats) {
    // Check if cat fell off screen
    if (isBodyOffScreen(cat.body)) {
      catsToRemove.push(cat);
      fallenCats.push(cat);
      continue;
    }

    // Check if cat is already sticky
    if (isCatSticky(cat) || cat.body.isStatic) {
      stickyCatCount++;
      continue;
    }

    // Update stability tracking
    updateCatStability(cat, deltaTimeMs);

    // Check sticky condition
    const shouldBeSticky = checkStickyCondition(cat, physics);
    if (shouldBeSticky) {
      makeCatStatic(cat);
      newlyStickyCats.push(cat);
      stickyCatCount++;
      setCatExpression(cat, "happy");
    } else {
      // Update expression based on velocity
      const speed = getCatSpeed(cat);
      if (speed > WOBBLE_VELOCITY_THRESHOLD) {
        setCatExpression(cat, "worried");
      } else if (cat.expression !== "surprised") {
        setCatExpression(cat, "neutral");
      }
    }
  }

  // Remove fallen cats from tower and physics world
  for (const cat of catsToRemove) {
    removeCatFromTower(tower, cat, physics);
  }

  return {
    fallenCats,
    newlyStickyCats,
    stickyCatCount,
  };
}

/**
 * Removes a specific cat from the tower and physics world.
 * Used when cats fall off screen in "Reach the Top" mode.
 *
 * @param tower - The tower state
 * @param cat - The cat to remove
 * @param physics - Physics engine for body removal
 */
export function removeCatFromTower(
  tower: TowerState,
  cat: CatEntity,
  physics: PhysicsEngine
): void {
  // Remove from tower's cat array
  const index = tower.cats.indexOf(cat);
  if (index !== -1) {
    tower.cats.splice(index, 1);
  }

  // Remove from physics world
  removeBody(physics, cat.body);
}

/**
 * Handles collision event for sticky landing detection.
 * Should be called when a cat collides with ground or another cat.
 *
 * @param cat - The cat that landed
 * @param landedOn - The body the cat landed on
 */
export function handleCatLanding(cat: CatEntity, landedOn: Matter.Body): void {
  // Only process if cat is not already sticky/static
  if (cat.body.isStatic || isCatSticky(cat)) {
    return;
  }

  // Start settling timer for sticky transition
  startSettling(cat, landedOn);
}

/**
 * Finds a cat entity in the tower by its body.
 *
 * @param tower - The tower state
 * @param body - The Matter.js body to find
 * @returns The cat entity or null if not found
 */
export function findCatByBody(tower: TowerState, body: Matter.Body): CatEntity | null {
  return tower.cats.find((cat) => cat.body === body) ?? null;
}

/**
 * Gets the topmost stable cat in the tower.
 * Useful for calculating landing position for scoring.
 */
export function getTopmostStableCat(tower: TowerState): CatEntity | null {
  let topmostCat: CatEntity | null = null;
  let highestY = Infinity;

  for (const cat of tower.cats) {
    if (isCatStable(cat) && cat.body.position.y < highestY) {
      highestY = cat.body.position.y;
      topmostCat = cat;
    }
  }

  return topmostCat;
}

/**
 * Gets the topmost sticky cat in the tower.
 * Used for win detection in "Reach the Top" mode.
 */
export function getTopmostStickyCat(tower: TowerState): CatEntity | null {
  let topmostCat: CatEntity | null = null;
  let highestY = Infinity;

  for (const cat of tower.cats) {
    if ((isCatSticky(cat) || cat.body.isStatic) && cat.body.position.y < highestY) {
      highestY = cat.body.position.y;
      topmostCat = cat;
    }
  }

  return topmostCat;
}

/**
 * Gets the most recently added cat (likely still falling or settling).
 */
export function getMostRecentCat(tower: TowerState): CatEntity | null {
  if (tower.cats.length === 0) {
    return null;
  }
  return tower.cats[tower.cats.length - 1];
}

/**
 * Checks if the tower is stable (all cats are stable).
 */
export function isTowerStable(tower: TowerState): boolean {
  if (tower.cats.length === 0) {
    return true;
  }

  return tower.cats.every((cat) => isCatStable(cat));
}

/**
 * Gets the average velocity of cats in the tower.
 * Useful for determining overall tower stability.
 */
export function getTowerAverageVelocity(tower: TowerState): number {
  if (tower.cats.length === 0) {
    return 0;
  }

  const totalSpeed = tower.cats.reduce((sum, cat) => sum + getCatSpeed(cat), 0);
  return totalSpeed / tower.cats.length;
}

/**
 * Clears all cats from the tower.
 * Used when restarting the game.
 */
export function clearTower(tower: TowerState, physics: PhysicsEngine): void {
  for (const cat of tower.cats) {
    Matter.Composite.remove(physics.world, cat.body);
  }

  if (tower.pendulumCat) {
    // Pendulum cat might not be in physics world yet
    const bodies = Matter.Composite.allBodies(physics.world);
    if (bodies.includes(tower.pendulumCat.body)) {
      Matter.Composite.remove(physics.world, tower.pendulumCat.body);
    }
  }

  tower.cats = [];
  tower.pendulumCat = null;
  tower.stackedCount = 0;
  tower.isWobbling = false;
  tower.hasFallenCat = false;
  tower.difficultyLevel = 0;
}

/**
 * Gets the number of cats currently falling (not stable).
 */
export function getFallingCatCount(tower: TowerState): number {
  return tower.cats.filter((cat) => !isCatStable(cat)).length;
}

/**
 * Gets the number of sticky cats in the tower.
 */
export function getStickyCatCount(tower: TowerState): number {
  return tower.cats.filter((cat) => isCatSticky(cat) || cat.body.isStatic).length;
}

/**
 * Updates pendulum difficulty based on tower state.
 */
export function syncPendulumDifficulty(
  tower: TowerState,
  pendulum: PendulumState
): void {
  if (tower.difficultyLevel !== pendulum.difficultyLevel) {
    increasePendulumDifficulty(pendulum, tower.difficultyLevel);
  }
}

/**
 * Checks if the win condition is met in "Reach the Top" mode.
 * A win occurs when any stable (sticky/static) cat's top edge is at or above WIN_LINE_Y.
 *
 * Only sticky/static cats count for win detection - falling/unstable cats do not trigger a win.
 * This prevents false wins from cats that are still in motion.
 *
 * @param tower - The tower state to check
 * @returns true if the win condition is met, false otherwise
 */
export function checkWinCondition(tower: TowerState): boolean {
  // No cats means no win
  if (tower.cats.length === 0) {
    return false;
  }

  // Check each cat in the tower
  for (const cat of tower.cats) {
    // Only check sticky/static cats (stable cats that have settled in place)
    if (!isCatSticky(cat) && !cat.body.isStatic) {
      continue;
    }

    // Calculate the top edge of the cat
    // The body position is the center, so subtract half the height to get the top edge
    const catTopEdge = cat.body.position.y - CAT_HEIGHT / 2;

    // Win condition: cat's top edge is at or above the win line
    // (In canvas coordinates, lower Y values are higher on screen)
    if (catTopEdge <= WIN_LINE_Y) {
      return true;
    }
  }

  return false;
}
