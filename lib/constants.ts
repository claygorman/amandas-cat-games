// Canvas Configuration
export const CANVAS_WIDTH = 720;
export const CANVAS_HEIGHT = 1280;
export const TARGET_FPS = 60;
export const FRAME_TIME = 1000 / TARGET_FPS; // ~16.67ms per frame

// Aspect ratio for responsive scaling
export const ASPECT_RATIO = CANVAS_WIDTH / CANVAS_HEIGHT; // 0.5625 (9:16 portrait)

// Physics Configuration
export const GRAVITY = 1.0;
export const STABILITY_VELOCITY_THRESHOLD = 0.5;
export const STABILITY_TIME_REQUIRED = 2000; // ms (for falling cats in Reach the Top mode)
export const CLASSIC_STABILITY_TIME_REQUIRED = 100; // ms (fast for static cats in Classic mode)

// Classic Mode Physics (original spec - some bounce, wobble risk)
export const CAT_FRICTION_CLASSIC = 0.85;
export const CAT_RESTITUTION_CLASSIC = 0.15;
export const CAT_FRICTION_AIR_CLASSIC = 0.01;

// Reach the Top Mode Physics (heavy, no bounce, stable stacking)
export const CAT_FRICTION_REACH_TOP = 1.0;
export const CAT_RESTITUTION_REACH_TOP = 0.02;
export const CAT_FRICTION_AIR_REACH_TOP = 0.02;

// Default exports for backwards compatibility (use Classic values)
export const CAT_FRICTION = CAT_FRICTION_CLASSIC;
export const CAT_RESTITUTION = CAT_RESTITUTION_CLASSIC;
export const CAT_FRICTION_AIR = CAT_FRICTION_AIR_CLASSIC;

// Ground Platform Configuration
export const GROUND_HEIGHT = 60;
export const GROUND_Y = CANVAS_HEIGHT - GROUND_HEIGHT / 2; // Center of ground body

// Collision Categories (bitmask for Matter.js collision filtering)
export const COLLISION_CATEGORY_DEFAULT = 0x0001;
export const COLLISION_CATEGORY_CAT = 0x0002;
export const COLLISION_CATEGORY_GROUND = 0x0004;

// Death Zone (below this Y position, cats are considered fallen)
export const DEATH_ZONE_Y = CANVAS_HEIGHT + 100;

// Pendulum Configuration
export const SWING_AMPLITUDE = 0.35; // 35% of screen width
export const SWING_PERIOD = 3500; // ms (slower swing)
export const SPEED_INCREASE_FACTOR = 0.175; // 17.5%
export const PENDULUM_Y = 100; // Y position of pendulum cat

// Input Configuration
export const DROP_DEBOUNCE_MS = 100;

// Difficulty Thresholds
export const DIFFICULTY_THRESHOLDS = [5, 10, 15, 20, 25, 30]; // continues pattern

// Wobble Detection
export const WOBBLE_VELOCITY_THRESHOLD = 2.0; // Velocity threshold for wobble detection

// Scoring Configuration
export const POINTS_PER_STACK = 1;
export const PERFECT_BONUS = 2;
export const PERFECT_THRESHOLD = 0.125; // 12.5% of cat width for perfect landing

// High Score Persistence
export const HIGH_SCORE_KEY = "catstack_highscore";

// Perfect Landing Display Duration
export const PERFECT_DISPLAY_DURATION = 1500; // ms to show "Perfect!" text

// ========================================
// Reach the Top Mode Configuration
// ========================================

// Win Line Configuration
// The win line is positioned at ~10% from the top of the canvas (128 pixels from top)
export const WIN_LINE_Y = 128;

// Win line visual styling - mint green color matching pastel theme
export const WIN_LINE_COLOR = "#7BC67B";

// Overlap Threshold for Sticky Landing
// Cats must overlap by at least 55% of their width to "stick" in place
// This allows some margin for error while still requiring good aim
export const OVERLAP_THRESHOLD = 0.55; // 55% of CAT_WIDTH

// Sticky Settle Time
// The time (in ms) a cat must be stable before becoming static/sticky
// This allows for a brief physics settling period before locking in place
export const STICKY_SETTLE_TIME = 300; // ms

// High Score Key for Reach the Top Mode (lower is better)
export const REACH_TOP_BEST_KEY = "catstack_reachtop_best";
