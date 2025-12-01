import React, { useRef, useEffect, useCallback } from 'react';
import { GameStatus, Car, Obstacle, Particle } from '../types';
import { CANVAS_WIDTH, LANE_COUNT, LANE_WIDTH, CAR_WIDTH, CAR_HEIGHT, INITIAL_SPEED, MAX_SPEED, SPEED_INCREMENT, COLORS } from '../constants';
import { audioManager } from '../services/audioService';

interface GameCanvasProps {
  status: GameStatus;
  onGameOver: (score: number, distance: number) => void;
  onScoreUpdate: (score: number, distance: number, speed: number) => void;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ status, onGameOver, onScoreUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Game State Refs (using refs to avoid closure staleness in loop)
  const gameStateRef = useRef({
    car: {
      pos: { x: CANVAS_WIDTH / 2 - CAR_WIDTH / 2, y: 0 }, // Y is set dynamically based on height
      width: CAR_WIDTH,
      height: CAR_HEIGHT,
      lane: 1, // 0: Left, 1: Center, 2: Right
      speed: INITIAL_SPEED,
    } as Car,
    obstacles: [] as Obstacle[],
    particles: [] as Particle[],
    score: 0,
    distance: 0,
    offsetY: 0, // For scrolling effect
    frameCount: 0,
    lastTime: 0,
  });

  const requestRef = useRef<number>(0);

  // Input Handling
  const moveLane = useCallback((direction: -1 | 1) => {
    if (status !== GameStatus.PLAYING) return;
    
    const currentLane = gameStateRef.current.car.lane;
    const newLane = Math.max(0, Math.min(2, currentLane + direction));
    
    if (newLane !== currentLane) {
      gameStateRef.current.car.lane = newLane;
      audioManager.playMove(); // Trigger Sound
    }
  }, [status]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') moveLane(-1);
      if (e.key === 'ArrowRight' || e.key === 'd') moveLane(1);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [moveLane]);

  // Touch controls logic
  const handleTouchStart = (e: React.TouchEvent) => {
    if (status !== GameStatus.PLAYING) return;
    
    // Resume audio context on first touch if needed
    audioManager.resume();

    const touchX = e.touches[0].clientX;
    const halfWidth = window.innerWidth / 2;
    if (touchX < halfWidth) moveLane(-1);
    else moveLane(1);
  };

  // Game Loop
  const update = useCallback((time: number) => {
    if (status !== GameStatus.PLAYING) return;
    
    const state = gameStateRef.current;
    const deltaTime = time - state.lastTime;
    state.lastTime = time;

    // Increase speed / difficulty
    if (state.car.speed < MAX_SPEED) {
      state.car.speed += SPEED_INCREMENT;
    }

    // Update Engine Sound
    audioManager.updateEngine(state.car.speed);

    // Update Distance & Score
    state.distance += state.car.speed * 0.1;
    state.score = Math.floor(state.distance);
    state.offsetY += state.car.speed;
    if (state.offsetY > 100) state.offsetY -= 100; // Reset offset for seamless road

    // Update Car Position (Lerp for smoothness)
    const targetX = (state.car.lane * LANE_WIDTH) + (LANE_WIDTH / 2) - (CAR_WIDTH / 2);
    state.car.pos.x += (targetX - state.car.pos.x) * 0.15;

    // Spawn Obstacles
    state.frameCount++;
    // Dynamic spawn rate based on speed
    const spawnRate = Math.max(30, Math.floor(100 - state.car.speed * 3));
    
    if (state.frameCount % spawnRate === 0) {
      const lane = Math.floor(Math.random() * LANE_COUNT);
      // Ensure we don't spawn on top of another obstacle
      const tooClose = state.obstacles.some(o => o.lane === lane && o.pos.y < 200);
      
      if (!tooClose) {
        state.obstacles.push({
          id: Date.now() + Math.random(),
          pos: { 
            x: (lane * LANE_WIDTH) + (LANE_WIDTH / 2) - (CAR_WIDTH / 2), 
            y: -200 
          },
          width: CAR_WIDTH,
          height: CAR_HEIGHT * 0.8,
          lane: lane,
          type: 'rock',
          color: COLORS.obstacle
        });
      }
    }

    // Update Obstacles
    state.obstacles.forEach(obs => {
      obs.pos.y += state.car.speed;
    });

    // Remove off-screen obstacles
    state.obstacles = state.obstacles.filter(obs => obs.pos.y < window.innerHeight + 100);

    // Collision Detection
    // Simple AABB collision with a bit of padding for fairness
    const padding = 10;
    const carRect = {
      l: state.car.pos.x + padding,
      r: state.car.pos.x + CAR_WIDTH - padding,
      t: window.innerHeight - 150 + padding, // Car Y is fixed visually relative to bottom
      b: window.innerHeight - 150 + CAR_HEIGHT - padding
    };

    let collision = false;
    state.obstacles.forEach(obs => {
      const obsRect = {
        l: obs.pos.x + padding,
        r: obs.pos.x + obs.width - padding,
        t: obs.pos.y + padding,
        b: obs.pos.y + obs.height - padding
      };

      if (
        carRect.l < obsRect.r &&
        carRect.r > obsRect.l &&
        carRect.t < obsRect.b &&
        carRect.b > obsRect.t
      ) {
        collision = true;
      }
    });

    // Report stats
    onScoreUpdate(state.score, state.distance, state.car.speed);

    if (collision) {
      audioManager.playCrash(); // Trigger Crash Sound
      onGameOver(state.score, state.distance);
    } else {
      requestRef.current = requestAnimationFrame(update);
    }
  }, [status, onGameOver, onScoreUpdate]);

