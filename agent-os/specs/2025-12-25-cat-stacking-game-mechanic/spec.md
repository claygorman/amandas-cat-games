# Specification: Cat Stacking Mini-Game Mode

## Goal
Create a new mini-game mode where players build a stable cat tower to reach a win line using physics-based stacking, with the objective of reaching the goal with as few cats as possible.

## User Stories
- As a player, I want to select between the original stacking game and the new "Reach the Top" mini-game so that I can enjoy different gameplay experiences
- As a player, I want cats to stick in place when they land with sufficient overlap so that I can build a stable tower without worrying about constant physics wobble

## Specific Requirements

**Game Mode Selection System**
- Add a game mode selection screen before gameplay begins
- Display two options: "Classic Mode" (existing game) and "Reach the Top" mode (new mini-game)
- Use visual buttons or cards to differentiate the modes
- Store selected mode in game state and apply appropriate rules
- Allow returning to mode selection from game over screen

**Win Line Visual and Detection**
- Draw a horizontal win line at 90% from the top of the canvas (approximately Y=128 pixels from top, or 10% of CANVAS_HEIGHT)
- Style the win line with a dashed pattern and subtle color (green or gold) to indicate the goal
- Detect when any stable cat's body crosses above the win line
- Trigger win state when win condition is met

**Physics-Based Cat Dropping**
- Reuse the existing pendulum swing mechanic for horizontal positioning
- Use Matter.js physics for gravity-based falling (reuse existing GRAVITY constant)
- Cats fall from pendulum position when player taps/clicks
- Maintain existing cat friction and restitution properties for realistic physics

**Sticky Landing Mechanic**
- Calculate overlap percentage when a cat lands on another cat or ground
- Define overlap threshold (recommend 50-60% of cat width) for "sticking"
- When overlap threshold is met, make the cat static after a brief settling period
- If overlap is insufficient, cat remains dynamic and may fall off
- Do not use instant position locking; allow short physics settling before becoming sticky

**Cat Count Tracking (Score Inversion)**
- Track total number of cats dropped (not stacked cats)
- Display cat count prominently in HUD as "Cats: X"
- On win, display "You reached the top with X cats!"
- Lower cat count equals better performance (inverse of original scoring)
- No point bonuses or perfect landing bonuses in this mode

**Win State and Celebration**
- Trigger win state when a stable cat crosses the win line
- Display win screen with celebratory message and cat count
- Show comparison to previous best (if tracked)
- Include "Play Again" and "Change Mode" options
- Optional: confetti or celebration animation

**Game Over Condition Removal**
- In this mode, cats falling off do NOT trigger game over
- Fallen cats are simply removed from play and counted as "wasted"
- Game only ends when player reaches the win line
- Display fallen cat count separately (optional: "Cats lost: X")

## Visual Design
No visual mockups were provided. The implementation should follow the existing pastel aesthetic established in the game, with:
- Win line using a contrasting but harmonious color (suggest mint green #7BC67B or gold #FFD700)
- Mode selection screen matching the start screen's soft pink background (#FFF5F5)
- Victory screen with celebratory colors while maintaining pastel theme

## Existing Code to Leverage

**Pendulum System (`lib/game/pendulum.ts`)**
- Reuse `createPendulum()`, `updatePendulum()`, `getCurrentPendulumPosition()` for swing mechanic
- The existing sinusoidal swing motion works perfectly for this mode
- Optionally disable difficulty progression (speed increases) for consistent experience

**Physics Engine (`lib/game/physics.ts`)**
- Reuse `createPhysicsEngine()`, `updatePhysics()`, `createGroundPlatform()`
- Leverage existing `isBodyOffScreen()` to detect fallen cats for removal
- Use `createCatBody()` pattern but add logic to make bodies static after sticking

**Cat Entity System (`lib/game/cat.ts`)**
- Reuse `createCatEntity()`, `CatEntity` interface, cat variants and expressions
- Leverage `updateCatStability()` and `isCatStable()` for detecting when to apply sticky mechanic
- Use existing CAT_WIDTH (80px) for overlap calculations

**Game State Management (`lib/game/state.ts`)**
- Extend `GameStateType` to include "modeSelect" and "win" states
- Add `gameMode: "classic" | "reachTheTop"` to `GameState` interface
- Reuse state transition pattern for new states

**Renderer (`lib/game/renderer.ts`)**
- Reuse `renderCat()`, `renderCats()`, `renderPendulumCat()`, `renderGround()`
- Follow existing UI patterns for mode selection and win screens
- Use `drawRoundedRect()` helper for consistent button/card styling

## Out of Scope
- Power-up cats or special abilities
- Multiple difficulty levels or progressive difficulty in this mode
- Leaderboards or online score sharing
- Time pressure or auto-drop mechanics
- Variable cat shapes or sizes
- Tower collapse chain reactions (if one falls, others stay)
- Sound effects or music
- Achievements or unlockables
- Saving/loading game progress mid-session
- Animated tutorials or onboarding flows
