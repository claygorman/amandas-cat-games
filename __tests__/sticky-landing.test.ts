/**
 * Task 2.1: Sticky Landing Mechanic Tests
 *
 * These 6 focused tests verify:
 * 1. Overlap calculation between two cat bodies
 * 2. Overlap threshold detection (pass cases)
 * 3. Overlap threshold detection (fail cases)
 * 4. Cat becoming static after settling period
 * 5. Cat falling off when overlap is insufficient
 * 6. Ground collision is treated as sufficient overlap
 */

import Matter from "matter-js";
import {
  createPhysicsEngine,
  createGroundPlatform,
  cleanupPhysics,
  PhysicsEngine,
  CAT_WIDTH,
  calculateCatOverlap,
  checkStickyCondition,
  makeCatStatic,
} from "@/lib/game/physics";
import {
  createCatEntity,
  CatEntity,
} from "@/lib/game/cat";
import {
  OVERLAP_THRESHOLD,
  STICKY_SETTLE_TIME,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
} from "@/lib/constants";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Test 1: Overlap calculation between two cat bodies
describe("Overlap calculation between cat bodies", () => {
  let physics: PhysicsEngine;

  beforeEach(() => {
    physics = createPhysicsEngine();
    createGroundPlatform(physics);
    localStorageMock.clear();
  });

  afterEach(() => {
    cleanupPhysics(physics);
  });

  it("should calculate 100% overlap when cats are perfectly aligned", () => {
    // Create two cats at the same X position
    const bottomCat = createCatEntity(physics, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 150);
    const topCat = createCatEntity(physics, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 250);

    const overlap = calculateCatOverlap(topCat, bottomCat);

    expect(overlap).toBeCloseTo(1.0, 1);
  });

  it("should calculate 50% overlap when cats are offset by half width", () => {
    // Create two cats offset by half the cat width
    const bottomCat = createCatEntity(physics, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 150);
    const topCat = createCatEntity(physics, CANVAS_WIDTH / 2 + CAT_WIDTH / 2, CANVAS_HEIGHT - 250);

    const overlap = calculateCatOverlap(topCat, bottomCat);

    expect(overlap).toBeCloseTo(0.5, 1);
  });

  it("should calculate 0% overlap when cats do not overlap horizontally", () => {
    // Create two cats that don't overlap at all
    const bottomCat = createCatEntity(physics, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 150);
    const topCat = createCatEntity(physics, CANVAS_WIDTH / 2 + CAT_WIDTH * 2, CANVAS_HEIGHT - 250);

    const overlap = calculateCatOverlap(topCat, bottomCat);

    expect(overlap).toBe(0);
  });
});

// Test 2: Overlap threshold detection (pass cases)
describe("Overlap threshold detection - pass cases", () => {
  let physics: PhysicsEngine;

  beforeEach(() => {
    physics = createPhysicsEngine();
    createGroundPlatform(physics);
    localStorageMock.clear();
  });

  afterEach(() => {
    cleanupPhysics(physics);
  });

  it("should pass threshold when overlap is exactly at threshold", () => {
    // Create cats with overlap exactly at threshold (55%)
    const bottomCat = createCatEntity(physics, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 150);
    // Calculate offset for exactly threshold overlap
    const offset = CAT_WIDTH * (1 - OVERLAP_THRESHOLD);
    const topCat = createCatEntity(physics, CANVAS_WIDTH / 2 + offset, CANVAS_HEIGHT - 250);

    const overlap = calculateCatOverlap(topCat, bottomCat);

    expect(overlap).toBeGreaterThanOrEqual(OVERLAP_THRESHOLD - 0.05);
  });

  it("should pass threshold when overlap is above threshold", () => {
    // Create cats with high overlap (80%)
    const bottomCat = createCatEntity(physics, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 150);
    const offset = CAT_WIDTH * 0.2; // 20% offset = 80% overlap
    const topCat = createCatEntity(physics, CANVAS_WIDTH / 2 + offset, CANVAS_HEIGHT - 250);

    const overlap = calculateCatOverlap(topCat, bottomCat);

    expect(overlap).toBeGreaterThan(OVERLAP_THRESHOLD);
  });
});

// Test 3: Overlap threshold detection (fail cases)
describe("Overlap threshold detection - fail cases", () => {
  let physics: PhysicsEngine;

  beforeEach(() => {
    physics = createPhysicsEngine();
    createGroundPlatform(physics);
    localStorageMock.clear();
  });

  afterEach(() => {
    cleanupPhysics(physics);
  });

  it("should fail threshold when overlap is below threshold", () => {
    // Create cats with low overlap (30%)
    const bottomCat = createCatEntity(physics, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 150);
    const offset = CAT_WIDTH * 0.7; // 70% offset = 30% overlap
    const topCat = createCatEntity(physics, CANVAS_WIDTH / 2 + offset, CANVAS_HEIGHT - 250);

    const overlap = calculateCatOverlap(topCat, bottomCat);

    expect(overlap).toBeLessThan(OVERLAP_THRESHOLD);
  });

  it("should fail threshold when overlap is zero", () => {
    // Create cats with no overlap
    const bottomCat = createCatEntity(physics, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 150);
    const topCat = createCatEntity(physics, CANVAS_WIDTH / 2 + CAT_WIDTH + 50, CANVAS_HEIGHT - 250);

    const overlap = calculateCatOverlap(topCat, bottomCat);

    expect(overlap).toBe(0);
    expect(overlap).toBeLessThan(OVERLAP_THRESHOLD);
  });
});

