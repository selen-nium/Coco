import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

// Gemini text-embedding-004 — used for semantic memory retrieval
const embeddingModel = genAI.getGenerativeModel({
  model: "text-embedding-004",
});

/**
 * Generates a 1536-dimensional vector embedding for the given text.
 * Used for storing and searching past conversation history.
 */
export async function embedText(text: string): Promise<number[]> {
  const result = await embeddingModel.embedContent(text);
  return result.embedding.values;
}

/**
 * Converts a number array to a string literal format for pgvector.
 * Example: [0.1, 0.2] -> '[0.1, 0.2]'
 */
export function toVectorLiteral(values: number[]): string {
  return `[${values.join(",")}]`;
}

export { genAI };
