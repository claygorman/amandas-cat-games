/**
 * Input Handling System
 *
 * Manages user input for the Cat Stack game including:
 * - Mouse click/mousedown on canvas
 * - Touch events on canvas (with scroll prevention)
 * - Spacebar keyboard events
 * - Debouncing to prevent accidental double-drops
 * - Enable/disable for game state management
 * - Mode selection button hit-testing
 * - Win screen button hit-testing
 * - Game over screen button hit-testing
 */

import { DROP_DEBOUNCE_MS } from "@/lib/constants";
import { MODE_BUTTON_BOUNDS, WIN_SCREEN_BUTTON_BOUNDS, GAME_OVER_BUTTON_BOUNDS, Rect } from "./renderer";

/**
 * Callback function type for drop events.
 */
export type DropCallback = () => void;

/**
 * Represents the current input state.
 */
export interface InputState {
  /** Whether input is currently enabled */
  enabled: boolean;
  /** Timestamp of last drop action */
  lastDropTime: number;
  /** Whether a drop is currently pending (for debounce) */
  dropPending: boolean;
}

/**
 * Input handler interface for managing game input.
 */
export interface InputHandler {
  /** Set the callback to be called on drop input */
  onDrop: (callback: DropCallback) => void;
  /** Enable input handling */
  enable: () => void;
  /** Disable input handling */
  disable: () => void;
  /** Clean up event listeners */
  cleanup: () => void;
  /** Get current input state */
  getState: () => InputState;
  /** Manually trigger a drop (for testing or programmatic use) */
  triggerDrop: () => boolean;
}

/**
 * Creates an input handler attached to the given canvas element.
 *
 * @param canvas - The canvas element to listen for mouse/touch events
 * @returns An InputHandler for managing game input
 */
export function createInputHandler(canvas: HTMLCanvasElement): InputHandler {
  const state: InputState = {
    enabled: true,
    lastDropTime: 0,
    dropPending: false,
  };

  let dropCallback: DropCallback | null = null;

  /**
   * Attempts to trigger a drop, respecting debounce timing.
   */
  const attemptDrop = (): boolean => {
    if (!state.enabled) {
      return false;
    }

    const now = Date.now();
    const timeSinceLastDrop = now - state.lastDropTime;

    if (timeSinceLastDrop < DROP_DEBOUNCE_MS) {
      return false;
    }

    state.lastDropTime = now;

    if (dropCallback) {
      dropCallback();
    }

    return true;
  };

  /**
   * Handle mouse down events on canvas.
   */
  const handleMouseDown = (event: MouseEvent): void => {
    event.preventDefault();
    attemptDrop();
  };

  /**
   * Handle touch start events on canvas.
   */
  const handleTouchStart = (event: TouchEvent): void => {
    // Prevent default to avoid scrolling and other touch behaviors
    event.preventDefault();
    attemptDrop();
  };

  /**
   * Handle keyboard events (spacebar).
   */
  const handleKeyDown = (event: KeyboardEvent): void => {
    // Only handle spacebar
    if (event.code === "Space" || event.key === " ") {
      event.preventDefault();
      attemptDrop();
    }
  };

  // Attach event listeners
  canvas.addEventListener("mousedown", handleMouseDown);
  canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
  document.addEventListener("keydown", handleKeyDown);

  const handler: InputHandler = {
    onDrop: (callback: DropCallback): void => {
      dropCallback = callback;
    },

    enable: (): void => {
      state.enabled = true;
    },

    disable: (): void => {
      state.enabled = false;
    },

    cleanup: (): void => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("keydown", handleKeyDown);
      dropCallback = null;
    },

    getState: (): InputState => {
      return { ...state };
    },

    triggerDrop: (): boolean => {
      return attemptDrop();
    },
  };

  return handler;
}

/**
 * Creates a mock input handler for testing purposes.
 * Does not attach any event listeners.
 */
export function createMockInputHandler(): InputHandler {
  const state: InputState = {
    enabled: true,
    lastDropTime: 0,
    dropPending: false,
  };

  let dropCallback: DropCallback | null = null;

  return {
    onDrop: (callback: DropCallback): void => {
      dropCallback = callback;
    },

    enable: (): void => {
      state.enabled = true;
    },

    disable: (): void => {
      state.enabled = false;
    },

    cleanup: (): void => {
      dropCallback = null;
    },

    getState: (): InputState => {
      return { ...state };
    },

    triggerDrop: (): boolean => {
      if (!state.enabled) {
        return false;
      }

      const now = Date.now();
      if (now - state.lastDropTime < DROP_DEBOUNCE_MS) {
        return false;
      }

      state.lastDropTime = now;
      if (dropCallback) {
        dropCallback();
      }
      return true;
    },
  };
}

