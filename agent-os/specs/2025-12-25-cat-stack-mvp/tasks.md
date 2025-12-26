# Task Breakdown: Cat Stack MVP

## Overview
Total Tasks: 6 Task Groups, approximately 40 sub-tasks

This is a greenfield Next.js 16 game project using Matter.js for physics and HTML5 Canvas for rendering. The implementation follows a layered approach: project setup, core game engine, entity systems, game mechanics, UI/state management, and final integration testing.

## Task List

### Project Foundation

#### Task Group 1: Project Setup and Game Canvas
**Dependencies:** None
**Estimated Size:** Medium (2-3 hours)

- [x] 1.0 Complete project foundation and canvas setup
  - [x] 1.1 Write 4 focused tests for canvas and game loop functionality
    - Test canvas initialization and context creation
    - Test responsive scaling calculations for 720x1280 aspect ratio
    - Test devicePixelRatio handling for high-DPI displays
    - Test requestAnimationFrame game loop starts and stops correctly
  - [x] 1.2 Initialize Next.js 16 project structure
    - Create app/ directory with page.tsx entry point
    - Create components/ directory for React components
    - Create lib/game/ directory for game logic and utilities
    - Create lib/constants.ts for game configuration values
    - Configure TypeScript strict mode
    - Install dependencies: matter-js, @types/matter-js
  - [x] 1.3 Create responsive game canvas component
    - Create components/GameCanvas.tsx with "use client" directive
    - Implement 720x1280 portrait aspect ratio with dynamic scaling
    - Handle devicePixelRatio for crisp rendering on Retina displays
    - Add canvas ref and context initialization
  - [x] 1.4 Implement game loop hook
    - Create lib/game/useGameLoop.ts custom hook
    - Use requestAnimationFrame for 60 FPS target
    - Implement delta time calculation for consistent physics
    - Handle cleanup on component unmount
  - [x] 1.5 Ensure project foundation tests pass
    - Run ONLY the 4 tests written in 1.1
    - Verify canvas renders at correct dimensions
    - Verify game loop executes at target framerate

**Acceptance Criteria:**
- The 4 tests written in 1.1 pass
- Canvas displays at correct aspect ratio on various screen sizes
- Game loop runs smoothly at 60 FPS
- High-DPI displays render crisply
- Project structure follows Next.js App Router conventions

---

### Physics Layer

#### Task Group 2: Matter.js Physics Integration
**Dependencies:** Task Group 1
**Estimated Size:** Medium (2-3 hours)

- [x] 2.0 Complete physics engine integration
  - [x] 2.1 Write 5 focused tests for physics functionality
    - Test Matter.js engine initialization with correct gravity
    - Test ground platform body creation and positioning
    - Test physics world bounds detection
    - Test body collision detection between cat-like bodies
    - Test physics cleanup on unmount (no memory leaks)
  - [x] 2.2 Create physics engine initialization utility
    - Create lib/game/physics.ts for Matter.js setup
    - Initialize engine with gravity approximately 1.0 (tunable)
    - Export engine, world, and utility functions
    - Configure collision categories for cats and ground
  - [x] 2.3 Implement ground platform body
    - Create static ground body at bottom of play area
    - Style as pastel-colored rectangle with rounded top
    - Position correctly relative to canvas dimensions
  - [x] 2.4 Create physics update integration with game loop
    - Call Matter.Engine.update() in sync with render loop
    - Handle fixed timestep for consistent physics simulation
    - Implement world bounds for off-screen detection
  - [x] 2.5 Implement physics cleanup on component unmount
    - Clear all bodies from world
    - Dispose of engine properly
    - Remove event listeners
  - [x] 2.6 Ensure physics layer tests pass
    - Run ONLY the 5 tests written in 2.1
    - Verify physics simulation runs correctly
    - Verify ground platform is positioned correctly

**Acceptance Criteria:**
- The 5 tests written in 2.1 pass
- Physics engine runs in sync with render loop
- Ground platform exists and is collidable
- Bodies fall with gravity when spawned
- No memory leaks on cleanup

---

### Entity System

