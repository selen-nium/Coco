import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

// Gemini 2.5 Flash — used for both brain (guidance) and safety shield (scam detection)
export const brainModel = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});

export const safetyModel = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});

export { genAI };
