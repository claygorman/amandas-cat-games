"use client";

import { useRef, useEffect, useCallback } from "react";
import { TARGET_FPS, FRAME_TIME } from "@/lib/constants";

export interface GameLoopCallback {
  (deltaTime: number, timestamp: number): void;
}

export interface UseGameLoopOptions {
  onUpdate: GameLoopCallback;
  isRunning?: boolean;
}

export interface UseGameLoopReturn {
  start: () => void;
  stop: () => void;
  isRunning: boolean;
}

/**
 * Custom hook for managing a game loop using requestAnimationFrame.
 * Provides consistent delta time calculation for physics updates.
 */
export function useGameLoop({
  onUpdate,
  isRunning: initialRunning = true,
}: UseGameLoopOptions): UseGameLoopReturn {
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const isRunningRef = useRef<boolean>(initialRunning);
  const onUpdateRef = useRef<GameLoopCallback>(onUpdate);

  // Keep the callback ref up to date
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  const loop = useCallback((timestamp: number) => {
    if (!isRunningRef.current) return;

    // Calculate delta time in seconds
    const deltaTime = lastTimeRef.current === 0
      ? FRAME_TIME / 1000
      : Math.min((timestamp - lastTimeRef.current) / 1000, 0.1); // Cap at 100ms to handle tab switching

    lastTimeRef.current = timestamp;

    // Call the update function
    onUpdateRef.current(deltaTime, timestamp);

    // Schedule next frame
    animationFrameRef.current = requestAnimationFrame(loop);
  }, []);

  const start = useCallback(() => {
    if (isRunningRef.current) return;

    isRunningRef.current = true;
    lastTimeRef.current = 0;
    animationFrameRef.current = requestAnimationFrame(loop);
  }, [loop]);

  const stop = useCallback(() => {
    isRunningRef.current = false;
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  // Start/stop loop based on isRunning
  useEffect(() => {
    if (initialRunning) {
      // Start the loop
      if (!isRunningRef.current) {
        isRunningRef.current = true;
        lastTimeRef.current = 0;
        animationFrameRef.current = requestAnimationFrame(loop);
      }
    } else {
      // Stop the loop
      isRunningRef.current = false;
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    }

    // Cleanup on unmount
    return () => {
      isRunningRef.current = false;
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [loop, initialRunning]);

  return {
    start,
    stop,
    isRunning: isRunningRef.current,
  };
}

/**
 * Utility function to calculate canvas scaling for responsive display.
 * Maintains the 720x1280 aspect ratio while fitting within the container.
 */
export function calculateCanvasScale(
  containerWidth: number,
  containerHeight: number,
  canvasWidth: number,
  canvasHeight: number
): { scale: number; offsetX: number; offsetY: number } {
  const containerAspect = containerWidth / containerHeight;
  const canvasAspect = canvasWidth / canvasHeight;

  let scale: number;
  let offsetX = 0;
  let offsetY = 0;

  if (containerAspect > canvasAspect) {
    // Container is wider - fit by height
    scale = containerHeight / canvasHeight;
    offsetX = (containerWidth - canvasWidth * scale) / 2;
  } else {
    // Container is taller - fit by width
    scale = containerWidth / canvasWidth;
    offsetY = (containerHeight - canvasHeight * scale) / 2;
  }

  return { scale, offsetX, offsetY };
}

/**
 * Get the device pixel ratio for high-DPI display support.
 * Returns 1 for standard displays, 2+ for Retina/high-DPI displays.
 */
export function getDevicePixelRatio(): number {
  if (typeof window === "undefined") return 1;
  return Math.min(window.devicePixelRatio || 1, 3); // Cap at 3x for performance
}
