# Product Roadmap

## MVP Phase

1. [ ] Game Canvas Setup — Create responsive canvas element that scales properly for desktop and mobile viewports, with consistent aspect ratio and touch/mouse input detection. `S`

2. [ ] Physics Engine Integration — Integrate Matter.js with gravity, collision detection, and friction. Create ground platform as static body and verify physics simulation runs at 60 FPS. `S`

3. [ ] Cat Entity System — Create cat physics bodies with proper collision shapes, mass, and friction properties. Implement 4 cat visual variants with distinct appearances. `M`

4. [ ] Pendulum Drop Mechanic — Implement swinging pendulum motion for cat positioning, with tap/click to release. Cat should drop with proper physics from release point. `M`

5. [ ] Tower Stability Detection — Detect when cats fall off the platform or tower collapses. Track successful stacks vs fallen cats to determine game over conditions. `S`

6. [ ] Scoring System — Implement score calculation based on cats successfully stacked. Add perfect landing detection for center drops with bonus points. Store high score in local storage. `S`

7. [ ] Game State Management — Create game states for start screen, active gameplay, and game over. Allow restarting and display current score and high score appropriately in each state. `S`

8. [ ] Visual Polish — Apply cartoonish art style with pastel color palette. Add cat expressions/animations, smooth transitions between states, and satisfying visual feedback for landings. `M`

## Post-MVP Enhancements

9. [ ] Difficulty Progression — Increase pendulum swing speed as score grows. Introduce smaller cat variants at higher scores. Widen swing arc for additional challenge. `S`

10. [ ] Sound Effects — Add audio feedback for drops, landings, perfect bonuses, and game over. Include subtle background music with mute toggle. `S`

11. [ ] Mobile Optimization — Fine-tune touch controls, ensure proper viewport handling on iOS/Android browsers, and optimize performance for lower-end mobile devices. `S`

12. [ ] Animations and Juice — Add particle effects for perfect landings, screen shake on tower wobble, cat squish/stretch on impact, and celebratory effects for new high scores. `M`

13. [ ] Additional Cat Variants — Expand to 8-10 cat designs with rare variants that appear at higher scores. Add subtle personality animations (blinking, tail movement). `S`

14. [ ] Share Functionality — Allow players to share their high score via native share API or generated image. Include game branding for viral potential. `S`

15. [ ] Multiple Game Modes — Add timed mode (stack as many as possible in 60 seconds) and zen mode (no game over, just relaxed stacking). `M`

16. [ ] Global Leaderboards — Implement backend for anonymous high score submission and display of top scores. Add daily/weekly/all-time filtering. `L`

> Notes
> - Order items by technical dependencies and product architecture
> - Each item should represent an end-to-end functional and testable feature
> - MVP (items 1-8) targets approximately 3-4 weeks of development
> - Post-MVP features can be prioritized based on user feedback
