
import { GoogleGenAI, Type } from "@google/genai";

/**
 * World-class initialization logic.
 * We create a new instance right before use to ensure we catch the latest 
 * environment variables (injected at build) or user-selected keys.
 */
const getAIInstance = () => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey || apiKey === "undefined" || apiKey.trim() === "") {
    throw new Error("MISSING_API_KEY");
  }

  return new GoogleGenAI({ apiKey });
};

/**
 * Handles errors and provides recovery paths for students.
 */
export const handleAIError = async (error: any) => {
  console.error("Aditya AI Error Log:", error);
  
  const errorMessage = error.message || "";
  const status = error.status || (error.response ? error.response.status : null);

  // If the key is invalid, expired, or not found, prompt for a new one
  if (errorMessage.includes("entity was not found") || 
      errorMessage.includes("API key not valid") || 
      status === 401 || status === 403) {
    
    if (typeof window !== 'undefined' && (window as any).aistudio) {
      // Per instructions: Trigger selection and assume success to avoid race conditions
      try {
        await (window as any).aistudio.openSelectKey();
        return "RETRY_WITH_NEW_KEY";
      } catch (e) {
        return "Authentication required. Please click the key icon to provide an API key.";
      }
    }
  }

  if (status === 429) {
    return "The campus AI is currently busy. Please wait a moment before asking another question.";
  }

  return "I'm having trouble connecting to the academic brain. Please check your connection.";
};

export const chatWithAI = async (message: string, history: any[]) => {
  try {
    const ai = getAIInstance();
    const contextHistory = history.length > 0 
      ? `Recent discussion:\n${history.map(m => `${m.role}: ${m.content}`).join('\n')}\n\n`
      : "";

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `${contextHistory}Query: ${message}`,
      config: {
        systemInstruction: "You are the Aditya University AI Assistant. Keep answers academic, professional, and helpful. Guide students through their curriculum.",
        temperature: 0.7,
      },
    });

    return response.text || "No response received.";
  } catch (error) {
    const errorResult = await handleAIError(error);
    if (errorResult === "RETRY_WITH_NEW_KEY") {
      // Re-run the request with the newly selected key
      return chatWithAI(message, history);
    }
    return errorResult;
  }
};

export const explainWrongAnswer = async (q: string, opts: string[], correct: string, student: string) => {
  try {
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Question: ${q}\nCorrect: ${correct}\nStudent Choice: ${student}`,
      config: {
        systemInstruction: "Briefly explain why the correct answer is logically superior. Encourage the student.",
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
      contents: `Create ${count} academic questions about ${topic}.`,
      config: {
        systemInstruction: "Return high-quality academic questions in strict JSON format.",
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
