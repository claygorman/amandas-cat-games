/**
 * Task 1.1: Canvas and Game Loop Tests
 *
 * These 4 focused tests verify:
 * 1. Canvas initialization and context creation
 * 2. Responsive scaling calculations for 720x1280 aspect ratio
 * 3. devicePixelRatio handling for high-DPI displays
 * 4. requestAnimationFrame game loop starts and stops correctly
 */

import { renderHook, act, waitFor } from "@testing-library/react";
import { render, screen } from "@testing-library/react";
import { GameCanvas } from "@/components/GameCanvas";
import {
  useGameLoop,
  calculateCanvasScale,
  getDevicePixelRatio,
} from "@/lib/game/useGameLoop";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "@/lib/constants";

// Test 1: Canvas initialization and context creation
describe("Canvas initialization", () => {
  it("should render canvas and obtain 2D rendering context", async () => {
    // Mock the container dimensions
    Object.defineProperty(HTMLDivElement.prototype, 'clientWidth', {
      configurable: true,
      value: 360,
    });
    Object.defineProperty(HTMLDivElement.prototype, 'clientHeight', {
      configurable: true,
      value: 640,
    });

    render(<GameCanvas isRunning={false} />);

    const canvas = screen.getByTestId("game-canvas") as HTMLCanvasElement;
    expect(canvas).toBeInTheDocument();
    expect(canvas.tagName).toBe("CANVAS");

    // Verify 2D context can be obtained (mocked in jest.setup.js)
    const ctx = canvas.getContext("2d");
    expect(ctx).not.toBeNull();

    // Verify the mock context has expected properties
    expect(ctx).toHaveProperty("fillRect");
    expect(ctx).toHaveProperty("scale");
    expect(ctx).toHaveProperty("setTransform");
  });
});

// Test 2: Responsive scaling calculations for 720x1280 aspect ratio
describe("Responsive scaling calculations", () => {
  it("should calculate correct scale and offsets for 720x1280 aspect ratio", () => {
    // Test case 1: Container wider than canvas aspect ratio (letterbox on sides)
    const wideResult = calculateCanvasScale(1920, 1080, CANVAS_WIDTH, CANVAS_HEIGHT);

    // With 1920x1080 container and 720x1280 canvas, should fit by height
    // Scale = 1080 / 1280 = 0.84375
    expect(wideResult.scale).toBeCloseTo(0.84375, 4);
    // Horizontal offset = (1920 - 720 * 0.84375) / 2 = (1920 - 607.5) / 2 = 656.25
    expect(wideResult.offsetX).toBeCloseTo(656.25, 1);
    expect(wideResult.offsetY).toBe(0);

    // Test case 2: Container taller than canvas aspect ratio (letterbox on top/bottom)
    const tallResult = calculateCanvasScale(360, 800, CANVAS_WIDTH, CANVAS_HEIGHT);

    // With 360x800 container and 720x1280 canvas, should fit by width
    // Scale = 360 / 720 = 0.5
    expect(tallResult.scale).toBeCloseTo(0.5, 4);
    expect(tallResult.offsetX).toBe(0);
    // Vertical offset = (800 - 1280 * 0.5) / 2 = (800 - 640) / 2 = 80
    expect(tallResult.offsetY).toBeCloseTo(80, 1);

    // Test case 3: Perfect aspect ratio match
    const perfectResult = calculateCanvasScale(720, 1280, CANVAS_WIDTH, CANVAS_HEIGHT);
    expect(perfectResult.scale).toBeCloseTo(1, 4);
    expect(perfectResult.offsetX).toBe(0);
    expect(perfectResult.offsetY).toBe(0);
  });
});

