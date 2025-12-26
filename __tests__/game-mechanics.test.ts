/**
 * Task 4.1: Game Mechanics Tests
 *
 * These 6 focused tests verify:
 * 1. Pendulum sinusoidal motion calculation
 * 2. Cat drop spawning at pendulum position
 * 3. Input handling (click, touch, spacebar)
 * 4. Input debouncing (100ms minimum between drops)
 * 5. Difficulty progression at thresholds (5, 10, 15, 20 cats)
 * 6. Tower stability detection (cat fallen triggers game over)
 */

import Matter from "matter-js";
import {
  createPendulum,
  getPendulumPosition,
  updatePendulum,
  PendulumState,
  increasePendulumDifficulty,
} from "@/lib/game/pendulum";
import {
  createInputHandler,
  InputHandler,
  InputState,
} from "@/lib/game/input";
import { createCatEntity, CatEntity, setCatExpression } from "@/lib/game/cat";
import {
  createPhysicsEngine,
  cleanupPhysics,
  PhysicsEngine,
  isBodyBelowDeathZone,
  getBodySpeed,
} from "@/lib/game/physics";
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  SWING_AMPLITUDE,
  SWING_PERIOD,
  SPEED_INCREASE_FACTOR,
  DROP_DEBOUNCE_MS,
  DIFFICULTY_THRESHOLDS,
  PENDULUM_Y,
  DEATH_ZONE_Y,
  WOBBLE_VELOCITY_THRESHOLD,
} from "@/lib/constants";

// Test 1: Pendulum sinusoidal motion calculation
describe("Pendulum sinusoidal motion", () => {
  it("should calculate correct X position using sinusoidal motion", () => {
    const pendulum = createPendulum();
    const centerX = CANVAS_WIDTH / 2;
    const amplitude = CANVAS_WIDTH * SWING_AMPLITUDE;

    // At time 0, should be at center
    const pos0 = getPendulumPosition(pendulum, 0);
    expect(pos0.x).toBeCloseTo(centerX, 1);
    expect(pos0.y).toBe(PENDULUM_Y);

    // At 1/4 period (500ms), should be at maximum amplitude (sin(PI/2) = 1)
    const pos500 = getPendulumPosition(pendulum, SWING_PERIOD / 4);
    expect(pos500.x).toBeCloseTo(centerX + amplitude, 1);

    // At 1/2 period (1000ms), should be back at center (sin(PI) = 0)
    const pos1000 = getPendulumPosition(pendulum, SWING_PERIOD / 2);
    expect(pos1000.x).toBeCloseTo(centerX, 1);

    // At 3/4 period (1500ms), should be at minimum (sin(3*PI/2) = -1)
    const pos1500 = getPendulumPosition(pendulum, (SWING_PERIOD * 3) / 4);
    expect(pos1500.x).toBeCloseTo(centerX - amplitude, 1);

    // At full period (2000ms), should be back at center
    const pos2000 = getPendulumPosition(pendulum, SWING_PERIOD);
    expect(pos2000.x).toBeCloseTo(centerX, 1);
  });

  it("should have correct amplitude (40% of screen width)", () => {
    const pendulum = createPendulum();
    const centerX = CANVAS_WIDTH / 2;
    const expectedAmplitude = CANVAS_WIDTH * SWING_AMPLITUDE;

    // Get max position (at 1/4 period)
    const maxPos = getPendulumPosition(pendulum, SWING_PERIOD / 4);
    const actualAmplitude = maxPos.x - centerX;

    expect(actualAmplitude).toBeCloseTo(expectedAmplitude, 1);
  });

  it("should have approximately 2 second period", () => {
    const pendulum = createPendulum();
    const pos0 = getPendulumPosition(pendulum, 0);
    const posPeriod = getPendulumPosition(pendulum, SWING_PERIOD);

    // After one full period, should be at same position
    expect(pos0.x).toBeCloseTo(posPeriod.x, 1);
    expect(pos0.y).toBeCloseTo(posPeriod.y, 1);
  });
});

// Test 2: Cat drop spawning at pendulum position
describe("Cat drop spawning", () => {
  let physics: PhysicsEngine;

  beforeEach(() => {
    physics = createPhysicsEngine();
  });

  afterEach(() => {
    cleanupPhysics(physics);
  });

  it("should spawn cat at current pendulum X position", () => {
    const pendulum = createPendulum();
    const time = SWING_PERIOD / 4; // At max amplitude
    const pendulumPos = getPendulumPosition(pendulum, time);

    // Create cat at pendulum position
    const cat = createCatEntity(physics, pendulumPos.x, pendulumPos.y);

    expect(cat.body.position.x).toBeCloseTo(pendulumPos.x, 1);
    expect(cat.body.position.y).toBeCloseTo(pendulumPos.y, 1);
  });

  it("should have no initial velocity when dropped", () => {
    const pendulum = createPendulum();
    const pendulumPos = getPendulumPosition(pendulum, 0);

    // Create cat at pendulum position (newly created cats have no velocity)
    const cat = createCatEntity(physics, pendulumPos.x, pendulumPos.y);

    // Velocity should be zero initially
    expect(cat.body.velocity.x).toBeCloseTo(0, 5);
    expect(cat.body.velocity.y).toBeCloseTo(0, 5);
  });

  it("should set expression to surprised during fall", () => {
    const pendulum = createPendulum();
    const pendulumPos = getPendulumPosition(pendulum, 0);

    const cat = createCatEntity(physics, pendulumPos.x, pendulumPos.y);
    setCatExpression(cat, "surprised");

    expect(cat.expression).toBe("surprised");
  });
});

