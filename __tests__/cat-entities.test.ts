/**
 * Task 3.1: Cat Entity Tests
 *
 * These 6 focused tests verify:
 * 1. Cat body creation with correct physics properties
 * 2. Cat variant random selection (4 variants)
 * 3. Cat expression state management (neutral, surprised, happy, worried)
 * 4. Cat rendering with correct visual style
 * 5. Cat physics properties (friction 0.8-0.9, restitution 0.1-0.2)
 * 6. Cat stability detection (velocity below threshold for 2 seconds)
 */

import Matter from "matter-js";
import {
  createCatEntity,
  getRandomCatVariant,
  CAT_VARIANTS,
  CatVariant,
  CatExpression,
  getCatExpression,
  setCatExpression,
  CatEntity,
  updateCatStability,
  isCatStable,
} from "@/lib/game/cat";
import {
  renderCat,
  drawCatBody,
  drawCatEars,
  drawCatFace,
} from "@/lib/game/renderer";
import {
  createPhysicsEngine,
  cleanupPhysics,
  PhysicsEngine,
} from "@/lib/game/physics";
import {
  CAT_FRICTION,
  CAT_RESTITUTION,
  CANVAS_WIDTH,
  STABILITY_VELOCITY_THRESHOLD,
  STABILITY_TIME_REQUIRED,
} from "@/lib/constants";

// Test 1: Cat body creation with correct physics properties
describe("Cat body creation", () => {
  let physics: PhysicsEngine;

  beforeEach(() => {
    physics = createPhysicsEngine();
  });

  afterEach(() => {
    cleanupPhysics(physics);
  });

  it("should create cat body with correct dimensions and properties", () => {
    const cat = createCatEntity(physics, CANVAS_WIDTH / 2, 500);

    expect(cat).toBeDefined();
    expect(cat.body).toBeDefined();
    expect(cat.variant).toBeDefined();
    expect(cat.expression).toBe("neutral");

    // Verify body exists in physics world
    const bodies = Matter.Composite.allBodies(physics.world);
    expect(bodies).toContain(cat.body);

    // Verify body label
    expect(cat.body.label).toBe("cat");

    // Verify body is dynamic (not static)
    expect(cat.body.isStatic).toBe(false);

    // Verify body has chamfer (rounded corners)
    expect(cat.body.chamfer).toBeDefined();
  });

  it("should store custom cat data on the body", () => {
    const cat = createCatEntity(physics, CANVAS_WIDTH / 2, 500);

    // Verify custom data is stored on body
    const customData = (cat.body as any).catData;
    expect(customData).toBeDefined();
    expect(customData.variant).toBeDefined();
    expect(customData.expression).toBe("neutral");
    expect(customData.stableTime).toBe(0);
    expect(customData.squishFactor).toBe(1);
  });
});

// Test 2: Cat variant random selection (4 variants)
describe("Cat variant selection", () => {
  it("should have exactly 4 cat variants defined", () => {
    expect(Object.keys(CAT_VARIANTS)).toHaveLength(4);
    expect(CAT_VARIANTS.orangeTabby).toBeDefined();
    expect(CAT_VARIANTS.gray).toBeDefined();
    expect(CAT_VARIANTS.tuxedo).toBeDefined();
    expect(CAT_VARIANTS.calico).toBeDefined();
  });

  it("should return a valid variant from getRandomCatVariant", () => {
    const validVariants: CatVariant[] = [
      "orangeTabby",
      "gray",
      "tuxedo",
      "calico",
    ];

    // Run multiple times to test randomness
    for (let i = 0; i < 20; i++) {
      const variant = getRandomCatVariant();
      expect(validVariants).toContain(variant);
    }
  });

  it("should have correct color properties for each variant", () => {
    // Orange Tabby
    expect(CAT_VARIANTS.orangeTabby.bodyColor).toBeDefined();
    expect(CAT_VARIANTS.orangeTabby.accentColor).toBeDefined();

    // Gray
    expect(CAT_VARIANTS.gray.bodyColor).toBeDefined();
    expect(CAT_VARIANTS.gray.accentColor).toBeDefined();

    // Tuxedo
    expect(CAT_VARIANTS.tuxedo.bodyColor).toBeDefined();
    expect(CAT_VARIANTS.tuxedo.accentColor).toBeDefined();
    expect(CAT_VARIANTS.tuxedo.noseColor).toBeDefined();

    // Calico
    expect(CAT_VARIANTS.calico.bodyColor).toBeDefined();
    expect(CAT_VARIANTS.calico.patches).toBeDefined();
  });
});

