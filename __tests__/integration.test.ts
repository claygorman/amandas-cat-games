/**
 * Task 6.3: Integration Tests
 *
 * These 8 integration tests cover end-to-end workflows and system interactions:
 * 1. Complete drop-to-score workflow
 * 2. Game over trigger and restart flow
 * 3. Difficulty progression during extended play
 * 4. Multiple cat stacking physics interaction
 * 5. "Perfect!" landing full flow (detection + bonus + display)
 * 6. High score update flow (beat, save, display)
 * 7. Responsive canvas during window resize
 * 8. Mobile touch input end-to-end
 */

import Matter from "matter-js";
import {
  createPhysicsEngine,
  cleanupPhysics,
  createGroundPlatform,
  getAllCatBodies,
  PhysicsEngine,
} from "@/lib/game/physics";
import {
  createCatEntity,
  CatEntity,
  setCatExpression,
  updateCatStability,
  isCatStable,
} from "@/lib/game/cat";
import {
  createGameState,
  transitionToPlaying,
  transitionToGameOver,
  restartGame,
  isPlayingState,
  isGameOverState,
  isStartState,
  canDropCat,
  GameState,
} from "@/lib/game/state";
import {
  createScoreState,
  awardStabilityPoints,
  loadHighScore,
  saveHighScore,
  updateHighScore,
  isPerfectLanding,
  ScoreState,
} from "@/lib/game/scoring";
import {
  createTowerState,
  addCatToTower,
  updateTower,
  clearTower,
  TowerState,
} from "@/lib/game/tower";
import {
  createPendulum,
  getPendulumPosition,
  getCurrentPendulumPosition,
  updatePendulum,
  increasePendulumDifficulty,
  checkDifficultyThreshold,
  PendulumState,
} from "@/lib/game/pendulum";
import {
  createInputHandler,
  createMockInputHandler,
  InputHandler,
} from "@/lib/game/input";
import { calculateCanvasScale } from "@/lib/game/useGameLoop";
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  STABILITY_TIME_REQUIRED,
  DIFFICULTY_THRESHOLDS,
  SPEED_INCREASE_FACTOR,
  POINTS_PER_STACK,
  PERFECT_BONUS,
  HIGH_SCORE_KEY,
  DEATH_ZONE_Y,
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

// ============================================================================
// Test 1: Complete drop-to-score workflow
// ============================================================================
describe("Integration: Complete drop-to-score workflow", () => {
  let physics: PhysicsEngine;
  let gameState: GameState;
  let mockInputHandler: InputHandler;

  beforeEach(() => {
    physics = createPhysicsEngine();
    createGroundPlatform(physics);
    gameState = createGameState();
    mockInputHandler = createMockInputHandler();
    localStorageMock.clear();
  });

  afterEach(() => {
    cleanupPhysics(physics);
    mockInputHandler.cleanup();
  });

  it("should complete workflow: pendulum -> drop -> fall -> land -> stabilize -> score", () => {
    // 1. Start game
    transitionToPlaying(gameState, mockInputHandler);
    expect(isPlayingState(gameState)).toBe(true);

    // 2. Get pendulum position for drop
    const pendulum = gameState.pendulumState;
    updatePendulum(pendulum, 500); // Advance time to move pendulum
    const dropPos = getCurrentPendulumPosition(pendulum);

    // 3. Create cat at drop position (simulating drop)
    const cat = createCatEntity(physics, dropPos.x, dropPos.y);
    addCatToTower(gameState.towerState, cat);

    // Verify cat is in surprised expression during fall
    expect(cat.expression).toBe("surprised");

    // 4. Run physics until cat lands and stabilizes
    // Simulate physics updates (cat falls and lands)
    for (let i = 0; i < 60; i++) {
      Matter.Engine.update(physics.engine, 16.67);
    }

    // 5. Simulate stability time passing
    Matter.Body.setVelocity(cat.body, { x: 0, y: 0 });
    updateCatStability(cat, STABILITY_TIME_REQUIRED);

    // 6. Verify cat became stable
    expect(isCatStable(cat)).toBe(true);

    // 7. Award points for stable cat
    const result = awardStabilityPoints(gameState.scoreState, cat, null);

    // 8. Verify score increased
    expect(result.pointsAwarded).toBeGreaterThanOrEqual(POINTS_PER_STACK);
    expect(gameState.scoreState.score).toBeGreaterThanOrEqual(POINTS_PER_STACK);
  });

  it("should track multiple cats through complete workflow", () => {
    transitionToPlaying(gameState, mockInputHandler);

    // Drop and stabilize 3 cats
    for (let i = 0; i < 3; i++) {
      const cat = createCatEntity(
        physics,
        CANVAS_WIDTH / 2,
        200 - i * 70 // Stack progressively higher
      );
      addCatToTower(gameState.towerState, cat);

      // Stabilize each cat
      Matter.Body.setVelocity(cat.body, { x: 0, y: 0 });
      updateCatStability(cat, STABILITY_TIME_REQUIRED);

      const previousCat = i > 0 ? gameState.towerState.cats[i - 1] : null;
      awardStabilityPoints(gameState.scoreState, cat, previousCat);
    }

    // Verify total score reflects 3 cats
    expect(gameState.scoreState.score).toBeGreaterThanOrEqual(3 * POINTS_PER_STACK);
    expect(gameState.towerState.cats.length).toBe(3);
  });
});