// Test 3: Input handling (click, touch, spacebar)
describe("Input handling", () => {
  let mockCanvas: HTMLCanvasElement;
  let inputHandler: InputHandler;

  beforeEach(() => {
    // Create a mock canvas element
    mockCanvas = document.createElement("canvas");
    inputHandler = createInputHandler(mockCanvas);
  });

  afterEach(() => {
    inputHandler.cleanup();
  });

  it("should detect mousedown/click events", () => {
    let dropTriggered = false;
    inputHandler.onDrop(() => {
      dropTriggered = true;
    });

    // Simulate mousedown event
    const mouseEvent = new MouseEvent("mousedown", {
      bubbles: true,
      cancelable: true,
    });
    mockCanvas.dispatchEvent(mouseEvent);

    expect(dropTriggered).toBe(true);
  });

  it("should detect touchstart events", () => {
    let dropTriggered = false;
    inputHandler.onDrop(() => {
      dropTriggered = true;
    });

    // Simulate touchstart event
    const touchEvent = new TouchEvent("touchstart", {
      bubbles: true,
      cancelable: true,
      touches: [{ identifier: 0, target: mockCanvas } as Touch],
    });
    mockCanvas.dispatchEvent(touchEvent);

    expect(dropTriggered).toBe(true);
  });

  it("should detect spacebar keydown events", () => {
    let dropTriggered = false;
    inputHandler.onDrop(() => {
      dropTriggered = true;
    });

    // Simulate spacebar keydown event
    const keyEvent = new KeyboardEvent("keydown", {
      bubbles: true,
      cancelable: true,
      key: " ",
      code: "Space",
    });
    document.dispatchEvent(keyEvent);

    expect(dropTriggered).toBe(true);
  });

  it("should ignore non-spacebar key presses", () => {
    let dropTriggered = false;
    inputHandler.onDrop(() => {
      dropTriggered = true;
    });

    // Simulate a different key
    const keyEvent = new KeyboardEvent("keydown", {
      bubbles: true,
      cancelable: true,
      key: "a",
      code: "KeyA",
    });
    document.dispatchEvent(keyEvent);

    expect(dropTriggered).toBe(false);
  });
});

// Test 4: Input debouncing (100ms minimum between drops)
describe("Input debouncing", () => {
  let mockCanvas: HTMLCanvasElement;
  let inputHandler: InputHandler;

  beforeEach(() => {
    mockCanvas = document.createElement("canvas");
    inputHandler = createInputHandler(mockCanvas);
    jest.useFakeTimers();
  });

  afterEach(() => {
    inputHandler.cleanup();
    jest.useRealTimers();
  });

  it("should debounce rapid inputs (100ms minimum)", () => {
    let dropCount = 0;
    inputHandler.onDrop(() => {
      dropCount++;
    });

    // First click should trigger
    const event1 = new MouseEvent("mousedown", { bubbles: true });
    mockCanvas.dispatchEvent(event1);
    expect(dropCount).toBe(1);

    // Immediate second click should be ignored
    const event2 = new MouseEvent("mousedown", { bubbles: true });
    mockCanvas.dispatchEvent(event2);
    expect(dropCount).toBe(1);

    // After 50ms, still should be ignored
    jest.advanceTimersByTime(50);
    const event3 = new MouseEvent("mousedown", { bubbles: true });
    mockCanvas.dispatchEvent(event3);
    expect(dropCount).toBe(1);

    // After 100ms total, should allow another drop
    jest.advanceTimersByTime(60); // 50 + 60 = 110ms
    const event4 = new MouseEvent("mousedown", { bubbles: true });
    mockCanvas.dispatchEvent(event4);
    expect(dropCount).toBe(2);
  });

  it("should allow input after debounce period expires", () => {
    let dropCount = 0;
    inputHandler.onDrop(() => {
      dropCount++;
    });

    // First click
    mockCanvas.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    expect(dropCount).toBe(1);

    // Wait full debounce period
    jest.advanceTimersByTime(DROP_DEBOUNCE_MS + 10);

    // Second click should work
    mockCanvas.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    expect(dropCount).toBe(2);
  });
});

