import { db } from "../firebase";
import { ref, push, query, orderByChild, limitToLast, get, set } from "firebase/database";
import { ScoreEntry } from "../types";

export interface RankingResult {
  success: boolean;
  data: ScoreEntry[];
  error?: string;
}

export const saveScore = async (uid: string, displayName: string, score: number) => {
  try {
    const scoresRef = ref(db, 'scores');
    const newScoreRef = push(scoresRef);
    await set(newScoreRef, {
      uid,
      displayName: displayName || 'Anonymous',
      score,
      timestamp: Date.now()
    });
  } catch (error: any) {
    if (error.code === 'PERMISSION_DENIED') {
       console.warn("Score save failed: Permission Denied. Check Firebase Console Rules.");
    } else {
       console.error("Error saving score:", error);
    }
  }
};

export const getTopScores = async (): Promise<RankingResult> => {
  const scoresRef = ref(db, 'scores');
  
  try {
    // 1st Attempt: Try server-side sorting (Efficient)
    try {
      const topScoresQuery = query(scoresRef, orderByChild('score'), limitToLast(20));
      const snapshot = await get(topScoresQuery);

      if (snapshot.exists()) {
        const data = snapshot.val();
        const scoresArray: ScoreEntry[] = Object.values(data);
        const sorted = scoresArray.sort((a, b) => b.score - a.score);
        return { success: true, data: sorted };
      }
      return { success: true, data: [] };

    } catch (queryError: any) {
      // 2nd Attempt: Fallback to client-side sorting if index is missing
      // This ensures the app works even if the user hasn't configured Firebase Indexes yet.
      if (queryError.message && (queryError.message.includes('Index not defined') || queryError.message.includes('indexOn'))) {
         console.warn("Firebase Index missing. Falling back to client-side sorting.");
         
         const snapshot = await get(scoresRef); // Fetch all data (warning: slow for large datasets)
         if (snapshot.exists()) {
             const data = snapshot.val();
             const scoresArray: ScoreEntry[] = Object.values(data);
             // Sort and take top 20
             const sorted = scoresArray.sort((a, b) => b.score - a.score).slice(0, 20);
             return { success: true, data: sorted };
         }
         return { success: true, data: [] };
      }
      // Re-throw if it's not an index error
      throw queryError;
    }

  } catch (error: any) {
    console.error("Error fetching scores:", error);
    let errorMessage = error.message;
    
    if (error.code === 'PERMISSION_DENIED' || (error.message && error.message.includes('permission_denied'))) {
        errorMessage = 'PERMISSION_DENIED';
    } else if (error.message && (error.message.includes('Index not defined') || error.message.includes('indexOn'))) {
        errorMessage = 'INDEX_NOT_DEFINED';
    }

    return { success: false, data: [], error: errorMessage };
  }
};