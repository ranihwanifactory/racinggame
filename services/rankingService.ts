import { db } from "../firebase";
import { ref, push, query, orderByChild, limitToLast, get, set } from "firebase/database";
import { ScoreEntry } from "../types";

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
  } catch (error) {
    console.error("Error saving score:", error);
  }
};

export const getTopScores = async (): Promise<ScoreEntry[]> => {
  try {
    const scoresRef = ref(db, 'scores');
    const topScoresQuery = query(scoresRef, orderByChild('score'), limitToLast(20));
    const snapshot = await get(topScoresQuery);

    if (snapshot.exists()) {
      const data = snapshot.val();
      // Firebase returns object with keys, convert to array
      const scoresArray: ScoreEntry[] = Object.values(data);
      // Sort descending by score
      return scoresArray.sort((a, b) => b.score - a.score);
    }
    return [];
  } catch (error) {
    console.error("Error fetching scores:", error);
    return [];
  }
};