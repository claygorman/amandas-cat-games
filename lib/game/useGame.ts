"use client";

/**
 * Main game hook that integrates all game systems.
 * Manages physics, state, input, rendering, and game loop.
 * Supports both Classic and "Reach the Top" game modes.
 */

import { useRef, useEffect, useCallback, useState } from "react";
import { createPhysicsEngine, updatePhysics, cleanupPhysics, PhysicsEngine, createGroundPlatform } from "./physics";
import {
  createGameState,
  GameState,
  isStartState,
  isModeSelectState,
  isPlayingState,
  isGameOverState,
  isWinState,
  handleStateInput,
  canDropCat,
  transitionToStart,
  transitionToGameOver,
  transitionToWin,
  transitionToModeSelect,
  selectGameMode,
  incrementCatsDropped,
  incrementCatsLost,
  restartGame,
} from "./state";
import { createInputHandler, InputHandler, getCanvasCoordinates, checkModeButtonClick, checkWinScreenButtonClick, checkGameOverButtonClick } from "./input";
import { updatePendulum, getCurrentPendulumPosition, increasePendulumDifficulty } from "./pendulum";
import { createCatEntity, CatEntity, getRandomCatVariant, setCatExpression, updateCatSquish, triggerCatSquish } from "./cat";
import { addCatToTower, updateTower, updateTowerReachTheTop, checkWinCondition, handleCatLanding, findCatByBody, getPreviousCat, isClassicCatAligned, pushTowerDown, hasTowerReachedGround } from "./tower";
import { awardStabilityPoints, updatePerfectDisplay, updateReachTopBest, getReachTopBest } from "./scoring";
import {
  renderGround,
  renderCats,
  renderPendulumCat,
  renderStartScreen,
  renderModeSelectScreen,
  renderWinLine,
  renderPerfectFeedback,
  renderGameOverScreen,
  renderWinScreen,
  createConfettiParticles,
  updateConfettiParticles,
  renderConfetti,
  ConfettiParticle,
} from "./renderer";
import { CANVAS_WIDTH, CANVAS_HEIGHT, GROUND_Y, GROUND_HEIGHT } from "@/lib/constants";
import Matter from "matter-js";

export interface UseGameResult {
  onUpdate: (deltaTime: number, ctx: CanvasRenderingContext2D) => void;
  isStartState: boolean;
  highScore: number;
  onTapToPlay: () => void;
  /** Whether the game is currently in active gameplay (not in start, mode select, game over, or win state) */
  isPlaying: boolean;
  /** Current game mode when playing */
  gameMode: "classic" | "reachTheTop" | null;
  /** Current score (classic mode) or cats dropped (reach the top mode) */
  currentScore: number;
  /** Number of cats lost (reach the top mode) */
  catsLost: number;
  /** Go back to mode selection screen */
  onBackToMenu: () => void;
}

