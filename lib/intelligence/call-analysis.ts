import { generateText } from "@/lib/gemini/client";

export type TranscriptEntry = {
  role: string;
  message?: string;
  text?: string;
  timestamp?: string;
};

export type TaskConfidence = "High" | "Medium" | "Low";

const USER_UNCERTAINTY_PATTERNS = [
  /\bagain\b/gi,
  /\brepeat\b/gi,
  /\bi do(?:n't| not) understand\b/gi,
  /\bi'?m confused\b/gi,
  /\bwhat do i do\b/gi,
  /\bwhat now\b/gi,
  /\bsorry\b/gi,
  /\bi can't find\b/gi,
  /\bi cant find\b/gi,
  /\bwhere is\b/gi,
  /\bwhich one\b/gi,
  /\bcan you help\b/gi,
];

function getEntryText(entry: TranscriptEntry) {
  return (entry.message ?? entry.text ?? "").trim();
}

function normalizeAgentPrompt(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function analyzeTaskConfidence(entries: TranscriptEntry[]) {
  const userTexts = entries
    .filter((entry) => entry.role === "user" || entry.role === "user_proxy")
    .map(getEntryText)
    .join("\n");

  const userUncertaintyCount = USER_UNCERTAINTY_PATTERNS.reduce((count, pattern) => {
    const matches = userTexts.match(pattern);
    return count + (matches?.length ?? 0);
  }, 0);

  const agentPromptCounts = new Map<string, number>();

  for (const entry of entries) {
    if (entry.role !== "agent") continue;
    const normalized = normalizeAgentPrompt(getEntryText(entry));
    if (normalized.length < 18) continue;
    agentPromptCounts.set(normalized, (agentPromptCounts.get(normalized) ?? 0) + 1);
  }

  let repeatedAgentPromptCount = 0;
  for (const count of agentPromptCounts.values()) {
    if (count > 1) repeatedAgentPromptCount += count - 1;
  }

  const weightedSignal = userUncertaintyCount * 2 + repeatedAgentPromptCount;

  let confidence: TaskConfidence = "High";
  if (weightedSignal >= 6) {
    confidence = "Low";
  } else if (weightedSignal >= 2) {
    confidence = "Medium";
  }

  return {
    confidence,
    userUncertaintyCount,
    repeatedAgentPromptCount,
  };
}

function compactTaskLabel(text: string) {
  return text
    .replace(/^["'\s]+|["'\s]+$/g, "")
    .split(/\s+/)
    .slice(0, 5)
    .join(" ");
}

export async function extractTaskLabel(entries: TranscriptEntry[]) {
  const transcript = entries
    .map((entry) => `${entry.role}: ${getEntryText(entry)}`)
    .filter((line) => line.trim().length > 0)
    .join("\n");

  if (!transcript.trim()) {
    return "General support";
  }

  try {
    const raw = await generateText(`Read this phone support transcript and return only a short task label, maximum 5 words, describing what the user was trying to do. Use transcript only. No punctuation. No explanation.

Transcript:
${transcript}`);

    const label = compactTaskLabel(raw);
    return label || "General support";
  } catch {
    const firstUserLine = entries.find(
      (entry) => entry.role === "user" || entry.role === "user_proxy"
    );
    return firstUserLine
      ? compactTaskLabel(getEntryText(firstUserLine)) || "General support"
      : "General support";
  }
}
