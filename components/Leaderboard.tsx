import React from 'react';
import { ScoreEntry } from '../types';

interface LeaderboardProps {
  scores: ScoreEntry[];
  currentUserId?: string;
  onClose: () => void;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ scores, currentUserId, onClose }) => {
  return (
    <div className="absolute inset-0 bg-black/95 backdrop-blur-xl flex items-center justify-center z-50 p-6 animate-fade-in">
      <div className="max-w-md w-full h-[80vh] flex flex-col bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden relative">
        <div className="p-6 border-b border-gray-800 bg-gray-900">
          <h2 className="text-3xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 tracking-tighter">
            HALL OF FAME
          </h2>
          <p className="text-gray-400 text-xs font-mono mt-1">TOP RACERS GLOBAL RANKING</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {scores.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 py-10 gap-2">
              <span className="text-2xl opacity-50">🏁</span>
              <p>등록된 기록이 없습니다.</p>
              <p className="text-xs text-gray-600">Firebase Database 규칙을 확인해주세요.</p>
            </div>
          ) : (
            scores.map((entry, index) => {
              const isCurrentUser = entry.uid === currentUserId;
              const rank = index + 1;
              let rankColor = "text-gray-400";
              if (rank === 1) rankColor = "text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]";
              if (rank === 2) rankColor = "text-gray-300";
              if (rank === 3) rankColor = "text-amber-600";

              return (
                <div 
                  key={index} 
                  className={`flex items-center p-3 rounded-lg border ${isCurrentUser ? 'bg-neon-blue/10 border-neon-blue/50' : 'bg-black/40 border-gray-800'}`}
                >
                  <div className={`w-8 font-black text-xl italic ${rankColor} text-center`}>
                    {rank}
                  </div>
                  <div className="flex-1 mx-3 overflow-hidden">
                    <div className={`text-sm font-bold truncate ${isCurrentUser ? 'text-neon-blue' : 'text-gray-200'}`}>
                      {entry.displayName.split('@')[0]}
                    </div>
                    <div className="text-[10px] text-gray-500 font-mono">
                      {new Date(entry.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right font-mono font-bold text-neon-green">
                    {entry.score.toLocaleString()}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="p-4 bg-gray-900 border-t border-gray-800">
          <button 
            onClick={onClose}
            className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-white rounded font-bold transition-colors"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;