/**
 * Task 8.3: Strategic Integration Tests for Cat Stacking Mini-Game
 *
 * These tests focus on integration points and end-to-end workflows
 * that are not covered by the unit tests in Task Groups 1-6.
 *
 * Tests included:
 * 1. Complete end-to-end "Reach the Top" flow (mode select -> play -> win)
 * 2. Mode switching and proper state cleanup
 * 3. Best score tracking for "reachTheTop" mode (localStorage persistence)
 * 4. Sticky landing in context of building a tower
 * 5. Game over screen "Change Mode" button functionality
 * 6. Win detection integration with tower building
 * 7. Cat stats tracking during full game flow
 * 8. Restart game in "reachTheTop" mode resets properly
 */

import Matter from "matter-js";
import {
  createGameState,
  transitionToModeSelect,
  selectGameMode,
  transitionToWin,
  transitionToGameOver,
  restartGame,
  getCurrentState,
  isPlayingState,
  isWinState,
  isGameOverState,
  isModeSelectState,
  incrementCatsDropped,
  incrementCatsLost,
  getCatStats,
  GameState,
} from "@/lib/game/state";
import {
  createPhysicsEngine,
  createGroundPlatform,
  cleanupPhysics,
  PhysicsEngine,
  makeCatStatic,
} from "@/lib/game/physics";
import { createMockInputHandler, checkGameOverButtonClick } from "@/lib/game/input";
import {
  createTowerState,
  addCatToTower,
  updateTowerReachTheTop,
  checkWinCondition,
  clearTower,
  TowerState,
} from "@/lib/game/tower";
import {
  createCatEntity,
  CatEntity,
  CAT_HEIGHT,
} from "@/lib/game/cat";
import {
  createScoreState,
  updateReachTopBest,
  loadReachTopBest,
  saveReachTopBest,
  getReachTopBest,
  isNewReachTopBest,
  ScoreState,
} from "@/lib/game/scoring";
import {
  WIN_LINE_Y,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  REACH_TOP_BEST_KEY,
} from "@/lib/constants";
import { GAME_OVER_BUTTON_BOUNDS } from "@/lib/game/renderer";

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
// Test 1: Complete end-to-end "Reach the Top" flow
// ============================================================================
describe("Integration: Complete Reach the Top game flow", () => {
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

  it("should complete full flow: start -> modeSelect -> play -> build tower -> win", () => {
    // 1. Start at initial state
    expect(getCurrentState(gameState)).toBe("start");

    // 2. Transition to mode select
    transitionToModeSelect(gameState, physics, mockInputHandler);
    expect(isModeSelectState(gameState)).toBe(true);

    // 3. Select "reachTheTop" mode
    selectGameMode(gameState, "reachTheTop", mockInputHandler);
    expect(isPlayingState(gameState)).toBe(true);
    expect(gameState.gameMode).toBe("reachTheTop");
    expect(gameState.catsDropped).toBe(0);
    expect(gameState.catsLost).toBe(0);

    // 4. Simulate dropping cats and building tower
    const tower = gameState.towerState;

    // Drop first cat (lands on ground)
    incrementCatsDropped(gameState);
    const cat1 = createCatEntity(physics, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 150);
    addCatToTower(tower, cat1);
    makeCatStatic(cat1); // Simulate becoming sticky

    // Drop more cats to build tower toward win line
    for (let i = 1; i < 5; i++) {
      incrementCatsDropped(gameState);
      const cat = createCatEntity(
        physics,
        CANVAS_WIDTH / 2,
        CANVAS_HEIGHT - 150 - i * (CAT_HEIGHT + 10)
      );
      addCatToTower(tower, cat);
      makeCatStatic(cat);
    }

    // Simulate one cat falling off
    incrementCatsLost(gameState);

    // 5. Verify cat stats
    const stats = getCatStats(gameState);
    expect(stats.dropped).toBe(5);
    expect(stats.lost).toBe(1);
    expect(stats.stacked).toBe(4);

    // 6. Drop winning cat above win line
    incrementCatsDropped(gameState);
    const winningCat = createCatEntity(physics, CANVAS_WIDTH / 2, WIN_LINE_Y - 50);
    addCatToTower(tower, winningCat);
    makeCatStatic(winningCat);

    // 7. Check win condition
    const hasWon = checkWinCondition(tower);
    expect(hasWon).toBe(true);

    // 8. Transition to win state
    transitionToWin(gameState, mockInputHandler);
    expect(isWinState(gameState)).toBe(true);

    // 9. Verify cat stats preserved
    expect(gameState.catsDropped).toBe(6);
    expect(gameState.catsLost).toBe(1);
  });
});