// Test 3: Cat expression state management
describe("Cat expression state management", () => {
  let physics: PhysicsEngine;
  let cat: CatEntity;

  beforeEach(() => {
    physics = createPhysicsEngine();
    cat = createCatEntity(physics, CANVAS_WIDTH / 2, 500);
  });

  afterEach(() => {
    cleanupPhysics(physics);
  });

  it("should initialize with neutral expression", () => {
    expect(cat.expression).toBe("neutral");
    expect(getCatExpression(cat)).toBe("neutral");
  });

  it("should update expression state correctly", () => {
    const expressions: CatExpression[] = [
      "neutral",
      "surprised",
      "happy",
      "worried",
    ];

    for (const expr of expressions) {
      setCatExpression(cat, expr);
      expect(getCatExpression(cat)).toBe(expr);
      expect(cat.expression).toBe(expr);
    }
  });

  it("should persist expression in body custom data", () => {
    setCatExpression(cat, "surprised");
    const customData = (cat.body as any).catData;
    expect(customData.expression).toBe("surprised");

    setCatExpression(cat, "happy");
    expect(customData.expression).toBe("happy");
  });
});

// Test 4: Cat rendering with correct visual style
describe("Cat rendering", () => {
  let mockCtx: CanvasRenderingContext2D;
  let physics: PhysicsEngine;

  beforeEach(() => {
    physics = createPhysicsEngine();

    // Create a mock canvas context
    mockCtx = {
      save: jest.fn(),
      restore: jest.fn(),
      translate: jest.fn(),
      rotate: jest.fn(),
      scale: jest.fn(),
      beginPath: jest.fn(),
      closePath: jest.fn(),
      fill: jest.fn(),
      stroke: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      arc: jest.fn(),
      ellipse: jest.fn(),
      quadraticCurveTo: jest.fn(),
      bezierCurveTo: jest.fn(),
      roundRect: jest.fn(),
      fillRect: jest.fn(),
      fillStyle: "",
      strokeStyle: "",
      lineWidth: 1,
      lineCap: "butt",
    } as unknown as CanvasRenderingContext2D;
  });

  afterEach(() => {
    cleanupPhysics(physics);
  });

  it("should call correct drawing methods for cat body", () => {
    const cat = createCatEntity(physics, CANVAS_WIDTH / 2, 500);

    renderCat(mockCtx, cat);

    // Verify context transformation methods were called
    expect(mockCtx.save).toHaveBeenCalled();
    expect(mockCtx.restore).toHaveBeenCalled();
    expect(mockCtx.translate).toHaveBeenCalled();
  });

  it("should draw cat with variant colors", () => {
    const cat = createCatEntity(physics, CANVAS_WIDTH / 2, 500);
    const variantColors = CAT_VARIANTS[cat.variant];

    renderCat(mockCtx, cat);

    // Verify fill was called (for body and features)
    expect(mockCtx.fill).toHaveBeenCalled();
  });

  it("should draw different expressions correctly", () => {
    const cat = createCatEntity(physics, CANVAS_WIDTH / 2, 500);

    // Test each expression
    const expressions: CatExpression[] = [
      "neutral",
      "surprised",
      "happy",
      "worried",
    ];

    for (const expr of expressions) {
      setCatExpression(cat, expr);
      jest.clearAllMocks();

      renderCat(mockCtx, cat);

      // Each expression should result in drawing calls
      expect(mockCtx.save).toHaveBeenCalled();
      expect(mockCtx.restore).toHaveBeenCalled();
    }
  });
});

