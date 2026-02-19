
import { GoogleGenAI, Type } from "@google/genai";

/**
 * AI Connection Status Helper
 */
const isAiConfigured = () => {
  const key = process.env.API_KEY;
  return key && key !== "undefined" && key.trim().length > 10;
};

/**
 * Chat with AI (Stubbed for future development)
 */
export const chatWithAI = async (message: string, history: any[]) => {
  if (!isAiConfigured()) {
    return "AI Assistant is currently in 'Option Only' mode. Functional connectivity has been removed as per developer request.";
  }
  
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: message,
    });
    return response.text || "No response.";
  } catch (error) {
    return "The AI service is currently paused for maintenance.";
  }
};

/**
 * Explain Wrong Answer (Now provides a generic educational tip if offline)
 */
export const explainWrongAnswer = async (questionText: string, options: string[], correctIdx: number, studentIdx: number) => {
  if (!isAiConfigured()) {
    return "Academic Tip: Review the core principles of this module in your textbook. AI-powered detailed explanations are currently disabled.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Question: ${questionText}\nCorrect: ${options[correctIdx]}`,
      config: { systemInstruction: "Explain the answer briefly." }
    });
    return response.text || "Consult faculty for details.";
  } catch (error) {
    return "Detailed AI explanation is offline.";
  }
};

/**
 * Generate AI Questions (Returns static samples if offline)
 */
export const generateAIQuestions = async (topic: string, count: number = 5) => {
  if (!isAiConfigured()) {
    return [
      {
        text: `Sample question about ${topic}? (AI Generator Offline)`,
        options: ["Option A", "Option B", "Option C", "Option D"],
        correctAnswer: 0
      }
    ];
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Generate ${count} questions about ${topic}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctAnswer: { type: Type.INTEGER }
            }
          }
        }
      }
    });
    return response.text ? JSON.parse(response.text) : null;
  } catch (error) {
    return null;
  }
};
