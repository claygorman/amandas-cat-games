/**
 * Physics Engine Utilities
 *
 * Matter.js integration for Cat Stack game physics.
 * Provides engine initialization, body creation, and cleanup utilities.
 * Also includes sticky landing mechanics for the "Reach the Top" game mode.
 */

import Matter from "matter-js";
import {
  GRAVITY,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  GROUND_HEIGHT,
  GROUND_Y,
  CAT_FRICTION,
  CAT_RESTITUTION,
  CAT_FRICTION_AIR,
  COLLISION_CATEGORY_CAT,
  COLLISION_CATEGORY_GROUND,
  DEATH_ZONE_Y,
  OVERLAP_THRESHOLD,
  STICKY_SETTLE_TIME,
  STABILITY_VELOCITY_THRESHOLD,
} from "@/lib/constants";
import { CatEntity, CatBodyData } from "./cat";

// Type for the physics engine wrapper
export interface PhysicsEngine {
  engine: Matter.Engine;
  world: Matter.World;
  ground: Matter.Body | null;
}

// Cat body dimensions (base size)
export const CAT_WIDTH = 80;
export const CAT_HEIGHT = 60;

/**
 * Creates and initializes the Matter.js physics engine with correct gravity settings.
 * The engine is configured for a portrait-oriented game with gravity pulling down.
 */
export function createPhysicsEngine(): PhysicsEngine {
  // Create the physics engine
  const engine = Matter.Engine.create({
    gravity: {
      x: 0,
      y: GRAVITY,
      scale: 0.001, // Default Matter.js gravity scale
    },
    // Increase solver iterations for more stable stacking
    // Prevents bodies from "squeezing out" of stacks under pressure
    positionIterations: 10, // Default is 6
    velocityIterations: 8,  // Default is 4
  });

  return {
    engine,
    world: engine.world,
    ground: null,
  };
}

/**
 * Creates the static ground platform at the bottom of the play area.
 * The ground is styled as a pastel-colored rectangle and positioned
 * correctly relative to the canvas dimensions.
 */
export function createGroundPlatform(physics: PhysicsEngine): Matter.Body {
  const ground = Matter.Bodies.rectangle(
    CANVAS_WIDTH / 2, // Center X
    GROUND_Y, // Center Y (near bottom)
    CANVAS_WIDTH, // Full width
    GROUND_HEIGHT, // Height
    {
      isStatic: true,
      label: "ground",
      friction: 1.0, // High friction for stable stacking
      restitution: 0.1, // Slight bounce
      collisionFilter: {
        category: COLLISION_CATEGORY_GROUND,
        mask: COLLISION_CATEGORY_CAT, // Only collide with cats
      },
      render: {
        fillStyle: "#B8E6B8", // Pastel mint green
      },
    }
  );

  // Add to world
  Matter.Composite.add(physics.world, ground);
  physics.ground = ground;

  return ground;
}

/**
 * Creates a cat body with appropriate physics properties.
 * Uses a rectangular shape with rounded corners (chamfer) for cat-like appearance.
 */
export function createCatBody(
  physics: PhysicsEngine,
  x: number,
  y: number
): Matter.Body {
  const cat = Matter.Bodies.rectangle(x, y, CAT_WIDTH, CAT_HEIGHT, {
    label: "cat",
    friction: CAT_FRICTION,
    frictionStatic: CAT_FRICTION * 1.2, // Higher static friction for stability
    frictionAir: CAT_FRICTION_AIR,      // Air resistance for controlled falling
    restitution: CAT_RESTITUTION,       // Almost no bounce - cats feel heavy
    chamfer: { radius: 10 }, // Rounded corners
    collisionFilter: {
      category: COLLISION_CATEGORY_CAT,
      mask: COLLISION_CATEGORY_CAT | COLLISION_CATEGORY_GROUND, // Collide with cats and ground
    },
    render: {
      fillStyle: "#FFD4A3", // Pastel orange (default cat color)
    },
  });

  // Add to world
  Matter.Composite.add(physics.world, cat);

  return cat;
}

/**
 * Checks if a body is below the death zone threshold.
 * Used to detect when cats have fallen off the stack.
 */