#### Task Group 3: Cat Entity System
**Dependencies:** Task Group 2
**Estimated Size:** Large (3-4 hours)

- [x] 3.0 Complete cat entity system
  - [x] 3.1 Write 6 focused tests for cat entities
    - Test cat body creation with correct physics properties
    - Test cat variant random selection (4 variants)
    - Test cat expression state management (neutral, surprised, happy, worried)
    - Test cat rendering with correct visual style
    - Test cat physics properties (friction 0.8-0.9, restitution 0.1-0.2)
    - Test cat stability detection (velocity below threshold for 2 seconds)
  - [x] 3.2 Define cat body physics configuration
    - Create lib/game/cat.ts for cat entity logic
    - Define rectangular body with rounded corners (80x60 pixels base)
    - Configure physics: mass, friction (0.8-0.9), restitution (0.1-0.2)
    - Store custom data on body for variant and expression state
  - [x] 3.3 Implement 4 cat visual variants
    - Define color palettes for: orange tabby, gray, tuxedo, calico
    - Create variant selection function (random on spawn)
    - Store variant type on cat body for rendering
  - [x] 3.4 Create cat expression state system
    - Define expressions: "neutral", "surprised", "happy", "worried"
    - Implement expression state getter/setter on cat body
    - Create expression transition logic hooks
  - [x] 3.5 Implement cat canvas rendering
    - Create lib/game/renderer.ts for drawing utilities
    - Draw rounded rectangle body shape
    - Draw triangle ears
    - Draw oval eyes with expression variations
    - Draw whisker lines
    - Draw mouth/expression (smile, squiggly, etc.)
    - Apply variant colors and patterns
  - [x] 3.6 Add landing squish animation
    - Detect cat impact with ground or other cat
    - Apply brief scale squish effect (compress then restore)
    - Keep animation subtle and quick
  - [x] 3.7 Ensure cat entity tests pass
    - Run ONLY the 6 tests written in 3.1
    - Verify cats render with correct visuals
    - Verify physics properties are applied correctly

**Acceptance Criteria:**
- The 6 tests written in 3.1 pass
- Cats spawn with random variants
- Cats display correct expressions based on state
- Cat physics feel satisfying (slight bounce, good friction)
- Visual style matches pastel/cartoonish aesthetic
- Landing squish animation provides feedback

---

### Game Mechanics

#### Task Group 4: Pendulum, Dropping, and Difficulty
**Dependencies:** Task Group 3
**Estimated Size:** Large (3-4 hours)

- [x] 4.0 Complete core game mechanics
  - [x] 4.1 Write 6 focused tests for game mechanics
    - Test pendulum sinusoidal motion calculation
    - Test cat drop spawning at pendulum position
    - Test input handling (click, touch, spacebar)
    - Test input debouncing (100ms minimum between drops)
    - Test difficulty progression at thresholds (5, 10, 15, 20 cats)
    - Test tower stability detection (cat fallen triggers game over)
  - [x] 4.2 Implement pendulum swing motion
    - Create lib/game/pendulum.ts for pendulum logic
    - Position invisible pivot at top-center of screen
    - Implement sinusoidal motion: x = centerX + amplitude * sin(time * speed)
    - Base amplitude: 40% of screen width
    - Base period: approximately 2 seconds
  - [x] 4.3 Create cat drop mechanic
    - On input, spawn cat at current pendulum X position
    - Apply no initial velocity (gravity takes over)
    - Set cat expression to "surprised" during fall
    - Immediately position next cat on pendulum
  - [x] 4.4 Implement input handling system
    - Create lib/game/input.ts for input management
    - Listen for mousedown/click on canvas
    - Listen for touchstart on canvas (prevent default for scroll)
    - Listen for spacebar keydown events
    - Implement 100ms debounce between drops
  - [x] 4.5 Implement difficulty progression
    - Track successfully stacked cats count
    - Increase swing speed by 15-20% at thresholds: 5, 10, 15, 20
    - Optionally increase amplitude slightly at higher levels
    - Store difficulty level in game state
  - [x] 4.6 Implement tower stability detection
    - Monitor all cat bodies each frame
    - Detect cats fallen below ground level (death zone)
    - Track cat velocity for stability check (< 0.5 for 2 seconds)
    - Transition expression to "happy" when stable
    - Detect wobbling tower (check velocity of recent cats)
    - Set expressions to "worried" during wobble
  - [x] 4.7 Ensure game mechanics tests pass
    - Run ONLY the 6 tests written in 4.1
    - Verify pendulum swings correctly
    - Verify drops work with all input methods

