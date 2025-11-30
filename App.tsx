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
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState<ScoreEntry[]>([]);

  // Monitor Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Automatically hide auth modal if logged in successfully
        setShowAuthModal(false);
      }
    });
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

    // Save score if user is logged in
    if (user) {
      const displayName = user.displayName || user.email?.split('@')[0] || 'Unknown Pilot';
      saveScore(user.uid, displayName, finalScore);
    }

    // Call Gemini API
    const analysis = await getGameAnalysis(finalScore, finalDistance);
    
    setAiAnalysis(analysis);
    setIsAiLoading(false);
  }, [user]);

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
    const scores = await getTopScores();
    setLeaderboardData(scores);
    setShowLeaderboard(true);
  };

  return (
    <div className="w-full h-screen bg-gray-900 relative">
      <GameCanvas 
        status={status}
        onGameOver={handleGameOver}
        onScoreUpdate={handleScoreUpdate}
      />
      
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

      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}

      {showLeaderboard && (
        <Leaderboard 
          scores={leaderboardData} 
          currentUserId={user?.uid}
          onClose={() => setShowLeaderboard(false)} 
        />
      )}
    </div>
  );
};

export default App;