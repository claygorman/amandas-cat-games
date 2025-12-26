/**
 * Game State Machine
 *
 * Manages the game state transitions for Cat Stack including:
 * - State definitions: "start", "modeSelect", "playing", "gameover", "win"
 * - State transition functions
 * - Appropriate cleanup on state changes
 * - Integration with physics, tower, and scoring systems
 * - Game mode support: "classic" and "reachTheTop"
 */

import { PhysicsEngine, clearCatBodies } from "./physics";
import { TowerState, clearTower, createTowerState } from "./tower";
import { PendulumState, resetPendulum, createPendulum } from "./pendulum";
import { ScoreState, resetScore, createScoreState, updateHighScore } from "./scoring";
import { InputHandler } from "./input";

/**
 * Game state types.
 * - "start": Initial title screen
 * - "modeSelect": Game mode selection screen
 * - "playing": Active gameplay
 * - "gameover": Game over screen (classic mode or fallen in reachTheTop)
 * - "win": Victory screen (reachTheTop mode when goal is reached)
 */
export type GameStateType = "start" | "modeSelect" | "playing" | "gameover" | "win";

/**
 * Game mode types.
 * - "classic": Original stacking game where falling ends the game
 * - "reachTheTop": New mode where the goal is to reach the win line with fewest cats
 */
export type GameMode = "classic" | "reachTheTop";

/**
 * Represents the complete game state.
 */
export interface GameState {
  /** Current state of the game */
  currentState: GameStateType;
  /** Whether the game has started at least once */
  hasStarted: boolean;
  /** Score state */
  scoreState: ScoreState;
  /** Tower state */
  towerState: TowerState;
  /** Pendulum state */
  pendulumState: PendulumState;
  /** Whether high score was beaten this game */
  beatHighScore: boolean;
  /** Current game mode ("classic" or "reachTheTop") */
  gameMode: GameMode;
  /** Total number of cats dropped (for reachTheTop mode scoring) */
  catsDropped: number;
  /** Number of cats that fell off screen (for reachTheTop mode) */
  catsLost: number;
}

/**
 * Creates a new game state initialized to the start screen.
 */
export function createGameState(): GameState {
  return {
    currentState: "start",
    hasStarted: false,
    scoreState: createScoreState(),
    towerState: createTowerState(),
    pendulumState: createPendulum(),
    beatHighScore: false,
    gameMode: "classic",
    catsDropped: 0,
    catsLost: 0,
  };
}

/**
 * Gets the current game state type.
 */
export function getCurrentState(gameState: GameState): GameStateType {
  return gameState.currentState;
}

/**
 * Checks if the game is in the start state.
 */
export function isStartState(gameState: GameState): boolean {
  return gameState.currentState === "start";
}

/**
 * Checks if the game is in the mode select state.
 */
export function isModeSelectState(gameState: GameState): boolean {
  return gameState.currentState === "modeSelect";
}

/**
 * Checks if the game is in the playing state.
 */
export function isPlayingState(gameState: GameState): boolean {
  return gameState.currentState === "playing";
}

/**
 * Checks if the game is in the game over state.
 */
export function isGameOverState(gameState: GameState): boolean {
  return gameState.currentState === "gameover";
}

/**
 * Checks if the game is in the win state.
 */
export function isWinState(gameState: GameState): boolean {
  return gameState.currentState === "win";
}

/**
 * Transitions to the start state.
 * This is typically called when returning to menu or initial load.
 *
 * @param gameState - The game state to transition
 * @param physics - Physics engine for cleanup
 * @param inputHandler - Input handler to configure
 */
export function transitionToStart(
  gameState: GameState,
  physics?: PhysicsEngine,
  inputHandler?: InputHandler
): void {
  // Clean up if coming from another state
  if (physics) {
    clearTower(gameState.towerState, physics);
  }

  // Reset game data
  resetScore(gameState.scoreState);
  gameState.towerState = createTowerState();
  resetPendulum(gameState.pendulumState);
  gameState.beatHighScore = false;
  gameState.catsDropped = 0;
  gameState.catsLost = 0;

  // Enable input for "tap to play"
  if (inputHandler) {
    inputHandler.enable();
  }

  gameState.currentState = "start";
}

/**
 * Transitions to the mode select state.
 * This allows the player to choose between game modes.
 *
 * @param gameState - The game state to transition
 * @param physics - Physics engine for cleanup
 * @param inputHandler - Input handler to configure
 */
export function transitionToModeSelect(
  gameState: GameState,
  physics?: PhysicsEngine,
  inputHandler?: InputHandler
): void {
  // Clean up if coming from another state
  if (physics) {
    clearTower(gameState.towerState, physics);
  }

  // Reset game data
  resetScore(gameState.scoreState);
  gameState.towerState = createTowerState();
  resetPendulum(gameState.pendulumState);
  gameState.beatHighScore = false;
  gameState.catsDropped = 0;
  gameState.catsLost = 0;

  // Enable input for mode selection
  if (inputHandler) {
    inputHandler.enable();
  }

  gameState.currentState = "modeSelect";
}

/**
 * Selects a game mode and transitions to the playing state.
 *
 * @param gameState - The game state to transition
 * @param mode - The game mode to select ("classic" or "reachTheTop")
 * @param inputHandler - Input handler to enable
 */
export function selectGameMode(
  gameState: GameState,
  mode: GameMode,
  inputHandler?: InputHandler
): void {
  // Set the selected game mode
  gameState.gameMode = mode;

  // Reset mode-specific counters
  gameState.catsDropped = 0;
  gameState.catsLost = 0;

  // Transition to playing state
  transitionToPlaying(gameState, inputHandler);
}