  // Render Loop
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const state = gameStateRef.current;
    const width = canvas.width;
    const height = canvas.height;
    
    // Scale factor to fit virtual width to screen width while maintaining aspect logic for gameplay
    const scaleX = width / CANVAS_WIDTH;
    
    // Clear
    ctx.fillStyle = COLORS.road;
    ctx.fillRect(0, 0, width, height);

    // Draw Grid / Retro Floor
    ctx.strokeStyle = 'rgba(188, 19, 254, 0.15)'; // Purple grid
    ctx.lineWidth = 1;
    
    // Vertical moving lines
    const laneScreenW = width / LANE_COUNT;
    
    // Draw Lane Markers
    ctx.beginPath();
    ctx.strokeStyle = COLORS.lane;
    ctx.lineWidth = 2;
    ctx.setLineDash([20, 20]);
    ctx.lineDashOffset = -state.offsetY;
    
    for (let i = 1; i < LANE_COUNT; i++) {
        const x = i * laneScreenW;
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
    }
    ctx.stroke();
    ctx.setLineDash([]); // Reset

    // Draw Obstacles
    state.obstacles.forEach(obs => {
      ctx.shadowBlur = 15;
      ctx.shadowColor = obs.color;
      ctx.fillStyle = obs.color;
      
      // Map virtual X to screen X
      const screenX = obs.pos.x * scaleX;
      const screenW = obs.width * scaleX;
      
      // Rounded Rect for obstacle
      ctx.beginPath();
      ctx.roundRect(screenX, obs.pos.y, screenW, obs.height, 8);
      ctx.fill();
      
      // Detail on obstacle
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(screenX + 5, obs.pos.y + 5, screenW - 10, obs.height - 10);
    });

    // Draw Car
    const carY = height - 150;
    const carScreenX = state.car.pos.x * scaleX;
    const carScreenW = CAR_WIDTH * scaleX;

    // Car Glow
    ctx.shadowBlur = 20;
    ctx.shadowColor = COLORS.carGlow;
    
    // Car Body
    ctx.fillStyle = COLORS.carBody;
    ctx.beginPath();
    // Simple futuristic car shape
    ctx.moveTo(carScreenX + 10, carY);
    ctx.lineTo(carScreenX + carScreenW - 10, carY);
    ctx.lineTo(carScreenX + carScreenW, carY + CAR_HEIGHT);
    ctx.lineTo(carScreenX, carY + CAR_HEIGHT);
    ctx.closePath();
    ctx.fill();

    // Car Details (Windshield)
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#000';
    ctx.fillRect(carScreenX + 8, carY + 20, carScreenW - 16, 20);

    // Rear Lights
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#ff0000';
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(carScreenX + 5, carY + CAR_HEIGHT - 10, 10, 5);
    ctx.fillRect(carScreenX + carScreenW - 15, carY + CAR_HEIGHT - 10, 10, 5);

    // Speed Lines (if moving fast)
    if (state.car.speed > INITIAL_SPEED + 2) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for(let i=0; i<5; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const len = Math.random() * 50 + 20;
            ctx.moveTo(x, y);
            ctx.lineTo(x, y + len);
        }
        ctx.stroke();
    }
    
    if (status === GameStatus.PLAYING) {
        requestAnimationFrame(render);
    }
  }, [status]);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && canvasRef.current) {
        canvasRef.current.width = containerRef.current.clientWidth;
        canvasRef.current.height = containerRef.current.clientHeight;
        requestAnimationFrame(render);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize(); 

    return () => window.removeEventListener('resize', handleResize);
  }, [render]);

  // Main Loop Trigger
  useEffect(() => {
    if (status === GameStatus.PLAYING) {
      audioManager.startEngine(); // Start Engine Sound
      gameStateRef.current.lastTime = performance.now();
      requestRef.current = requestAnimationFrame(update);
      requestAnimationFrame(render);
    } else {
       audioManager.stopEngine(); // Stop Engine Sound
       if (status === GameStatus.IDLE) {
         // Reset state
         gameStateRef.current.car.lane = 1;
         gameStateRef.current.car.pos.x = CANVAS_WIDTH / 2 - CAR_WIDTH / 2;
         gameStateRef.current.car.speed = INITIAL_SPEED;
         gameStateRef.current.score = 0;
         gameStateRef.current.distance = 0;
         gameStateRef.current.obstacles = [];
         requestAnimationFrame(render);
       }
    }

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      audioManager.stopEngine(); // Cleanup
    };
  }, [status, update, render]);

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden" onTouchStart={handleTouchStart}>
      <canvas ref={canvasRef} className="block" />
    </div>
  );
};

export default GameCanvas;