"use client";

import { useEffect, useRef } from "react";

interface AnimatedBackgroundProps {
  highScore: number;
  onTapToPlay: () => void;
}

export function AnimatedBackground({ highScore, onTapToPlay }: AnimatedBackgroundProps) {
  const grassRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const grass = grassRef.current;
    if (!grass) return;

    // Generate grass blades dynamically
    for (let i = 0; i < 60; i++) {
      const blade = document.createElement("div");
      blade.className = "grass-blade";
      blade.style.left = `${i * 1.7}%`;
      blade.style.height = `${25 + Math.random() * 30}px`;
      blade.style.animationDelay = `${Math.random() * 2}s`;
      blade.style.animationDuration = `${2 + Math.random() * 1.5}s`;
      grass.appendChild(blade);
    }

    return () => {
      // Cleanup grass blades
      while (grass.firstChild) {
        grass.removeChild(grass.firstChild);
      }
    };
  }, []);

  return (
    <div className="animated-background">
      {/* Clouds */}
      <div className="cloud cloud-1"></div>
      <div className="cloud cloud-2"></div>
      <div className="cloud cloud-3"></div>

      {/* Paw prints */}
      <svg className="paw paw-1" width="35" height="35" viewBox="0 0 50 50" fill="#F5A9B8">
        <ellipse cx="25" cy="32" rx="12" ry="10"/><ellipse cx="12" cy="18" rx="6" ry="7"/><ellipse cx="25" cy="12" rx="6" ry="7"/><ellipse cx="38" cy="18" rx="6" ry="7"/>
      </svg>
      <svg className="paw paw-2" width="30" height="30" viewBox="0 0 50 50" fill="#F5A9B8">
        <ellipse cx="25" cy="32" rx="12" ry="10"/><ellipse cx="12" cy="18" rx="6" ry="7"/><ellipse cx="25" cy="12" rx="6" ry="7"/><ellipse cx="38" cy="18" rx="6" ry="7"/>
      </svg>
      <svg className="paw paw-3" width="38" height="38" viewBox="0 0 50 50" fill="#F5A9B8">
        <ellipse cx="25" cy="32" rx="12" ry="10"/><ellipse cx="12" cy="18" rx="6" ry="7"/><ellipse cx="25" cy="12" rx="6" ry="7"/><ellipse cx="38" cy="18" rx="6" ry="7"/>
      </svg>
      <svg className="paw paw-4" width="32" height="32" viewBox="0 0 50 50" fill="#F5A9B8">
        <ellipse cx="25" cy="32" rx="12" ry="10"/><ellipse cx="12" cy="18" rx="6" ry="7"/><ellipse cx="25" cy="12" rx="6" ry="7"/><ellipse cx="38" cy="18" rx="6" ry="7"/>
      </svg>
      <svg className="paw paw-5" width="36" height="36" viewBox="0 0 50 50" fill="#F5A9B8">
        <ellipse cx="25" cy="32" rx="12" ry="10"/><ellipse cx="12" cy="18" rx="6" ry="7"/><ellipse cx="25" cy="12" rx="6" ry="7"/><ellipse cx="38" cy="18" rx="6" ry="7"/>
      </svg>
      <svg className="paw paw-6" width="28" height="28" viewBox="0 0 50 50" fill="#F5A9B8">
        <ellipse cx="25" cy="32" rx="12" ry="10"/><ellipse cx="12" cy="18" rx="6" ry="7"/><ellipse cx="25" cy="12" rx="6" ry="7"/><ellipse cx="38" cy="18" rx="6" ry="7"/>
      </svg>
      <svg className="paw paw-7" width="34" height="34" viewBox="0 0 50 50" fill="#F5A9B8">
        <ellipse cx="25" cy="32" rx="12" ry="10"/><ellipse cx="12" cy="18" rx="6" ry="7"/><ellipse cx="25" cy="12" rx="6" ry="7"/><ellipse cx="38" cy="18" rx="6" ry="7"/>
      </svg>
      <svg className="paw paw-8" width="40" height="40" viewBox="0 0 50 50" fill="#F5A9B8">
        <ellipse cx="25" cy="32" rx="12" ry="10"/><ellipse cx="12" cy="18" rx="6" ry="7"/><ellipse cx="25" cy="12" rx="6" ry="7"/><ellipse cx="38" cy="18" rx="6" ry="7"/>
      </svg>

      {/* Sparkles */}
      <svg className="sparkle sparkle-1" width="18" height="18" viewBox="0 0 24 24" fill="#FFD700"><path d="M12 0L14 10L24 12L14 14L12 24L10 14L0 12L10 10L12 0Z"/></svg>
      <svg className="sparkle sparkle-2" width="14" height="14" viewBox="0 0 24 24" fill="#FFD700"><path d="M12 0L14 10L24 12L14 14L12 24L10 14L0 12L10 10L12 0Z"/></svg>
      <svg className="sparkle sparkle-3" width="20" height="20" viewBox="0 0 24 24" fill="#FFD700"><path d="M12 0L14 10L24 12L14 14L12 24L10 14L0 12L10 10L12 0Z"/></svg>
      <svg className="sparkle sparkle-4" width="16" height="16" viewBox="0 0 24 24" fill="#FFD700"><path d="M12 0L14 10L24 12L14 14L12 24L10 14L0 12L10 10L12 0Z"/></svg>
      <svg className="sparkle sparkle-5" width="18" height="18" viewBox="0 0 24 24" fill="#FFD700"><path d="M12 0L14 10L24 12L14 14L12 24L10 14L0 12L10 10L12 0Z"/></svg>
      <svg className="sparkle sparkle-6" width="15" height="15" viewBox="0 0 24 24" fill="#FFD700"><path d="M12 0L14 10L24 12L14 14L12 24L10 14L0 12L10 10L12 0Z"/></svg>
      <svg className="sparkle sparkle-7" width="17" height="17" viewBox="0 0 24 24" fill="#FFD700"><path d="M12 0L14 10L24 12L14 14L12 24L10 14L0 12L10 10L12 0Z"/></svg>
      <svg className="sparkle sparkle-8" width="19" height="19" viewBox="0 0 24 24" fill="#FFD700"><path d="M12 0L14 10L24 12L14 14L12 24L10 14L0 12L10 10L12 0Z"/></svg>
      <svg className="sparkle sparkle-9" width="16" height="16" viewBox="0 0 24 24" fill="#FFD700"><path d="M12 0L14 10L24 12L14 14L12 24L10 14L0 12L10 10L12 0Z"/></svg>
      <svg className="sparkle sparkle-10" width="18" height="18" viewBox="0 0 24 24" fill="#FFD700"><path d="M12 0L14 10L24 12L14 14L12 24L10 14L0 12L10 10L12 0Z"/></svg>

      {/* Fish */}
      <svg className="fish fish-1" width="55" height="35" viewBox="0 0 55 35" fill="#FFB6C1" opacity="0.5">
        <ellipse cx="22" cy="17" rx="20" ry="14"/><path d="M42 17 L55 5 L55 29 Z"/><circle cx="12" cy="14" r="4" fill="#2D2D2D"/><circle cx="13" cy="13" r="1.5" fill="white"/>
      </svg>
      <svg className="fish fish-2" width="50" height="30" viewBox="0 0 55 35" fill="#FFB6C1" opacity="0.45">
        <ellipse cx="22" cy="17" rx="20" ry="14"/><path d="M42 17 L55 5 L55 29 Z"/><circle cx="12" cy="14" r="4" fill="#2D2D2D"/><circle cx="13" cy="13" r="1.5" fill="white"/>
      </svg>
      <svg className="fish fish-3" width="45" height="28" viewBox="0 0 55 35" fill="#FFB6C1" opacity="0.4">
        <ellipse cx="22" cy="17" rx="20" ry="14"/><path d="M42 17 L55 5 L55 29 Z"/><circle cx="12" cy="14" r="4" fill="#2D2D2D"/><circle cx="13" cy="13" r="1.5" fill="white"/>
      </svg>

      {/* Yarn balls */}
      <svg className="yarn yarn-1" viewBox="0 0 60 60" fill="none">
        <circle cx="30" cy="30" r="28" fill="#FFB6C1"/><path d="M10 30 Q20 10 40 15 Q55 20 50 40 Q45 55 25 50 Q5 45 10 30" stroke="#E8919F" strokeWidth="3" fill="none"/><path d="M15 25 Q30 5 45 25 Q50 40 35 50" stroke="#FF9AA2" strokeWidth="2" fill="none"/>
      </svg>
      <svg className="yarn yarn-2" viewBox="0 0 60 60" fill="none">
        <circle cx="30" cy="30" r="28" fill="#FFB6C1"/><path d="M10 30 Q20 10 40 15 Q55 20 50 40 Q45 55 25 50 Q5 45 10 30" stroke="#E8919F" strokeWidth="3" fill="none"/><path d="M15 25 Q30 5 45 25 Q50 40 35 50" stroke="#FF9AA2" strokeWidth="2" fill="none"/>
      </svg>
      <svg className="yarn yarn-3" viewBox="0 0 60 60" fill="none">
        <circle cx="30" cy="30" r="28" fill="#FFB6C1"/><path d="M10 30 Q20 10 40 15 Q55 20 50 40 Q45 55 25 50 Q5 45 10 30" stroke="#E8919F" strokeWidth="3" fill="none"/><path d="M15 25 Q30 5 45 25 Q50 40 35 50" stroke="#FF9AA2" strokeWidth="2" fill="none"/>
      </svg>

      {/* Hearts */}
      <svg className="heart heart-1" width="28" height="28" viewBox="0 0 24 24" fill="#FF6B6B"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
      <svg className="heart heart-2" width="24" height="24" viewBox="0 0 24 24" fill="#FF6B6B"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
      <svg className="heart heart-3" width="30" height="30" viewBox="0 0 24 24" fill="#FF6B6B"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
      <svg className="heart heart-4" width="26" height="26" viewBox="0 0 24 24" fill="#FF6B6B"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
      <svg className="heart heart-5" width="22" height="22" viewBox="0 0 24 24" fill="#FF6B6B"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>

      {/* Floating Cats */}
      <svg className="cat cat-1" viewBox="0 0 100 120" fill="none">
        <path d="M25 35 L35 10 L45 35" fill="#F5A9B8" stroke="#E8919F" strokeWidth="2"/><path d="M55 35 L65 10 L75 35" fill="#F5A9B8" stroke="#E8919F" strokeWidth="2"/><path d="M30 30 L35 18 L40 30" fill="#FFD1DC"/><path d="M60 30 L65 18 L70 30" fill="#FFD1DC"/><ellipse cx="50" cy="45" rx="30" ry="25" fill="#F5A9B8"/><ellipse cx="50" cy="85" rx="35" ry="35" fill="#F5A9B8"/><ellipse cx="40" cy="42" rx="4" ry="5" fill="#2D2D2D"/><ellipse cx="60" cy="42" rx="4" ry="5" fill="#2D2D2D"/><ellipse cx="41" cy="41" rx="1.5" ry="2" fill="white"/><ellipse cx="61" cy="41" rx="1.5" ry="2" fill="white"/><path d="M47 50 L50 54 L53 50 Z" fill="#E8919F"/><path d="M50 54 Q45 60 40 56" stroke="#E8919F" strokeWidth="2" fill="none" strokeLinecap="round"/><path d="M50 54 Q55 60 60 56" stroke="#E8919F" strokeWidth="2" fill="none" strokeLinecap="round"/><ellipse cx="30" cy="52" rx="6" ry="4" fill="#FFB6C1" opacity="0.6"/><ellipse cx="70" cy="52" rx="6" ry="4" fill="#FFB6C1" opacity="0.6"/><ellipse cx="50" cy="90" rx="20" ry="22" fill="#FFE4E9"/>
      </svg>
      <svg className="cat cat-2" viewBox="0 0 100 120" fill="none">
        <path d="M25 35 L35 10 L45 35" fill="#F5A9B8" stroke="#E8919F" strokeWidth="2"/><path d="M55 35 L65 10 L75 35" fill="#F5A9B8" stroke="#E8919F" strokeWidth="2"/><path d="M30 30 L35 18 L40 30" fill="#FFD1DC"/><path d="M60 30 L65 18 L70 30" fill="#FFD1DC"/><ellipse cx="50" cy="45" rx="30" ry="25" fill="#F5A9B8"/><ellipse cx="50" cy="85" rx="35" ry="35" fill="#F5A9B8"/><ellipse cx="40" cy="42" rx="4" ry="5" fill="#2D2D2D"/><ellipse cx="60" cy="42" rx="4" ry="5" fill="#2D2D2D"/><ellipse cx="41" cy="41" rx="1.5" ry="2" fill="white"/><ellipse cx="61" cy="41" rx="1.5" ry="2" fill="white"/><path d="M47 50 L50 54 L53 50 Z" fill="#E8919F"/><path d="M50 54 Q45 60 40 56" stroke="#E8919F" strokeWidth="2" fill="none" strokeLinecap="round"/><path d="M50 54 Q55 60 60 56" stroke="#E8919F" strokeWidth="2" fill="none" strokeLinecap="round"/><ellipse cx="30" cy="52" rx="6" ry="4" fill="#FFB6C1" opacity="0.6"/><ellipse cx="70" cy="52" rx="6" ry="4" fill="#FFB6C1" opacity="0.6"/><ellipse cx="50" cy="90" rx="20" ry="22" fill="#FFE4E9"/>
      </svg>
      <svg className="cat cat-3" viewBox="0 0 100 120" fill="none">
        <path d="M25 35 L35 10 L45 35" fill="#F5A9B8" stroke="#E8919F" strokeWidth="2"/><path d="M55 35 L65 10 L75 35" fill="#F5A9B8" stroke="#E8919F" strokeWidth="2"/><path d="M30 30 L35 18 L40 30" fill="#FFD1DC"/><path d="M60 30 L65 18 L70 30" fill="#FFD1DC"/><ellipse cx="50" cy="45" rx="30" ry="25" fill="#F5A9B8"/><ellipse cx="50" cy="85" rx="35" ry="35" fill="#F5A9B8"/><ellipse cx="40" cy="42" rx="4" ry="5" fill="#2D2D2D"/><ellipse cx="60" cy="42" rx="4" ry="5" fill="#2D2D2D"/><ellipse cx="41" cy="41" rx="1.5" ry="2" fill="white"/><ellipse cx="61" cy="41" rx="1.5" ry="2" fill="white"/><path d="M47 50 L50 54 L53 50 Z" fill="#E8919F"/><path d="M50 54 Q45 60 40 56" stroke="#E8919F" strokeWidth="2" fill="none" strokeLinecap="round"/><path d="M50 54 Q55 60 60 56" stroke="#E8919F" strokeWidth="2" fill="none" strokeLinecap="round"/><ellipse cx="30" cy="52" rx="6" ry="4" fill="#FFB6C1" opacity="0.6"/><ellipse cx="70" cy="52" rx="6" ry="4" fill="#FFB6C1" opacity="0.6"/><ellipse cx="50" cy="90" rx="20" ry="22" fill="#FFE4E9"/>
      </svg>
      <svg className="cat cat-4" viewBox="0 0 100 120" fill="none">
        <path d="M25 35 L35 10 L45 35" fill="#F5A9B8" stroke="#E8919F" strokeWidth="2"/><path d="M55 35 L65 10 L75 35" fill="#F5A9B8" stroke="#E8919F" strokeWidth="2"/><path d="M30 30 L35 18 L40 30" fill="#FFD1DC"/><path d="M60 30 L65 18 L70 30" fill="#FFD1DC"/><ellipse cx="50" cy="45" rx="30" ry="25" fill="#F5A9B8"/><ellipse cx="50" cy="85" rx="35" ry="35" fill="#F5A9B8"/><ellipse cx="40" cy="42" rx="4" ry="5" fill="#2D2D2D"/><ellipse cx="60" cy="42" rx="4" ry="5" fill="#2D2D2D"/><ellipse cx="41" cy="41" rx="1.5" ry="2" fill="white"/><ellipse cx="61" cy="41" rx="1.5" ry="2" fill="white"/><path d="M47 50 L50 54 L53 50 Z" fill="#E8919F"/><path d="M50 54 Q45 60 40 56" stroke="#E8919F" strokeWidth="2" fill="none" strokeLinecap="round"/><path d="M50 54 Q55 60 60 56" stroke="#E8919F" strokeWidth="2" fill="none" strokeLinecap="round"/><ellipse cx="30" cy="52" rx="6" ry="4" fill="#FFB6C1" opacity="0.6"/><ellipse cx="70" cy="52" rx="6" ry="4" fill="#FFB6C1" opacity="0.6"/><ellipse cx="50" cy="90" rx="20" ry="22" fill="#FFE4E9"/>
      </svg>
      <svg className="cat cat-5" viewBox="0 0 100 120" fill="none">
        <path d="M25 35 L35 10 L45 35" fill="#F5A9B8" stroke="#E8919F" strokeWidth="2"/><path d="M55 35 L65 10 L75 35" fill="#F5A9B8" stroke="#E8919F" strokeWidth="2"/><path d="M30 30 L35 18 L40 30" fill="#FFD1DC"/><path d="M60 30 L65 18 L70 30" fill="#FFD1DC"/><ellipse cx="50" cy="45" rx="30" ry="25" fill="#F5A9B8"/><ellipse cx="50" cy="85" rx="35" ry="35" fill="#F5A9B8"/><ellipse cx="40" cy="42" rx="4" ry="5" fill="#2D2D2D"/><ellipse cx="60" cy="42" rx="4" ry="5" fill="#2D2D2D"/><ellipse cx="41" cy="41" rx="1.5" ry="2" fill="white"/><ellipse cx="61" cy="41" rx="1.5" ry="2" fill="white"/><path d="M47 50 L50 54 L53 50 Z" fill="#E8919F"/><path d="M50 54 Q45 60 40 56" stroke="#E8919F" strokeWidth="2" fill="none" strokeLinecap="round"/><path d="M50 54 Q55 60 60 56" stroke="#E8919F" strokeWidth="2" fill="none" strokeLinecap="round"/><ellipse cx="30" cy="52" rx="6" ry="4" fill="#FFB6C1" opacity="0.6"/><ellipse cx="70" cy="52" rx="6" ry="4" fill="#FFB6C1" opacity="0.6"/><ellipse cx="50" cy="90" rx="20" ry="22" fill="#FFE4E9"/>
      </svg>

      {/* Grass */}
      <div className="animated-grass" ref={grassRef}></div>

      {/* Game UI */}
      <div className="game-ui">
        <div className="main-cat">
          <svg width="110" height="130" viewBox="0 0 100 120" fill="none">
            <path d="M25 35 L35 10 L45 35" fill="#F5A9B8" stroke="#E8919F" strokeWidth="2"/><path d="M55 35 L65 10 L75 35" fill="#F5A9B8" stroke="#E8919F" strokeWidth="2"/><path d="M30 30 L35 18 L40 30" fill="#FFD1DC"/><path d="M60 30 L65 18 L70 30" fill="#FFD1DC"/><ellipse cx="50" cy="45" rx="30" ry="25" fill="#F5A9B8"/><ellipse cx="50" cy="85" rx="35" ry="35" fill="#F5A9B8"/><ellipse cx="40" cy="42" rx="4" ry="5" fill="#2D2D2D"/><ellipse cx="60" cy="42" rx="4" ry="5" fill="#2D2D2D"/><ellipse cx="41" cy="41" rx="1.5" ry="2" fill="white"/><ellipse cx="61" cy="41" rx="1.5" ry="2" fill="white"/><path d="M47 50 L50 54 L53 50 Z" fill="#E8919F"/><path d="M50 54 Q45 60 40 56" stroke="#E8919F" strokeWidth="2" fill="none" strokeLinecap="round"/><path d="M50 54 Q55 60 60 56" stroke="#E8919F" strokeWidth="2" fill="none" strokeLinecap="round"/><ellipse cx="30" cy="52" rx="6" ry="4" fill="#FFB6C1" opacity="0.6"/><ellipse cx="70" cy="52" rx="6" ry="4" fill="#FFB6C1" opacity="0.6"/><ellipse cx="50" cy="90" rx="20" ry="22" fill="#FFE4E9"/>
          </svg>
        </div>
        <h1 className="title">Cat Stack</h1>
        <p className="subtitle">Stack cats as high as you can!</p>
        {highScore > 0 && (
          <div className="best-score">Best: {highScore}</div>
        )}
        <button className="play-btn" onClick={onTapToPlay}>
          Tap to Play
        </button>
      </div>

      {/* Vignette */}
      <div className="vignette"></div>
    </div>
  );
}

export default AnimatedBackground;
