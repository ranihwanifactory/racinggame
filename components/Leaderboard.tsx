import React from 'react';
import { ScoreEntry } from '../types';

interface LeaderboardProps {
  scores: ScoreEntry[];
  isLoading: boolean;
  error: string | null;
  currentUserId?: string;
  onClose: () => void;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ scores, isLoading, error, currentUserId, onClose }) => {
  return (
    <div className="absolute inset-0 bg-black/95 backdrop-blur-xl flex items-center justify-center z-50 p-6 animate-fade-in">
      <div className="max-w-md w-full h-[85vh] flex flex-col bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden relative shadow-[0_0_50px_rgba(0,0,0,0.8)]">
        <div className="p-6 border-b border-gray-800 bg-gray-900 sticky top-0 z-10">
          <h2 className="text-3xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 tracking-tighter">
            HALL OF FAME
          </h2>
          <p className="text-gray-400 text-xs font-mono mt-1">TOP RACERS GLOBAL RANKING</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
          {isLoading ? (
             <div className="flex flex-col items-center justify-center h-64 gap-4 text-neon-blue">
               <div className="w-8 h-8 border-4 border-neon-blue border-t-transparent rounded-full animate-spin"></div>
               <span className="text-sm font-mono animate-pulse">CONNECTING TO MAINFRAME...</span>
             </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-4 gap-4">
              <span className="text-4xl">⚠️</span>
              <h3 className="text-red-400 font-bold">데이터 불러오기 실패</h3>
              
              {error === 'PERMISSION_DENIED' ? (
                <div className="text-left bg-gray-950 p-4 rounded border border-red-900/50 w-full text-xs text-gray-400 font-mono">
                  <p className="mb-2 text-white">Firebase 권한 오류가 발생했습니다.</p>
                  <p className="mb-2">Firebase Console 규칙 탭에서 읽기/쓰기 권한을 허용해주세요.</p>
                  <pre className="bg-black p-2 rounded text-green-500 overflow-x-auto">
{`{
  "rules": {
    ".read": true,
    ".write": true
  }
}`}
                  </pre>
                </div>
              ) : error === 'INDEX_NOT_DEFINED' ? (
                <div className="text-left bg-gray-950 p-4 rounded border border-yellow-900/50 w-full text-xs text-gray-400 font-mono">
                  <p className="mb-2 text-white">인덱스 설정이 권장됩니다.</p>
                  <p className="mb-2">성능 향상을 위해 규칙 탭에 아래 내용을 추가해주세요:</p>
                  <pre className="bg-black p-2 rounded text-yellow-500 overflow-x-auto">
{`"scores": {
  ".indexOn": ["score"]
}`}
                  </pre>
                </div>
              ) : (
                <p className="text-gray-500 text-sm">{error}</p>
              )}
            </div>
          ) : scores.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 py-10 gap-2">
              <span className="text-2xl opacity-50">🏁</span>
              <p>등록된 기록이 없습니다.</p>
              <p className="text-xs text-gray-600">첫 번째 챔피언이 되어보세요!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {scores.map((entry, index) => {
                const isCurrentUser = entry.uid === currentUserId;
                const rank = index + 1;
                let rankColor = "text-gray-500";
                let rowBg = isCurrentUser ? 'bg-neon-blue/10 border-neon-blue/50' : 'bg-black/40 border-gray-800';
                
                if (rank === 1) {
                    rankColor = "text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]";
                    rowBg = isCurrentUser ? rowBg : 'bg-yellow-900/10 border-yellow-700/30';
                }
                if (rank === 2) rankColor = "text-gray-300";
                if (rank === 3) rankColor = "text-amber-700";

                return (
                  <div 
                    key={index} 
                    className={`flex items-center p-3 rounded-lg border ${rowBg} transition-transform hover:scale-[1.02]`}
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
              })}
            </div>
          )}
        </div>

        <div className="p-4 bg-gray-900 border-t border-gray-800">
          <button 
            onClick={onClose}
            className="w-full py-4 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded transition-colors tracking-widest text-sm"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;