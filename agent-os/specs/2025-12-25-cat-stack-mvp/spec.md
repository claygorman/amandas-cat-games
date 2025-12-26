# Specification: Cat Stack MVP

## Goal
Build a browser-based physics stacking game where players drop cats from a swinging pendulum onto a growing tower, featuring cute cartoonish visuals, physics-based gameplay with Matter.js, and scoring with high score persistence.

## User Stories
- As a player, I want to tap or click to drop cats from a swinging pendulum so that I can stack them into a tower
- As a player, I want to see my current score and high score so that I can track my progress and try to beat my record
- As a player, I want visual feedback on perfect landings so that I feel rewarded for precise timing

## Specific Requirements

**Game Canvas Setup**
- Create a responsive canvas element that fills the viewport while maintaining aspect ratio
- Target resolution of 720x1280 (portrait orientation) with dynamic scaling
- Handle both touch and mouse input events on the canvas
- Initialize Canvas 2D context for rendering at 60 FPS using requestAnimationFrame
- Implement devicePixelRatio handling for crisp rendering on high-DPI displays

**Physics Engine Integration**
- Initialize Matter.js engine with gravity set to approximately 1.0 (tunable for game feel)
- Create a static ground platform body at the bottom of the play area
- Configure physics world with appropriate bounds to detect when cats fall off-screen
- Run physics simulation in sync with render loop using Matter.Engine.update()
- Set collision categories for cats and ground to enable proper stacking physics

**Cat Entity System**
- Define cat body as rectangular with rounded corners (approximately 80x60 pixels base size)
- Apply consistent physics properties: mass, friction (0.8-0.9), restitution (0.1-0.2 for slight bounce)
- Implement 4 visual variants: orange tabby, gray, tuxedo, calico (randomly selected on spawn)
- Store expression state on each cat body: "neutral", "surprised", "happy", "worried"
- Render cats using Canvas drawing with appropriate colors/patterns for each variant

**Pendulum Drop Mechanic**
- Position pendulum pivot point at top-center of screen (invisible - no rope/arm rendered)
- Implement sinusoidal horizontal motion: x = centerX + amplitude * sin(time * speed)
- Start with base swing amplitude of 40% of screen width and period of approximately 2 seconds
- On click/tap/spacebar, spawn cat at current pendulum position and apply no initial velocity
- Immediately begin positioning next cat on pendulum after drop

**Difficulty Progression**
- Track number of successfully stacked cats (not score) for threshold checks
- Increase swing speed by 15-20% at thresholds: 5, 10, 15, 20 cats (continuing pattern)
- Optionally increase swing amplitude slightly at higher levels for additional challenge
- Store difficulty level in game state to persist across the session

**Tower Stability Detection**
- Monitor all cat bodies each frame for position below ground level (fallen off)
- Trigger game over immediately when any cat falls below the death zone threshold
- Track cat "stable" state: velocity magnitude below threshold (approximately 0.5) for 2 seconds
- Transition cat expression from "surprised" to "happy" when stability achieved
- Detect wobbling tower by checking velocity magnitudes of recent cats (switch to "worried" expression)

**Scoring System**
- Award +1 point when a cat achieves 2-second stability on the stack
- Calculate landing position relative to the cat below (or ground platform for first cat)
- Award +2 bonus for "Perfect!" landing when center offset is within 10-15% of cat width
- Display "Perfect!" text feedback briefly on screen for bonus landings
- Persist high score to localStorage under key "catstack_highscore"

**Game State Management**
- Implement state machine with states: "start", "playing", "gameover"
- Start screen: display game title, high score, and "Tap to Play" prompt
- Playing state: show current score in top corner, high score below it, active pendulum and physics
- Game over screen: display final score, high score (update if beaten), "Tap to Restart" prompt
- Handle state transitions with appropriate cleanup (clear physics bodies on restart)

**Visual Style and Polish**
- Use pastel color palette: soft pink, mint green, lavender, cream backgrounds
- Draw cats with simple shapes: rounded rectangle body, triangle ears, oval eyes, whisker lines
- Animate cat expressions: neutral (default eyes), surprised (wide eyes), happy (curved smile), worried (squiggly mouth)
- Add subtle landing feedback: brief scale squish effect on cat impact
- Render ground platform as a simple pastel-colored rectangle with rounded top

**Input Handling**
- Listen for mousedown/click events on canvas for desktop
- Listen for touchstart events on canvas for mobile (prevent default to avoid scrolling)
- Listen for spacebar keydown events as alternative desktop control
- Debounce input to prevent accidental double-drops (minimum 100ms between drops)
- Disable input during game over state until restart action

## Visual Design

No visual mockups were provided. Implementation will follow these design principles:
- Cartoonish, friendly art style with rounded shapes
- Pastel color palette (pink, mint, lavender, cream)
- Simple vector-style cat illustrations with expressive faces
- Clean, minimal UI with clear typography for scores
- Soft shadows or outlines to help cats stand out from background

## Existing Code to Leverage

This is a greenfield project with no existing codebase. The following approaches should be established as patterns for the project:

**Next.js App Router Structure**
- Use app/ directory with page.tsx as main entry point
- Create components/ directory for reusable React components
- Create lib/ or game/ directory for game logic, physics utilities, and constants
- Use "use client" directive for components that need browser APIs (Canvas, localStorage)

**Game Loop Architecture**
- Separate rendering logic from physics updates for clean architecture
- Use a custom hook (useGameLoop) to manage requestAnimationFrame lifecycle
- Store game state in React refs for performance (avoid re-renders during gameplay)
- Expose necessary state to React components for UI updates (scores, game state)

**Matter.js Integration Pattern**
- Initialize engine and world in useEffect on component mount
- Clean up physics engine on component unmount to prevent memory leaks
- Use Matter.Events for collision callbacks and physics events
- Keep references to key bodies (ground, active cats) for easy access

## Out of Scope
- Sound effects and background music (post-MVP feature)
- Particle effects for landings and celebrations
- Screen shake effects on tower wobble
- Cat variants beyond the initial 4 (orange tabby, gray, tuxedo, calico)
- Social sharing functionality
- Global leaderboards or backend services
- Multiple game modes (timed, zen)
- Advanced animations (blinking, tail movement)
- Offline/PWA capabilities
- Analytics or tracking