**Acceptance Criteria:**
- The 6 tests written in 4.1 pass
- Pendulum swings smoothly with sinusoidal motion
- Cats drop correctly from pendulum position
- All input methods work (click, touch, spacebar)
- Difficulty increases at correct thresholds
- Game detects fallen cats immediately
- Cat expressions change based on tower state

---

### UI and State Management

#### Task Group 5: Scoring and Game States
**Dependencies:** Task Group 4
**Estimated Size:** Medium (2-3 hours)

- [x] 5.0 Complete UI and game state management
  - [x] 5.1 Write 6 focused tests for scoring and game states
    - Test score increment (+1) on cat stability
    - Test perfect landing detection (10-15% center offset)
    - Test perfect landing bonus (+2 points)
    - Test high score localStorage persistence
    - Test game state transitions (start -> playing -> gameover)
    - Test game restart with proper physics cleanup
  - [x] 5.2 Implement scoring system
    - Create lib/game/scoring.ts for score logic
    - Award +1 point when cat achieves 2-second stability
    - Calculate landing position relative to cat below (or ground)
    - Award +2 bonus for center offset within 10-15% of cat width
    - Display brief "Perfect!" text on screen for bonus landings
  - [x] 5.3 Implement high score persistence
    - Save high score to localStorage key "catstack_highscore"
    - Load high score on game initialization
    - Update high score when beaten
  - [x] 5.4 Create game state machine
    - Create lib/game/state.ts for state management
    - Define states: "start", "playing", "gameover"
    - Implement state transition functions
    - Trigger appropriate cleanup on state changes
  - [x] 5.5 Create start screen UI
    - Display game title (styled text on canvas)
    - Show high score
    - Display "Tap to Play" prompt
    - Transition to playing state on input
  - [x] 5.6 Create gameplay HUD
    - Display current score in top corner
    - Display high score below current score
    - Use clean typography that fits pastel style
  - [x] 5.7 Create game over screen UI
    - Display "Game Over" message
    - Show final score
    - Show high score (highlight if beaten)
    - Display "Tap to Restart" prompt
    - Disable game input until restart action
  - [x] 5.8 Implement game restart functionality
    - Clear all cat bodies from physics world
    - Reset score and stacked cats count
    - Reset difficulty to base level
    - Transition back to start or playing state
  - [x] 5.9 Ensure UI and state tests pass
    - Run ONLY the 6 tests written in 5.1
    - Verify scoring works correctly
    - Verify state transitions are smooth

**Acceptance Criteria:**
- The 6 tests written in 5.1 pass
- Score increments correctly on stable landings
- Perfect landings detected and bonus awarded
- High score persists across sessions
- All three game screens display correctly
- Game restarts cleanly with no leftover state

---

### Integration and Polish

#### Task Group 6: Test Review, Integration, and Visual Polish
**Dependencies:** Task Groups 1-5
**Estimated Size:** Medium (2-3 hours)