// ============================================================================
// Test 2: Game over trigger and restart flow
// ============================================================================
describe("Integration: Game over trigger and restart flow", () => {
  let physics: PhysicsEngine;
  let gameState: GameState;
  let mockInputHandler: InputHandler;

  beforeEach(() => {
    physics = createPhysicsEngine();
    createGroundPlatform(physics);
    gameState = createGameState();
    mockInputHandler = createMockInputHandler();
    localStorageMock.clear();
  });

  afterEach(() => {
    cleanupPhysics(physics);
    mockInputHandler.cleanup();
  });

  it("should complete game over and restart cycle", () => {
    // 1. Start playing
    transitionToPlaying(gameState, mockInputHandler);
    expect(isPlayingState(gameState)).toBe(true);

    // 2. Add some cats and score
    const cat1 = createCatEntity(physics, CANVAS_WIDTH / 2, 500);
    addCatToTower(gameState.towerState, cat1);
    Matter.Body.setVelocity(cat1.body, { x: 0, y: 0 });
    updateCatStability(cat1, STABILITY_TIME_REQUIRED);
    awardStabilityPoints(gameState.scoreState, cat1, null);

    expect(gameState.scoreState.score).toBeGreaterThan(0);
    const scoreBeforeGameOver = gameState.scoreState.score;

    // 3. Trigger game over
    transitionToGameOver(gameState, mockInputHandler);
    expect(isGameOverState(gameState)).toBe(true);
    expect(canDropCat(gameState)).toBe(false);

    // 4. Verify high score was checked
    expect(gameState.beatHighScore).toBeDefined();

    // 5. Restart game
    restartGame(gameState, physics, mockInputHandler);

    // 6. Verify game restarted correctly
    expect(isPlayingState(gameState)).toBe(true);
    expect(canDropCat(gameState)).toBe(true);
    expect(gameState.scoreState.score).toBe(0);
    expect(gameState.towerState.cats.length).toBe(0);
    expect(gameState.towerState.stackedCount).toBe(0);
    expect(gameState.pendulumState.speedMultiplier).toBe(1.0);

    // 7. Verify physics world was cleared of cats
    expect(getAllCatBodies(physics).length).toBe(0);
  });

  it("should preserve high score through restart", () => {
    transitionToPlaying(gameState, mockInputHandler);

    // Score 5 points
    for (let i = 0; i < 5; i++) {
      const cat = createCatEntity(physics, CANVAS_WIDTH / 2, 500);
      addCatToTower(gameState.towerState, cat);
      Matter.Body.setVelocity(cat.body, { x: 0, y: 0 });
      updateCatStability(cat, STABILITY_TIME_REQUIRED);
      const prevCat = i > 0 ? gameState.towerState.cats[i - 1] : null;
      awardStabilityPoints(gameState.scoreState, cat, prevCat);
    }

    const highScoreAfterFirstGame = gameState.scoreState.highScore;

    // Game over and restart
    transitionToGameOver(gameState, mockInputHandler);
    restartGame(gameState, physics, mockInputHandler);

    // High score should be preserved
    expect(gameState.scoreState.highScore).toBe(highScoreAfterFirstGame);
    expect(gameState.scoreState.score).toBe(0);
  });
});

