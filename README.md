# Cat Stack

**[Play Now](https://claygorman.github.io/amandas-cat-games/)**

A fun physics-based stacking game where you drop cats to build the tallest tower possible. Built with Next.js, React, and Matter.js.

## How to Play

- **Drop cats** by clicking, tapping, or pressing spacebar
- **Time your drops** when the swinging cat is centered for best results
- **Stack carefully** - the game ends when a cat falls off the tower!

### Scoring

- **+1 point** for each successfully stacked cat
- **+2 bonus** for perfect landings (when cats align well)

### Game Modes

- **Classic Mode**: Stack cats as high as you can. The swing speed increases as your tower grows!
- **Reach the Top Mode**: Get your tower to the goal line using as few cats as possible

## Tech Stack

- **Next.js 16** - React framework
- **React 19** - UI library
- **Matter.js** - 2D physics engine
- **Tailwind CSS 4** - Styling
- **TypeScript** - Type safety
- **Jest** - Testing

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 10+

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to play the game.

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm test` | Run tests |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm lint` | Run ESLint |

## Project Structure

```
├── app/                  # Next.js app router
│   └── page.tsx          # Main game page
├── components/           # React components
│   └── GameCanvas.tsx    # Canvas with responsive scaling
├── lib/                  # Game logic
│   ├── constants.ts      # Game configuration
│   └── game/
│       ├── cat.ts        # Cat entity logic
│       ├── input.ts      # Input handling
│       ├── pendulum.ts   # Swinging pendulum logic
│       ├── physics.ts    # Matter.js physics setup
│       ├── renderer.ts   # Canvas rendering
│       ├── scoring.ts    # Score management
│       ├── state.ts      # Game state management
│       ├── tower.ts      # Tower/stacking logic
│       ├── useGame.ts    # Main game hook
│       └── useGameLoop.ts # Game loop with RAF
└── __tests__/            # Test files
```

## License

Private project.
