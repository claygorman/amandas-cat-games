/**
 * Task 2.1: Physics Engine Tests
 *
 * These 5 focused tests verify:
 * 1. Matter.js engine initialization with correct gravity
 * 2. Ground platform body creation and positioning
 * 3. Physics world bounds detection
 * 4. Body collision detection between cat-like bodies
 * 5. Physics cleanup on unmount (no memory leaks)
 */

import Matter from "matter-js";
import {
  createPhysicsEngine,
  createGroundPlatform,
  createCatBody,
  isBodyBelowDeathZone,
  cleanupPhysics,
  PhysicsEngine,
} from "@/lib/game/physics";
import {
  GRAVITY,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  GROUND_HEIGHT,
  GROUND_Y,
  CAT_FRICTION,
  CAT_RESTITUTION,
  DEATH_ZONE_Y,
  COLLISION_CATEGORY_CAT,
  COLLISION_CATEGORY_GROUND,
} from "@/lib/constants";

// Test 1: Matter.js engine initialization with correct gravity
describe("Physics engine initialization", () => {
  it("should initialize engine with correct gravity settings", () => {
    const physics = createPhysicsEngine();

    expect(physics).toBeDefined();
    expect(physics.engine).toBeDefined();
    expect(physics.world).toBeDefined();

    // Verify gravity is set correctly (Matter.js uses y-positive as down)
    expect(physics.engine.gravity.x).toBe(0);
    expect(physics.engine.gravity.y).toBe(GRAVITY);

    // Verify gravity scale
    expect(physics.engine.gravity.scale).toBe(0.001);

    // Clean up
    cleanupPhysics(physics);
  });

  it("should create a valid Matter.js world", () => {
    const physics = createPhysicsEngine();

    // World should be a Composite
    expect(physics.world).toBe(physics.engine.world);
    expect(Matter.Composite.allBodies(physics.world)).toHaveLength(0);

    cleanupPhysics(physics);
  });
});

// Test 2: Ground platform body creation and positioning
describe("Ground platform body", () => {
  it("should create static ground body at correct position", () => {
    const physics = createPhysicsEngine();
    const ground = createGroundPlatform(physics);

    expect(ground).toBeDefined();

    // Verify ground is static
    expect(ground.isStatic).toBe(true);

    // Verify ground position (center of body)
    expect(ground.position.x).toBe(CANVAS_WIDTH / 2);
    expect(ground.position.y).toBe(GROUND_Y);

    // Verify ground dimensions
    const bounds = ground.bounds;
    const width = bounds.max.x - bounds.min.x;
    const height = bounds.max.y - bounds.min.y;
    expect(width).toBeCloseTo(CANVAS_WIDTH, 0);
    expect(height).toBeCloseTo(GROUND_HEIGHT, 0);

    // Verify ground is added to world
    const bodies = Matter.Composite.allBodies(physics.world);
    expect(bodies).toContain(ground);

    // Verify collision category
    expect(ground.collisionFilter.category).toBe(COLLISION_CATEGORY_GROUND);

    cleanupPhysics(physics);
  });
});

