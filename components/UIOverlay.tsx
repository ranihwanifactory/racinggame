import React from 'react';
import { GameStatus } from '../types';

interface UIOverlayProps {
  status: GameStatus;
  score: number;
  speed: number;
  aiAnalysis: string;
  isAiLoading: boolean;
  user: any; // Firebase user type
  showInstallButton?: boolean;
  onStart: () => void;
  onRestart: () => void;
  onLoginClick: () => void;
  onLogoutClick: () => void;
  onShowLeaderboard: () => void;
  onInstallClick?: () => void;
  onShareClick?: () => void;
}

const UIOverlay: React.FC<UIOverlayProps> = ({ 
  status, 
  score, 
  speed, 
  aiAnalysis, 
  isAiLoading,
  user,
  showInstallButton,
  onStart, 
  onRestart,
  onLoginClick,
  onLogoutClick,
  onShowLeaderboard,
  onInstallClick,
  onShareClick
}) => {
  // Format speed to look like km/h
  const displaySpeed = Math.floor(speed * 20); 

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between">
      {/* HUD - Always visible during play */}
      <div className="p-4 flex justify-between items-start pointer-events-none z-10">
        <div className="bg-black/50 backdrop-blur-md p-2 rounded-lg border border-neon-blue/30 text-neon-blue shadow-[0_0_10px_rgba(0,243,255,0.3)]">
          <div className="text-xs uppercase tracking-widest opacity-80">SCORE</div>
          <div className="text-2xl font-bold font-mono">{score.toString().padStart(6, '0')}</div>
        </div>
        
        <div className="bg-black/50 backdrop-blur-md p-2 rounded-lg border border-neon-pink/30 text-neon-pink shadow-[0_0_10px_rgba(255,0,255,0.3)]">
          <div className="text-xs uppercase tracking-widest opacity-80">SPEED</div>
          <div className="text-2xl font-bold font-mono text-right">{displaySpeed} <span className="text-sm">km/h</span></div>
        </div>
      </div>

      {/* Start Screen */}
      {status === GameStatus.IDLE && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-auto z-40">
          <h1 className="text-6xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-neon-purple drop-shadow-[0_0_15px_rgba(188,19,254,0.8)] mb-2 transform -skew-x-12">
            NEON RACER
          </h1>
          <p className="text-gray-300 mb-8 font-mono text-sm tracking-widest">AI DRIVEN OBSTACLE AVOIDANCE</p>
          
          <div className="flex flex-col items-center gap-4 w-full max-w-xs px-6">
            <button 
              onClick={onStart}
              className="w-full group relative px-8 py-3 bg-transparent overflow-hidden rounded-none skew-x-[-12deg] border border-neon-blue text-neon-blue hover:bg-neon-blue hover:text-black transition-all duration-300"
            >
              <span className="absolute inset-0 w-full h-full bg-neon-blue/20 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
              <span className="relative font-bold text-xl tracking-widest skew-x-[12deg] block">GAME START</span>
            </button>
            
            <button 
              onClick={onShowLeaderboard}
              className="w-full py-3 bg-gray-800/80 border border-gray-600 hover:border-yellow-400 hover:text-yellow-400 text-gray-300 rounded skew-x-[-12deg] transition-all font-bold tracking-widest"
            >
              <span className="block skew-x-[12deg]">RANKING</span>
            </button>

             <div className="flex gap-2 w-full">
              {showInstallButton && (
                <button 
                  onClick={onInstallClick}
                  className="flex-1 py-2 bg-gray-800/60 border border-gray-700 text-neon-green hover:bg-neon-green/20 hover:border-neon-green rounded skew-x-[-12deg] transition-all text-xs font-bold"
                >
                  <span className="block skew-x-[12deg]">📲 INSTALL APP</span>
                </button>
              )}
              
              <button 
                onClick={onShareClick}
                className="flex-1 py-2 bg-gray-800/60 border border-gray-700 text-neon-pink hover:bg-neon-pink/20 hover:border-neon-pink rounded skew-x-[-12deg] transition-all text-xs font-bold"
              >
                <span className="block skew-x-[12deg]">🔗 SHARE</span>
              </button>
            </div>

            {/* Login Status / Button */}
            <div className="mt-4 flex flex-col items-center">
              {user ? (
                <div className="flex items-center gap-3 bg-gray-900/80 px-4 py-2 rounded-full border border-gray-700">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-sm text-white font-medium max-w-[150px] truncate">
                    {user.displayName || user.email?.split('@')[0]}
                  </span>
                  <button onClick={onLogoutClick} className="text-xs text-red-400 hover:text-red-300 underline ml-2">
                    LOGOUT
                  </button>
                </div>
              ) : (
                <button 
                  onClick={onLoginClick}
                  className="text-sm text-neon-pink hover:text-white underline decoration-dashed underline-offset-4"
                >
                  LOGIN TO SAVE SCORE
                </button>
              )}
            </div>
            
            <div className="text-xs text-gray-500 mt-8 animate-pulse text-center">
              [PC] Arrow Keys or A/D <br/> [Mobile] Tap Left/Right Screen
            </div>
          </div>
        </div>
      )}

      {/* Game Over Screen */}
      {status === GameStatus.GAME_OVER && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md pointer-events-auto z-50 p-6 animate-fade-in">
          <h2 className="text-5xl font-black text-red-500 mb-2 drop-shadow-[0_0_10px_red] italic -skew-x-12">CRASHED</h2>
          
          <div className="bg-gray-900/80 border border-gray-700 p-6 rounded-lg max-w-md w-full mb-6 relative overflow-hidden">
             {/* Gemini AI Feedback Section */}
            <div className="absolute top-0 left-0 w-1 h-full bg-neon-purple"></div>
            <div className="flex items-start gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-purple to-blue-600 flex items-center justify-center text-xs font-bold shadow-lg">AI</div>
              <div className="text-xs text-neon-purple uppercase font-bold tracking-widest mt-1">Race Engineer</div>
            </div>
            
            <div className="min-h-[60px] text-gray-200 text-sm leading-relaxed font-mono">
              {isAiLoading ? (
                <span className="animate-pulse">Analyzing telemetry data...</span>
              ) : (
                `"${aiAnalysis}"`
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-8 text-center w-full max-w-xs">
            <div>
              <div className="text-xs text-gray-500 uppercase">Final Score</div>
              <div className="text-3xl font-bold text-white">{score}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase">Top Speed</div>
              <div className="text-3xl font-bold text-white">{displaySpeed} <span className="text-sm">km/h</span></div>
            </div>
          </div>

          <div className="flex flex-col gap-3 w-full max-w-xs">
            <button 
              onClick={onRestart}
              className="w-full px-10 py-3 bg-white text-black font-bold text-lg hover:bg-neon-green hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,255,255,0.4)] skew-x-[-12deg]"
            >
              <span className="block skew-x-[12deg]">RETRY</span>
            </button>
            <button 
              onClick={onShowLeaderboard}
              className="w-full px-10 py-3 bg-transparent border border-gray-600 text-gray-300 font-bold hover:bg-gray-800 transition-all skew-x-[-12deg]"
            >
               <span className="block skew-x-[12deg]">RANKING</span>
            </button>
            
             <button 
              onClick={onShareClick}
              className="w-full py-2 text-neon-pink hover:text-white text-xs font-bold tracking-widest mt-2"
            >
              🔗 SHARE RESULT
            </button>
          </div>
        </div>
      )}
      
      {/* Touch Areas Hint (Overlay during play) */}
      {status === GameStatus.PLAYING && (
        <div className="absolute inset-0 flex pointer-events-none">
          <div className="w-1/2 h-full border-r border-white/5 bg-gradient-to-r from-white/0 to-white/5 opacity-0 active:opacity-20 transition-opacity" />
          <div className="w-1/2 h-full border-l border-white/5 bg-gradient-to-l from-white/0 to-white/5 opacity-0 active:opacity-20 transition-opacity" />
        </div>
      )}
    </div>
  );
};

export default UIOverlay;