// ============================================================================
// Test 2: Mode switching and proper state cleanup
// ============================================================================
describe("Integration: Mode switching with state cleanup", () => {
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

  it("should properly clean up state when switching from classic to reachTheTop", () => {
    // Start in classic mode
    transitionToModeSelect(gameState, physics, mockInputHandler);
    selectGameMode(gameState, "classic", mockInputHandler);
    expect(gameState.gameMode).toBe("classic");

    // Add some cats to tower
    const cat1 = createCatEntity(physics, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 150);
    addCatToTower(gameState.towerState, cat1);
    gameState.scoreState.score = 5;

    // Switch to mode select (should clean up)
    transitionToModeSelect(gameState, physics, mockInputHandler);

    // Verify cleanup
    expect(gameState.scoreState.score).toBe(0);
    expect(gameState.towerState.cats.length).toBe(0);
    expect(gameState.catsDropped).toBe(0);
    expect(gameState.catsLost).toBe(0);

    // Select reachTheTop mode
    selectGameMode(gameState, "reachTheTop", mockInputHandler);
    expect(gameState.gameMode).toBe("reachTheTop");
    expect(isPlayingState(gameState)).toBe(true);
  });

  it("should properly clean up state when switching from win to mode select", () => {
    // Get to win state in reachTheTop mode
    transitionToModeSelect(gameState, physics, mockInputHandler);
    selectGameMode(gameState, "reachTheTop", mockInputHandler);
    gameState.catsDropped = 10;
    gameState.catsLost = 2;
    transitionToWin(gameState, mockInputHandler);

    expect(isWinState(gameState)).toBe(true);
    expect(gameState.catsDropped).toBe(10);

    // Switch to mode select
    transitionToModeSelect(gameState, physics, mockInputHandler);

    // Verify cleanup
    expect(isModeSelectState(gameState)).toBe(true);
    expect(gameState.catsDropped).toBe(0);
    expect(gameState.catsLost).toBe(0);
    expect(gameState.towerState.cats.length).toBe(0);
  });
});

// ============================================================================
// Test 3: Best score tracking for "reachTheTop" mode
// ============================================================================
describe("Integration: Reach the Top best score persistence", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it("should save and load best score from localStorage", () => {
    const scoreState = createScoreState();

    // Initially no best score
    expect(getReachTopBest(scoreState)).toBeNull();
    expect(loadReachTopBest()).toBeNull();

    // Win with 8 cats
    const isNewBest = updateReachTopBest(scoreState, 8);
    expect(isNewBest).toBe(true);
    expect(getReachTopBest(scoreState)).toBe(8);

    // Verify localStorage persistence
    expect(loadReachTopBest()).toBe(8);

    // Create new score state (simulates game restart)
    const newScoreState = createScoreState();
    expect(getReachTopBest(newScoreState)).toBe(8);
  });

  it("should update best when achieving lower cat count", () => {
    const scoreState = createScoreState();

    // First win with 10 cats
    updateReachTopBest(scoreState, 10);
    expect(getReachTopBest(scoreState)).toBe(10);

    // Second win with 7 cats (better!)
    const isNewBest = updateReachTopBest(scoreState, 7);
    expect(isNewBest).toBe(true);
    expect(getReachTopBest(scoreState)).toBe(7);
  });

  it("should NOT update best when achieving higher cat count", () => {
    const scoreState = createScoreState();

    // First win with 5 cats
    updateReachTopBest(scoreState, 5);
    expect(getReachTopBest(scoreState)).toBe(5);

    // Second win with 8 cats (worse)
    const isNewBest = updateReachTopBest(scoreState, 8);
    expect(isNewBest).toBe(false);
    expect(getReachTopBest(scoreState)).toBe(5); // Still 5
  });

  it("should correctly check if score would be new best", () => {
    const scoreState = createScoreState();

    // No previous best
    expect(isNewReachTopBest(scoreState, 10)).toBe(true);

    // Set a best
    updateReachTopBest(scoreState, 10);

    // Check various scores
    expect(isNewReachTopBest(scoreState, 8)).toBe(true); // Lower is better
    expect(isNewReachTopBest(scoreState, 10)).toBe(false); // Same is not better
    expect(isNewReachTopBest(scoreState, 12)).toBe(false); // Higher is worse
  });
});

