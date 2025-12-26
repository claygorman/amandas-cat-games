/**
 * Task 6.1: Win Screen and Celebration Tests
 *
 * These 5 focused tests verify:
 * 1. Win screen displays when in win state
 * 2. Win message includes cat count
 * 3. Play Again and Change Mode buttons render
 * 4. Confetti particles are created and animated
 * 5. Win screen button hit-testing works correctly
 */

import {
  createGameState,
  transitionToModeSelect,
  transitionToWin,
  selectGameMode,
  isWinState,
  GameState,
} from "@/lib/game/state";
import {
  createPhysicsEngine,
  cleanupPhysics,
  PhysicsEngine,
} from "@/lib/game/physics";
import { createMockInputHandler } from "@/lib/game/input";
import {
  renderWinScreen,
  createConfettiParticles,
  updateConfettiParticles,
  renderConfetti,
  WIN_SCREEN_BUTTON_BOUNDS,
} from "@/lib/game/renderer";
import { checkWinScreenButtonClick } from "@/lib/game/input";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "@/lib/constants";

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

// Mock canvas context
function createMockContext(): CanvasRenderingContext2D {
  return {
    fillStyle: "",
    strokeStyle: "",
    font: "",
    textAlign: "left",
    textBaseline: "alphabetic",
    lineWidth: 1,
    lineCap: "butt",
    shadowColor: "",
    shadowBlur: 0,
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    globalAlpha: 1,
    fillRect: jest.fn(),
    strokeRect: jest.fn(),
    fillText: jest.fn(),
    strokeText: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    quadraticCurveTo: jest.fn(),
    bezierCurveTo: jest.fn(),
    arc: jest.fn(),
    ellipse: jest.fn(),
    closePath: jest.fn(),
    fill: jest.fn(),
    stroke: jest.fn(),
    save: jest.fn(),
    restore: jest.fn(),
    translate: jest.fn(),
    rotate: jest.fn(),
    scale: jest.fn(),
    setLineDash: jest.fn(),
    getLineDash: jest.fn(() => []),
    measureText: jest.fn(() => ({ width: 100 })),
  } as unknown as CanvasRenderingContext2D;
}