export function isBodyBelowDeathZone(body: Matter.Body): boolean {
  return body.position.y > DEATH_ZONE_Y;
}

/**
 * Checks if a body has fallen off the screen (below, left, or right).
 */
export function isBodyOffScreen(body: Matter.Body): boolean {
  const margin = 100; // Allow some margin outside visible area
  return (
    body.position.y > DEATH_ZONE_Y ||
    body.position.x < -margin ||
    body.position.x > CANVAS_WIDTH + margin
  );
}

/**
 * Updates the physics engine for one frame.
 * Should be called in sync with the render loop.
 *
 * @param physics - The physics engine instance
 * @param deltaTime - Time since last frame in milliseconds
 */
export function updatePhysics(
  physics: PhysicsEngine,
  deltaTime: number
): void {
  // Use fixed timestep for consistent physics simulation
  // Cap delta time to prevent physics explosion on lag spikes
  const cappedDelta = Math.min(deltaTime, 33.33); // Max ~30 FPS worth of time
  Matter.Engine.update(physics.engine, cappedDelta);
}

/**
 * Gets all cat bodies currently in the physics world.
 */
export function getAllCatBodies(physics: PhysicsEngine): Matter.Body[] {
  return Matter.Composite.allBodies(physics.world).filter(
    (body) => body.label === "cat"
  );
}

/**
 * Removes a specific body from the physics world.
 */
export function removeBody(physics: PhysicsEngine, body: Matter.Body): void {
  Matter.Composite.remove(physics.world, body);
}

/**
 * Clears all cat bodies from the world (keeps ground).
 * Useful for game restart.
 */
export function clearCatBodies(physics: PhysicsEngine): void {
  const cats = getAllCatBodies(physics);
  for (const cat of cats) {
    Matter.Composite.remove(physics.world, cat);
  }
}

/**
 * Cleans up all physics resources.
 * Should be called on component unmount to prevent memory leaks.
 * - Clears all bodies from the world
 * - Clears all event listeners
 * - Disposes of the engine
 */
export function cleanupPhysics(physics: PhysicsEngine): void {
  // Remove all bodies from the world
  Matter.Composite.clear(physics.world, false);

  // Clear the engine (this also clears the world)
  Matter.Engine.clear(physics.engine);

  // Reset ground reference
  physics.ground = null;
}

/**
 * Checks if a body is considered "stable" (low velocity).
 * A body is stable when its velocity magnitude is below the threshold.
 */
export function isBodyStable(
  body: Matter.Body,
  velocityThreshold: number = 0.5
): boolean {
  const velocity = body.velocity;
  const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
  return speed < velocityThreshold;
}

/**
 * Gets the velocity magnitude of a body.
 */
export function getBodySpeed(body: Matter.Body): number {
  const velocity = body.velocity;
  return Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
}

// ========================================
// Sticky Landing Mechanics (Reach the Top Mode)
// ========================================

/**
 * Calculates the horizontal overlap percentage between two cat bodies.
 * Used to determine if a landing cat has sufficient overlap to "stick" in place.
 *
 * @param cat - The cat entity whose overlap we're calculating
 * @param targetCat - The cat entity the first cat landed on, or null for ground landing
 * @returns Overlap percentage as a value between 0 and 1 (1 = 100% overlap)
 */
export function calculateCatOverlap(
  cat: CatEntity,
  targetCat: CatEntity | null
): number {
  // Ground landing is always treated as sufficient overlap (100%)
  if (targetCat === null) {
    return 1.0;
  }

  const catX = cat.body.position.x;
  const targetX = targetCat.body.position.x;

  // Calculate the horizontal extent of each cat
  const catLeft = catX - CAT_WIDTH / 2;
  const catRight = catX + CAT_WIDTH / 2;
  const targetLeft = targetX - CAT_WIDTH / 2;
  const targetRight = targetX + CAT_WIDTH / 2;

  // Calculate overlap region
  const overlapLeft = Math.max(catLeft, targetLeft);
  const overlapRight = Math.min(catRight, targetRight);

  // Calculate overlap width
  const overlapWidth = Math.max(0, overlapRight - overlapLeft);

  // Return overlap as percentage of cat width
  return overlapWidth / CAT_WIDTH;
}

