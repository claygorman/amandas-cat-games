"use client";

interface GameHeaderProps {
  onBack: () => void;
  currentScore?: number;
  highScore?: number;
  catsLost?: number;
  gameMode?: "classic" | "reachTheTop";
}

export default function GameHeader({
  onBack,
  currentScore = 0,
  highScore = 0,
  catsLost = 0,
  gameMode
}: GameHeaderProps) {
  const isReachTheTop = gameMode === "reachTheTop";

  return (
    <header className="game-header">
      <button className="back-button" onClick={onBack} aria-label="Back to menu">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        <span>Menu</span>
      </button>

      <div className="header-stats">
        {isReachTheTop ? (
          <>
            <div className="header-score header-cats">
              <span className="stat-label">Cats</span>
              <span className="stat-value">{currentScore}</span>
            </div>
            <div className="header-lost">
              <span className="stat-label">Lost</span>
              <span className="stat-value">{catsLost}</span>
            </div>
          </>
        ) : (
          <>
            <div className="header-score">
              <span className="stat-label">Score</span>
              <span className="stat-value">{currentScore}</span>
            </div>
            <div className="header-best">
              <span className="stat-label">Best</span>
              <span className="stat-value">{highScore}</span>
            </div>
          </>
        )}
      </div>

      {gameMode && (
        <div className="header-mode">
          {gameMode === "classic" ? "Classic" : "Reach the Top"}
        </div>
      )}
    </header>
  );
}