// Test 5: Cat physics properties (friction 0.8-0.9, restitution 0.1-0.2)
describe("Cat physics properties", () => {
  let physics: PhysicsEngine;

  beforeEach(() => {
    physics = createPhysicsEngine();
  });

  afterEach(() => {
    cleanupPhysics(physics);
  });

  it("should have friction within valid range (0.8-0.9)", () => {
    const cat = createCatEntity(physics, CANVAS_WIDTH / 2, 500);

    expect(cat.body.friction).toBeGreaterThanOrEqual(0.8);
    expect(cat.body.friction).toBeLessThanOrEqual(0.9);
  });

  it("should have restitution within valid range (0.1-0.2)", () => {
    const cat = createCatEntity(physics, CANVAS_WIDTH / 2, 500);

    expect(cat.body.restitution).toBeGreaterThanOrEqual(0.1);
    expect(cat.body.restitution).toBeLessThanOrEqual(0.2);
  });

  it("should use configured physics constants", () => {
    const cat = createCatEntity(physics, CANVAS_WIDTH / 2, 500);

    // Verify friction matches constant (should be 0.85)
    expect(cat.body.friction).toBeCloseTo(CAT_FRICTION, 2);

    // Verify restitution matches constant (should be 0.15)
    expect(cat.body.restitution).toBeCloseTo(CAT_RESTITUTION, 2);
  });

  it("should have appropriate static friction for stability", () => {
    const cat = createCatEntity(physics, CANVAS_WIDTH / 2, 500);

    // Static friction should be higher than dynamic friction
    expect(cat.body.frictionStatic).toBeGreaterThan(cat.body.friction);
  });
});

// Test 6: Cat stability detection (velocity below threshold for 2 seconds)
describe("Cat stability detection", () => {
  let physics: PhysicsEngine;

  beforeEach(() => {
    physics = createPhysicsEngine();
  });

  afterEach(() => {
    cleanupPhysics(physics);
  });

  it("should not be stable initially", () => {
    const cat = createCatEntity(physics, CANVAS_WIDTH / 2, 500);

    expect(isCatStable(cat)).toBe(false);
    expect(cat.stableTime).toBe(0);
  });

  it("should accumulate stable time when velocity is below threshold", () => {
    const cat = createCatEntity(physics, CANVAS_WIDTH / 2, 500);

    // Simulate low velocity by setting body velocity directly
    Matter.Body.setVelocity(cat.body, { x: 0, y: 0 });

    // Update stability with 500ms delta
    updateCatStability(cat, 500);
    expect(cat.stableTime).toBe(500);
    expect(isCatStable(cat)).toBe(false);

    // Update again
    updateCatStability(cat, 500);
    expect(cat.stableTime).toBe(1000);
    expect(isCatStable(cat)).toBe(false);
  });

  it("should become stable after 2 seconds of low velocity", () => {
    const cat = createCatEntity(physics, CANVAS_WIDTH / 2, 500);

    // Simulate low velocity
    Matter.Body.setVelocity(cat.body, { x: 0, y: 0 });

    // Accumulate 2 seconds of stability
    updateCatStability(cat, 2000);

    expect(cat.stableTime).toBeGreaterThanOrEqual(STABILITY_TIME_REQUIRED);
    expect(isCatStable(cat)).toBe(true);
  });

  it("should reset stable time when velocity exceeds threshold", () => {
    const cat = createCatEntity(physics, CANVAS_WIDTH / 2, 500);

    // First, accumulate some stable time
    Matter.Body.setVelocity(cat.body, { x: 0, y: 0 });
    updateCatStability(cat, 1000);
    expect(cat.stableTime).toBe(1000);

    // Then set high velocity
    Matter.Body.setVelocity(cat.body, {
      x: STABILITY_VELOCITY_THRESHOLD + 1,
      y: 0,
    });
    updateCatStability(cat, 100);

    // Stable time should be reset
    expect(cat.stableTime).toBe(0);
    expect(isCatStable(cat)).toBe(false);
  });

  it("should use correct velocity threshold from constants", () => {
    const cat = createCatEntity(physics, CANVAS_WIDTH / 2, 500);

    // Set velocity just below threshold
    Matter.Body.setVelocity(cat.body, {
      x: STABILITY_VELOCITY_THRESHOLD * 0.9,
      y: 0,
    });
    updateCatStability(cat, 500);
    expect(cat.stableTime).toBe(500); // Should accumulate

    // Reset and set velocity just above threshold
    cat.stableTime = 0;
    Matter.Body.setVelocity(cat.body, {
      x: STABILITY_VELOCITY_THRESHOLD * 1.1,
      y: 0,
    });
    updateCatStability(cat, 500);
    expect(cat.stableTime).toBe(0); // Should not accumulate
  });
});