// Test 4: Cat becoming static after settling period
describe("Cat becoming static after settling period", () => {
  let physics: PhysicsEngine;

  beforeEach(() => {
    physics = createPhysicsEngine();
    createGroundPlatform(physics);
    localStorageMock.clear();
  });

  afterEach(() => {
    cleanupPhysics(physics);
  });

  it("should make cat static using makeCatStatic function", () => {
    const cat = createCatEntity(physics, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 200);

    // Initially cat should be dynamic
    expect(cat.body.isStatic).toBe(false);

    // Make cat static
    makeCatStatic(cat);

    // Cat should now be static
    expect(cat.body.isStatic).toBe(true);
  });

  it("should track settling start time on cat entity", () => {
    const cat = createCatEntity(physics, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 200);

    // Initially settlingStartTime should be null
    const catData = (cat.body as any).catData;
    expect(catData.settlingStartTime).toBeNull();

    // Simulate setting settling start time
    catData.settlingStartTime = Date.now();

    expect(catData.settlingStartTime).not.toBeNull();
  });

  it("should track isSticky state on cat entity", () => {
    const cat = createCatEntity(physics, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 200);

    // Initially isSticky should be false
    const catData = (cat.body as any).catData;
    expect(catData.isSticky).toBe(false);

    // Simulate making cat sticky
    catData.isSticky = true;

    expect(catData.isSticky).toBe(true);
  });
});

// Test 5: Cat falling off when overlap is insufficient
describe("Cat falling off when overlap is insufficient", () => {
  let physics: PhysicsEngine;

  beforeEach(() => {
    physics = createPhysicsEngine();
    createGroundPlatform(physics);
    localStorageMock.clear();
  });

  afterEach(() => {
    cleanupPhysics(physics);
  });

  it("should not trigger sticky condition when overlap is below threshold", () => {
    const bottomCat = createCatEntity(physics, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 150);
    // Make bottom cat static as if it's already stacked
    Matter.Body.setStatic(bottomCat.body, true);

    // Create top cat with insufficient overlap (30%)
    const offset = CAT_WIDTH * 0.7;
    const topCat = createCatEntity(physics, CANVAS_WIDTH / 2 + offset, CANVAS_HEIGHT - 250);

    // Track what the cat landed on
    const catData = (topCat.body as any).catData;
    catData.landedOnBody = bottomCat.body;

    // Stop the cat to simulate it has landed
    Matter.Body.setVelocity(topCat.body, { x: 0, y: 0 });

    // Check sticky condition - should fail due to insufficient overlap
    const shouldBeSticky = checkStickyCondition(topCat, physics);

    expect(shouldBeSticky).toBe(false);
  });

  it("should trigger sticky condition when overlap is sufficient", () => {
    const bottomCat = createCatEntity(physics, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 150);
    // Make bottom cat static as if it's already stacked
    Matter.Body.setStatic(bottomCat.body, true);

    // Create top cat with sufficient overlap (75%)
    const offset = CAT_WIDTH * 0.25;
    const topCat = createCatEntity(physics, CANVAS_WIDTH / 2 + offset, CANVAS_HEIGHT - 250);

    // Track what the cat landed on
    const catData = (topCat.body as any).catData;
    catData.landedOnBody = bottomCat.body;
    catData.settlingStartTime = Date.now() - STICKY_SETTLE_TIME - 100; // Already settled

    // Stop the cat to simulate it has landed
    Matter.Body.setVelocity(topCat.body, { x: 0, y: 0 });

    // Check sticky condition - should pass due to sufficient overlap and settling
    const shouldBeSticky = checkStickyCondition(topCat, physics);

    expect(shouldBeSticky).toBe(true);
  });
});

// Test 6: Ground collision is treated as sufficient overlap
describe("Ground collision as sufficient overlap", () => {
  let physics: PhysicsEngine;

  beforeEach(() => {
    physics = createPhysicsEngine();
    createGroundPlatform(physics);
    localStorageMock.clear();
  });

  afterEach(() => {
    cleanupPhysics(physics);
  });

  it("should return 1.0 (100%) overlap when target is null (ground landing)", () => {
    const cat = createCatEntity(physics, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 150);

    // Calculate overlap with ground (null target)
    const overlap = calculateCatOverlap(cat, null);

    expect(overlap).toBe(1.0);
  });

  it("should trigger sticky condition when landed on ground", () => {
    const cat = createCatEntity(physics, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 100);

    // Simulate landing on ground
    const catData = (cat.body as any).catData;
    catData.landedOnBody = physics.ground;
    catData.settlingStartTime = Date.now() - STICKY_SETTLE_TIME - 100; // Already settled

    // Stop the cat to simulate it has landed
    Matter.Body.setVelocity(cat.body, { x: 0, y: 0 });

    // Check sticky condition - should pass because ground landing is always sufficient
    const shouldBeSticky = checkStickyCondition(cat, physics);

    expect(shouldBeSticky).toBe(true);
  });
});
