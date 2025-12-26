"use client";

import GameCanvas from "@/components/GameCanvas";
import { useGame } from "@/lib/game/useGame";

export default function Home() {
  const { onUpdate } = useGame();

  return (
    <main className="w-screen h-screen h-dvh bg-gray-900 flex">
      {/* Instructions Panel */}
      <div className="hidden lg:flex flex-col justify-center p-8 text-white max-w-xs">
        <h1 className="text-3xl font-bold text-pink-400 mb-6">Cat Stack</h1>

        <div className="space-y-4">
          <section>
            <h2 className="text-lg font-semibold text-pink-300 mb-2">How to Play</h2>
            <p className="text-gray-300 text-sm">
              Stack cats as high as you can! Time your drops carefully to build a stable tower.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-pink-300 mb-2">Controls</h2>
            <ul className="text-gray-300 text-sm space-y-1">
              <li><span className="text-pink-400">Click</span> or <span className="text-pink-400">Tap</span> to drop</li>
              <li><span className="text-pink-400">Spacebar</span> also works!</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-pink-300 mb-2">Scoring</h2>
            <ul className="text-gray-300 text-sm space-y-1">
              <li><span className="text-green-400">+1</span> for each stacked cat</li>
              <li><span className="text-yellow-400">+2 bonus</span> for perfect landings!</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-pink-300 mb-2">Tips</h2>
            <ul className="text-gray-300 text-sm space-y-1">
              <li>Watch the swinging cat above</li>
              <li>Drop when centered for best results</li>
              <li>Speed increases as you stack more!</li>
            </ul>
          </section>
        </div>

        <p className="text-gray-500 text-xs mt-8">
          Game over when a cat falls off!
        </p>
      </div>

      {/* Game Area */}
      <div className="flex-1 h-full">
        <GameCanvas onUpdate={onUpdate} />
      </div>
    </main>
  );
}