// Test 3: devicePixelRatio handling for high-DPI displays
describe("devicePixelRatio handling", () => {
  const originalDPR = window.devicePixelRatio;

  afterEach(() => {
    Object.defineProperty(window, "devicePixelRatio", {
      configurable: true,
      writable: true,
      value: originalDPR,
    });
  });

  it("should correctly handle various devicePixelRatio values", () => {
    // Test standard display (1x)
    Object.defineProperty(window, "devicePixelRatio", {
      configurable: true,
      writable: true,
      value: 1,
    });
    expect(getDevicePixelRatio()).toBe(1);

    // Test Retina display (2x)
    Object.defineProperty(window, "devicePixelRatio", {
      configurable: true,
      writable: true,
      value: 2,
    });
    expect(getDevicePixelRatio()).toBe(2);

    // Test high-DPI display (3x)
    Object.defineProperty(window, "devicePixelRatio", {
      configurable: true,
      writable: true,
      value: 3,
    });
    expect(getDevicePixelRatio()).toBe(3);

    // Test capping at 3x for very high DPI displays (performance optimization)
    Object.defineProperty(window, "devicePixelRatio", {
      configurable: true,
      writable: true,
      value: 4,
    });
    expect(getDevicePixelRatio()).toBe(3);

    // Test undefined devicePixelRatio (fallback to 1)
    Object.defineProperty(window, "devicePixelRatio", {
      configurable: true,
      writable: true,
      value: undefined,
    });
    expect(getDevicePixelRatio()).toBe(1);
  });
});

// Test 4: requestAnimationFrame game loop starts and stops correctly
describe("Game loop control", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should start and stop the game loop correctly", async () => {
    const updateCallback = jest.fn();

    const { result, unmount } = renderHook(() =>
      useGameLoop({
        onUpdate: updateCallback,
        isRunning: true,
      })
    );

    // Initial state - loop should be running
    expect(result.current.isRunning).toBe(true);

    // Advance timers to trigger animation frames
    act(() => {
      jest.advanceTimersByTime(50); // ~3 frames at 60 FPS
    });

    // Callback should have been called
    await waitFor(() => {
      expect(updateCallback).toHaveBeenCalled();
    });

    const callCountAfterRunning = updateCallback.mock.calls.length;
    expect(callCountAfterRunning).toBeGreaterThan(0);

    // Stop the loop
    act(() => {
      result.current.stop();
    });

    // Clear call count
    updateCallback.mockClear();

    // Advance more timers
    act(() => {
      jest.advanceTimersByTime(50);
    });

    // No additional calls after stop
    expect(updateCallback).not.toHaveBeenCalled();

    // Restart the loop
    act(() => {
      result.current.start();
    });

    // Advance timers
    act(() => {
      jest.advanceTimersByTime(50);
    });

    // Should be called again after restart
    await waitFor(() => {
      expect(updateCallback).toHaveBeenCalled();
    });

    // Clean up
    unmount();
  });

  it("should provide correct delta time values", async () => {
    const deltaTimes: number[] = [];
    const updateCallback = jest.fn((deltaTime: number) => {
      deltaTimes.push(deltaTime);
    });

    const { unmount } = renderHook(() =>
      useGameLoop({
        onUpdate: updateCallback,
        isRunning: true,
      })
    );

    // Advance timers to get multiple frames
    act(() => {
      jest.advanceTimersByTime(100); // ~6 frames at 60 FPS
    });

    await waitFor(() => {
      expect(deltaTimes.length).toBeGreaterThan(0);
    });

    // Delta times should be positive numbers (in seconds)
    deltaTimes.forEach((dt) => {
      expect(dt).toBeGreaterThan(0);
      expect(dt).toBeLessThanOrEqual(0.1); // Max capped at 100ms
    });

    unmount();
  });

  it("should clean up on unmount", () => {
    const cancelAnimationFrameSpy = jest.spyOn(global, "cancelAnimationFrame");
    const updateCallback = jest.fn();

    const { unmount } = renderHook(() =>
      useGameLoop({
        onUpdate: updateCallback,
        isRunning: true,
      })
    );

    // Advance timers to start the loop
    act(() => {
      jest.advanceTimersByTime(20);
    });

    // Unmount should trigger cleanup
    unmount();

    // cancelAnimationFrame should have been called
    expect(cancelAnimationFrameSpy).toHaveBeenCalled();

    cancelAnimationFrameSpy.mockRestore();
  });
});