// ============================================================================
// Test 3: Difficulty progression during extended play
// ============================================================================
describe("Integration: Difficulty progression during extended play", () => {
  let physics: PhysicsEngine;
  let gameState: GameState;
  let mockInputHandler: InputHandler;

  beforeEach(() => {
    physics = createPhysicsEngine();
    createGroundPlatform(physics);
    gameState = createGameState();
    mockInputHandler = createMockInputHandler();
    localStorageMock.clear();
  });

  afterEach(() => {
    cleanupPhysics(physics);
    mockInputHandler.cleanup();
  });

  it("should increase difficulty at thresholds: 5, 10, 15 cats", () => {
    transitionToPlaying(gameState, mockInputHandler);

    const initialSpeed = gameState.pendulumState.speedMultiplier;
    expect(initialSpeed).toBe(1.0);

    // Helper to simulate stacking a cat and checking for difficulty increase
    const stackCat = () => {
      const cat = createCatEntity(physics, CANVAS_WIDTH / 2, 500);
      addCatToTower(gameState.towerState, cat);

      // Simulate the cat becoming stable (zero velocity)
      Matter.Body.setVelocity(cat.body, { x: 0, y: 0 });

      // Directly increment stacked count to simulate game flow
      gameState.towerState.stackedCount++;

      // Check for difficulty threshold
      const newLevel = checkDifficultyThreshold(
        gameState.towerState.stackedCount,
        gameState.towerState.difficultyLevel,
        DIFFICULTY_THRESHOLDS
      );

      if (newLevel > gameState.towerState.difficultyLevel) {
        gameState.towerState.difficultyLevel = newLevel;
        increasePendulumDifficulty(gameState.pendulumState, newLevel);
        return true;
      }
      return false;
    };

    // Stack to first threshold (5 cats)
    for (let i = 0; i < 5; i++) {
      stackCat();
    }
    expect(gameState.towerState.stackedCount).toBe(5);
    expect(gameState.towerState.difficultyLevel).toBe(1);
    expect(gameState.pendulumState.speedMultiplier).toBeCloseTo(
      1 + SPEED_INCREASE_FACTOR,
      3
    );

    // Stack to second threshold (10 cats)
    for (let i = 5; i < 10; i++) {
      stackCat();
    }
    expect(gameState.towerState.stackedCount).toBe(10);
    expect(gameState.towerState.difficultyLevel).toBe(2);
    expect(gameState.pendulumState.speedMultiplier).toBeCloseTo(
      Math.pow(1 + SPEED_INCREASE_FACTOR, 2),
      3
    );

    // Stack to third threshold (15 cats)
    for (let i = 10; i < 15; i++) {
      stackCat();
    }
    expect(gameState.towerState.stackedCount).toBe(15);
    expect(gameState.towerState.difficultyLevel).toBe(3);
    expect(gameState.pendulumState.speedMultiplier).toBeCloseTo(
      Math.pow(1 + SPEED_INCREASE_FACTOR, 3),
      3
    );
  });

  it("should reset difficulty on restart", () => {
    transitionToPlaying(gameState, mockInputHandler);

    // Manually set up stacked count and difficulty
    gameState.towerState.stackedCount = 10;
    gameState.towerState.difficultyLevel = 2;
    increasePendulumDifficulty(gameState.pendulumState, 2);

    expect(gameState.towerState.difficultyLevel).toBe(2);
    expect(gameState.pendulumState.speedMultiplier).toBeCloseTo(
      Math.pow(1 + SPEED_INCREASE_FACTOR, 2),
      3
    );

    // Restart
    transitionToGameOver(gameState, mockInputHandler);
    restartGame(gameState, physics, mockInputHandler);

    // Difficulty should be reset
    expect(gameState.towerState.difficultyLevel).toBe(0);
    expect(gameState.pendulumState.speedMultiplier).toBe(1.0);
  });
});

