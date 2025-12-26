# Spec Requirements: Cat Stacking Game Mechanic

## Initial Description
A Tetris-like cat stacking game:
- Cats fall to the bottom of the screen (gravity-based falling)
- Cats stack on top of each other from the bottom up
- Win condition: Reach the top with the fewest number of cats dropped

## Requirements Discussion

### First Round Questions

**Q1:** Relationship to existing game: I assume this is a new game mode alongside the existing pendulum-drop mechanic, not a replacement. Is that correct, or should this replace the current core gameplay?
**Answer:** New mini-game mode - Keep existing game, add this as a second mini-game option. Almost identical but different play style.

**Q2:** Horizontal positioning: Since cats fall from the top, I assume the player controls horizontal positioning (left/right movement or tap-to-position) before/during the fall, similar to Tetris. Is that correct, or do cats fall from random/fixed positions automatically?
**Answer:** Keep the swinging left-to-right mechanic where player times the drop. Use physics-based drop with Matter.js if possible, otherwise fall straight down like Tetris.

**Q3:** Cat shapes and sizes: I assume cats will have varied shapes and sizes that affect how they stack (like Tetris pieces create different stacking challenges). Should cats be uniform rectangles, or varied shapes (round, tall, wide, etc.)?
**Answer:** Keep them the same size, but they need to line up well or they fall off. Cats become "sticky" once they land properly on the square beneath with enough overlap.

**Q4:** Win condition clarification: You mentioned "reach the top with fewest cats." I assume there's a target height line near the top of the screen, and the goal is to build a stable tower that reaches it. Is that correct? What happens if cats fall off or the tower collapses - does that count against the player?
**Answer:** Win line at ~90% from top. If a cat falls off, the whole tower doesn't collapse, but cats won't stick/stack if not overlapping enough with the cat underneath.

**Q5:** Stacking physics: The existing game uses Matter.js physics for realistic stacking. Should this mode also use physics-based stacking (cats can wobble, fall, slide), or should it be more rigid/grid-based like classic Tetris?
**Answer:** Use Matter.js physics.

**Q6:** Time pressure: I assume there's no time pressure between drops - players can take their time positioning each cat. Is that correct, or should there be auto-drop timing like Tetris?
**Answer:** No time pressure, players can take their time.

**Q7:** Is there anything you specifically do NOT want included in this feature?
**Answer:** Keep it simple for now (no power-ups, combos, difficulty levels, leaderboards, etc.)

### Existing Code to Reference

Based on the product roadmap, the following planned/existing features should be referenced:
- **Physics Engine Integration** - Matter.js with gravity, collision detection, and friction (Roadmap Item 2)
- **Cat Entity System** - Cat physics bodies with collision shapes, mass, and friction properties (Roadmap Item 3)
- **Pendulum Drop Mechanic** - Swinging pendulum motion for cat positioning with tap/click to release (Roadmap Item 4)
- **Game State Management** - Game states for start screen, active gameplay, and game over (Roadmap Item 7)

No specific file paths were provided by user, but this new mode should reuse the existing pendulum mechanic and physics infrastructure.

### Follow-up Questions

No follow-up questions needed - requirements are clear.

## Visual Assets

### Files Provided:
No visual assets provided.

### Visual Insights:
N/A

## Requirements Summary

### Functional Requirements
- New mini-game mode accessible alongside the existing pendulum-drop game
- Swinging left-to-right pendulum mechanic for horizontal positioning (reuse existing)
- Player times the drop release (tap/click)
- Cats fall with Matter.js physics-based gravity
- Cats are uniform in size
- "Sticky" landing mechanic: cats lock in place when landing with sufficient overlap on the cat beneath
- Cats that don't overlap enough with the cat below will fall off
- Tower remains stable when individual cats fall (no chain collapse)
- Win line positioned at approximately 90% from the top of the screen
- Win condition: reach the win line with the fewest cats dropped
- No time pressure between drops - player-paced gameplay

### Reusability Opportunities
- Pendulum drop mechanic from existing game mode
- Matter.js physics engine integration
- Cat entity system (sprites, collision shapes)
- Game state management (start, playing, win/game-over states)
- Canvas rendering system
- Score/cat count tracking

### Scope Boundaries

**In Scope:**
- New mini-game mode selection
- Swinging pendulum drop mechanic
- Physics-based falling with Matter.js
- Uniform-sized cats
- "Sticky" landing logic based on overlap threshold
- Win line at 90% screen height
- Cat count tracking (fewer = better score)
- Win state when tower reaches win line

**Out of Scope:**
- Power-up cats
- Combo scoring systems
- Multiple difficulty levels
- Leaderboards
- Time pressure / auto-drop
- Variable cat shapes or sizes
- Tower collapse mechanics

### Technical Considerations
- Must integrate with Matter.js physics engine (already planned in roadmap)
- Reuse existing pendulum swing mechanics
- Need to implement overlap detection for "sticky" landing logic
- Win line collision/detection at 90% screen height
- Track number of cats dropped for scoring
- Needs game mode selection UI to switch between original and this mini-game
- Should share cat sprites and canvas rendering with main game
