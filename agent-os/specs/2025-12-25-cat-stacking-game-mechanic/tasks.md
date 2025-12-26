# Task Breakdown: Cat Stacking Mini-Game Mode ("Reach the Top")

## Overview
Total Tasks: 35

This implementation adds a new "Reach the Top" mini-game mode alongside the existing classic stacking game. Players build a cat tower to reach a win line at 90% screen height, with cats becoming "sticky" when landing with sufficient overlap. The goal is to reach the top with the fewest cats dropped.

## Task List

### Game State & Constants Layer

#### Task Group 1: Game Mode System Foundation
**Dependencies:** None

- [x] 1.0 Complete game mode state infrastructure
  - [x] 1.1 Write 4-6 focused tests for game mode functionality
    - Test game mode type definitions ("classic" | "reachTheTop")
    - Test mode selection state transitions
    - Test mode-specific state properties initialization
    - Test win state transition logic
  - [x] 1.2 Add new constants for Reach the Top mode
    - Add `WIN_LINE_Y` constant (128 pixels from top, ~10% of CANVAS_HEIGHT)
    - Add `WIN_LINE_COLOR` constant (#7BC67B mint green)
    - Add `OVERLAP_THRESHOLD` constant (0.5-0.6 of CAT_WIDTH for sticky landing)
    - Add `STICKY_SETTLE_TIME` constant (settling period before becoming static)
    - Location: `lib/constants.ts`
  - [x] 1.3 Extend GameStateType and GameState interface
    - Add "modeSelect" and "win" to `GameStateType`
    - Add `gameMode: "classic" | "reachTheTop"` to `GameState`
    - Add `catsDropped: number` for tracking total drops
    - Add `catsLost: number` for tracking fallen cats
    - Location: `lib/game/state.ts`
  - [x] 1.4 Implement mode selection state transitions
    - Create `transitionToModeSelect()` function
    - Create `transitionToWin()` function
    - Create `selectGameMode(mode: "classic" | "reachTheTop")` function
    - Update `handleStateInput()` to handle mode select and win states
    - Location: `lib/game/state.ts`
  - [x] 1.5 Ensure game mode tests pass
    - Run ONLY the 4-6 tests written in 1.1
    - Verify state transitions work correctly
    - Verify mode-specific properties are initialized

**Acceptance Criteria:**
- Game state supports mode selection, playing, win, and game over states
- Mode-specific constants are defined and accessible
- State transitions handle both classic and reach-the-top modes
- The 4-6 tests from 1.1 pass

---

### Physics & Game Logic Layer

#### Task Group 2: Sticky Landing Mechanic
**Dependencies:** Task Group 1

- [x] 2.0 Complete sticky landing physics implementation
  - [x] 2.1 Write 4-6 focused tests for sticky landing mechanics
    - Test overlap calculation between two cat bodies
    - Test overlap threshold detection (pass/fail cases)
    - Test cat becoming static after settling period
    - Test cat falling off when overlap is insufficient
  - [x] 2.2 Create overlap detection utility function
    - Implement `calculateCatOverlap(cat: CatEntity, targetCat: CatEntity | null): number`
    - Calculate horizontal overlap percentage based on CAT_WIDTH
    - Handle ground collision as special case (always sufficient overlap)
    - Location: `lib/game/physics.ts`
  - [x] 2.3 Implement sticky state tracking on cat entities
    - Add `isSticky: boolean` to `CatBodyData` interface
    - Add `settlingStartTime: number | null` to track when settling began
    - Add `landedOnBody: Matter.Body | null` to track what cat landed on
    - Location: `lib/game/cat.ts`
  - [x] 2.4 Implement sticky transition logic
    - Create `checkStickyCondition(cat: CatEntity, physics: PhysicsEngine): boolean`
    - Create `makeCatStatic(cat: CatEntity): void` using `Matter.Body.setStatic()`
    - Integrate with collision detection to check overlap on landing
    - Location: `lib/game/physics.ts`
  - [x] 2.5 Update tower management for sticky mechanic
    - Modify `updateTower()` to apply sticky logic when in "reachTheTop" mode
    - Track cats that become sticky vs cats that fall off
    - Do NOT trigger game over when cats fall in this mode
    - Location: `lib/game/tower.ts`
  - [x] 2.6 Ensure sticky landing tests pass
    - Run ONLY the 4-6 tests written in 2.1
    - Verify overlap detection accuracy
    - Verify sticky transition works correctly

**Acceptance Criteria:**
- Overlap percentage is calculated correctly between cat bodies
- Cats become static after sufficient overlap and settling
- Cats fall off when overlap is below threshold
- Tower update handles sticky logic for "reachTheTop" mode
- The 4-6 tests from 2.1 pass

---

#### Task Group 3: Win Line Detection and Game Flow
**Dependencies:** Task Groups 1, 2

- [x] 3.0 Complete win detection and game flow logic
  - [x] 3.1 Write 4-6 focused tests for win detection
    - Test win line crossing detection for stable cats
    - Test win state is NOT triggered for falling/unstable cats
    - Test cat count tracking (dropped and lost)
    - Test game flow from playing to win state
  - [x] 3.2 Implement win line crossing detection
    - Create `checkWinCondition(tower: TowerState): boolean`
    - Check if any stable (sticky) cat's top edge is above WIN_LINE_Y
    - Only trigger for stable cats, not falling ones
    - Location: `lib/game/tower.ts`
  - [x] 3.3 Implement cat count tracking system
    - Add `incrementCatsDropped(gameState: GameState): void`
    - Add `incrementCatsLost(gameState: GameState): void`
    - Add `getCatStats(gameState: GameState): { dropped: number, lost: number, stacked: number }`
    - Location: `lib/game/state.ts`
  - [x] 3.4 Remove fallen cat bodies in Reach the Top mode
    - Create `removeFallenCat(cat: CatEntity, physics: PhysicsEngine): void`
    - Integrate with `updateTower()` to remove cats that fall off screen
    - Increment `catsLost` counter when cat is removed
    - Location: `lib/game/tower.ts`
  - [x] 3.5 Integrate win detection into game loop
    - Check win condition each frame after tower update
    - Call `transitionToWin()` when win condition is met
    - Location: `lib/game/useGame.ts`
  - [x] 3.6 Ensure win detection tests pass
    - Run ONLY the 4-6 tests written in 3.1
    - Verify win detection triggers correctly
    - Verify cat counting is accurate

**Acceptance Criteria:**
- Win condition triggers when stable cat crosses win line
- Cat drop count is tracked accurately
- Fallen cats are removed without ending the game
- Lost cat count is tracked separately
- The 4-6 tests from 3.1 pass

---

### UI & Rendering Layer

#### Task Group 4: Mode Selection Screen
**Dependencies:** Task Group 1

- [x] 4.0 Complete mode selection screen UI
  - [x] 4.1 Write 3-5 focused tests for mode selection rendering
    - Test mode selection screen renders when in modeSelect state
    - Test both mode buttons are rendered with correct labels
    - Test button positioning and dimensions
  - [x] 4.2 Create mode selection screen renderer
    - Create `renderModeSelectScreen(ctx: CanvasRenderingContext2D): void`
    - Display title "Choose Mode" with consistent styling
    - Use soft pink background (#FFF5F5) matching start screen
    - Location: `lib/game/renderer.ts`
  - [x] 4.3 Implement mode selection buttons
    - Create "Classic Mode" button/card with brief description
    - Create "Reach the Top" button/card with brief description
    - Use `drawRoundedRect()` helper for consistent styling
    - Add visual differentiation (icons or colors) for each mode
    - Location: `lib/game/renderer.ts`
  - [x] 4.4 Create button hit-testing utility
    - Create `getModeButtonBounds(): { classic: Rect, reachTheTop: Rect }`
    - Implement `checkModeButtonClick(x: number, y: number): "classic" | "reachTheTop" | null`
    - Location: `lib/game/input.ts`
  - [x] 4.5 Integrate mode selection input handling
    - Update input handler to detect mode button clicks
    - Call `selectGameMode()` when button is clicked
    - Transition to playing state after mode selection
    - Location: `lib/game/useGame.ts`
  - [x] 4.6 Ensure mode selection UI tests pass
    - Run ONLY the 3-5 tests written in 4.1
    - Verify screen renders correctly
    - Verify button interaction works

**Acceptance Criteria:**
- Mode selection screen displays both game mode options
- Visual styling matches existing pastel aesthetic
- Buttons are clickable and trigger mode selection
- Game transitions to playing after selection
- The 3-5 tests from 4.1 pass

---

#### Task Group 5: Win Line and HUD Rendering
**Dependencies:** Task Groups 1, 4

- [x] 5.0 Complete win line and mode-specific HUD rendering
  - [x] 5.1 Write 3-5 focused tests for win line and HUD rendering
    - Test win line renders at correct Y position with correct style
    - Test HUD displays cat count in Reach the Top mode
    - Test HUD displays score in Classic mode
  - [x] 5.2 Implement win line rendering
    - Create `renderWinLine(ctx: CanvasRenderingContext2D): void`
    - Draw dashed horizontal line at WIN_LINE_Y position
    - Use mint green (#7BC67B) or gold (#FFD700) color
    - Add subtle glow or label "GOAL" for visibility
    - Location: `lib/game/renderer.ts`
  - [x] 5.3 Create mode-specific HUD rendering
    - Create `renderReachTheTopHUD(ctx: CanvasRenderingContext2D, catsDropped: number, catsLost: number): void`
    - Display "Cats: X" prominently (fewer is better)
    - Optionally display "Lost: Y" in smaller text
    - Reuse existing HUD styling patterns
    - Location: `lib/game/renderer.ts`
  - [x] 5.4 Integrate mode-specific rendering into game loop
    - Render win line only in "reachTheTop" mode
    - Switch HUD rendering based on current game mode
    - Keep Classic mode HUD unchanged
    - Location: `lib/game/useGame.ts`
  - [x] 5.5 Ensure win line and HUD tests pass
    - Run ONLY the 3-5 tests written in 5.1
    - Verify win line visibility
    - Verify HUD displays correct information per mode

**Acceptance Criteria:**
- Win line is visible and styled correctly
- HUD displays appropriate information per game mode
- Classic mode remains unchanged
- The 3-5 tests from 5.1 pass

---

#### Task Group 6: Win Screen and Celebration
**Dependencies:** Task Groups 3, 5

- [x] 6.0 Complete win screen and celebration UI
  - [x] 6.1 Write 3-5 focused tests for win screen rendering
    - Test win screen displays when in win state
    - Test win message includes cat count
    - Test Play Again and Change Mode buttons render
  - [x] 6.2 Create win screen renderer
    - Create `renderWinScreen(ctx: CanvasRenderingContext2D, catsUsed: number, bestScore: number | null): void`
    - Display celebratory message "You reached the top!"
    - Show cat count with "with X cats!" emphasis
    - Use pastel celebratory colors (soft gold, mint green)
    - Location: `lib/game/renderer.ts`
  - [x] 6.3 Add optional confetti/celebration animation
    - Create simple particle system for confetti effect
    - Use pastel colors matching game aesthetic
    - Animate particles falling during win screen
    - Keep implementation simple (no external libraries)
    - Location: `lib/game/renderer.ts`
  - [x] 6.4 Implement win screen buttons
    - Add "Play Again" button (restarts in same mode)
    - Add "Change Mode" button (returns to mode selection)
    - Use consistent button styling from other screens
    - Location: `lib/game/renderer.ts`
  - [x] 6.5 Integrate win screen input handling
    - Create hit-testing for win screen buttons
    - Handle "Play Again" to restart game
    - Handle "Change Mode" to return to mode selection
    - Location: `lib/game/useGame.ts`
  - [x] 6.6 Ensure win screen tests pass
    - Run ONLY the 3-5 tests written in 6.1
    - Verify screen displays correctly
    - Verify button interactions work

**Acceptance Criteria:**
- Win screen displays with celebratory message and cat count
- Optional confetti animation adds visual interest
- Both buttons are functional
- Screen matches game's pastel aesthetic
- The 3-5 tests from 6.1 pass

---

### Integration Layer

#### Task Group 7: Game Loop Integration and Polish
**Dependencies:** Task Groups 1-6

- [x] 7.0 Complete full game loop integration
  - [x] 7.1 Update main game hook for dual-mode support
    - Modify `useGame` to check current game mode
    - Route update logic based on mode (classic vs reachTheTop)
    - Ensure classic mode behavior is unchanged
    - Location: `lib/game/useGame.ts`
  - [x] 7.2 Implement mode-specific drop handling
    - In "reachTheTop" mode: increment `catsDropped` on each drop
    - In "reachTheTop" mode: skip difficulty progression
    - Maintain existing drop behavior for "classic" mode
    - Location: `lib/game/useGame.ts`
  - [x] 7.3 Add game over screen navigation to mode select
    - Update game over screen to include "Change Mode" option
    - Allow returning to mode selection from game over
    - Location: `lib/game/renderer.ts`
  - [x] 7.4 Implement best score tracking for Reach the Top mode
    - Add separate high score key for "reachTheTop" mode (lower is better)
    - Store and retrieve best cat count from localStorage
    - Display comparison on win screen
    - Location: `lib/game/scoring.ts`
  - [x] 7.5 Polish and edge case handling
    - Ensure smooth transitions between all states
    - Handle rapid input during state transitions
    - Verify no memory leaks when switching modes
    - Test cleanup on component unmount

**Acceptance Criteria:**
- Both game modes are fully playable
- Mode switching works correctly
- Best scores are tracked separately per mode
- No regressions in classic mode functionality
- Smooth state transitions throughout

---

### Testing

#### Task Group 8: Test Review and Gap Analysis
**Dependencies:** Task Groups 1-7

- [x] 8.0 Review existing tests and fill critical gaps
  - [x] 8.1 Review tests from Task Groups 1-7
    - Review the 4-6 tests from Task 1.1 (game mode state)
    - Review the 4-6 tests from Task 2.1 (sticky landing)
    - Review the 4-6 tests from Task 3.1 (win detection)
    - Review the 3-5 tests from Task 4.1 (mode selection UI)
    - Review the 3-5 tests from Task 5.1 (win line/HUD)
    - Review the 3-5 tests from Task 6.1 (win screen)
    - Total existing tests: approximately 22-33 tests
  - [x] 8.2 Analyze test coverage gaps for this feature
    - Identify critical end-to-end workflows lacking coverage
    - Focus on integration points between systems
    - Prioritize user-facing functionality
    - Do NOT assess entire application test coverage
  - [x] 8.3 Write up to 10 additional strategic tests
    - Add integration tests for complete game flow (mode select -> play -> win)
    - Add test for sticky landing in context of full tower
    - Add test for proper cleanup when switching modes
    - Focus on scenarios not covered by unit tests
  - [x] 8.4 Run feature-specific tests only
    - Run all tests from Tasks 1.1, 2.1, 3.1, 4.1, 5.1, 6.1
    - Run additional tests from 8.3
    - Expected total: approximately 32-43 tests maximum
    - Verify all critical workflows pass

**Acceptance Criteria:**
- All feature-specific tests pass (approximately 32-43 tests total)
- Critical user workflows for both modes are covered
- No more than 10 additional tests added in gap analysis
- Testing focused exclusively on cat stacking feature requirements

---

## Execution Order

Recommended implementation sequence:

1. **Task Group 1: Game Mode System Foundation** - Establishes state management for dual-mode support
2. **Task Group 4: Mode Selection Screen** - UI for selecting between modes (can start in parallel with Group 2)
3. **Task Group 2: Sticky Landing Mechanic** - Core physics for the new game mode
4. **Task Group 5: Win Line and HUD Rendering** - Visual elements for new mode (can overlap with Group 3)
5. **Task Group 3: Win Line Detection and Game Flow** - Win condition logic
6. **Task Group 6: Win Screen and Celebration** - Victory state UI
7. **Task Group 7: Game Loop Integration and Polish** - Full integration and polish
8. **Task Group 8: Test Review and Gap Analysis** - Final testing and verification

## Files to Create/Modify

### New Files
None required - all functionality extends existing modules

### Modified Files
- `lib/constants.ts` - New constants for win line, overlap threshold
- `lib/game/state.ts` - Extended game states and mode support
- `lib/game/physics.ts` - Overlap detection utilities
- `lib/game/cat.ts` - Sticky state tracking
- `lib/game/tower.ts` - Win detection, fallen cat handling
- `lib/game/renderer.ts` - Mode select, win line, win screen, HUD
- `lib/game/input.ts` - Button hit-testing
- `lib/game/scoring.ts` - Mode-specific scoring/best tracking
- `lib/game/useGame.ts` - Game loop integration

## Key Reusability Notes

- **Pendulum System**: Fully reusable, optionally disable difficulty progression for consistent experience
- **Physics Engine**: Reuse entirely, add overlap detection utility
- **Cat Entity System**: Extend with sticky state, reuse rendering and expressions
- **Renderer**: Reuse all cat rendering, ground, UI helpers (drawRoundedRect, styling)
- **State Management**: Extend existing pattern with new states
- **Input Handling**: Extend with button hit-testing for mode/win screens