export function useGame(): UseGameResult {
  const physicsRef = useRef<PhysicsEngine | null>(null);
  const gameStateRef = useRef<GameState | null>(null);
  const inputHandlerRef = useRef<InputHandler | null>(null);
  const catsRef = useRef<CatEntity[]>([]);
  const pendulumCatVariantRef = useRef<ReturnType<typeof getRandomCatVariant>>(getRandomCatVariant());
  const isInitializedRef = useRef(false);
  const gameTimeRef = useRef(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const confettiRef = useRef<ConfettiParticle[] | null>(null);
  // Track if we've already updated the best score for the current win
  const bestScoreUpdatedRef = useRef(false);
  // Track when we entered mode select to prevent click-through on same event
  const modeSelectEnteredTimeRef = useRef(0);

  // React state for exposing to UI
  const [isInStartState, setIsInStartState] = useState(true);
  const [currentHighScore, setCurrentHighScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameMode, setGameMode] = useState<"classic" | "reachTheTop" | null>(null);
  const [currentScore, setCurrentScore] = useState(0);
  const [catsLost, setCatsLost] = useState(0);

  // Initialize game systems
  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    // Create physics engine
    const physics = createPhysicsEngine();
    physicsRef.current = physics;

    // Create ground platform
    createGroundPlatform(physics);

    // Create game state
    const gameState = createGameState();
    gameStateRef.current = gameState;

    // Set up collision detection for squish animation and sticky landing
    Matter.Events.on(physics.engine, "collisionStart", (event) => {
      const currentGameState = gameStateRef.current;

      for (const pair of event.pairs) {
        // Check if a cat collided
        const bodyA = pair.bodyA;
        const bodyB = pair.bodyB;

        // Find cats involved in collision and calculate impact velocity
        for (const cat of catsRef.current) {
          if (cat.body === bodyA || cat.body === bodyB) {
            const velocity = cat.body.velocity;
            const impactVelocity = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
            triggerCatSquish(cat, impactVelocity);

            // Handle sticky landing for reachTheTop mode
            if (currentGameState && currentGameState.gameMode === "reachTheTop") {
              // Determine what the cat landed on
              const landedOnBody = cat.body === bodyA ? bodyB : bodyA;
              handleCatLanding(cat, landedOnBody);
            }
          }
        }
      }
    });

    return () => {
      if (physicsRef.current) {
        cleanupPhysics(physicsRef.current);
      }
      if (inputHandlerRef.current) {
        inputHandlerRef.current.cleanup();
      }
    };
  }, []);

  // Handle mode button click
  const handleModeButtonClick = useCallback((event: MouseEvent | TouchEvent) => {
    const gameState = gameStateRef.current;
    const physics = physicsRef.current;
    const canvas = canvasRef.current;
    if (!gameState || !physics || !canvas || !isModeSelectState(gameState)) return;

    // Prevent click-through: ignore clicks within 100ms of entering mode select
    // This prevents the same click that triggered "Tap to Play" from also selecting a mode
    if (Date.now() - modeSelectEnteredTimeRef.current < 100) return;

    // Get click/touch coordinates
    let clientX: number, clientY: number;
    if (event instanceof TouchEvent) {
      if (event.touches.length === 0) return;
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      clientX = event.clientX;
      clientY = event.clientY;
    }

    // Convert to canvas logical coordinates (720x1280)
    // Note: Use CANVAS_WIDTH/HEIGHT, not canvas.width/height which includes DPR scaling
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    // Check which button was clicked
    const clickedButton = checkModeButtonClick(x, y);
    if (clickedButton === "back") {
      // Go back to start state (animated background)
      transitionToStart(gameState, physics, inputHandlerRef.current ?? undefined);
      // Update React state to show animated background
      setIsInStartState(true);
    } else if (clickedButton === "classic" || clickedButton === "reachTheTop") {
      // Select the game mode and transition to playing
      selectGameMode(gameState, clickedButton, inputHandlerRef.current ?? undefined);

      // Clear any existing cats for fresh start
      catsRef.current = [];
      pendulumCatVariantRef.current = getRandomCatVariant();
      // Reset best score update tracking for new game
      bestScoreUpdatedRef.current = false;

      // Update React state
      setIsPlaying(true);
      setGameMode(clickedButton);
      setCurrentScore(0);
      setCatsLost(0);
    }
  }, []);

  // Handle win screen button click
  const handleWinScreenButtonClick = useCallback((event: MouseEvent | TouchEvent) => {
    const gameState = gameStateRef.current;
    const physics = physicsRef.current;
    const canvas = canvasRef.current;
    if (!gameState || !physics || !canvas || !isWinState(gameState)) return;

    // Get click/touch coordinates
    let clientX: number, clientY: number;
    if (event instanceof TouchEvent) {
      if (event.touches.length === 0) return;
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      clientX = event.clientX;
      clientY = event.clientY;
    }

    // Convert to canvas logical coordinates (720x1280)
    // Note: Use CANVAS_WIDTH/HEIGHT, not canvas.width/height which includes DPR scaling
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    // Check which button was clicked
    const clickedButton = checkWinScreenButtonClick(x, y);
    if (clickedButton === "playAgain") {
      // Restart the game in the same mode
      restartGame(gameState, physics, inputHandlerRef.current ?? undefined);
      catsRef.current = [];
      pendulumCatVariantRef.current = getRandomCatVariant();
      confettiRef.current = null;
      // Reset best score update tracking for new game
      bestScoreUpdatedRef.current = false;
    } else if (clickedButton === "changeMode") {
      // Return to mode selection
      transitionToModeSelect(gameState, physics, inputHandlerRef.current ?? undefined);
      catsRef.current = [];
      pendulumCatVariantRef.current = getRandomCatVariant();
      confettiRef.current = null;
      // Reset best score update tracking for new game
      bestScoreUpdatedRef.current = false;
      // Mark when we entered mode select to prevent click-through
      modeSelectEnteredTimeRef.current = Date.now();
    }
  }, []);

  // Handle game over screen button click
  const handleGameOverButtonClick = useCallback((event: MouseEvent | TouchEvent) => {
    const gameState = gameStateRef.current;
    const physics = physicsRef.current;
    const canvas = canvasRef.current;
    if (!gameState || !physics || !canvas || !isGameOverState(gameState)) return;

    // Get click/touch coordinates
    let clientX: number, clientY: number;
    if (event instanceof TouchEvent) {
      if (event.touches.length === 0) return;
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      clientX = event.clientX;
      clientY = event.clientY;
    }

    // Convert to canvas logical coordinates (720x1280)
    // Note: Use CANVAS_WIDTH/HEIGHT, not canvas.width/height which includes DPR scaling
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    // Check which button was clicked
    const clickedButton = checkGameOverButtonClick(x, y);
    if (clickedButton === "restart") {
      // Restart the game in the same mode
      restartGame(gameState, physics, inputHandlerRef.current ?? undefined);
      catsRef.current = [];
      pendulumCatVariantRef.current = getRandomCatVariant();
    } else if (clickedButton === "changeMode") {
      // Return to mode selection
      transitionToModeSelect(gameState, physics, inputHandlerRef.current ?? undefined);
      catsRef.current = [];
      pendulumCatVariantRef.current = getRandomCatVariant();
      // Mark when we entered mode select to prevent click-through
      modeSelectEnteredTimeRef.current = Date.now();
    }
  }, []);

  // Handle drop action
  const handleDrop = useCallback(() => {
    const physics = physicsRef.current;
    const gameState = gameStateRef.current;
    if (!physics || !gameState) return;

    // If in mode select state, don't handle as a drop (button clicks are handled separately)
    if (isModeSelectState(gameState)) {
      return;
    }

    // If in win state, don't handle as a drop (button clicks are handled separately)
    if (isWinState(gameState)) {
      return;
    }

    // If in game over state, don't handle as a drop (button clicks are handled separately)
    if (isGameOverState(gameState)) {
      return;
    }

    // Check if we should handle state transition (start/gameover)
    const stateResult = handleStateInput(gameState, physics, inputHandlerRef.current ?? undefined);

    if (stateResult.action === "start") {
      // Transition to mode select screen instead of directly to playing
      transitionToModeSelect(gameState, physics, inputHandlerRef.current ?? undefined);
      pendulumCatVariantRef.current = getRandomCatVariant();
      // Mark when we entered mode select to prevent click-through
      modeSelectEnteredTimeRef.current = Date.now();
      return;
    }

    if (stateResult.action === "restart") {
      // Clear cats on restart
      catsRef.current = [];
      pendulumCatVariantRef.current = getRandomCatVariant();
      return;
    }

    // If playing, drop a cat
    if (canDropCat(gameState)) {
      const pendulumPos = getCurrentPendulumPosition(gameState.pendulumState);
      const variant = pendulumCatVariantRef.current;

      // Get the previous cat BEFORE adding the new one (for alignment check)
      const previousCat = getPreviousCat(gameState.towerState);

      // Create and add cat to physics world (with mode-specific physics)
      const cat = createCatEntity(physics, pendulumPos.x, pendulumPos.y, variant, gameState.gameMode);

      // Classic mode: push-down mechanics
      if (gameState.gameMode === "classic") {
        // Check alignment with previous cat
        const isAligned = isClassicCatAligned(cat, previousCat);

        if (isAligned) {
          // Push all existing cats down by one cat height
          pushTowerDown(gameState.towerState);

          // Set happy expression for successful drop
          setCatExpression(cat, "happy");

          // Add to tower tracking
          addCatToTower(gameState.towerState, cat);
          catsRef.current.push(cat);

          // Check if any cat has reached the ground (bottom of screen)
          // Ground surface is at GROUND_Y - GROUND_HEIGHT/2
          const groundSurface = GROUND_Y - GROUND_HEIGHT / 2;
          if (hasTowerReachedGround(gameState.towerState, groundSurface)) {
            // Tower has reached the ground - game over (but in a good way!)
            // For now, trigger game over to end the round
            transitionToGameOver(gameState, inputHandlerRef.current ?? undefined);
          }
        } else {
          // Not aligned - game over!
          // Remove the misaligned cat from physics world
          Matter.Composite.remove(physics.world, cat.body);
          transitionToGameOver(gameState, inputHandlerRef.current ?? undefined);
        }
      } else {
        // Reach the Top mode: original falling mechanics
        setCatExpression(cat, "surprised");

        // Add to tower tracking
        addCatToTower(gameState.towerState, cat);
        catsRef.current.push(cat);

        // Track cats dropped in reachTheTop mode
        incrementCatsDropped(gameState);
      }

      // Prepare next cat
      pendulumCatVariantRef.current = getRandomCatVariant();
    }
  }, []);

  // Set up input handler after mount (needs canvas reference) - runs once
  useEffect(() => {
    // Wait a bit for canvas to be ready
    const timer = setTimeout(() => {
      const canvas = document.querySelector('canvas');
      if (canvas && !inputHandlerRef.current) {
        canvasRef.current = canvas;
        const handler = createInputHandler(canvas);
        handler.onDrop(handleDrop);
        inputHandlerRef.current = handler;
      }
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, [handleDrop]);

  // Set up button click handlers - separate effect to handle callback changes
  useEffect(() => {
    let canvas: HTMLCanvasElement | null = null;

    // Wait for canvas to be ready (same timing as input handler)
    const timer = setTimeout(() => {
      canvas = canvasRef.current ?? document.querySelector('canvas') as HTMLCanvasElement | null;
      if (!canvas) return;

      // Store canvas reference if not already set
      if (!canvasRef.current) {
        canvasRef.current = canvas;
      }

      // Add mode selection button click handlers
      canvas.addEventListener("mousedown", handleModeButtonClick);
      canvas.addEventListener("touchstart", handleModeButtonClick, { passive: false });

      // Add win screen button click handlers
      canvas.addEventListener("mousedown", handleWinScreenButtonClick);
      canvas.addEventListener("touchstart", handleWinScreenButtonClick, { passive: false });

      // Add game over screen button click handlers
      canvas.addEventListener("mousedown", handleGameOverButtonClick);
      canvas.addEventListener("touchstart", handleGameOverButtonClick, { passive: false });
    }, 150); // Slightly after input handler setup

    return () => {
      clearTimeout(timer);
      if (canvas) {
        canvas.removeEventListener("mousedown", handleModeButtonClick);
        canvas.removeEventListener("touchstart", handleModeButtonClick);
        canvas.removeEventListener("mousedown", handleWinScreenButtonClick);
        canvas.removeEventListener("touchstart", handleWinScreenButtonClick);
        canvas.removeEventListener("mousedown", handleGameOverButtonClick);
        canvas.removeEventListener("touchstart", handleGameOverButtonClick);
      }
    };
  }, [handleModeButtonClick, handleWinScreenButtonClick, handleGameOverButtonClick]);

  // Main update function called every frame
  const onUpdate = useCallback((deltaTime: number, ctx: CanvasRenderingContext2D) => {
    const physics = physicsRef.current;
    const gameState = gameStateRef.current;
    if (!physics || !gameState) return;

    gameTimeRef.current += deltaTime;

    // Clear canvas
    ctx.fillStyle = "#FFF5F5";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Always render ground
    renderGround(ctx);

    if (isStartState(gameState)) {
      // Start screen
      renderStartScreen(ctx, gameState.scoreState.highScore);
    } else if (isModeSelectState(gameState)) {
      // Mode selection screen
      renderModeSelectScreen(ctx);
    } else if (isPlayingState(gameState)) {
      // Convert seconds to ms for physics and other systems
      const deltaTimeMs = deltaTime * 1000;

      // Update physics (Matter.js expects milliseconds)
      updatePhysics(physics, deltaTimeMs);

      // Update pendulum
      updatePendulum(gameState.pendulumState, deltaTimeMs);

      // Mode-specific tower update and game logic
      if (gameState.gameMode === "reachTheTop") {
        // Reach the Top mode: use sticky landing mechanics
        // NOTE: Difficulty progression is intentionally skipped for this mode
        const reachTopResult = updateTowerReachTheTop(
          gameState.towerState,
          physics,
          deltaTimeMs
        );

        // Track lost cats (fallen off screen)
        for (const fallenCat of reachTopResult.fallenCats) {
          incrementCatsLost(gameState);
          // Remove from local cats array
          const index = catsRef.current.indexOf(fallenCat);
          if (index !== -1) {
            catsRef.current.splice(index, 1);
          }
        }

        // Check win condition after tower update
        if (checkWinCondition(gameState.towerState)) {
          // Update best score before transitioning (only once)
          if (!bestScoreUpdatedRef.current) {
            updateReachTopBest(gameState.scoreState, gameState.catsDropped);
            bestScoreUpdatedRef.current = true;
          }
          transitionToWin(gameState, inputHandlerRef.current ?? undefined);
          // Initialize confetti particles for celebration
          confettiRef.current = createConfettiParticles(50);
          setIsPlaying(false);
        }
      } else {
        // Classic mode: original game logic
        const towerResult = updateTower(gameState.towerState, deltaTimeMs);

        if (towerResult.gameOver) {
          // Game over!
          transitionToGameOver(gameState, inputHandlerRef.current ?? undefined);
          setIsPlaying(false);
        }

        // Check for stable cats and award points
        for (const cat of towerResult.newlyStableCats) {
          // Find the cat below this one for perfect landing check
          const catIndex = catsRef.current.indexOf(cat);
          const catBelow = catIndex > 0 ? catsRef.current[catIndex - 1] : null;

          // Award points (this also checks for perfect landing and updates display)
          awardStabilityPoints(gameState.scoreState, cat, catBelow);
        }

        // Check if difficulty should increase
        if (towerResult.difficultyIncreased) {
          increasePendulumDifficulty(gameState.pendulumState, gameState.towerState.difficultyLevel);
        }

        // Update perfect display timer (uses ms)
        updatePerfectDisplay(gameState.scoreState, deltaTimeMs);
      }

      // Update cat squish animations
      for (const cat of catsRef.current) {
        updateCatSquish(cat, deltaTimeMs);
      }

      // Render win line for Reach the Top mode (render before cats for layering)
      if (gameState.gameMode === "reachTheTop") {
        renderWinLine(ctx);
      }

      // Render all cats
      renderCats(ctx, catsRef.current);

      // Render pendulum cat
      renderPendulumCat(ctx, gameState.pendulumState, pendulumCatVariantRef.current);

      // Update React state for header (HUD is now in React header for both modes)
      if (gameState.gameMode === "classic") {
        // Render perfect feedback if active
        renderPerfectFeedback(ctx, gameState.scoreState);
        // Update React state for header
        setCurrentScore(gameState.scoreState.score);
        setCurrentHighScore(gameState.scoreState.highScore);
      } else {
        // Reach the Top mode
        setCurrentScore(gameState.catsDropped);
        setCatsLost(gameState.catsLost);
      }
    } else if (isGameOverState(gameState)) {
      // Convert seconds to ms
      const deltaTimeMs = deltaTime * 1000;

      // Still update physics for visual effect
      updatePhysics(physics, deltaTimeMs);

      // Update cat squish
      for (const cat of catsRef.current) {
        updateCatSquish(cat, deltaTimeMs);
      }

      // Render cats (they may still be settling)
      renderCats(ctx, catsRef.current);

      // Render game over screen
      renderGameOverScreen(
        ctx,
        gameState.scoreState.score,
        gameState.scoreState.highScore,
        gameState.beatHighScore
      );
    } else if (isWinState(gameState)) {
      // Win state for reachTheTop mode
      // Convert seconds to ms
      const deltaTimeMs = deltaTime * 1000;

      // Still update physics for visual effect
      updatePhysics(physics, deltaTimeMs);

      // Update cat squish
      for (const cat of catsRef.current) {
        updateCatSquish(cat, deltaTimeMs);
      }

      // Update confetti particles
      if (confettiRef.current) {
        updateConfettiParticles(confettiRef.current, deltaTimeMs);
      }

      // Render win line (still visible on win screen)
      renderWinLine(ctx);

      // Render cats (they should be stable)
      renderCats(ctx, catsRef.current);

      // Render confetti behind the win screen UI
      if (confettiRef.current) {
        renderConfetti(ctx, confettiRef.current);
      }

      // Render win screen with celebratory UI
      // Get the best score from score state (may have been updated on this win)
      const bestScore = getReachTopBest(gameState.scoreState);
      renderWinScreen(ctx, gameState.catsDropped, bestScore);
    }
  }, []);

  // Handler for "Tap to Play" button from HTML UI
  const onTapToPlay = useCallback(() => {
    const gameState = gameStateRef.current;
    const physics = physicsRef.current;
    if (!gameState || !physics) return;

    if (isStartState(gameState)) {
      // Transition to mode select screen
      transitionToModeSelect(gameState, physics, inputHandlerRef.current ?? undefined);
      pendulumCatVariantRef.current = getRandomCatVariant();
      // Mark when we entered mode select to prevent click-through
      modeSelectEnteredTimeRef.current = Date.now();
      // Update React state
      setIsInStartState(false);
    }
  }, []);

  // Sync high score from game state to React state
  useEffect(() => {
    const gameState = gameStateRef.current;
    if (gameState) {
      setCurrentHighScore(gameState.scoreState.highScore);
    }
  }, []);

  // Handler for back button during gameplay - returns to mode select
  const onBackToMenu = useCallback(() => {
    const gameState = gameStateRef.current;
    const physics = physicsRef.current;
    if (!gameState || !physics) return;

    // Clear cats and reset game state
    for (const cat of catsRef.current) {
      Matter.Composite.remove(physics.world, cat.body);
    }
    catsRef.current = [];
    pendulumCatVariantRef.current = getRandomCatVariant();
    confettiRef.current = null;
    bestScoreUpdatedRef.current = false;

    // Transition to mode select
    transitionToModeSelect(gameState, physics, inputHandlerRef.current ?? undefined);

    // Mark when we entered mode select to prevent click-through
    modeSelectEnteredTimeRef.current = Date.now();

    // Update React state
    setIsPlaying(false);
    setGameMode(null);
    setCurrentScore(0);
  }, []);

  return {
    onUpdate,
    isStartState: isInStartState,
    highScore: currentHighScore,
    onTapToPlay,
    isPlaying,
    gameMode,
    currentScore,
    catsLost,
    onBackToMenu,
  };
}
