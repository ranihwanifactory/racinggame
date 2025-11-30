import React, { useState, useCallback, useEffect } from 'react';
import GameCanvas from './components/GameCanvas';
import UIOverlay from './components/UIOverlay';
import AuthModal from './components/AuthModal';
import Leaderboard from './components/Leaderboard';
import { GameStatus, ScoreEntry } from './types';
import { getGameAnalysis } from './services/geminiService';
import { auth } from './firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { saveScore, getTopScores } from './services/rankingService';

const App: React.FC = () => {
  const [status, setStatus] = useState<GameStatus>(GameStatus.IDLE);
  const [score, setScore] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  // Auth & Ranking State
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  // Leaderboard State
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState<ScoreEntry[]>([]);
  const [isLeaderboardLoading, setIsLeaderboardLoading] = useState(false);
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null);

  // Local High Score
  const [localBestScore, setLocalBestScore] = useState(0);

  // Monitor Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setShowAuthModal(false);
      }
    });
    
    // Load local best score
    const savedBest = localStorage.getItem('neonRacerBestScore');
    if (savedBest) {
      setLocalBestScore(parseInt(savedBest, 10));
    }

    return () => unsubscribe();
  }, []);

  const handleScoreUpdate = useCallback((newScore: number, distance: number, newSpeed: number) => {
    setScore(newScore);
    setSpeed(newSpeed);
  }, []);

  const handleGameOver = useCallback(async (finalScore: number, finalDistance: number) => {
    setStatus(GameStatus.GAME_OVER);
    setIsAiLoading(true);
    setAiAnalysis(""); 

    // Update Local Best
    if (finalScore > localBestScore) {
      setLocalBestScore(finalScore);
      localStorage.setItem('neonRacerBestScore', finalScore.toString());
    }

    // Save score if user is logged in
    if (user) {
      const displayName = user.displayName || user.email?.split('@')[0] || 'Unknown Pilot';
      saveScore(user.uid, displayName, finalScore);
    }

    // Call Gemini API
    const analysis = await getGameAnalysis(finalScore, finalDistance);
    
    setAiAnalysis(analysis);
    setIsAiLoading(false);
  }, [user, localBestScore]);

  const handleStart = () => {
    setScore(0);
    setSpeed(0);
    setStatus(GameStatus.PLAYING);
  };

  const handleRestart = () => {
    setStatus(GameStatus.IDLE);
    setTimeout(() => {
        handleStart();
    }, 100);
  };

  const handleShowLeaderboard = async () => {
    setShowLeaderboard(true);
    setIsLeaderboardLoading(true);
    setLeaderboardError(null);
    
    const result = await getTopScores();
    
    setIsLeaderboardLoading(false);
    if (result.success) {
      setLeaderboardData(result.data);
    } else {
      setLeaderboardError(result.error || "Unknown Error");
    }
  };

  return (
    <div className="w-full h-screen bg-gray-900 relative">
      <GameCanvas 
        status={status}
        onGameOver={handleGameOver}
        onScoreUpdate={handleScoreUpdate}
      />
      
      {/* Show local best on idle screen via custom prop or modification to UIOverlay. 
          For now, UIOverlay doesn't have localBest prop, but we can pass it if we wanted.
          Let's stick to the current UIOverlay contract but pass it implicitly if needed later.
      */}
      <UIOverlay 
        status={status}
        score={score}
        speed={speed}
        aiAnalysis={aiAnalysis}
        isAiLoading={isAiLoading}
        user={user}
        onStart={handleStart}
        onRestart={handleRestart}
        onLoginClick={() => setShowAuthModal(true)}
        onLogoutClick={() => signOut(auth)}
        onShowLeaderboard={handleShowLeaderboard}
      />
      
      {/* Optional: Display Local Best on Idle Screen Overlay hack */}
      {status === GameStatus.IDLE && localBestScore > 0 && (
        <div className="absolute top-4 left-4 z-50 pointer-events-none">
          <div className="bg-gray-900/80 border border-yellow-500/30 px-3 py-1 rounded text-yellow-500 text-xs font-mono">
            LOCAL BEST: {localBestScore}
          </div>
        </div>
      )}

      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}

      {showLeaderboard && (
        <Leaderboard 
          scores={leaderboardData} 
          isLoading={isLeaderboardLoading}
          error={leaderboardError}
          currentUserId={user?.uid}
          onClose={() => setShowLeaderboard(false)} 
        />
      )}
    </div>
  );
};

export default App;