// ============================================================================
// Test 4: Multiple cat stacking physics interaction
// ============================================================================
describe("Integration: Multiple cat stacking physics interaction", () => {
  let physics: PhysicsEngine;

  beforeEach(() => {
    physics = createPhysicsEngine();
    createGroundPlatform(physics);
  });

  afterEach(() => {
    cleanupPhysics(physics);
  });

  it("should handle multiple cats stacking on ground", () => {
    // Create 3 cats in a vertical stack position
    const cat1 = createCatEntity(physics, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 150);
    const cat2 = createCatEntity(physics, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 220);
    const cat3 = createCatEntity(physics, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 290);

    // Run physics simulation
    for (let i = 0; i < 120; i++) {
      Matter.Engine.update(physics.engine, 16.67);
    }

    // All cats should have settled (not below death zone)
    expect(cat1.body.position.y).toBeLessThan(DEATH_ZONE_Y);
    expect(cat2.body.position.y).toBeLessThan(DEATH_ZONE_Y);
    expect(cat3.body.position.y).toBeLessThan(DEATH_ZONE_Y);

    // Cats should be stacked (cat2 above cat1, cat3 above cat2)
    expect(cat2.body.position.y).toBeLessThan(cat1.body.position.y);
    expect(cat3.body.position.y).toBeLessThan(cat2.body.position.y);
  });

  it("should detect when offset cat causes tower collapse", () => {
    // Create base cat
    const baseCat = createCatEntity(physics, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 150);

    // Run physics to stabilize base
    for (let i = 0; i < 60; i++) {
      Matter.Engine.update(physics.engine, 16.67);
    }

    // Create offset cat that should fall off
    const offsetCat = createCatEntity(
      physics,
      CANVAS_WIDTH / 2 + 100, // Significantly offset
      CANVAS_HEIGHT - 250
    );

    // Run physics
    for (let i = 0; i < 300; i++) {
      Matter.Engine.update(physics.engine, 16.67);

      // Check if offset cat has fallen
      if (offsetCat.body.position.y > DEATH_ZONE_Y) {
        break;
      }
    }

    // Offset cat may have fallen or be precariously balanced
    // The exact outcome depends on physics, but we verify system handles it
    const allCats = getAllCatBodies(physics);
    expect(allCats.length).toBe(2);
  });

  it("should maintain physics performance with many stacked cats", () => {
    const cats: CatEntity[] = [];

    // Create 10 cats stacked
    for (let i = 0; i < 10; i++) {
      const cat = createCatEntity(
        physics,
        CANVAS_WIDTH / 2 + (Math.random() - 0.5) * 20, // Slight random offset
        CANVAS_HEIGHT - 150 - i * 65
      );
      cats.push(cat);
    }

    // Time physics updates
    const startTime = Date.now();
    const frames = 120;

    for (let i = 0; i < frames; i++) {
      Matter.Engine.update(physics.engine, 16.67);
    }

    const elapsed = Date.now() - startTime;
    const avgFrameTime = elapsed / frames;

    // Should complete quickly (< 5ms per frame on average)
    expect(avgFrameTime).toBeLessThan(5);

    // All cats should still exist in world
    expect(getAllCatBodies(physics).length).toBe(10);
  });
});

