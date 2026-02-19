
import { GoogleGenAI, Type } from "@google/genai";

/**
 * World-class initialization logic.
 * We create a new instance right before use to ensure we catch the latest 
 * environment variables or user-selected keys.
 */
const getAIInstance = () => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey || apiKey.trim() === "") {
    // This helps debug if the GitHub Secret wasn't mapped correctly
    throw new Error("MISSING_API_KEY");
  }

  return new GoogleGenAI({ apiKey });
};

const handleAIError = async (error: any) => {
  console.error("Gemini Error:", error);
  
  if (error.message === "MISSING_API_KEY") {
    return "Campus AI is currently offline: The API_KEY environment variable is not set. Please check your deployment settings.";
  }
  
  // If the key is invalid or restricted, we can prompt the user to select their own
  // if the platform supports the window.aistudio tools.
  if (error.message?.includes("entity was not found") || error.status === 401 || error.status === 403) {
    if (typeof window !== 'undefined' && (window as any).aistudio) {
      try {
        await (window as any).aistudio.openSelectKey();
        return "Authentication refreshed. Please try your request again.";
      } catch (e) {
        return "Access denied. Please contact the administrator to verify the API configuration.";
      }
    }
  }
  
  return "The academic assistant is currently reaching capacity. Please try again in a few moments.";
};

export const chatWithAI = async (message: string, history: any[]) => {
  try {
    const ai = getAIInstance();
    const contextHistory = history.length > 0 
      ? `Recent context:\n${history.map(m => `${m.role}: ${m.content}`).join('\n')}\n\n`
      : "";

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `${contextHistory}Question: ${message}`,
      config: {
        systemInstruction: "You are the Aditya University AI Assistant. Keep answers academic and professional. If the question is non-academic, politely guide the student back to their studies.",
        temperature: 0.6,
      },
    });

    return response.text || "No response received.";
  } catch (error) {
    return await handleAIError(error);
  }
};

export const explainWrongAnswer = async (q: string, opts: string[], correct: string, student: string) => {
  try {
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Question: ${q}\nCorrect Answer: ${correct}\nStudent Choice: ${student}`,
      config: {
        systemInstruction: "Explain the logical reason for the correct answer. Be encouraging.",
      }
    });
    return response.text || "Explanation currently unavailable.";
  } catch (error) {
    return await handleAIError(error);
  }
};

export const generateAIQuestions = async (topic: string, count: number = 5) => {
  try {
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Create ${count} university questions about ${topic}.`,
      config: {
        systemInstruction: "Return high-quality academic questions in JSON format.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctAnswer: { type: Type.INTEGER }
            },
            required: ["text", "options", "correctAnswer"]
          }
        }
      }
    });
    return response.text ? JSON.parse(response.text) : null;
  } catch (error) {
    await handleAIError(error);
    return null;
  }
};
