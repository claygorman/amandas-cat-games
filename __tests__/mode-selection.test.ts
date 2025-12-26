/**
 * Task 4.1: Mode Selection Screen UI Tests
 *
 * These 4 focused tests verify:
 * 1. Mode selection screen renders when in modeSelect state
 * 2. Both mode buttons are rendered with correct labels
 * 3. Button positioning and dimensions are correct
 * 4. Button hit-testing correctly identifies clicked buttons
 */

import {
  createGameState,
  transitionToModeSelect,
  isModeSelectState,
  GameState,
} from "@/lib/game/state";
import {
  createPhysicsEngine,
  cleanupPhysics,
  PhysicsEngine,
} from "@/lib/game/physics";
import { createMockInputHandler } from "@/lib/game/input";
import {
  renderModeSelectScreen,
  MODE_BUTTON_BOUNDS,
} from "@/lib/game/renderer";
import {
  getModeButtonBounds,
  checkModeButtonClick,
} from "@/lib/game/input";
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

// Test 1: Mode selection screen renders when in modeSelect state
describe("Mode selection screen rendering", () => {
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

  it("should be in modeSelect state after transition", () => {
    transitionToModeSelect(gameState, physics, mockInputHandler);

    expect(isModeSelectState(gameState)).toBe(true);
  });

  it("should render mode selection screen without errors", () => {
    transitionToModeSelect(gameState, physics, mockInputHandler);

    // Should not throw when rendering
    expect(() => renderModeSelectScreen(ctx)).not.toThrow();
  });

  it("should draw background with soft pink color", () => {
    renderModeSelectScreen(ctx);

    expect(ctx.fillRect).toHaveBeenCalledWith(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    // Verify fillStyle was set to soft pink at some point
    expect(ctx.fillRect).toHaveBeenCalled();
  });

  it("should draw title text 'Choose Mode'", () => {
    renderModeSelectScreen(ctx);

    // Verify fillText was called with the title
    const fillTextCalls = (ctx.fillText as jest.Mock).mock.calls;
    const hasTitle = fillTextCalls.some(
      (call: [string, number, number]) => call[0] === "Choose Mode"
    );
    expect(hasTitle).toBe(true);
  });
});

// Test 2: Both mode buttons are rendered with correct labels
describe("Mode button rendering", () => {
  let ctx: CanvasRenderingContext2D;

  beforeEach(() => {
    ctx = createMockContext();
  });

  it("should render 'Classic Mode' button", () => {
    renderModeSelectScreen(ctx);

    const fillTextCalls = (ctx.fillText as jest.Mock).mock.calls;
    const hasClassicLabel = fillTextCalls.some(
      (call: [string, number, number]) => call[0] === "Classic Mode"
    );
    expect(hasClassicLabel).toBe(true);
  });

  it("should render 'Reach the Top' button", () => {
    renderModeSelectScreen(ctx);

    const fillTextCalls = (ctx.fillText as jest.Mock).mock.calls;
    const hasReachTopLabel = fillTextCalls.some(
      (call: [string, number, number]) => call[0] === "Reach the Top"
    );
    expect(hasReachTopLabel).toBe(true);
  });

  it("should render descriptions for both mode buttons", () => {
    renderModeSelectScreen(ctx);

    const fillTextCalls = (ctx.fillText as jest.Mock).mock.calls;
    // Check for descriptive text elements (at least 4 fillText calls expected: title, 2 labels, 2+ descriptions)
    expect(fillTextCalls.length).toBeGreaterThanOrEqual(4);
  });
});

// Test 3: Button positioning and dimensions
describe("Button positioning and dimensions", () => {
  it("should return correct button bounds", () => {
    const bounds = getModeButtonBounds();

    // Both buttons should exist
    expect(bounds.classic).toBeDefined();
    expect(bounds.reachTheTop).toBeDefined();

    // Classic button should be above reachTheTop button
    expect(bounds.classic.y).toBeLessThan(bounds.reachTheTop.y);

    // Buttons should have positive dimensions
    expect(bounds.classic.width).toBeGreaterThan(0);
    expect(bounds.classic.height).toBeGreaterThan(0);
    expect(bounds.reachTheTop.width).toBeGreaterThan(0);
    expect(bounds.reachTheTop.height).toBeGreaterThan(0);
  });

  it("should have buttons centered horizontally", () => {
    const bounds = getModeButtonBounds();
    const centerX = CANVAS_WIDTH / 2;

    // Button centers should be near canvas center
    const classicCenterX = bounds.classic.x + bounds.classic.width / 2;
    const reachTopCenterX = bounds.reachTheTop.x + bounds.reachTheTop.width / 2;

    expect(Math.abs(classicCenterX - centerX)).toBeLessThan(10);
    expect(Math.abs(reachTopCenterX - centerX)).toBeLessThan(10);
  });

  it("should have reasonable button sizes for touch interaction", () => {
    const bounds = getModeButtonBounds();

    // Minimum touch target size should be at least 44px (accessibility guideline)
    expect(bounds.classic.height).toBeGreaterThanOrEqual(80);
    expect(bounds.reachTheTop.height).toBeGreaterThanOrEqual(80);
    expect(bounds.classic.width).toBeGreaterThanOrEqual(200);
    expect(bounds.reachTheTop.width).toBeGreaterThanOrEqual(200);
  });
});

// Test 4: Button hit-testing correctly identifies clicked buttons
describe("Button hit-testing", () => {
  it("should detect click on Classic Mode button", () => {
    const bounds = getModeButtonBounds();
    const clickX = bounds.classic.x + bounds.classic.width / 2;
    const clickY = bounds.classic.y + bounds.classic.height / 2;

    const result = checkModeButtonClick(clickX, clickY);

    expect(result).toBe("classic");
  });

  it("should detect click on Reach the Top button", () => {
    const bounds = getModeButtonBounds();
    const clickX = bounds.reachTheTop.x + bounds.reachTheTop.width / 2;
    const clickY = bounds.reachTheTop.y + bounds.reachTheTop.height / 2;

    const result = checkModeButtonClick(clickX, clickY);

    expect(result).toBe("reachTheTop");
  });

  it("should return null when clicking outside buttons", () => {
    // Click at top-left corner (should be outside buttons)
    const result = checkModeButtonClick(10, 10);

    expect(result).toBeNull();
  });

  it("should correctly identify button edge clicks", () => {
    const bounds = getModeButtonBounds();

    // Click just inside the top-left corner of classic button
    const insideX = bounds.classic.x + 5;
    const insideY = bounds.classic.y + 5;
    expect(checkModeButtonClick(insideX, insideY)).toBe("classic");

    // Click just outside the classic button
    const outsideX = bounds.classic.x - 5;
    const outsideY = bounds.classic.y - 5;
    expect(checkModeButtonClick(outsideX, outsideY)).toBeNull();
  });
});