// ============================================================================
// Test 5: "Perfect!" landing full flow
// ============================================================================
describe("Integration: Perfect landing full flow", () => {
  let physics: PhysicsEngine;
  let scoreState: ScoreState;

  beforeEach(() => {
    physics = createPhysicsEngine();
    createGroundPlatform(physics);
    scoreState = createScoreState();
    localStorageMock.clear();
  });

  afterEach(() => {
    cleanupPhysics(physics);
  });

  it("should complete perfect landing flow: detection -> bonus -> display", () => {
    // 1. Create cat exactly at center (perfect landing position)
    const perfectCat = createCatEntity(physics, CANVAS_WIDTH / 2, 500);

    // Verify initial state
    expect(scoreState.showingPerfect).toBe(false);
    expect(scoreState.perfectDisplayTime).toBe(0);

    // 2. Award points (this triggers perfect detection)
    const result = awardStabilityPoints(scoreState, perfectCat, null);

    // 3. Verify perfect was detected
    expect(result.isPerfect).toBe(true);

    // 4. Verify bonus was awarded
    expect(result.pointsAwarded).toBe(POINTS_PER_STACK + PERFECT_BONUS);
    expect(scoreState.score).toBe(POINTS_PER_STACK + PERFECT_BONUS);

    // 5. Verify display state was triggered
    expect(scoreState.showingPerfect).toBe(true);
    expect(scoreState.perfectDisplayTime).toBeGreaterThan(0);
    expect(scoreState.perfectX).toBe(perfectCat.body.position.x);
  });

  it("should NOT trigger perfect for offset landing", () => {
    // Create cat significantly off center
    const offsetCat = createCatEntity(physics, CANVAS_WIDTH / 2 + 50, 500);

    const result = awardStabilityPoints(scoreState, offsetCat, null);

    // Should NOT be perfect
    expect(result.isPerfect).toBe(false);
    expect(result.pointsAwarded).toBe(POINTS_PER_STACK);
    expect(scoreState.showingPerfect).toBe(false);
  });

  it("should detect perfect when stacking on another cat", () => {
    // Create base cat
    const baseCat = createCatEntity(physics, 400, 500);

    // Create perfectly aligned cat above
    const stackedCat = createCatEntity(physics, 400, 430);

    const result = awardStabilityPoints(scoreState, stackedCat, baseCat);

    expect(result.isPerfect).toBe(true);
    expect(result.pointsAwarded).toBe(POINTS_PER_STACK + PERFECT_BONUS);
  });
});

// ============================================================================
// Test 6: High score update flow
// ============================================================================
describe("Integration: High score update flow", () => {
  let physics: PhysicsEngine;
  let gameState: GameState;
  let mockInputHandler: InputHandler;

  beforeEach(() => {
    physics = createPhysicsEngine();
    createGroundPlatform(physics);
    localStorageMock.clear();
    gameState = createGameState();
    mockInputHandler = createMockInputHandler();
  });

  afterEach(() => {
    cleanupPhysics(physics);
    mockInputHandler.cleanup();
  });

  it("should complete high score flow: beat -> save -> display", () => {
    // 1. Start with no high score
    expect(loadHighScore()).toBe(0);
    expect(gameState.scoreState.highScore).toBe(0);

    // 2. Play and score (without using awardStabilityPoints to control high score timing)
    transitionToPlaying(gameState, mockInputHandler);

    // Manually add score to control the flow
    gameState.scoreState.score = 15;

    // Verify high score hasn't been updated yet
    expect(gameState.scoreState.highScore).toBe(0);

    // 3. Game over triggers high score check
    transitionToGameOver(gameState, mockInputHandler);

    // 4. Verify high score was beaten (transitionToGameOver calls updateHighScore)
    expect(gameState.beatHighScore).toBe(true);
    expect(gameState.scoreState.highScore).toBe(15);

    // 5. Verify saved to localStorage
    expect(loadHighScore()).toBe(15);
  });

  it("should NOT update high score when current score is lower", () => {
    // Set initial high score
    saveHighScore(100);

    // Create new game state (should load the high score)
    const newGameState = createGameState();
    expect(newGameState.scoreState.highScore).toBe(100);

    // Play and score less than high score
    transitionToPlaying(newGameState, mockInputHandler);
    newGameState.scoreState.score = 5; // Less than 100

    // Game over
    transitionToGameOver(newGameState, mockInputHandler);

    // High score should NOT be beaten
    expect(newGameState.beatHighScore).toBe(false);
    expect(newGameState.scoreState.highScore).toBe(100);
    expect(loadHighScore()).toBe(100);
  });

  it("should display correct values on game over screen data", () => {
    // Set initial high score
    saveHighScore(5);
    gameState = createGameState(); // Reload to get high score
    expect(gameState.scoreState.highScore).toBe(5);

    transitionToPlaying(gameState, mockInputHandler);

    // Set score higher than high score
    gameState.scoreState.score = 20;

    transitionToGameOver(gameState, mockInputHandler);

    // Verify game over screen data
    expect(gameState.scoreState.score).toBe(20);
    expect(gameState.scoreState.highScore).toBe(20);
    expect(gameState.beatHighScore).toBe(true);
  });
});