// Test 1: Win screen displays when in win state
describe("Win screen rendering in win state", () => {
  let gameState: GameState;
  let physics: PhysicsEngine;
  let mockInputHandler: ReturnType<typeof createMockInputHandler>;
  let ctx: CanvasRenderingContext2D;

  beforeEach(() => {
    gameState = createGameState();
    physics = createPhysicsEngine();
    mockInputHandler = createMockInputHandler();
    ctx = createMockContext();
    localStorageMock.clear();
  });

  afterEach(() => {
    cleanupPhysics(physics);
    mockInputHandler.cleanup();
  });

  it("should be in win state after transition", () => {
    transitionToModeSelect(gameState, physics, mockInputHandler);
    selectGameMode(gameState, "reachTheTop", mockInputHandler);
    transitionToWin(gameState, mockInputHandler);

    expect(isWinState(gameState)).toBe(true);
  });

  it("should render win screen without errors", () => {
    transitionToWin(gameState, mockInputHandler);

    // Should not throw when rendering
    expect(() => renderWinScreen(ctx, 5, null)).not.toThrow();
  });

  it("should draw overlay background", () => {
    renderWinScreen(ctx, 5, null);

    expect(ctx.fillRect).toHaveBeenCalledWith(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    expect(ctx.fillRect).toHaveBeenCalled();
  });
});

// Test 2: Win message includes cat count
describe("Win message with cat count", () => {
  let ctx: CanvasRenderingContext2D;

  beforeEach(() => {
    ctx = createMockContext();
  });

  it("should display 'You reached the top!' message", () => {
    renderWinScreen(ctx, 5, null);

    const fillTextCalls = (ctx.fillText as jest.Mock).mock.calls;
    const hasReachedTopMessage = fillTextCalls.some(
      (call: [string, number, number]) =>
        call[0].toLowerCase().includes("reached the top")
    );
    expect(hasReachedTopMessage).toBe(true);
  });

  it("should display cat count with emphasis", () => {
    const catsUsed = 7;
    renderWinScreen(ctx, catsUsed, null);

    const fillTextCalls = (ctx.fillText as jest.Mock).mock.calls;

    // Check that the cat count number is rendered
    const hasCatCountNumber = fillTextCalls.some(
      (call: [string, number, number]) =>
        call[0] === `${catsUsed}`
    );

    // Check that "cats!" text is rendered
    const hasCatsText = fillTextCalls.some(
      (call: [string, number, number]) =>
        call[0].toLowerCase().includes("cat")
    );

    expect(hasCatCountNumber).toBe(true);
    expect(hasCatsText).toBe(true);
  });

  it("should show new best indicator when beating previous best", () => {
    const catsUsed = 5;
    const previousBest = 10; // Higher is worse in this mode

    renderWinScreen(ctx, catsUsed, previousBest);

    const fillTextCalls = (ctx.fillText as jest.Mock).mock.calls;
    const hasNewBest = fillTextCalls.some(
      (call: [string, number, number]) =>
        call[0].toLowerCase().includes("new best") ||
        call[0].toLowerCase().includes("best")
    );
    expect(hasNewBest).toBe(true);
  });
});

// Test 3: Play Again and Change Mode buttons render
describe("Win screen buttons rendering", () => {
  let ctx: CanvasRenderingContext2D;

  beforeEach(() => {
    ctx = createMockContext();
  });

  it("should render 'Play Again' button", () => {
    renderWinScreen(ctx, 5, null);

    const fillTextCalls = (ctx.fillText as jest.Mock).mock.calls;
    const hasPlayAgain = fillTextCalls.some(
      (call: [string, number, number]) =>
        call[0].toLowerCase().includes("play again")
    );
    expect(hasPlayAgain).toBe(true);
  });

  it("should render 'Change Mode' button", () => {
    renderWinScreen(ctx, 5, null);

    const fillTextCalls = (ctx.fillText as jest.Mock).mock.calls;
    const hasChangeMode = fillTextCalls.some(
      (call: [string, number, number]) =>
        call[0].toLowerCase().includes("change mode")
    );
    expect(hasChangeMode).toBe(true);
  });

  it("should have correct button bounds defined", () => {
    expect(WIN_SCREEN_BUTTON_BOUNDS).toBeDefined();
    expect(WIN_SCREEN_BUTTON_BOUNDS.playAgain).toBeDefined();
    expect(WIN_SCREEN_BUTTON_BOUNDS.changeMode).toBeDefined();

    // Play Again should be above Change Mode
    expect(WIN_SCREEN_BUTTON_BOUNDS.playAgain.y).toBeLessThan(
      WIN_SCREEN_BUTTON_BOUNDS.changeMode.y
    );

    // Buttons should have reasonable sizes
    expect(WIN_SCREEN_BUTTON_BOUNDS.playAgain.width).toBeGreaterThan(100);
    expect(WIN_SCREEN_BUTTON_BOUNDS.playAgain.height).toBeGreaterThan(40);
  });
});

// Test 4: Confetti particles animation
describe("Confetti particles animation", () => {
  let ctx: CanvasRenderingContext2D;

  beforeEach(() => {
    ctx = createMockContext();
  });

  it("should create confetti particles", () => {
    const particles = createConfettiParticles(30);

    expect(particles).toBeDefined();
    expect(particles.length).toBe(30);
    expect(particles[0]).toHaveProperty("x");
    expect(particles[0]).toHaveProperty("y");
    expect(particles[0]).toHaveProperty("color");
  });

  it("should update particle positions", () => {
    const particles = createConfettiParticles(5);
    const initialPositions = particles.map((p) => ({ x: p.x, y: p.y }));

    updateConfettiParticles(particles, 16); // 16ms delta

    // At least some particles should have moved
    const moved = particles.some(
      (p, i) => p.y !== initialPositions[i].y
    );
    expect(moved).toBe(true);
  });

  it("should render confetti particles without errors", () => {
    const particles = createConfettiParticles(10);

    expect(() => renderConfetti(ctx, particles)).not.toThrow();
  });
});

// Test 5: Win screen button hit-testing
describe("Win screen button hit-testing", () => {
  it("should detect click on Play Again button", () => {
    const bounds = WIN_SCREEN_BUTTON_BOUNDS.playAgain;
    const clickX = bounds.x + bounds.width / 2;
    const clickY = bounds.y + bounds.height / 2;

    const result = checkWinScreenButtonClick(clickX, clickY);

    expect(result).toBe("playAgain");
  });

  it("should detect click on Change Mode button", () => {
    const bounds = WIN_SCREEN_BUTTON_BOUNDS.changeMode;
    const clickX = bounds.x + bounds.width / 2;
    const clickY = bounds.y + bounds.height / 2;

    const result = checkWinScreenButtonClick(clickX, clickY);

    expect(result).toBe("changeMode");
  });

  it("should return null when clicking outside buttons", () => {
    // Click at top-left corner (should be outside buttons)
    const result = checkWinScreenButtonClick(10, 10);

    expect(result).toBeNull();
  });

  it("should correctly identify button edge clicks", () => {
    const bounds = WIN_SCREEN_BUTTON_BOUNDS.playAgain;

    // Click just inside the top-left corner of playAgain button
    const insideX = bounds.x + 5;
    const insideY = bounds.y + 5;
    expect(checkWinScreenButtonClick(insideX, insideY)).toBe("playAgain");

    // Click just outside the playAgain button
    const outsideX = bounds.x - 5;
    const outsideY = bounds.y - 5;
    expect(checkWinScreenButtonClick(outsideX, outsideY)).toBeNull();
  });
});
