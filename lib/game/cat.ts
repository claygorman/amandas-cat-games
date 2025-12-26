/**
 * Cat Entity System
 *
 * Manages cat entities for the Cat Stack game including:
 * - Cat body physics configuration
 * - Visual variants (orange tabby, gray, tuxedo, calico)
 * - Expression state management (neutral, surprised, happy, worried)
 * - Stability detection for scoring
 * - Squish animation on landing
 * - Sticky landing mechanics for "Reach the Top" mode
 */

import Matter from "matter-js";
import {
  CAT_FRICTION_CLASSIC,
  CAT_RESTITUTION_CLASSIC,
  CAT_FRICTION_AIR_CLASSIC,
  CAT_FRICTION_REACH_TOP,
  CAT_RESTITUTION_REACH_TOP,
  CAT_FRICTION_AIR_REACH_TOP,
  COLLISION_CATEGORY_CAT,
  COLLISION_CATEGORY_GROUND,
  STABILITY_VELOCITY_THRESHOLD,
  STABILITY_TIME_REQUIRED,
} from "@/lib/constants";
import { GameMode } from "./state";
import { PhysicsEngine } from "./physics";

// Cat body dimensions (base size)
export const CAT_WIDTH = 80;
export const CAT_HEIGHT = 60;

// Cat expression types
export type CatExpression = "neutral" | "surprised" | "happy" | "worried";

// Cat variant types
export type CatVariant = "orangeTabby" | "gray" | "tuxedo" | "calico";

// Color configuration for each variant
export interface CatVariantColors {
  bodyColor: string;
  accentColor: string;
  stripeColor?: string;
  noseColor?: string;
  patches?: { color: string; positions: { x: number; y: number }[] }[];
}

// Cat variant color definitions (pastel colors as per spec)
export const CAT_VARIANTS: Record<CatVariant, CatVariantColors> = {
  orangeTabby: {
    bodyColor: "#FFD4A3", // Soft orange
    accentColor: "#FFC078", // Cream/light orange for stripes
    stripeColor: "#E8B88A", // Slightly darker for tabby stripes
    noseColor: "#FFB6B6", // Pink nose
  },
  gray: {
    bodyColor: "#C4C4C4", // Soft gray
    accentColor: "#D8D8D8", // Lighter gray for accents
    stripeColor: "#A8A8A8", // Slightly darker gray
    noseColor: "#FFB6B6", // Pink nose
  },
  tuxedo: {
    bodyColor: "#4A4A4A", // Dark gray/black
    accentColor: "#FFFFFF", // White for tuxedo pattern
    noseColor: "#FFB6B6", // Pink nose
  },
  calico: {
    bodyColor: "#FFF5E6", // Cream base
    accentColor: "#FFD4A3", // Soft orange patches
    noseColor: "#FFB6B6", // Pink nose
    patches: [
      {
        color: "#FFD4A3", // Orange patches
        positions: [
          { x: -15, y: -10 },
          { x: 20, y: 5 },
        ],
      },
      {
        color: "#A8A8A8", // Gray patches
        positions: [
          { x: 10, y: -15 },
          { x: -20, y: 10 },
        ],
      },
    ],
  },
};

/**
 * Custom data stored on the cat body.
 * Extended with sticky landing state for "Reach the Top" mode.
 */
export interface CatBodyData {
  variant: CatVariant;
  expression: CatExpression;
  stableTime: number;
  squishFactor: number;
  squishVelocity: number;
  isLanding: boolean;
  /** Whether this cat has become "sticky" (static) in Reach the Top mode */
  isSticky: boolean;
  /** Timestamp when settling began (for sticky transition timing) */
  settlingStartTime: number | null;
  /** The body this cat landed on (for overlap calculation) */
  landedOnBody: Matter.Body | null;
}

// Cat entity interface
export interface CatEntity {
  body: Matter.Body;
  variant: CatVariant;
  expression: CatExpression;
  stableTime: number;
  squishFactor: number;
  squishVelocity: number;
  isLanding: boolean;
}