- [x] 6.0 Review tests, integrate systems, and polish visuals
  - [x] 6.1 Review tests from Task Groups 1-5
    - Review the 4 tests written in Task 1.1 (canvas/game loop)
    - Review the 5 tests written in Task 2.1 (physics)
    - Review the 6 tests written in Task 3.1 (cat entities)
    - Review the 6 tests written in Task 4.1 (game mechanics)
    - Review the 6 tests written in Task 5.1 (scoring/states)
    - Total existing tests: 84 tests (actual count from implementation)
  - [x] 6.2 Analyze test coverage gaps for Cat Stack MVP
    - Identify critical user workflows lacking coverage
    - Focus on end-to-end gameplay scenarios
    - Prioritize integration between systems
  - [x] 6.3 Write up to 8 additional integration tests
    - Test complete drop-to-score workflow
    - Test game over trigger and restart flow
    - Test difficulty progression during extended play
    - Test multiple cat stacking physics interaction
    - Test "Perfect!" landing full flow (detection + bonus + display)
    - Test high score update flow (beat, save, display)
    - Test responsive canvas during window resize
    - Test mobile touch input end-to-end
  - [x] 6.4 Apply visual polish pass
    - Refine pastel color palette consistency
    - Ensure soft pink, mint green, lavender, cream theme throughout
    - Add subtle shadows or outlines to cats for visibility
    - Polish ground platform appearance
    - Ensure UI text is readable and styled appropriately
  - [x] 6.5 Performance optimization check
    - Verify 60 FPS maintained during gameplay
    - Check for any rendering bottlenecks
    - Ensure physics doesn't lag with many stacked cats
    - Verify bundle size target (under 500KB JS for game code)
  - [x] 6.6 Cross-browser and device testing
    - Test on Chrome, Firefox, Safari desktop
    - Test on mobile Safari and Chrome
    - Verify touch input works on actual mobile devices
    - Confirm aspect ratio scaling works on various screens
  - [x] 6.7 Run all feature-specific tests
    - Run all 84 tests from Task Groups 1-5
    - Run 22 integration tests from 6.3
    - Total: 106 tests
    - Verify all tests pass
    - Fix any failing tests

**Acceptance Criteria:**
- All 106 tests pass
- Complete game loop works: start -> play -> stack -> score -> game over -> restart
- Visual style is cohesive and matches pastel/cartoonish aesthetic
- Performance targets met (60 FPS, game code well under 500KB)
- Works on desktop and mobile browsers
- No console errors or warnings during gameplay

---

## Execution Order

Recommended implementation sequence:

1. **Task Group 1: Project Setup and Game Canvas** - Foundation that everything builds upon
2. **Task Group 2: Matter.js Physics Integration** - Core physics system needed for gameplay
3. **Task Group 3: Cat Entity System** - Game objects that use physics
4. **Task Group 4: Pendulum, Dropping, and Difficulty** - Core game mechanics
5. **Task Group 5: Scoring and Game States** - Game flow and user feedback
6. **Task Group 6: Test Review, Integration, and Visual Polish** - Final integration and quality assurance

## Technical Notes

**Key Constants to Define (lib/constants.ts):**
```typescript
// Canvas
CANVAS_WIDTH: 720
CANVAS_HEIGHT: 1280
TARGET_FPS: 60

// Physics
GRAVITY: 1.0
CAT_FRICTION: 0.85
CAT_RESTITUTION: 0.15
STABILITY_VELOCITY_THRESHOLD: 0.5
STABILITY_TIME_REQUIRED: 2000 // ms

// Pendulum
SWING_AMPLITUDE: 0.4 // 40% of screen width
SWING_PERIOD: 2000 // ms
SPEED_INCREASE_FACTOR: 0.175 // 17.5%

// Scoring
POINTS_PER_STACK: 1
PERFECT_BONUS: 2
PERFECT_THRESHOLD: 0.125 // 12.5% of cat width

// Difficulty Thresholds
DIFFICULTY_THRESHOLDS: [5, 10, 15, 20, 25, 30] // continues pattern

// Input
DROP_DEBOUNCE_MS: 100
```

**File Structure:**
```
app/
  page.tsx                    # Main entry point
  layout.tsx                  # Root layout
  globals.css                 # Global styles (Tailwind)
components/
  GameCanvas.tsx              # Main game canvas component
lib/
  constants.ts                # Game configuration
  game/
    useGameLoop.ts            # Game loop hook
    physics.ts                # Matter.js utilities
    cat.ts                    # Cat entity logic
    renderer.ts               # Canvas rendering utilities
    pendulum.ts               # Pendulum motion logic
    input.ts                  # Input handling
    tower.ts                  # Tower management (cats, stability)
    scoring.ts                # Score management
    state.ts                  # Game state machine
```