/**
 * Transitions to the playing state.
 * This starts the actual gameplay.
 *
 * @param gameState - The game state to transition
 * @param inputHandler - Input handler to enable
 */
export function transitionToPlaying(
  gameState: GameState,
  inputHandler?: InputHandler
): void {
  gameState.currentState = "playing";
  gameState.hasStarted = true;

  // Enable input for gameplay
  if (inputHandler) {
    inputHandler.enable();
  }
}

/**
 * Transitions to the game over state.
 * This is called when a cat falls off the stack (in classic mode).
 *
 * @param gameState - The game state to transition
 * @param inputHandler - Input handler to disable during game over
 */
export function transitionToGameOver(
  gameState: GameState,
  inputHandler?: InputHandler
): void {
  // Update high score and check if beaten
  gameState.beatHighScore = updateHighScore(gameState.scoreState);

  gameState.currentState = "gameover";

  // Disable input briefly to prevent accidental restart
  if (inputHandler) {
    inputHandler.disable();

    // Re-enable after a short delay for restart action
    setTimeout(() => {
      inputHandler.enable();
    }, 500);
  }
}

/**
 * Transitions to the win state.
 * This is called when the player reaches the goal in reachTheTop mode.
 *
 * @param gameState - The game state to transition
 * @param inputHandler - Input handler to disable during win celebration
 */
export function transitionToWin(
  gameState: GameState,
  inputHandler?: InputHandler
): void {
  gameState.currentState = "win";

  // Disable input briefly to allow win celebration to be seen
  if (inputHandler) {
    inputHandler.disable();

    // Re-enable after a short delay for continue/restart action
    setTimeout(() => {
      inputHandler.enable();
    }, 500);
  }
}

/**
 * Handles input action based on current game state.
 * Returns whether the input was handled.
 *
 * @param gameState - The game state
 * @param physics - Physics engine for cleanup during restart
 * @param inputHandler - Input handler for state management
 * @returns Object indicating what action was taken
 */
export function handleStateInput(
  gameState: GameState,
  physics: PhysicsEngine,
  inputHandler?: InputHandler
): { handled: boolean; action: "start" | "drop" | "restart" | "modeSelect" | "playAgain" | "none" } {
  switch (gameState.currentState) {
    case "start":
      // Start the game (can transition to mode select or playing)
      transitionToPlaying(gameState, inputHandler);
      return { handled: true, action: "start" };

    case "modeSelect":
      // Mode selection input is handled by button clicks, not generic input
      // Return unhandled so the UI layer can process button clicks
      return { handled: false, action: "modeSelect" };

    case "playing":
      // Input during play should trigger drop (handled elsewhere)
      return { handled: false, action: "drop" };

    case "gameover":
      // Restart the game
      restartGame(gameState, physics, inputHandler);
      return { handled: true, action: "restart" };

    case "win":
      // Win screen input is handled by button clicks
      // Return unhandled so the UI layer can process button clicks
      return { handled: false, action: "playAgain" };

    default:
      return { handled: false, action: "none" };
  }
}

/**
 * Restarts the game from game over or win state.
 * Clears all physics bodies and resets state.
 *
 * @param gameState - The game state to restart
 * @param physics - Physics engine for cleanup
 * @param inputHandler - Input handler for state management
 */
export function restartGame(
  gameState: GameState,
  physics: PhysicsEngine,
  inputHandler?: InputHandler
): void {
  // Clear all cat bodies from physics world
  clearTower(gameState.towerState, physics);

  // Reset score (preserves high score)
  resetScore(gameState.scoreState);

  // Reset tower state
  gameState.towerState = createTowerState();

  // Reset pendulum to base difficulty
  resetPendulum(gameState.pendulumState);

  // Reset beat high score flag
  gameState.beatHighScore = false;

  // Reset mode-specific counters
  gameState.catsDropped = 0;
  gameState.catsLost = 0;

  // Transition to playing state (or start state based on preference)
  transitionToPlaying(gameState, inputHandler);
}

/**
 * Checks if the game can accept drop input.
 */
export function canDropCat(gameState: GameState): boolean {
  return gameState.currentState === "playing";
}

/**
 * Gets the appropriate screen to render based on state.
 */
export function getActiveScreen(
  gameState: GameState
): "start" | "modeSelect" | "gameplay" | "gameover" | "win" {
  switch (gameState.currentState) {
    case "start":
      return "start";
    case "modeSelect":
      return "modeSelect";
    case "playing":
      return "gameplay";
    case "gameover":
      return "gameover";
    case "win":
      return "win";
    default:
      return "start";
  }
}

/**
 * Increments the cats dropped counter.
 * Used for tracking total drops in reachTheTop mode.
 *
 * @param gameState - The game state to update
 */
export function incrementCatsDropped(gameState: GameState): void {
  gameState.catsDropped++;
}

/**
 * Increments the cats lost counter.
 * Used for tracking fallen cats in reachTheTop mode.
 *
 * @param gameState - The game state to update
 */
export function incrementCatsLost(gameState: GameState): void {
  gameState.catsLost++;
}

/**
 * Gets cat statistics for the current game.
 *
 * @param gameState - The game state to query
 * @returns Object containing dropped, lost, and stacked cat counts
 */
export function getCatStats(gameState: GameState): {
  dropped: number;
  lost: number;
  stacked: number;
} {
  return {
    dropped: gameState.catsDropped,
    lost: gameState.catsLost,
    stacked: gameState.catsDropped - gameState.catsLost,
  };
}
