import { GoogleGenAI } from "@google/genai";

export const getGameAnalysis = async (score: number, distance: number): Promise<string> => {
  // Lazy initialization to prevent crash on module load if API key is missing
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    // API Key가 없는 경우 조용히 기본 오프라인 메시지를 반환합니다.
    return "AI 시스템 오프라인. 운전 실력은 스스로 판단해.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey: apiKey });
    
    const prompt = `
      당신은 냉소적이지만 유머러스한 F1 레이싱 팀 매니저입니다.
      플레이어가 방금 게임 오버되었습니다.
      
      기록:
      - 점수: ${score}점
      - 주행 거리: ${Math.floor(distance)}m
      
      이 기록을 바탕으로 플레이어에게 50자 이내로 짧고 재치 있는 피드백(한국어)을 주세요. 
      운전을 못했으면 놀리고, 잘했으면 비꼬면서 칭찬하세요.
      반말 모드로 작성해 주세요.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "통신 상태가 좋지 않아... 다음에 다시 이야기하자.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "AI 시스템 오프라인. 운전 실력은 스스로 판단해.";
  }
};