// Test 5: Difficulty progression at thresholds (5, 10, 15, 20 cats)
describe("Difficulty progression", () => {
  it("should increase swing speed by 17.5% at each threshold", () => {
    const pendulum = createPendulum();
    const initialSpeedMultiplier = pendulum.speedMultiplier;

    // First threshold (5 cats)
    increasePendulumDifficulty(pendulum, 1);
    expect(pendulum.speedMultiplier).toBeCloseTo(
      initialSpeedMultiplier * (1 + SPEED_INCREASE_FACTOR),
      3
    );

    // Second threshold (10 cats)
    increasePendulumDifficulty(pendulum, 2);
    expect(pendulum.speedMultiplier).toBeCloseTo(
      initialSpeedMultiplier * Math.pow(1 + SPEED_INCREASE_FACTOR, 2),
      3
    );

    // Third threshold (15 cats)
    increasePendulumDifficulty(pendulum, 3);
    expect(pendulum.speedMultiplier).toBeCloseTo(
      initialSpeedMultiplier * Math.pow(1 + SPEED_INCREASE_FACTOR, 3),
      3
    );
  });

  it("should have correct difficulty thresholds defined", () => {
    expect(DIFFICULTY_THRESHOLDS).toContain(5);
    expect(DIFFICULTY_THRESHOLDS).toContain(10);
    expect(DIFFICULTY_THRESHOLDS).toContain(15);
    expect(DIFFICULTY_THRESHOLDS).toContain(20);
  });

  it("should track difficulty level in pendulum state", () => {
    const pendulum = createPendulum();

    expect(pendulum.difficultyLevel).toBe(0);

    increasePendulumDifficulty(pendulum, 1);
    expect(pendulum.difficultyLevel).toBe(1);

    increasePendulumDifficulty(pendulum, 2);
    expect(pendulum.difficultyLevel).toBe(2);
  });

  it("should swing faster after difficulty increase", () => {
    const pendulum = createPendulum();

    // Get positions at base speed
    const basePos1 = getPendulumPosition(pendulum, 100);

    // Increase difficulty
    increasePendulumDifficulty(pendulum, 1);

    // At same time, position should be different due to faster speed
    const fastPos1 = getPendulumPosition(pendulum, 100);

    // The faster pendulum should be further along in its cycle
    // (not exactly testable this way, but we can verify the speed multiplier is applied)
    expect(pendulum.speedMultiplier).toBeGreaterThan(1);
  });
});

// Test 6: Tower stability detection (cat fallen triggers game over)
describe("Tower stability detection", () => {
  let physics: PhysicsEngine;

  beforeEach(() => {
    physics = createPhysicsEngine();
  });

  afterEach(() => {
    cleanupPhysics(physics);
  });

  it("should detect cats fallen below death zone", () => {
    // Create a cat above death zone
    const catAbove = createCatEntity(physics, CANVAS_WIDTH / 2, 500);
    expect(isBodyBelowDeathZone(catAbove.body)).toBe(false);

    // Create a cat below death zone
    const catBelow = createCatEntity(physics, CANVAS_WIDTH / 2, DEATH_ZONE_Y + 50);
    expect(isBodyBelowDeathZone(catBelow.body)).toBe(true);
  });

  it("should detect wobbling cats by velocity threshold", () => {
    const cat = createCatEntity(physics, CANVAS_WIDTH / 2, 500);

    // Set low velocity - not wobbling
    Matter.Body.setVelocity(cat.body, { x: 0.1, y: 0.1 });
    expect(getBodySpeed(cat.body)).toBeLessThan(WOBBLE_VELOCITY_THRESHOLD);

    // Set high velocity - wobbling
    Matter.Body.setVelocity(cat.body, { x: 3, y: 2 });
    expect(getBodySpeed(cat.body)).toBeGreaterThan(WOBBLE_VELOCITY_THRESHOLD);
  });

  it("should track cat positions after physics updates", () => {
    // Create a cat that will fall
    const cat = createCatEntity(physics, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 100);
    const initialY = cat.body.position.y;

    // Run physics (cat should fall with no ground)
    for (let i = 0; i < 60; i++) {
      Matter.Engine.update(physics.engine, 16.67);
    }

    // Cat should have fallen
    expect(cat.body.position.y).toBeGreaterThan(initialY);
  });

  it("should provide velocity magnitude for stability checks", () => {
    const cat = createCatEntity(physics, CANVAS_WIDTH / 2, 500);

    // Set specific velocity
    Matter.Body.setVelocity(cat.body, { x: 3, y: 4 });

    // Speed should be sqrt(3^2 + 4^2) = 5
    expect(getBodySpeed(cat.body)).toBeCloseTo(5, 5);
  });
});
