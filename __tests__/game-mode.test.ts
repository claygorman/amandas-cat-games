/**
 * Task 1.1: Game Mode System Foundation Tests
 *
 * These 6 focused tests verify:
 * 1. Game mode type definitions ("classic" | "reachTheTop")
 * 2. Mode selection state transitions
 * 3. Mode-specific state properties initialization
 * 4. Win state transition logic
 * 5. State input handling for mode select and win states
 * 6. Full state flow: start -> modeSelect -> playing -> win
 */

import {
  createGameState,
  getCurrentState,
  transitionToModeSelect,
  transitionToPlaying,
  transitionToWin,
  selectGameMode,
  handleStateInput,
  isModeSelectState,
  isWinState,
  GameState,
} from "@/lib/game/state";
import {
  createPhysicsEngine,
  cleanupPhysics,
  PhysicsEngine,
} from "@/lib/game/physics";
import { createMockInputHandler } from "@/lib/game/input";

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

// Test 1: Game mode type definitions ("classic" | "reachTheTop")
describe("Game mode type definitions", () => {
  let gameState: GameState;

  beforeEach(() => {
    gameState = createGameState();
    localStorageMock.clear();
  });

  it("should default to 'classic' game mode", () => {
    expect(gameState.gameMode).toBe("classic");
  });

  it("should accept 'classic' as a valid game mode", () => {
    gameState.gameMode = "classic";
    expect(gameState.gameMode).toBe("classic");
  });

  it("should accept 'reachTheTop' as a valid game mode", () => {
    gameState.gameMode = "reachTheTop";
    expect(gameState.gameMode).toBe("reachTheTop");
  });

  it("should initialize catsDropped to 0", () => {
    expect(gameState.catsDropped).toBe(0);
  });

  it("should initialize catsLost to 0", () => {
    expect(gameState.catsLost).toBe(0);
  });
});

// Test 2: Mode selection state transitions
describe("Mode selection state transitions", () => {
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

  it("should transition to modeSelect state", () => {
    transitionToModeSelect(gameState, physics, mockInputHandler);

    expect(getCurrentState(gameState)).toBe("modeSelect");
    expect(isModeSelectState(gameState)).toBe(true);
  });

  it("should transition from start to modeSelect", () => {
    expect(getCurrentState(gameState)).toBe("start");

    transitionToModeSelect(gameState, physics, mockInputHandler);

    expect(getCurrentState(gameState)).toBe("modeSelect");
  });

  it("should enable input handler when transitioning to modeSelect", () => {
    mockInputHandler.disable();

    transitionToModeSelect(gameState, physics, mockInputHandler);

    expect(mockInputHandler.getState().enabled).toBe(true);
  });
});

// Test 3: Mode-specific state properties initialization
describe("Mode-specific state properties initialization", () => {
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

  it("should set gameMode to 'classic' when selecting classic mode", () => {
    transitionToModeSelect(gameState, physics, mockInputHandler);
    selectGameMode(gameState, "classic", mockInputHandler);

    expect(gameState.gameMode).toBe("classic");
  });

  it("should set gameMode to 'reachTheTop' when selecting reach the top mode", () => {
    transitionToModeSelect(gameState, physics, mockInputHandler);
    selectGameMode(gameState, "reachTheTop", mockInputHandler);

    expect(gameState.gameMode).toBe("reachTheTop");
  });

  it("should reset catsDropped and catsLost when selecting a mode", () => {
    gameState.catsDropped = 10;
    gameState.catsLost = 5;

    transitionToModeSelect(gameState, physics, mockInputHandler);
    selectGameMode(gameState, "reachTheTop", mockInputHandler);

    expect(gameState.catsDropped).toBe(0);
    expect(gameState.catsLost).toBe(0);
  });

  it("should transition to playing state after selecting a mode", () => {
    transitionToModeSelect(gameState, physics, mockInputHandler);
    selectGameMode(gameState, "reachTheTop", mockInputHandler);

    expect(getCurrentState(gameState)).toBe("playing");
  });
});

