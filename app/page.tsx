"use client";

import GameCanvas from "@/components/GameCanvas";
import AnimatedBackground from "@/components/AnimatedBackground";
import GameHeader from "@/components/GameHeader";
import { useGame } from "@/lib/game/useGame";

export default function Home() {
  const {
    onUpdate,
    isStartState,
    highScore,
    onTapToPlay,
    isPlaying,
    gameMode,
    currentScore,
    catsLost,
    onBackToMenu,
  } = useGame();

  // Create header overlay for gameplay
  const gameOverlay = isPlaying ? (
    <GameHeader
      onBack={onBackToMenu}
      currentScore={currentScore}
      highScore={highScore}
      catsLost={catsLost}
      gameMode={gameMode ?? undefined}
    />
  ) : null;

  return (
    <main className="w-screen h-screen h-dvh flex relative">
      {/* Animated Background - only show during start state */}
      {isStartState && (
        <AnimatedBackground highScore={highScore} onTapToPlay={onTapToPlay} />
      )}

      {/* Game Canvas with header overlay */}
      <div className={`flex-1 h-full ${isStartState ? "hidden" : ""}`}>
        <GameCanvas onUpdate={onUpdate} overlay={gameOverlay} />
      </div>
    </main>
  );
}