// ============================================================================
// Test 4: Sticky landing in context of building a tower
// ============================================================================
describe("Integration: Sticky landing during tower building", () => {
  let physics: PhysicsEngine;
  let tower: TowerState;

  beforeEach(() => {
    physics = createPhysicsEngine();
    createGroundPlatform(physics);
    tower = createTowerState();
    localStorageMock.clear();
  });

  afterEach(() => {
    cleanupPhysics(physics);
  });

  it("should build tower with sticky cats and track sticky count", () => {
    // Add cats to tower and make them sticky (simulating game progression)
    const cats: CatEntity[] = [];

    for (let i = 0; i < 4; i++) {
      const cat = createCatEntity(
        physics,
        CANVAS_WIDTH / 2,
        CANVAS_HEIGHT - 150 - i * (CAT_HEIGHT + 5)
      );
      addCatToTower(tower, cat);
      makeCatStatic(cat);
      cats.push(cat);
    }

    // Update tower to get sticky count
    const result = updateTowerReachTheTop(tower, physics, 16);

    // All cats should be counted as sticky
    expect(result.stickyCatCount).toBe(4);
    expect(tower.cats.length).toBe(4);
  });

  it("should track fallen cats separately from sticky cats", () => {
    // Add a sticky cat at ground level
    const stickyCat = createCatEntity(physics, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 150);
    addCatToTower(tower, stickyCat);
    makeCatStatic(stickyCat);

    // Add a falling cat (simulate it going off screen)
    const fallingCat = createCatEntity(physics, CANVAS_WIDTH / 2, CANVAS_HEIGHT + 200);
    addCatToTower(tower, fallingCat);

    expect(tower.cats.length).toBe(2);

    // Update tower - falling cat should be removed
    const result = updateTowerReachTheTop(tower, physics, 16);

    expect(result.fallenCats.length).toBe(1);
    expect(result.fallenCats[0]).toBe(fallingCat);
    expect(result.stickyCatCount).toBe(1);
    expect(tower.cats.length).toBe(1);
  });
});

// ============================================================================
// Test 5: Game over screen "Change Mode" button
// ============================================================================
describe("Integration: Game over screen Change Mode button", () => {
  it("should have Change Mode button bounds defined", () => {
    expect(GAME_OVER_BUTTON_BOUNDS).toBeDefined();
    expect(GAME_OVER_BUTTON_BOUNDS.changeMode).toBeDefined();
    expect(GAME_OVER_BUTTON_BOUNDS.changeMode.width).toBeGreaterThan(0);
    expect(GAME_OVER_BUTTON_BOUNDS.changeMode.height).toBeGreaterThan(0);
  });

  it("should detect click on Change Mode button", () => {
    const bounds = GAME_OVER_BUTTON_BOUNDS.changeMode;
    const clickX = bounds.x + bounds.width / 2;
    const clickY = bounds.y + bounds.height / 2;

    const result = checkGameOverButtonClick(clickX, clickY);
    expect(result).toBe("changeMode");
  });

  it("should detect click on Restart button", () => {
    const bounds = GAME_OVER_BUTTON_BOUNDS.restart;
    const clickX = bounds.x + bounds.width / 2;
    const clickY = bounds.y + bounds.height / 2;

    const result = checkGameOverButtonClick(clickX, clickY);
    expect(result).toBe("restart");
  });

  it("should return null for clicks outside buttons", () => {
    const result = checkGameOverButtonClick(10, 10);
    expect(result).toBeNull();
  });
});

// ============================================================================
// Test 6: Win detection integration with tower building
// ============================================================================
describe("Integration: Win detection with physical tower", () => {
  let physics: PhysicsEngine;
  let tower: TowerState;

  beforeEach(() => {
    physics = createPhysicsEngine();
    createGroundPlatform(physics);
    tower = createTowerState();
    localStorageMock.clear();
  });

  afterEach(() => {
    cleanupPhysics(physics);
  });

  it("should detect win when building tower reaches win line", () => {
    // Build a tower progressively from the ground up
    // Only add cats whose top edge (catY - CAT_HEIGHT/2) stays below WIN_LINE_Y
    // Win line is at Y=128, so cat center must be > 128 + 30 = 158 to not trigger win
    const startY = CANVAS_HEIGHT - 150; // ~1130
    const catSpacing = CAT_HEIGHT + 5; // 65 pixels between cat centers
    const minSafeCatY = WIN_LINE_Y + CAT_HEIGHT / 2 + 10; // ~168 - safe margin above win line

    // Calculate how many cats we can stack safely below the win line
    // Cat at position i has center at: startY - i * catSpacing
    // We want: startY - i * catSpacing > minSafeCatY
    // So: i < (startY - minSafeCatY) / catSpacing
    const maxSafeIndex = Math.floor((startY - minSafeCatY) / catSpacing);

    // Build tower cat by cat, staying safely below win line
    for (let i = 0; i <= maxSafeIndex; i++) {
      const catY = startY - i * catSpacing;
      const cat = createCatEntity(physics, CANVAS_WIDTH / 2, catY);
      addCatToTower(tower, cat);
      makeCatStatic(cat);

      // All these cats should be below the win line
      expect(checkWinCondition(tower)).toBe(false);
    }

    // Now add a winning cat above the win line
    const winY = WIN_LINE_Y - 10; // Above win line
    const winCat = createCatEntity(physics, CANVAS_WIDTH / 2, winY);
    addCatToTower(tower, winCat);
    makeCatStatic(winCat);

    // Now should win
    expect(checkWinCondition(tower)).toBe(true);
  });

  it("should NOT win with unstable cats above win line", () => {
    // Add cat above win line but NOT static
    const cat = createCatEntity(physics, CANVAS_WIDTH / 2, WIN_LINE_Y - 50);
    addCatToTower(tower, cat);
    // Do NOT make it static - it's still "falling"

    expect(cat.body.isStatic).toBe(false);
    expect(checkWinCondition(tower)).toBe(false);
  });
});