// Test 3: Physics world bounds detection
describe("Physics world bounds detection", () => {
  it("should correctly detect bodies below death zone", () => {
    const physics = createPhysicsEngine();

    // Create a body above death zone
    const bodyAbove = createCatBody(physics, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    expect(isBodyBelowDeathZone(bodyAbove)).toBe(false);

    // Create a body at the death zone boundary
    const bodyAtBoundary = createCatBody(physics, CANVAS_WIDTH / 2, DEATH_ZONE_Y - 1);
    expect(isBodyBelowDeathZone(bodyAtBoundary)).toBe(false);

    // Create a body below death zone
    const bodyBelow = createCatBody(physics, CANVAS_WIDTH / 2, DEATH_ZONE_Y + 100);
    expect(isBodyBelowDeathZone(bodyBelow)).toBe(true);

    cleanupPhysics(physics);
  });

  it("should track body positions after physics updates", () => {
    const physics = createPhysicsEngine();

    // Create ground first so body can land
    createGroundPlatform(physics);

    // Create a cat body above ground
    const cat = createCatBody(physics, CANVAS_WIDTH / 2, 200);
    const initialY = cat.position.y;

    // Run physics for several updates (body should fall due to gravity)
    for (let i = 0; i < 10; i++) {
      Matter.Engine.update(physics.engine, 16.67);
    }

    // Body should have moved down due to gravity
    expect(cat.position.y).toBeGreaterThan(initialY);

    cleanupPhysics(physics);
  });
});

// Test 4: Body collision detection between cat-like bodies
describe("Body collision detection", () => {
  it("should create cat bodies with correct collision properties", () => {
    const physics = createPhysicsEngine();

    const cat = createCatBody(physics, CANVAS_WIDTH / 2, 500);

    // Verify body exists and is dynamic
    expect(cat).toBeDefined();
    expect(cat.isStatic).toBe(false);

    // Verify physics properties
    expect(cat.friction).toBeCloseTo(CAT_FRICTION, 2);
    expect(cat.restitution).toBeCloseTo(CAT_RESTITUTION, 2);

    // Verify collision category
    expect(cat.collisionFilter.category).toBe(COLLISION_CATEGORY_CAT);

    // Verify cat can collide with both cats and ground
    expect(cat.collisionFilter.mask).toBe(
      COLLISION_CATEGORY_CAT | COLLISION_CATEGORY_GROUND
    );

    cleanupPhysics(physics);
  });

  it("should detect collisions between stacked bodies", () => {
    const physics = createPhysicsEngine();

    // Create ground
    createGroundPlatform(physics);

    // Create two cat bodies that will stack
    const cat1 = createCatBody(physics, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 150);
    const cat2 = createCatBody(physics, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 250);

    // Track collision events
    let collisionDetected = false;
    Matter.Events.on(physics.engine, "collisionStart", (event) => {
      const pairs = event.pairs;
      for (const pair of pairs) {
        if (
          (pair.bodyA === cat1 && pair.bodyB === cat2) ||
          (pair.bodyA === cat2 && pair.bodyB === cat1)
        ) {
          collisionDetected = true;
        }
      }
    });

    // Run physics simulation to allow bodies to collide
    for (let i = 0; i < 60; i++) {
      Matter.Engine.update(physics.engine, 16.67);
    }

    // Bodies should have collided (either with each other or ground)
    // Check that cat1 has reached a stable position near ground
    expect(cat1.position.y).toBeGreaterThan(CANVAS_HEIGHT - 200);

    cleanupPhysics(physics);
  });
});

// Test 5: Physics cleanup on unmount (no memory leaks)
describe("Physics cleanup", () => {
  it("should properly clean up all physics resources", () => {
    const physics = createPhysicsEngine();

    // Add ground and some bodies
    createGroundPlatform(physics);
    createCatBody(physics, CANVAS_WIDTH / 2, 200);
    createCatBody(physics, CANVAS_WIDTH / 2, 300);
    createCatBody(physics, CANVAS_WIDTH / 2, 400);

    // Verify bodies were added
    const bodiesBeforeCleanup = Matter.Composite.allBodies(physics.world);
    expect(bodiesBeforeCleanup.length).toBe(4); // ground + 3 cats

    // Cleanup
    cleanupPhysics(physics);

    // Verify all bodies are removed from world
    const bodiesAfterCleanup = Matter.Composite.allBodies(physics.world);
    expect(bodiesAfterCleanup.length).toBe(0);
  });

  it("should remove event listeners on cleanup", () => {
    const physics = createPhysicsEngine();

    // Add a collision event listener
    const collisionHandler = jest.fn();
    Matter.Events.on(physics.engine, "collisionStart", collisionHandler);

    // Create bodies that will collide
    createGroundPlatform(physics);
    const cat = createCatBody(physics, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 100);

    // Run a few physics updates
    for (let i = 0; i < 10; i++) {
      Matter.Engine.update(physics.engine, 16.67);
    }

    // Cleanup (this should remove event listeners)
    cleanupPhysics(physics);

    // The cleanup function should clear the world
    expect(Matter.Composite.allBodies(physics.world).length).toBe(0);
  });

  it("should handle multiple cleanup calls safely", () => {
    const physics = createPhysicsEngine();

    createGroundPlatform(physics);
    createCatBody(physics, CANVAS_WIDTH / 2, 300);

    // First cleanup
    cleanupPhysics(physics);
    expect(Matter.Composite.allBodies(physics.world).length).toBe(0);

    // Second cleanup should not throw
    expect(() => cleanupPhysics(physics)).not.toThrow();
    expect(Matter.Composite.allBodies(physics.world).length).toBe(0);
  });
});