/**
 * Returns a random cat variant.
 */
export function getRandomCatVariant(): CatVariant {
  const variants: CatVariant[] = ["orangeTabby", "gray", "tuxedo", "calico"];
  const randomIndex = Math.floor(Math.random() * variants.length);
  return variants[randomIndex];
}

/**
 * Creates a cat entity with physics body and visual properties.
 * Physics properties vary by game mode:
 * - Classic: bouncier, can wobble (original gameplay)
 * - Reach the Top: heavy, no bounce (stable stacking)
 */
export function createCatEntity(
  physics: PhysicsEngine,
  x: number,
  y: number,
  variant?: CatVariant,
  gameMode: GameMode = "classic"
): CatEntity {
  const selectedVariant = variant ?? getRandomCatVariant();

  // Select physics properties based on game mode
  const isReachTop = gameMode === "reachTheTop";
  const friction = isReachTop ? CAT_FRICTION_REACH_TOP : CAT_FRICTION_CLASSIC;
  const restitution = isReachTop ? CAT_RESTITUTION_REACH_TOP : CAT_RESTITUTION_CLASSIC;
  const frictionAir = isReachTop ? CAT_FRICTION_AIR_REACH_TOP : CAT_FRICTION_AIR_CLASSIC;

  // Create the physics body with rounded corners
  const body = Matter.Bodies.rectangle(x, y, CAT_WIDTH, CAT_HEIGHT, {
    label: "cat",
    friction: friction,
    frictionStatic: friction * 1.2, // Higher static friction for stability
    frictionAir: frictionAir,
    restitution: restitution,
    chamfer: { radius: 10 }, // Rounded corners
    collisionFilter: {
      category: COLLISION_CATEGORY_CAT,
      mask: COLLISION_CATEGORY_CAT | COLLISION_CATEGORY_GROUND,
    },
  });

  // Store custom cat data on the body (including sticky landing state)
  const catData: CatBodyData = {
    variant: selectedVariant,
    expression: "neutral",
    stableTime: 0,
    squishFactor: 1,
    squishVelocity: 0,
    isLanding: false,
    // Sticky landing state (for Reach the Top mode)
    isSticky: false,
    settlingStartTime: null,
    landedOnBody: null,
  };

  (body as any).catData = catData;

  // Add body to physics world
  Matter.Composite.add(physics.world, body);

  // Classic mode: cats are static immediately (no gravity fall)
  // They stay at pendulum position and stack pushes down
  if (gameMode === "classic") {
    Matter.Body.setStatic(body, true);
    catData.isSticky = true;
  }

  // Create and return the cat entity
  const catEntity: CatEntity = {
    body,
    variant: selectedVariant,
    expression: "neutral",
    stableTime: 0,
    squishFactor: 1,
    squishVelocity: 0,
    isLanding: false,
  };

  return catEntity;
}

/**
 * Gets the current expression of a cat entity.
 */
export function getCatExpression(cat: CatEntity): CatExpression {
  return cat.expression;
}

/**
 * Sets the expression of a cat entity.
 */
export function setCatExpression(cat: CatEntity, expression: CatExpression): void {
  cat.expression = expression;
  const catData = (cat.body as any).catData as CatBodyData;
  if (catData) {
    catData.expression = expression;
  }
}

/**
 * Gets the velocity magnitude of a cat's body.
 */
export function getCatSpeed(cat: CatEntity): number {
  const velocity = cat.body.velocity;
  return Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
}

/**
 * Updates the stability tracking for a cat entity.
 * Call this each frame with deltaTime in milliseconds.
 */
export function updateCatStability(cat: CatEntity, deltaTimeMs: number): void {
  const speed = getCatSpeed(cat);

  if (speed < STABILITY_VELOCITY_THRESHOLD) {
    // Accumulate stable time
    cat.stableTime += deltaTimeMs;
    const catData = (cat.body as any).catData as CatBodyData;
    if (catData) {
      catData.stableTime = cat.stableTime;
    }
  } else {
    // Reset stable time if moving
    cat.stableTime = 0;
    const catData = (cat.body as any).catData as CatBodyData;
    if (catData) {
      catData.stableTime = 0;
    }
  }
}

