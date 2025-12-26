# Tech Stack

## Framework and Runtime

- **Application Framework:** Next.js 16+ with App Router
- **Language:** TypeScript
- **Runtime:** Node.js 22+
- **Package Manager:** pnpm

## Frontend

- **React Version:** React 19+
- **CSS Framework:** Tailwind CSS 4
- **UI Components:** Custom components (minimal UI outside game canvas)

## Game Engine

- **Physics Engine:** Matter.js
  - Handles gravity, collision detection, friction, and rigid body dynamics
  - Lightweight and well-suited for 2D physics simulation
- **Rendering:** HTML5 Canvas API
  - Direct canvas rendering for game graphics
  - 60 FPS target performance
- **Game Loop:** requestAnimationFrame with fixed timestep for physics

## State Management

- **Game State:** React useState/useReducer for UI state
- **Physics State:** Matter.js engine state (positions, velocities, collisions)
- **Persistence:** Browser localStorage for high scores

## Asset Pipeline

- **Images:** Static assets in /public directory
  - Cat sprites as PNG with transparency
  - Optimized for web delivery
- **Fonts:** System fonts or Google Fonts for UI text

## Development Tools

- **Linting:** ESLint with Next.js config
- **Formatting:** Prettier
- **Type Checking:** TypeScript compiler (strict)

## Testing

- **Unit Tests:** vitest (for utility functions and game logic)
- **Component Tests:** React Testing Library (for UI components)
- **Manual Testing:** Browser DevTools for physics tuning and performance profiling

## Deployment

- **Hosting:** self hosted 
- **CI/CD:** N/A 
- **Domain:** N/A 

## Browser Support

- **Target Browsers:**
  - Chrome 90+
  - Firefox 90+
  - Safari 14+
  - Edge 90+
  - Mobile Safari (iOS 14+)
  - Chrome for Android

## Performance Targets

- **Frame Rate:** 60 FPS sustained gameplay
- **Initial Load:** Under 3 seconds on 3G connection
- **Bundle Size:** Under 500KB initial JavaScript
- **Lighthouse Score:** 90+ Performance

## Future Considerations (Post-MVP)

- **Audio:** Howler.js or Web Audio API for sound effects
