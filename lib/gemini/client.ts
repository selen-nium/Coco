import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

let _openai: OpenAI | null = null;
function getOpenAI() {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

export const brainModel = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});

/**
 * Generates a 1536-dimensional vector embedding for the given text.
 * Used for storing and searching past conversation history.
 */
export async function embedText(text: string): Promise<number[]> {
  const normalized = text.trim();

  if (!normalized) {
    throw new Error("Cannot embed empty text");
  }

  const result = await getOpenAI().embeddings.create({
    model: "text-embedding-3-small",
    input: normalized,
  });

  return result.data[0].embedding;
}

/**
 * Runs a text generation request against Gemini Flash and returns plain text.
 * Used for LLM-judge style decisions and post-call analysis.
 */
export async function generateText(prompt: string): Promise<string> {
  const normalized = prompt.trim();

  if (!normalized) {
    throw new Error("Cannot generate from empty prompt");
  }

  const result = await brainModel.generateContent(normalized);
  const response = await result.response;
  return response.text().trim();
}

/**
 * Converts a number array to a string literal format for pgvector.
 * Example: [0.1, 0.2] -> '[0.1, 0.2]'
 */
export function toVectorLiteral(values: number[]): string {
  return `[${values.join(",")}]`;
}

export function extractJsonBlock<T>(text: string): T {
  const fencedMatch = text.match(/```json\s*([\s\S]*?)```/i);
  const raw = fencedMatch?.[1] ?? text;
  return JSON.parse(raw) as T;
}

export { genAI };