// Test 4: Win state transition logic
describe("Win state transition logic", () => {
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

  it("should transition to win state", () => {
    transitionToPlaying(gameState, mockInputHandler);
    gameState.gameMode = "reachTheTop";

    transitionToWin(gameState, mockInputHandler);

    expect(getCurrentState(gameState)).toBe("win");
    expect(isWinState(gameState)).toBe(true);
  });

  it("should preserve catsDropped count when transitioning to win", () => {
    transitionToPlaying(gameState, mockInputHandler);
    gameState.gameMode = "reachTheTop";
    gameState.catsDropped = 15;

    transitionToWin(gameState, mockInputHandler);

    expect(gameState.catsDropped).toBe(15);
  });

  it("should preserve catsLost count when transitioning to win", () => {
    transitionToPlaying(gameState, mockInputHandler);
    gameState.gameMode = "reachTheTop";
    gameState.catsLost = 3;

    transitionToWin(gameState, mockInputHandler);

    expect(gameState.catsLost).toBe(3);
  });

  it("should disable and re-enable input handler after win transition", () => {
    transitionToPlaying(gameState, mockInputHandler);
    gameState.gameMode = "reachTheTop";

    transitionToWin(gameState, mockInputHandler);

    // Input should be disabled immediately after win
    expect(getCurrentState(gameState)).toBe("win");
    expect(mockInputHandler.getState().enabled).toBe(false);

    // Fast-forward timer to re-enable input
    jest.advanceTimersByTime(600);

    // Input should be re-enabled after delay
    expect(mockInputHandler.getState().enabled).toBe(true);
  });
});

// Test 5: State input handling for mode select and win states
describe("State input handling for mode select and win states", () => {
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

  it("should return 'modeSelect' action when in modeSelect state", () => {
    transitionToModeSelect(gameState, physics, mockInputHandler);

    const result = handleStateInput(gameState, physics, mockInputHandler);

    expect(result.action).toBe("modeSelect");
    expect(result.handled).toBe(false);
  });

  it("should return 'playAgain' action when in win state", () => {
    transitionToPlaying(gameState, mockInputHandler);
    gameState.gameMode = "reachTheTop";
    transitionToWin(gameState, mockInputHandler);

    const result = handleStateInput(gameState, physics, mockInputHandler);

    expect(result.action).toBe("playAgain");
    expect(result.handled).toBe(false);
  });
});

// Test 6: Full state flow: start -> modeSelect -> playing -> win
describe("Full state flow for game modes", () => {
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

  it("should support full classic mode flow: start -> modeSelect -> playing -> gameover", () => {
    // Initial state
    expect(getCurrentState(gameState)).toBe("start");

    // Transition to mode select
    transitionToModeSelect(gameState, physics, mockInputHandler);
    expect(getCurrentState(gameState)).toBe("modeSelect");

    // Select classic mode (transitions to playing)
    selectGameMode(gameState, "classic", mockInputHandler);
    expect(getCurrentState(gameState)).toBe("playing");
    expect(gameState.gameMode).toBe("classic");
  });

  it("should support full reachTheTop mode flow: start -> modeSelect -> playing -> win", () => {
    // Initial state
    expect(getCurrentState(gameState)).toBe("start");

    // Transition to mode select
    transitionToModeSelect(gameState, physics, mockInputHandler);
    expect(getCurrentState(gameState)).toBe("modeSelect");

    // Select reachTheTop mode (transitions to playing)
    selectGameMode(gameState, "reachTheTop", mockInputHandler);
    expect(getCurrentState(gameState)).toBe("playing");
    expect(gameState.gameMode).toBe("reachTheTop");

    // Simulate playing and winning
    gameState.catsDropped = 12;
    gameState.catsLost = 2;

    transitionToWin(gameState, mockInputHandler);
    expect(getCurrentState(gameState)).toBe("win");
    expect(gameState.catsDropped).toBe(12);
    expect(gameState.catsLost).toBe(2);
  });

  it("should allow returning to mode select from win state", () => {
    // Get to win state
    transitionToModeSelect(gameState, physics, mockInputHandler);
    selectGameMode(gameState, "reachTheTop", mockInputHandler);
    gameState.catsDropped = 10;
    transitionToWin(gameState, mockInputHandler);

    // Return to mode select
    transitionToModeSelect(gameState, physics, mockInputHandler);

    expect(getCurrentState(gameState)).toBe("modeSelect");
  });
});
