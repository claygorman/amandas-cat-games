"use client";

import { useRef, useEffect, useState, useCallback, ReactNode } from "react";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "@/lib/constants";
import {
  useGameLoop,
  calculateCanvasScale,
  getDevicePixelRatio,
} from "@/lib/game/useGameLoop";

export interface GameCanvasProps {
  onUpdate?: (deltaTime: number, ctx: CanvasRenderingContext2D) => void;
  isRunning?: boolean;
  /** Optional overlay content that will be positioned over the canvas */
  overlay?: ReactNode;
}

/**
 * Main game canvas component with responsive scaling and high-DPI support.
 * Maintains a 720x1280 portrait aspect ratio.
 */
export function GameCanvas({
  onUpdate,
  isRunning = true,
  overlay,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [containerStyle, setContainerStyle] = useState<React.CSSProperties>({});
  const [canvasLayout, setCanvasLayout] = useState({ width: 0, height: 0, marginLeft: 0 });

  // Handle canvas context initialization and sizing
  useEffect(() => {
    const updateSize = () => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;

      // Check if mobile (touch device) for viewport handling
      const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

      // Use visualViewport on mobile for accurate dimensions (accounts for browser chrome)
      // On desktop, use container dimensions to respect flex layout
      const visualViewport = window.visualViewport;
      const containerWidth = (isMobile && visualViewport) ? visualViewport.width : container.clientWidth;
      const containerHeight = (isMobile && visualViewport) ? visualViewport.height : container.clientHeight;

      // Only set explicit max-height on mobile to fix iOS viewport issues
      if (visualViewport && isMobile) {
        setContainerStyle({
          maxHeight: `${visualViewport.height}px`,
        });
      } else {
        setContainerStyle({});
      }

      // Wait until container has actual dimensions
      if (containerWidth === 0 || containerHeight === 0) {
        requestAnimationFrame(updateSize);
        return;
      }

      const { scale, offsetX, offsetY } = calculateCanvasScale(
        containerWidth,
        containerHeight,
        CANVAS_WIDTH,
        CANVAS_HEIGHT
      );

      const dpr = getDevicePixelRatio();
      const displayWidth = CANVAS_WIDTH * scale;
      const displayHeight = CANVAS_HEIGHT * scale;

      // Set the actual canvas size in memory (scaled up for high-DPI)
      canvas.width = CANVAS_WIDTH * dpr;
      canvas.height = CANVAS_HEIGHT * dpr;

      // Scale the canvas CSS size for display
      canvas.style.width = `${displayWidth}px`;
      canvas.style.height = `${displayHeight}px`;
      // Only use horizontal offset - vertical is handled by flex justify-start
      canvas.style.marginLeft = `${offsetX}px`;
      canvas.style.marginTop = `0px`;

      // Store layout for overlay positioning
      setCanvasLayout({ width: displayWidth, height: displayHeight, marginLeft: offsetX });

      // Scale the context to account for high-DPI
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
        ctx.scale(dpr, dpr);
        ctxRef.current = ctx;
        setIsReady(true);
      }
    };

    updateSize();
    window.addEventListener("resize", updateSize);

    // Listen to visualViewport changes for mobile browser chrome
    const visualViewport = window.visualViewport;
    visualViewport?.addEventListener("resize", updateSize);

    return () => {
      window.removeEventListener("resize", updateSize);
      visualViewport?.removeEventListener("resize", updateSize);
    };
  }, []);

  // Game loop update handler
  const handleUpdate = useCallback(
    (deltaTime: number, _timestamp: number) => {
      const ctx = ctxRef.current;
      if (!ctx) return;

      // Clear the canvas with a pastel background
      ctx.fillStyle = "#FFF5F5"; // Soft pink/cream background
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Call custom update handler if provided
      if (onUpdate) {
        onUpdate(deltaTime, ctx);
      }
    },
    [onUpdate]
  );

  // Initialize game loop only when ready
  useGameLoop({
    onUpdate: handleUpdate,
    isRunning: isRunning && isReady,
  });

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex flex-col justify-start bg-gray-900 overflow-hidden relative"
      style={containerStyle}
      data-testid="game-container"
    >
      <canvas
        ref={canvasRef}
        data-testid="game-canvas"
        className="block"
        style={{
          imageRendering: "crisp-edges",
        }}
      />
      {/* Overlay positioned to match canvas dimensions */}
      {overlay && canvasLayout.width > 0 && (
        <div
          className="canvas-overlay"
          style={{
            position: 'absolute',
            top: 0,
            left: canvasLayout.marginLeft,
            width: canvasLayout.width,
            height: canvasLayout.height,
            pointerEvents: 'none',
          }}
        >
          {overlay}
        </div>
      )}
    </div>
  );
}

export default GameCanvas;
