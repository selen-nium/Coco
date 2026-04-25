import { GoogleGenerativeAI } from "@google/generative-ai";
import { storeGuidanceSession } from "@/lib/gemini/guidance-sessions";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

// Gemini 2.5 Flash — used for both brain (guidance) and safety shield (scam detection)
export const brainModel = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});

export const safetyModel = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});

const embeddingModel = genAI.getGenerativeModel({
  model: "text-embedding-004",
});

export async function embedText(text: string): Promise<number[]> {
  const result = await embeddingModel.embedContent(text);
  return result.embedding.values;
}

export function toVectorLiteral(values: number[]): string {
  return `[${values.join(",")}]`;
}

export function createGuidanceSession(callSid: string, systemInstruction: string) {
  const chat = brainModel.startChat({
    history: [],
    systemInstruction,
  });

  storeGuidanceSession(callSid, chat);
  return chat;
}

export { genAI };
