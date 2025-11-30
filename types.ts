export enum GameStatus {
  IDLE = 'IDLE',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
}

export interface Position {
  x: number;
  y: number;
}

export interface Car {
  pos: Position;
  width: number;
  height: number;
  lane: number; // 0, 1, 2
  speed: number;
}

export interface Obstacle {
  id: number;
  pos: Position;
  width: number;
  height: number;
  lane: number;
  type: 'rock' | 'barrier' | 'oil';
  color: string;
}

export interface GameState {
  score: number;
  speed: number;
  distance: number;
  status: GameStatus;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

export interface ScoreEntry {
  uid: string;
  displayName: string;
  score: number;
  timestamp: number;
}