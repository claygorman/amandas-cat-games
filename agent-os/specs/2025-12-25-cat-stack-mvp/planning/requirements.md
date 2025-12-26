# Spec Requirements: Cat Stack MVP

## Initial Description

Cat Stack is a browser-based physics stacking game where players drop cats from a swinging pendulum onto a growing tower. The game features cute, cartoonish visuals with pastel colors and expressive cat characters. Players time their releases to stack cats as high as possible, with physics-based gameplay creating unique challenges each round.

Key elements from initial spec:
- Pendulum swings horizontally, player clicks/taps to drop
- Cats have rectangular hitboxes with rounded edges
- Physics: gravity, collision, bounciness, friction
- Scoring: +1 per cat stacked (after 2 sec stability), +2 bonus for "Perfect!" center landings
- Difficulty progression: swing speed increases at thresholds
- UI: Start screen, gameplay HUD (scores), Game over screen
- Visual: Cartoonish, pastel colors, cute cats with expressions
- Controls: Click/spacebar (desktop), tap (mobile)

## Requirements Discussion

### First Round Questions

**Q1:** For the pendulum swing, I'm assuming a smooth sinusoidal motion (like a real pendulum) rather than linear back-and-forth. Is that correct, or would you prefer a different motion pattern?
**Answer:** Yes, sinusoidal pendulum motion confirmed.

**Q2:** When a cat is dropped, should it visually detach from a "pendulum arm" or appear to just release from its current position? I'm leaning toward a clean release with no visible pendulum arm to keep the UI minimal.
**Answer:** Yes, clean release with no visible pendulum arm.

**Q3:** For the "Perfect!" center landing detection, what tolerance are you thinking? I'm assuming within 10-15% of the center of the cat below (or platform) would count as "perfect" - does that feel right?
**Answer:** Yes, 10-15% tolerance for "Perfect!" center landings confirmed.

**Q4:** When cats fall off the tower/platform, should the game end immediately on the first fallen cat, or after a certain number fall (e.g., 3 strikes)?
**Answer:** Game over on first fallen cat - immediate end, no strikes system.

**Q5:** For difficulty progression, you mentioned swing speed increases at thresholds. What score thresholds feel right to you?
**Answer:** Difficulty thresholds at 5, 10, 15 cats (and continuing pattern).

**Q6:** For the 4 cat variants, I'm picturing different colors/patterns (orange tabby, gray, tuxedo, calico) with the same basic shape. Should they have identical physics properties, or should there be subtle visual size differences?
**Answer:** Cat variants with same physics properties - visual differences only (colors/patterns).

**Q7:** For cat expressions, I'm thinking: neutral while swinging, surprised during fall, happy on successful land, and worried/wobbly if the tower is unstable. Does that match your vision?
**Answer:** Yes, cat expressions confirmed: neutral (swinging), surprised (falling), happy (landed), worried (unstable tower).

**Q8:** Is there anything that should specifically NOT be included in this MVP?
**Answer:** No exclusions - full MVP scope as defined in roadmap items 1-8.

### Existing Code to Reference

No similar existing features identified for reference. This is a fresh codebase with no prior implementations to build upon.

### Follow-up Questions

No follow-up questions were required - all initial questions were answered clearly.

## Visual Assets

### Files Provided:
No visual assets provided.

### Visual Insights:
No visual references available. Development will follow the described aesthetic:
- Cartoonish art style
- Pastel color palette
- Cute, expressive cat characters
- Clean, minimal UI

## Requirements Summary

### Functional Requirements

**Core Gameplay:**
- Pendulum with sinusoidal swing motion at top of screen
- Cat positioned on pendulum (no visible arm/rope)
- Click/tap/spacebar to release cat
- Physics simulation: gravity, collision, bounciness, friction
- Cats have rectangular hitboxes with rounded edges
- 4 visually distinct cat variants (same physics properties)

**Scoring:**
- +1 point per cat successfully stacked (after 2 second stability)
- +2 bonus points for "Perfect!" center landings (10-15% tolerance)
- High score persistence via localStorage

**Difficulty Progression:**
- Swing speed increases at 5, 10, 15 cats (continuing pattern)
- Progressive challenge maintains engagement

**Game States:**
- Start screen with play button
- Active gameplay with HUD (current score, high score)
- Game over screen with final score and restart option

**Cat Expressions:**
- Neutral: while swinging on pendulum
- Surprised: during fall
- Happy: on successful landing
- Worried: when tower is unstable/wobbling

**Controls:**
- Desktop: Mouse click or spacebar to drop
- Mobile: Tap to drop

### Reusability Opportunities

No existing code patterns to reference. This is a greenfield implementation using:
- Next.js 16 with App Router
- TypeScript (strict mode)
- Matter.js for physics
- HTML5 Canvas for rendering
- Tailwind CSS for UI styling
- localStorage for persistence

### Scope Boundaries

**In Scope (MVP - Roadmap Items 1-8):**
- Game canvas setup with responsive scaling
- Physics engine integration (Matter.js)
- Cat entity system with 4 variants
- Pendulum drop mechanic
- Tower stability detection
- Scoring system with perfect landing bonus
- Game state management (start, play, game over)
- Visual polish (art style, expressions, transitions)

**Out of Scope (Post-MVP):**
- Sound effects and music
- Advanced mobile optimization
- Particle effects and screen shake
- Additional cat variants beyond 4
- Share functionality
- Multiple game modes
- Global leaderboards

### Technical Considerations

**Framework:**
- Next.js 16 with App Router (user specified, updating from tech stack's 14+)
- TypeScript strict mode
- React 18+

**Game Engine:**
- Matter.js for physics (gravity, collision, friction, rigid bodies)
- HTML5 Canvas API for rendering
- requestAnimationFrame with fixed timestep for game loop
- Target 60 FPS performance

**State Management:**
- React useState/useReducer for UI state
- Matter.js engine state for physics
- localStorage for high score persistence

**Responsive Design:**
- Canvas scales for desktop and mobile viewports
- Consistent aspect ratio maintained
- Touch and mouse input detection

**Performance Targets:**
- 60 FPS sustained gameplay
- Under 3 seconds initial load on 3G
- Under 500KB initial JavaScript bundle
