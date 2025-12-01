import { db } from "../firebase";
import { ref, query, orderByChild, limitToLast, get, set } from "firebase/database";
import { ScoreEntry } from "../types";

// Changed key to v2 to restart local leaderboard with new unique-user logic
const LOCAL_STORAGE_KEY = 'neonRacer_leaderboard_v2';
const DB_PATH = 'best_scores';

export interface RankingResult {
  success: boolean;
  data: ScoreEntry[];
  error?: string;
  isLocal?: boolean;
}

// Helper: Get scores from local storage
const getLocalScores = (): ScoreEntry[] => {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error("Local storage read error", e);
    return [];
  }
};

// Helper: Save score to local storage (Unique per User)
const saveLocalScore = (entry: ScoreEntry) => {
  try {
    let scores = getLocalScores();
    
    const existingIndex = scores.findIndex(s => s.uid === entry.uid);
    
    if (existingIndex !== -1) {
      // Update only if new score is higher
      if (entry.score > scores[existingIndex].score) {
        scores[existingIndex] = entry;
      }
      // If new score is lower, do nothing
    } else {
      // New user
      scores.push(entry);
    }
    
    // Sort descending
    scores.sort((a, b) => b.score - a.score);
    // Keep top 20
    const top20 = scores.slice(0, 20);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(top20));
  } catch (e) {
    console.error("Local storage write error", e);
  }
};

export const saveScore = async (uid: string, displayName: string, score: number) => {
  // Construct the new entry
  const entry: ScoreEntry = {
    uid,
    displayName: displayName || 'Anonymous',
    score,
    timestamp: Date.now()
  };

  // Always save to local storage as backup/immediate feedback
  saveLocalScore(entry);

  try {
    const userScoreRef = ref(db, `${DB_PATH}/${uid}`);
    
    // 1. Fetch current score from server
    const snapshot = await get(userScoreRef);
    const currentData = snapshot.val() as ScoreEntry | null;

    // 2. Determine if we should update (No data exists OR new score is higher)
    // Note: We check if score > currentData.score. 
    // If they are equal, we don't update (preserving the earlier timestamp is standard, 
    // or updating timestamp is also fine. Here we stick to 'Best Score' meaning strictly higher or first).
    // If you want "Latest" even for ties, use >=. But usually ties go to the first holder.
    // Let's stick to > to minimize writes, unless data is corrupt (missing score).
    
    if (!currentData || score > (currentData.score || 0)) {
        await set(userScoreRef, entry);
        console.log("✅ Score saved to Firebase successfully:", entry);
    } else {
        console.log("ℹ️ Existing score is higher or equal. Skipping Firebase update.", {
            new: score,
            existing: currentData.score
        });
    }

  } catch (error: any) {
    console.error("❌ Firebase save failed:", error.message);
    // Local storage was already updated above, so user sees it locally at least.
  }
};

export const getTopScores = async (): Promise<RankingResult> => {
  const scoresRef = ref(db, DB_PATH);
  
  try {
    // Attempt 1: Standard Firebase Query
    let scoresArray: ScoreEntry[] = [];
    
    try {
      const topScoresQuery = query(scoresRef, orderByChild('score'), limitToLast(20));
      const snapshot = await get(topScoresQuery);

      if (snapshot.exists()) {
        const data = snapshot.val();
        scoresArray = Object.values(data);
      }
    } catch (queryError: any) {
      console.warn("Primary fetch failed, trying fallback...", queryError.code);
      
      if (queryError.code === 'PERMISSION_DENIED' || queryError.message.includes('permission_denied')) {
        throw queryError;
      }
      
      // Fallback: fetch all for client-side sorting if index is missing
      const snapshot = await get(scoresRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        scoresArray = Object.values(data);
      }
    }

    if (scoresArray.length > 0) {
      const sorted = scoresArray.sort((a, b) => b.score - a.score).slice(0, 20);
      return { success: true, data: sorted, isLocal: false };
    } else {
        return { success: true, data: [], isLocal: false };
    }

  } catch (error: any) {
    console.warn("Server unavailable, switching to Offline Mode:", error.message);
    
    // Fallback: Return Local Storage Data
    const localData = getLocalScores();
    
    // Determine error type for UI feedback
    let errorType = 'SERVER_ERROR';
    if (error.code === 'PERMISSION_DENIED' || (error.message && error.message.includes('permission_denied'))) {
        errorType = 'PERMISSION_DENIED';
    } else if (error.message && (error.message.includes('Index not defined') || error.message.includes('indexOn'))) {
        errorType = 'INDEX_NOT_DEFINED';
    }

    return { 
      success: true, 
      data: localData, 
      error: errorType,
      isLocal: true 
    };
  }
};