// ============================================================================
// Test 7: Cat stats tracking during full game flow
// ============================================================================
describe("Integration: Cat stats tracking during game", () => {
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

  it("should accurately track dropped, lost, and stacked cats", () => {
    transitionToModeSelect(gameState, physics, mockInputHandler);
    selectGameMode(gameState, "reachTheTop", mockInputHandler);

    // Simulate game session
    // Drop 12 cats total
    for (let i = 0; i < 12; i++) {
      incrementCatsDropped(gameState);
    }

    // 3 cats fell off
    incrementCatsLost(gameState);
    incrementCatsLost(gameState);
    incrementCatsLost(gameState);

    const stats = getCatStats(gameState);

    expect(stats.dropped).toBe(12);
    expect(stats.lost).toBe(3);
    expect(stats.stacked).toBe(9); // 12 - 3 = 9
  });

  it("should reset stats when transitioning to mode select", () => {
    transitionToModeSelect(gameState, physics, mockInputHandler);
    selectGameMode(gameState, "reachTheTop", mockInputHandler);

    // Accumulate stats
    incrementCatsDropped(gameState);
    incrementCatsDropped(gameState);
    incrementCatsLost(gameState);

    expect(gameState.catsDropped).toBe(2);
    expect(gameState.catsLost).toBe(1);

    // Return to mode select
    transitionToModeSelect(gameState, physics, mockInputHandler);

    // Stats should be reset
    expect(gameState.catsDropped).toBe(0);
    expect(gameState.catsLost).toBe(0);
  });
});

// ============================================================================
// Test 8: Restart game in "reachTheTop" mode
// ============================================================================
describe("Integration: Restart in Reach the Top mode", () => {
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

  it("should reset all state properly on restart while preserving mode", () => {
    // Setup: Start in reachTheTop mode
    transitionToModeSelect(gameState, physics, mockInputHandler);
    selectGameMode(gameState, "reachTheTop", mockInputHandler);

    // Play the game
    const tower = gameState.towerState;
    for (let i = 0; i < 5; i++) {
      incrementCatsDropped(gameState);
      const cat = createCatEntity(
        physics,
        CANVAS_WIDTH / 2,
        CANVAS_HEIGHT - 150 - i * (CAT_HEIGHT + 10)
      );
      addCatToTower(tower, cat);
      makeCatStatic(cat);
    }
    incrementCatsLost(gameState);

    // Verify state before restart
    expect(gameState.catsDropped).toBe(5);
    expect(gameState.catsLost).toBe(1);
    expect(tower.cats.length).toBe(5);

    // Restart the game
    restartGame(gameState, physics, mockInputHandler);

    // Verify reset
    expect(isPlayingState(gameState)).toBe(true);
    expect(gameState.catsDropped).toBe(0);
    expect(gameState.catsLost).toBe(0);
    expect(gameState.towerState.cats.length).toBe(0);
    expect(gameState.towerState.stackedCount).toBe(0);
    expect(gameState.pendulumState.speedMultiplier).toBe(1.0);
  });

  it("should preserve best score through restart", () => {
    // Setup: Win a game and set a best score
    transitionToModeSelect(gameState, physics, mockInputHandler);
    selectGameMode(gameState, "reachTheTop", mockInputHandler);
    gameState.catsDropped = 8;

    // Save a best score
    updateReachTopBest(gameState.scoreState, 8);
    expect(getReachTopBest(gameState.scoreState)).toBe(8);

    // Win the game
    transitionToWin(gameState, mockInputHandler);

    // Restart
    restartGame(gameState, physics, mockInputHandler);

    // Best score should be preserved
    expect(getReachTopBest(gameState.scoreState)).toBe(8);
    expect(loadReachTopBest()).toBe(8);
  });
});
