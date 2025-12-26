/**
 * Task 3.1: Win Detection and Game Flow Tests
 *
 * These 6 focused tests verify:
 * 1. Win line crossing detection for stable (sticky) cats
 * 2. Win state is NOT triggered for falling/unstable cats
 * 3. Cat count tracking (dropped and lost)
 * 4. Game flow from playing to win state
 * 5. Fallen cat removal without ending the game
 * 6. Win condition check returns false when no cats cross line
 */

import Matter from "matter-js";
import {
  createPhysicsEngine,
  createGroundPlatform,
  cleanupPhysics,
  PhysicsEngine,
  makeCatStatic,
  CAT_WIDTH,
} from "@/lib/game/physics";
import {
  createCatEntity,
  CatEntity,
  isCatSticky,
  CAT_HEIGHT,
} from "@/lib/game/cat";
import {
  createTowerState,
  TowerState,
  addCatToTower,
  checkWinCondition,
  removeCatFromTower,
  getStickyCatCount,
} from "@/lib/game/tower";
import {
  createGameState,
  getCurrentState,
  transitionToPlaying,
  transitionToWin,
  incrementCatsDropped,
  incrementCatsLost,
  getCatStats,
  GameState,
} from "@/lib/game/state";
import { createMockInputHandler } from "@/lib/game/input";
import {
  WIN_LINE_Y,
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

// Test 1: Win line crossing detection for stable (sticky) cats
describe("Win line crossing detection for stable cats", () => {
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

  it("should detect win when a sticky cat's top edge is above WIN_LINE_Y", () => {
    // Create a cat positioned so its top edge is above the win line
    // Win line is at Y=128, cat is 60px tall, so center at 128 + 30 = 158 would put top at 128
    // Place it slightly above to ensure crossing
    const catY = WIN_LINE_Y - 10; // Top edge will be at WIN_LINE_Y - 10 - 30 = very above win line
    const cat = createCatEntity(physics, CANVAS_WIDTH / 2, catY);
    addCatToTower(tower, cat);

    // Make the cat sticky (static)
    makeCatStatic(cat);

    const winDetected = checkWinCondition(tower);

    expect(winDetected).toBe(true);
  });

  it("should detect win when sticky cat top edge exactly at WIN_LINE_Y", () => {
    // Cat center at WIN_LINE_Y + CAT_HEIGHT/2 puts top edge exactly at WIN_LINE_Y
    const catY = WIN_LINE_Y + CAT_HEIGHT / 2;
    const cat = createCatEntity(physics, CANVAS_WIDTH / 2, catY);
    addCatToTower(tower, cat);

    makeCatStatic(cat);

    const winDetected = checkWinCondition(tower);

    // Top edge is exactly at win line, should count as crossing
    expect(winDetected).toBe(true);
  });

  it("should NOT detect win when sticky cat is below win line", () => {
    // Place cat well below the win line
    const catY = CANVAS_HEIGHT - 200;
    const cat = createCatEntity(physics, CANVAS_WIDTH / 2, catY);
    addCatToTower(tower, cat);

    makeCatStatic(cat);

    const winDetected = checkWinCondition(tower);

    expect(winDetected).toBe(false);
  });
});

// Test 2: Win state is NOT triggered for falling/unstable cats
describe("Win state NOT triggered for falling/unstable cats", () => {
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

  it("should NOT detect win for falling cat crossing win line", () => {
    // Create a cat above the win line but NOT sticky (still falling)
    const catY = WIN_LINE_Y - 50;
    const cat = createCatEntity(physics, CANVAS_WIDTH / 2, catY);
    addCatToTower(tower, cat);

    // Cat is not made static - it's still "falling"
    expect(cat.body.isStatic).toBe(false);

    const winDetected = checkWinCondition(tower);

    expect(winDetected).toBe(false);
  });

  it("should NOT detect win when only unstable cats are present above line", () => {
    // Create multiple cats, none are sticky
    const cat1 = createCatEntity(physics, CANVAS_WIDTH / 2, WIN_LINE_Y - 30);
    const cat2 = createCatEntity(physics, CANVAS_WIDTH / 2, WIN_LINE_Y - 100);
    addCatToTower(tower, cat1);
    addCatToTower(tower, cat2);

    // Neither cat is sticky
    expect(isCatSticky(cat1)).toBe(false);
    expect(isCatSticky(cat2)).toBe(false);

    const winDetected = checkWinCondition(tower);

    expect(winDetected).toBe(false);
  });
});

// Test 3: Cat count tracking (dropped and lost)
describe("Cat count tracking system", () => {
  let gameState: GameState;

  beforeEach(() => {
    gameState = createGameState();
    localStorageMock.clear();
  });

  it("should increment catsDropped counter", () => {
    expect(gameState.catsDropped).toBe(0);

    incrementCatsDropped(gameState);
    expect(gameState.catsDropped).toBe(1);

    incrementCatsDropped(gameState);
    incrementCatsDropped(gameState);
    expect(gameState.catsDropped).toBe(3);
  });

  it("should increment catsLost counter", () => {
    expect(gameState.catsLost).toBe(0);

    incrementCatsLost(gameState);
    expect(gameState.catsLost).toBe(1);

    incrementCatsLost(gameState);
    expect(gameState.catsLost).toBe(2);
  });

  it("should calculate stacked cats correctly from getCatStats", () => {
    // Drop 10 cats, lose 3
    for (let i = 0; i < 10; i++) {
      incrementCatsDropped(gameState);
    }
    for (let i = 0; i < 3; i++) {
      incrementCatsLost(gameState);
    }

    const stats = getCatStats(gameState);

    expect(stats.dropped).toBe(10);
    expect(stats.lost).toBe(3);
    expect(stats.stacked).toBe(7); // 10 - 3 = 7
  });

  it("should return all stats as zero for fresh game state", () => {
    const stats = getCatStats(gameState);

    expect(stats.dropped).toBe(0);
    expect(stats.lost).toBe(0);
    expect(stats.stacked).toBe(0);
  });
});

// Test 4: Game flow from playing to win state
describe("Game flow from playing to win state", () => {
  let gameState: GameState;
  let physics: PhysicsEngine;
  let mockInputHandler: ReturnType<typeof createMockInputHandler>;

  beforeEach(() => {
    gameState = createGameState();
    physics = createPhysicsEngine();
    mockInputHandler = createMockInputHandler();
    localStorageMock.clear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    cleanupPhysics(physics);
    mockInputHandler.cleanup();
    jest.useRealTimers();
  });

  it("should transition from playing to win when win condition is met", () => {
    transitionToPlaying(gameState, mockInputHandler);
    gameState.gameMode = "reachTheTop";

    expect(getCurrentState(gameState)).toBe("playing");

    // Simulate game progress
    gameState.catsDropped = 8;
    gameState.catsLost = 1;

    // Trigger win
    transitionToWin(gameState, mockInputHandler);

    expect(getCurrentState(gameState)).toBe("win");
  });

  it("should preserve cat stats when transitioning to win", () => {
    transitionToPlaying(gameState, mockInputHandler);
    gameState.gameMode = "reachTheTop";
    gameState.catsDropped = 15;
    gameState.catsLost = 4;

    transitionToWin(gameState, mockInputHandler);

    const stats = getCatStats(gameState);
    expect(stats.dropped).toBe(15);
    expect(stats.lost).toBe(4);
    expect(stats.stacked).toBe(11);
  });
});

// Test 5: Fallen cat removal without ending the game
describe("Fallen cat removal in Reach the Top mode", () => {
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

  it("should remove a cat from the tower when removeCatFromTower is called", () => {
    const cat = createCatEntity(physics, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 200);
    addCatToTower(tower, cat);

    expect(tower.cats.length).toBe(1);

    removeCatFromTower(tower, cat, physics);

    expect(tower.cats.length).toBe(0);
  });

  it("should remove cat body from physics world when removed from tower", () => {
    const cat = createCatEntity(physics, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 200);
    addCatToTower(tower, cat);

    const bodiesBefore = Matter.Composite.allBodies(physics.world);
    const catBodyInWorld = bodiesBefore.includes(cat.body);
    expect(catBodyInWorld).toBe(true);

    removeCatFromTower(tower, cat, physics);

    const bodiesAfter = Matter.Composite.allBodies(physics.world);
    expect(bodiesAfter.includes(cat.body)).toBe(false);
  });

  it("should not affect other cats when one is removed", () => {
    const cat1 = createCatEntity(physics, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 200);
    const cat2 = createCatEntity(physics, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 300);
    addCatToTower(tower, cat1);
    addCatToTower(tower, cat2);

    expect(tower.cats.length).toBe(2);

    removeCatFromTower(tower, cat1, physics);

    expect(tower.cats.length).toBe(1);
    expect(tower.cats[0]).toBe(cat2);
  });
});

// Test 6: Win condition check returns false when no cats cross line
describe("Win condition edge cases", () => {
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

  it("should return false when tower is empty", () => {
    expect(tower.cats.length).toBe(0);

    const winDetected = checkWinCondition(tower);

    expect(winDetected).toBe(false);
  });

  it("should return false when all cats are below win line even if sticky", () => {
    // Create multiple sticky cats all below the win line
    const cat1 = createCatEntity(physics, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 100);
    const cat2 = createCatEntity(physics, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 200);
    const cat3 = createCatEntity(physics, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 300);

    addCatToTower(tower, cat1);
    addCatToTower(tower, cat2);
    addCatToTower(tower, cat3);

    // Make all cats sticky
    makeCatStatic(cat1);
    makeCatStatic(cat2);
    makeCatStatic(cat3);

    const winDetected = checkWinCondition(tower);

    expect(winDetected).toBe(false);
  });

  it("should detect win with multiple sticky cats when at least one crosses line", () => {
    // Create cats at various heights
    const cat1 = createCatEntity(physics, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 100);
    const cat2 = createCatEntity(physics, CANVAS_WIDTH / 2, WIN_LINE_Y - 10); // Above win line

    addCatToTower(tower, cat1);
    addCatToTower(tower, cat2);

    // Make all cats sticky
    makeCatStatic(cat1);
    makeCatStatic(cat2);

    const winDetected = checkWinCondition(tower);

    expect(winDetected).toBe(true);
  });
});
