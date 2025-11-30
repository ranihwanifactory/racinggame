export const CANVAS_WIDTH = 400; // Virtual width for calculations
export const LANE_COUNT = 3;
export const LANE_WIDTH = CANVAS_WIDTH / LANE_COUNT;
export const CAR_WIDTH = 60;
export const CAR_HEIGHT = 100;

export const INITIAL_SPEED = 5;
export const MAX_SPEED = 15;
export const SPEED_INCREMENT = 0.005;

export const OBSTACLE_SPAWN_RATE = 100; // Frames between spawns (approx)

export const COLORS = {
  road: '#1a1a2e',
  lane: 'rgba(255, 255, 255, 0.1)',
  carBody: '#00f3ff',
  carGlow: 'rgba(0, 243, 255, 0.6)',
  obstacle: '#ff0055',
  text: '#ffffff',
};