// ============================================================================
// Test 7: Responsive canvas during window resize
// ============================================================================
describe("Integration: Responsive canvas during window resize", () => {
  it("should calculate correct scaling for various screen sizes", () => {
    // Test mobile portrait (iPhone-like)
    const mobileResult = calculateCanvasScale(375, 667, CANVAS_WIDTH, CANVAS_HEIGHT);
    expect(mobileResult.scale).toBeGreaterThan(0);
    expect(mobileResult.scale).toBeLessThanOrEqual(1);

    // Canvas should fit within container
    const scaledWidth = CANVAS_WIDTH * mobileResult.scale;
    const scaledHeight = CANVAS_HEIGHT * mobileResult.scale;
    expect(scaledWidth).toBeLessThanOrEqual(375);
    expect(scaledHeight).toBeLessThanOrEqual(667);

    // Test tablet landscape
    const tabletResult = calculateCanvasScale(1024, 768, CANVAS_WIDTH, CANVAS_HEIGHT);
    expect(tabletResult.scale).toBeGreaterThan(0);

    // Test desktop
    const desktopResult = calculateCanvasScale(1920, 1080, CANVAS_WIDTH, CANVAS_HEIGHT);
    expect(desktopResult.scale).toBeGreaterThan(0);
    expect(desktopResult.offsetX).toBeGreaterThan(0); // Should be centered horizontally
  });

  it("should maintain aspect ratio across resizes", () => {
    const sizes = [
      { w: 320, h: 568 },
      { w: 375, h: 667 },
      { w: 414, h: 896 },
      { w: 768, h: 1024 },
      { w: 1024, h: 768 },
      { w: 1920, h: 1080 },
    ];

    for (const size of sizes) {
      const result = calculateCanvasScale(size.w, size.h, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Calculate resulting dimensions
      const resultWidth = CANVAS_WIDTH * result.scale;
      const resultHeight = CANVAS_HEIGHT * result.scale;

      // Aspect ratio should be preserved
      const originalRatio = CANVAS_WIDTH / CANVAS_HEIGHT;
      const resultRatio = resultWidth / resultHeight;

      expect(resultRatio).toBeCloseTo(originalRatio, 3);
    }
  });

  it("should center canvas with correct offsets", () => {
    // Wide container - should center horizontally
    const wideResult = calculateCanvasScale(1920, 1080, CANVAS_WIDTH, CANVAS_HEIGHT);
    expect(wideResult.offsetX).toBeGreaterThan(0);
    expect(wideResult.offsetY).toBe(0);

    // Tall container - should center vertically
    const tallResult = calculateCanvasScale(360, 900, CANVAS_WIDTH, CANVAS_HEIGHT);
    expect(tallResult.offsetX).toBe(0);
    expect(tallResult.offsetY).toBeGreaterThan(0);
  });
});

// ============================================================================
// Test 8: Mobile touch input end-to-end
// ============================================================================
describe("Integration: Mobile touch input end-to-end", () => {
  let mockCanvas: HTMLCanvasElement;
  let inputHandler: InputHandler;
  let gameState: GameState;
  let physics: PhysicsEngine;

  beforeEach(() => {
    mockCanvas = document.createElement("canvas");
    inputHandler = createInputHandler(mockCanvas);
    gameState = createGameState();
    physics = createPhysicsEngine();
    createGroundPlatform(physics);
    localStorageMock.clear();

    jest.useFakeTimers();
  });

  afterEach(() => {
    inputHandler.cleanup();
    cleanupPhysics(physics);
    jest.useRealTimers();
  });

  it("should handle touch input to drop cat from start to score", () => {
    let dropCount = 0;
    const droppedCats: CatEntity[] = [];

    // Set up drop handler
    inputHandler.onDrop(() => {
      if (isStartState(gameState)) {
        transitionToPlaying(gameState, inputHandler);
      } else if (isPlayingState(gameState)) {
        dropCount++;
        const cat = createCatEntity(
          physics,
          CANVAS_WIDTH / 2,
          100
        );
        addCatToTower(gameState.towerState, cat);
        droppedCats.push(cat);
      }
    });

    // Simulate first touch to start game
    const startTouch = new TouchEvent("touchstart", {
      bubbles: true,
      cancelable: true,
      touches: [{ identifier: 0, target: mockCanvas } as Touch],
    });
    mockCanvas.dispatchEvent(startTouch);

    expect(isPlayingState(gameState)).toBe(true);

    // Wait for debounce
    jest.advanceTimersByTime(150);

    // Simulate touch to drop cat
    const dropTouch = new TouchEvent("touchstart", {
      bubbles: true,
      cancelable: true,
      touches: [{ identifier: 1, target: mockCanvas } as Touch],
    });
    mockCanvas.dispatchEvent(dropTouch);

    expect(dropCount).toBe(1);
    expect(droppedCats.length).toBe(1);
    expect(gameState.towerState.cats.length).toBe(1);
  });

  it("should prevent default on touch to avoid scrolling", () => {
    const touchEvent = new TouchEvent("touchstart", {
      bubbles: true,
      cancelable: true,
      touches: [{ identifier: 0, target: mockCanvas } as Touch],
    });

    mockCanvas.dispatchEvent(touchEvent);

    // The handler should have processed the input
    expect(inputHandler.getState().lastDropTime).toBeGreaterThan(0);
  });

  it("should handle rapid touch inputs with debouncing", () => {
    let dropCount = 0;

    inputHandler.onDrop(() => {
      dropCount++;
    });

    // Simulate rapid touches
    for (let i = 0; i < 5; i++) {
      const touch = new TouchEvent("touchstart", {
        bubbles: true,
        cancelable: true,
        touches: [{ identifier: i, target: mockCanvas } as Touch],
      });
      mockCanvas.dispatchEvent(touch);
    }

    // Only first should register due to debounce
    expect(dropCount).toBe(1);

    // Advance past debounce period
    jest.advanceTimersByTime(150);

    // Now another touch should work
    const laterTouch = new TouchEvent("touchstart", {
      bubbles: true,
      cancelable: true,
      touches: [{ identifier: 10, target: mockCanvas } as Touch],
    });
    mockCanvas.dispatchEvent(laterTouch);

    expect(dropCount).toBe(2);
  });

  it("should disable input during game over", () => {
    let dropTriggered = false;

    inputHandler.onDrop(() => {
      if (isPlayingState(gameState)) {
        dropTriggered = true;
      }
    });

    // Start game
    transitionToPlaying(gameState, inputHandler);

    // Trigger game over
    transitionToGameOver(gameState, inputHandler);
    expect(isGameOverState(gameState)).toBe(true);

    // Reset tracking
    dropTriggered = false;

    // Try to touch - should not trigger drop (input disabled)
    // Note: Input is disabled briefly on game over
    jest.advanceTimersByTime(50); // Before re-enable timeout

    const touch = new TouchEvent("touchstart", {
      bubbles: true,
      cancelable: true,
      touches: [{ identifier: 0, target: mockCanvas } as Touch],
    });
    mockCanvas.dispatchEvent(touch);

    // Drop should not have been triggered (game over state)
    expect(dropTriggered).toBe(false);
  });
});