/**
 * Checks if a cat meets the conditions to become "sticky" (static).
 * A cat becomes sticky when:
 * 1. It has sufficient horizontal overlap with what it landed on
 * 2. It has been settling for the required time period
 * 3. Its velocity is low enough (stable)
 *
 * @param cat - The cat entity to check
 * @param physics - The physics engine for ground reference
 * @returns true if the cat should become static
 */
export function checkStickyCondition(
  cat: CatEntity,
  physics: PhysicsEngine
): boolean {
  const catData = (cat.body as any).catData as CatBodyData | undefined;

  // If no cat data, can't check sticky condition
  if (!catData) {
    return false;
  }

  // Check if cat is already static/sticky
  if (cat.body.isStatic || catData.isSticky) {
    return false;
  }

  // Check if cat has landed on something
  const landedOnBody = catData.landedOnBody;
  if (!landedOnBody) {
    return false;
  }

  // Check velocity - must be stable (low velocity)
  const speed = getBodySpeed(cat.body);
  if (speed > STABILITY_VELOCITY_THRESHOLD) {
    return false;
  }

  // Check settling time
  const settlingStartTime = catData.settlingStartTime;
  if (settlingStartTime === null) {
    return false;
  }

  const settlingDuration = Date.now() - settlingStartTime;
  if (settlingDuration < STICKY_SETTLE_TIME) {
    return false;
  }

  // Calculate overlap
  let overlap: number;

  if (landedOnBody === physics.ground || landedOnBody.label === "ground") {
    // Ground landing - always sufficient overlap
    overlap = 1.0;
  } else {
    // Cat-to-cat landing - check overlap with target cat
    // Find the target cat entity from the body
    const targetCatData = (landedOnBody as any).catData as CatBodyData | undefined;
    if (!targetCatData) {
      // If no cat data on target, treat as unknown and allow
      overlap = 1.0;
    } else {
      // Create a temporary entity-like object for overlap calculation
      const targetEntity: CatEntity = {
        body: landedOnBody,
        variant: targetCatData.variant,
        expression: targetCatData.expression,
        stableTime: targetCatData.stableTime,
        squishFactor: targetCatData.squishFactor,
        squishVelocity: targetCatData.squishVelocity,
        isLanding: targetCatData.isLanding,
      };
      overlap = calculateCatOverlap(cat, targetEntity);
    }
  }

  // Check if overlap meets threshold
  return overlap >= OVERLAP_THRESHOLD;
}

/**
 * Makes a cat entity static, preventing further physics movement.
 * This is called when a cat has met the sticky conditions.
 * The cat's rotation is reset to 0 (flat) for stable stacking.
 *
 * @param cat - The cat entity to make static
 */
export function makeCatStatic(cat: CatEntity): void {
  // Reset rotation to 0 (flat) before making static for stable stacking
  Matter.Body.setAngle(cat.body, 0);

  // Use Matter.js to make the body static
  Matter.Body.setStatic(cat.body, true);

  // Update cat data to reflect sticky state
  const catData = (cat.body as any).catData as CatBodyData | undefined;
  if (catData) {
    catData.isSticky = true;
  }
}

/**
 * Starts the settling timer for a cat that has just landed.
 * Called when a collision is detected between a falling cat and another body.
 *
 * @param cat - The cat entity that landed
 * @param landedOn - The body the cat landed on
 */
export function startSettling(cat: CatEntity, landedOn: Matter.Body): void {
  const catData = (cat.body as any).catData as CatBodyData | undefined;
  if (catData && catData.settlingStartTime === null) {
    catData.settlingStartTime = Date.now();
    catData.landedOnBody = landedOn;
  }
}

/**
 * Resets the settling state for a cat that has started moving again.
 *
 * @param cat - The cat entity to reset settling for
 */
export function resetSettling(cat: CatEntity): void {
  const catData = (cat.body as any).catData as CatBodyData | undefined;
  if (catData) {
    catData.settlingStartTime = null;
    catData.landedOnBody = null;
  }
}