/**
 * Checks if a cat has been stable for the required duration.
 */
export function isCatStable(cat: CatEntity): boolean {
  return cat.stableTime >= STABILITY_TIME_REQUIRED;
}

/**
 * Checks if a cat is sticky (has become static in Reach the Top mode).
 */
export function isCatSticky(cat: CatEntity): boolean {
  const catData = (cat.body as any).catData as CatBodyData;
  return catData?.isSticky ?? false;
}

/**
 * Updates the squish animation for a cat entity.
 * Call this each frame with deltaTime in milliseconds.
 */
export function updateCatSquish(cat: CatEntity, deltaTimeMs: number): void {
  if (!cat.isLanding) return;

  // Spring-like animation for squish
  const targetSquish = 1;
  const springStrength = 0.015;
  const dampening = 0.85;

  // Calculate spring force
  const diff = targetSquish - cat.squishFactor;
  cat.squishVelocity += diff * springStrength * deltaTimeMs;
  cat.squishVelocity *= dampening;
  cat.squishFactor += cat.squishVelocity;

  // Sync with body data
  const catData = (cat.body as any).catData as CatBodyData;
  if (catData) {
    catData.squishFactor = cat.squishFactor;
    catData.squishVelocity = cat.squishVelocity;
  }

  // Stop animation when settled
  if (Math.abs(cat.squishFactor - 1) < 0.01 && Math.abs(cat.squishVelocity) < 0.001) {
    cat.squishFactor = 1;
    cat.squishVelocity = 0;
    cat.isLanding = false;
    if (catData) {
      catData.squishFactor = 1;
      catData.squishVelocity = 0;
      catData.isLanding = false;
    }
  }
}

/**
 * Triggers the squish animation when a cat lands.
 * Call this when collision is detected.
 */
export function triggerCatSquish(cat: CatEntity, impactVelocity: number): void {
  // Calculate squish amount based on impact velocity
  const squishAmount = Math.min(0.3, Math.abs(impactVelocity) * 0.05);

  cat.squishFactor = 1 - squishAmount;
  cat.squishVelocity = 0;
  cat.isLanding = true;

  // Sync with body data
  const catData = (cat.body as any).catData as CatBodyData;
  if (catData) {
    catData.squishFactor = cat.squishFactor;
    catData.squishVelocity = 0;
    catData.isLanding = true;
  }
}

/**
 * Gets the cat entity data from a Matter.js body.
 * Useful for retrieving cat info in collision callbacks.
 */
export function getCatDataFromBody(body: Matter.Body): CatBodyData | null {
  const catData = (body as any).catData;
  return catData ?? null;
}

/**
 * Syncs the entity state from the body's custom data.
 * Useful after physics updates.
 */
export function syncCatEntityFromBody(cat: CatEntity): void {
  const catData = (cat.body as any).catData as CatBodyData;
  if (catData) {
    cat.variant = catData.variant;
    cat.expression = catData.expression;
    cat.stableTime = catData.stableTime;
    cat.squishFactor = catData.squishFactor;
    cat.squishVelocity = catData.squishVelocity;
    cat.isLanding = catData.isLanding;
  }
}

/**
 * Gets the body that this cat landed on.
 * Used for sticky landing calculations.
 */
export function getLandedOnBody(cat: CatEntity): Matter.Body | null {
  const catData = (cat.body as any).catData as CatBodyData;
  return catData?.landedOnBody ?? null;
}

/**
 * Gets the settling start time for a cat.
 * Used for sticky landing timing.
 */
export function getSettlingStartTime(cat: CatEntity): number | null {
  const catData = (cat.body as any).catData as CatBodyData;
  return catData?.settlingStartTime ?? null;
}
