/**
 * Task 5.1: Scoring and Game States Tests
 *
 * These 6 focused tests verify:
 * 1. Score increment (+1) on cat stability
 * 2. Perfect landing detection (10-15% center offset)
 * 3. Perfect landing bonus (+2 points)
 * 4. High score localStorage persistence
 * 5. Game state transitions (start -> playing -> gameover)
 * 6. Game restart with proper physics cleanup
 */

import Matter from "matter-js";
import {
  createScoreState,
  loadHighScore,
  saveHighScore,
  updateHighScore,
  calculateLandingOffset,
  isPerfectLanding,
  awardStabilityPoints,
  resetScore,
  ScoreState,
} from "@/lib/game/scoring";
import {
  createGameState,
  getCurrentState,
  isStartState,
  isPlayingState,
  isGameOverState,
  transitionToStart,
  transitionToPlaying,
  transitionToGameOver,
  restartGame,
  canDropCat,
  GameState,
} from "@/lib/game/state";
import { createCatEntity, CatEntity, CAT_WIDTH } from "@/lib/game/cat";
import {
  createPhysicsEngine,
  cleanupPhysics,
  createGroundPlatform,
  getAllCatBodies,
  PhysicsEngine,
} from "@/lib/game/physics";
import { createMockInputHandler } from "@/lib/game/input";
import {
  POINTS_PER_STACK,
  PERFECT_BONUS,
  PERFECT_THRESHOLD,
  HIGH_SCORE_KEY,
  CANVAS_WIDTH,
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

// Test 1: Score increment (+1) on cat stability
describe("Score increment on cat stability", () => {
  let physics: PhysicsEngine;
  let scoreState: ScoreState;

  beforeEach(() => {
    physics = createPhysicsEngine();
    scoreState = createScoreState();
    localStorageMock.clear();
  });

  afterEach(() => {
    cleanupPhysics(physics);
  });

  it("should award +1 point when cat achieves stability", () => {
    const cat = createCatEntity(physics, CANVAS_WIDTH / 2, 500);
    const initialScore = scoreState.score;

    // Award points for stable cat (landing on ground)
    const result = awardStabilityPoints(scoreState, cat, null);

    expect(result.pointsAwarded).toBeGreaterThanOrEqual(POINTS_PER_STACK);
    expect(scoreState.score).toBe(initialScore + result.pointsAwarded);
  });

  it("should increment score by exactly 1 for non-perfect landing", () => {
    // Create a cat far from center (not perfect)
    const cat = createCatEntity(physics, CANVAS_WIDTH / 2 + 100, 500);
    const initialScore = scoreState.score;

    const result = awardStabilityPoints(scoreState, cat, null);

    // Should only award base points (not perfect)
    expect(result.isPerfect).toBe(false);
    expect(result.pointsAwarded).toBe(POINTS_PER_STACK);
    expect(scoreState.score).toBe(initialScore + POINTS_PER_STACK);
  });

  it("should accumulate score across multiple stable cats", () => {
    const cat1 = createCatEntity(physics, CANVAS_WIDTH / 2 + 50, 500);
    const cat2 = createCatEntity(physics, CANVAS_WIDTH / 2 + 60, 450);
    const cat3 = createCatEntity(physics, CANVAS_WIDTH / 2 + 70, 400);

    awardStabilityPoints(scoreState, cat1, null);
    awardStabilityPoints(scoreState, cat2, cat1);
    awardStabilityPoints(scoreState, cat3, cat2);

    expect(scoreState.score).toBeGreaterThanOrEqual(3 * POINTS_PER_STACK);
  });
});

// Test 2: Perfect landing detection (10-15% center offset)
describe("Perfect landing detection", () => {
  let physics: PhysicsEngine;

  beforeEach(() => {
    physics = createPhysicsEngine();
  });

  afterEach(() => {
    cleanupPhysics(physics);
  });

  it("should detect perfect landing when offset is within threshold", () => {
    // Perfect threshold is 12.5% of CAT_WIDTH (80 * 0.125 = 10 pixels)
    const perfectThresholdPixels = CAT_WIDTH * PERFECT_THRESHOLD;

    // Offset exactly at threshold should be perfect
    expect(isPerfectLanding(perfectThresholdPixels)).toBe(true);

    // Offset below threshold should be perfect
    expect(isPerfectLanding(perfectThresholdPixels - 1)).toBe(true);

    // Zero offset should be perfect
    expect(isPerfectLanding(0)).toBe(true);
  });

  it("should reject landing when offset exceeds threshold", () => {
    const perfectThresholdPixels = CAT_WIDTH * PERFECT_THRESHOLD;

    // Offset just above threshold should not be perfect
    expect(isPerfectLanding(perfectThresholdPixels + 1)).toBe(false);

    // Large offset should not be perfect
    expect(isPerfectLanding(50)).toBe(false);
  });

  it("should calculate correct offset from cat below", () => {
    const catBelow = createCatEntity(physics, 400, 500);
    const catAbove = createCatEntity(physics, 420, 450);

    const offset = calculateLandingOffset(catAbove, catBelow);

    expect(offset).toBe(20); // |420 - 400| = 20
  });

  it("should calculate correct offset from ground center", () => {
    const groundCenterX = CANVAS_WIDTH / 2; // 360
    const cat = createCatEntity(physics, 370, 500);

    const offset = calculateLandingOffset(cat, null);

    expect(offset).toBe(10); // |370 - 360| = 10
  });
});

// Test 3: Perfect landing bonus (+2 points)
describe("Perfect landing bonus", () => {
  let physics: PhysicsEngine;
  let scoreState: ScoreState;

  beforeEach(() => {
    physics = createPhysicsEngine();
    scoreState = createScoreState();
    localStorageMock.clear();
  });

  afterEach(() => {
    cleanupPhysics(physics);
  });

  it("should award +2 bonus for perfect landing", () => {
    // Create cat exactly at ground center (perfect landing)
    const cat = createCatEntity(physics, CANVAS_WIDTH / 2, 500);
    const initialScore = scoreState.score;

    const result = awardStabilityPoints(scoreState, cat, null);

    expect(result.isPerfect).toBe(true);
    expect(result.pointsAwarded).toBe(POINTS_PER_STACK + PERFECT_BONUS);
    expect(scoreState.score).toBe(initialScore + POINTS_PER_STACK + PERFECT_BONUS);
  });

  it("should set showingPerfect flag for perfect landing", () => {
    const cat = createCatEntity(physics, CANVAS_WIDTH / 2, 500);

    expect(scoreState.showingPerfect).toBe(false);

    awardStabilityPoints(scoreState, cat, null);

    expect(scoreState.showingPerfect).toBe(true);
    expect(scoreState.perfectDisplayTime).toBeGreaterThan(0);
  });

  it("should NOT award bonus for non-perfect landing", () => {
    // Create cat far from center (not perfect)
    const cat = createCatEntity(physics, CANVAS_WIDTH / 2 + 50, 500);
    const initialScore = scoreState.score;

    const result = awardStabilityPoints(scoreState, cat, null);

    expect(result.isPerfect).toBe(false);
    expect(result.pointsAwarded).toBe(POINTS_PER_STACK);
    expect(scoreState.score).toBe(initialScore + POINTS_PER_STACK);
    expect(scoreState.showingPerfect).toBe(false);
  });

  it("should detect perfect landing when stacking on another cat", () => {
    const catBelow = createCatEntity(physics, 400, 500);
    // Create cat exactly aligned with cat below
    const catAbove = createCatEntity(physics, 400, 450);

    const result = awardStabilityPoints(scoreState, catAbove, catBelow);

    expect(result.isPerfect).toBe(true);
    expect(result.pointsAwarded).toBe(POINTS_PER_STACK + PERFECT_BONUS);
  });
});

// Test 4: High score localStorage persistence
describe("High score localStorage persistence", () => {
  let scoreState: ScoreState;

  beforeEach(() => {
    localStorageMock.clear();
    scoreState = createScoreState();
  });

  it("should save high score to localStorage", () => {
    saveHighScore(10);

    expect(localStorageMock.getItem(HIGH_SCORE_KEY)).toBe("10");
  });

  it("should load high score from localStorage", () => {
    localStorageMock.setItem(HIGH_SCORE_KEY, "25");

    const highScore = loadHighScore();

    expect(highScore).toBe(25);
  });

  it("should return 0 when no high score is saved", () => {
    localStorageMock.clear();

    const highScore = loadHighScore();

    expect(highScore).toBe(0);
  });

  it("should update high score when current score is higher", () => {
    scoreState.score = 15;
    scoreState.highScore = 10;

    const wasBeaten = updateHighScore(scoreState);

    expect(wasBeaten).toBe(true);
    expect(scoreState.highScore).toBe(15);
    expect(localStorageMock.getItem(HIGH_SCORE_KEY)).toBe("15");
  });

  it("should NOT update high score when current score is lower", () => {
    scoreState.score = 5;
    scoreState.highScore = 10;

    const wasBeaten = updateHighScore(scoreState);

    expect(wasBeaten).toBe(false);
    expect(scoreState.highScore).toBe(10);
  });

  it("should preserve high score after score reset", () => {
    scoreState.score = 20;
    scoreState.highScore = 20;

    resetScore(scoreState);

    expect(scoreState.score).toBe(0);
    expect(scoreState.highScore).toBe(20);
  });
});

// Test 5: Game state transitions (start -> playing -> gameover)
describe("Game state transitions", () => {
  let gameState: GameState;
  let physics: PhysicsEngine;
  let mockInputHandler: ReturnType<typeof createMockInputHandler>;

  beforeEach(() => {
    gameState = createGameState();
    physics = createPhysicsEngine();
    mockInputHandler = createMockInputHandler();
    localStorageMock.clear();
  });

  afterEach(() => {
    cleanupPhysics(physics);
    mockInputHandler.cleanup();
  });

  it("should initialize in start state", () => {
    expect(getCurrentState(gameState)).toBe("start");
    expect(isStartState(gameState)).toBe(true);
    expect(isPlayingState(gameState)).toBe(false);
    expect(isGameOverState(gameState)).toBe(false);
  });

  it("should transition from start to playing", () => {
    transitionToPlaying(gameState, mockInputHandler);

    expect(getCurrentState(gameState)).toBe("playing");
    expect(isStartState(gameState)).toBe(false);
    expect(isPlayingState(gameState)).toBe(true);
    expect(gameState.hasStarted).toBe(true);
  });

  it("should transition from playing to gameover", () => {
    transitionToPlaying(gameState, mockInputHandler);
    transitionToGameOver(gameState, mockInputHandler);

    expect(getCurrentState(gameState)).toBe("gameover");
    expect(isGameOverState(gameState)).toBe(true);
    expect(isPlayingState(gameState)).toBe(false);
  });

  it("should allow drop only in playing state", () => {
    expect(canDropCat(gameState)).toBe(false); // start state

    transitionToPlaying(gameState, mockInputHandler);
    expect(canDropCat(gameState)).toBe(true); // playing state

    transitionToGameOver(gameState, mockInputHandler);
    expect(canDropCat(gameState)).toBe(false); // gameover state
  });

  it("should update high score on transition to gameover", () => {
    transitionToPlaying(gameState, mockInputHandler);
    gameState.scoreState.score = 15;
    gameState.scoreState.highScore = 10;

    transitionToGameOver(gameState, mockInputHandler);

    expect(gameState.beatHighScore).toBe(true);
    expect(gameState.scoreState.highScore).toBe(15);
  });
});

// Test 6: Game restart with proper physics cleanup
describe("Game restart with physics cleanup", () => {
  let gameState: GameState;
  let physics: PhysicsEngine;
  let mockInputHandler: ReturnType<typeof createMockInputHandler>;

  beforeEach(() => {
    gameState = createGameState();
    physics = createPhysicsEngine();
    createGroundPlatform(physics);
    mockInputHandler = createMockInputHandler();
    localStorageMock.clear();
  });

  afterEach(() => {
    cleanupPhysics(physics);
    mockInputHandler.cleanup();
  });

  it("should clear all cat bodies from physics world on restart", () => {
    // Start playing and add some cats
    transitionToPlaying(gameState, mockInputHandler);

    const cat1 = createCatEntity(physics, CANVAS_WIDTH / 2, 500);
    const cat2 = createCatEntity(physics, CANVAS_WIDTH / 2, 450);
    gameState.towerState.cats.push(cat1, cat2);

    expect(getAllCatBodies(physics).length).toBe(2);

    // Trigger game over and restart
    transitionToGameOver(gameState, mockInputHandler);
    restartGame(gameState, physics, mockInputHandler);

    // All cats should be cleared
    expect(getAllCatBodies(physics).length).toBe(0);
  });

  it("should reset score but preserve high score on restart", () => {
    transitionToPlaying(gameState, mockInputHandler);
    gameState.scoreState.score = 20;
    gameState.scoreState.highScore = 20;

    transitionToGameOver(gameState, mockInputHandler);
    restartGame(gameState, physics, mockInputHandler);

    expect(gameState.scoreState.score).toBe(0);
    expect(gameState.scoreState.highScore).toBe(20);
  });

  it("should reset stacked cats count on restart", () => {
    transitionToPlaying(gameState, mockInputHandler);
    gameState.towerState.stackedCount = 10;

    transitionToGameOver(gameState, mockInputHandler);
    restartGame(gameState, physics, mockInputHandler);

    expect(gameState.towerState.stackedCount).toBe(0);
  });

  it("should reset difficulty to base level on restart", () => {
    transitionToPlaying(gameState, mockInputHandler);
    gameState.towerState.difficultyLevel = 3;
    gameState.pendulumState.speedMultiplier = 1.5;

    transitionToGameOver(gameState, mockInputHandler);
    restartGame(gameState, physics, mockInputHandler);

    expect(gameState.towerState.difficultyLevel).toBe(0);
    expect(gameState.pendulumState.speedMultiplier).toBe(1.0);
  });

  it("should transition to playing state after restart", () => {
    transitionToPlaying(gameState, mockInputHandler);
    transitionToGameOver(gameState, mockInputHandler);
    restartGame(gameState, physics, mockInputHandler);

    expect(getCurrentState(gameState)).toBe("playing");
    expect(canDropCat(gameState)).toBe(true);
  });

  it("should clear fallen cat flag on restart", () => {
    transitionToPlaying(gameState, mockInputHandler);
    gameState.towerState.hasFallenCat = true;

    transitionToGameOver(gameState, mockInputHandler);
    restartGame(gameState, physics, mockInputHandler);

    expect(gameState.towerState.hasFallenCat).toBe(false);
  });
});