/**
 * Utility to check if touch is supported on the current device.
 */
export function isTouchDevice(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return (
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    (navigator as any).msMaxTouchPoints > 0
  );
}

/**
 * Utility to convert touch/mouse coordinates to canvas coordinates.
 *
 * @param event - The mouse or touch event
 * @param canvas - The canvas element
 * @returns The X, Y coordinates relative to the canvas
 */
export function getCanvasCoordinates(
  event: MouseEvent | Touch,
  canvas: HTMLCanvasElement
): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
  };
}

// ============================================================================
// MODE SELECTION BUTTON HIT-TESTING
// ============================================================================

/**
 * Gets the bounds of the mode selection buttons.
 * Returns the button rectangles for hit-testing.
 *
 * @returns Object containing bounds for classic and reachTheTop buttons
 */
export function getModeButtonBounds(): { classic: Rect; reachTheTop: Rect } {
  return {
    classic: { ...MODE_BUTTON_BOUNDS.classic },
    reachTheTop: { ...MODE_BUTTON_BOUNDS.reachTheTop },
  };
}

/**
 * Checks if a point is inside a rectangle.
 *
 * @param x - X coordinate of the point
 * @param y - Y coordinate of the point
 * @param rect - The rectangle to test against
 * @returns true if the point is inside the rectangle
 */
function isPointInRect(x: number, y: number, rect: Rect): boolean {
  return (
    x >= rect.x &&
    x <= rect.x + rect.width &&
    y >= rect.y &&
    y <= rect.y + rect.height
  );
}

/**
 * Checks which mode button (if any) was clicked at the given coordinates.
 *
 * @param x - X coordinate of the click
 * @param y - Y coordinate of the click
 * @returns "classic" or "reachTheTop" if a button was clicked, null otherwise
 */
export function checkModeButtonClick(
  x: number,
  y: number
): "classic" | "reachTheTop" | null {
  if (isPointInRect(x, y, MODE_BUTTON_BOUNDS.classic)) {
    return "classic";
  }

  if (isPointInRect(x, y, MODE_BUTTON_BOUNDS.reachTheTop)) {
    return "reachTheTop";
  }

  return null;
}

// ============================================================================
// WIN SCREEN BUTTON HIT-TESTING
// ============================================================================

/**
 * Gets the bounds of the win screen buttons.
 * Returns the button rectangles for hit-testing.
 *
 * @returns Object containing bounds for playAgain and changeMode buttons
 */
export function getWinScreenButtonBounds(): { playAgain: Rect; changeMode: Rect } {
  return {
    playAgain: { ...WIN_SCREEN_BUTTON_BOUNDS.playAgain },
    changeMode: { ...WIN_SCREEN_BUTTON_BOUNDS.changeMode },
  };
}

/**
 * Checks which win screen button (if any) was clicked at the given coordinates.
 *
 * @param x - X coordinate of the click
 * @param y - Y coordinate of the click
 * @returns "playAgain" or "changeMode" if a button was clicked, null otherwise
 */
export function checkWinScreenButtonClick(
  x: number,
  y: number
): "playAgain" | "changeMode" | null {
  if (isPointInRect(x, y, WIN_SCREEN_BUTTON_BOUNDS.playAgain)) {
    return "playAgain";
  }

  if (isPointInRect(x, y, WIN_SCREEN_BUTTON_BOUNDS.changeMode)) {
    return "changeMode";
  }

  return null;
}

// ============================================================================
// GAME OVER SCREEN BUTTON HIT-TESTING
// ============================================================================

/**
 * Gets the bounds of the game over screen buttons.
 * Returns the button rectangles for hit-testing.
 *
 * @returns Object containing bounds for restart and changeMode buttons
 */
export function getGameOverButtonBounds(): { restart: Rect; changeMode: Rect } {
  return {
    restart: { ...GAME_OVER_BUTTON_BOUNDS.restart },
    changeMode: { ...GAME_OVER_BUTTON_BOUNDS.changeMode },
  };
}

/**
 * Checks which game over screen button (if any) was clicked at the given coordinates.
 *
 * @param x - X coordinate of the click
 * @param y - Y coordinate of the click
 * @returns "restart" or "changeMode" if a button was clicked, null otherwise
 */
export function checkGameOverButtonClick(
  x: number,
  y: number
): "restart" | "changeMode" | null {
  if (isPointInRect(x, y, GAME_OVER_BUTTON_BOUNDS.restart)) {
    return "restart";
  }

  if (isPointInRect(x, y, GAME_OVER_BUTTON_BOUNDS.changeMode)) {
    return "changeMode";
  }

  return null;
}
