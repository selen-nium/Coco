export function normalizeTranscriptEntry(entry) {
  const message = typeof entry?.message === "string" ? entry.message : "";
  const text = typeof entry?.text === "string" ? entry.text : "";
  return (message || text).trim();
}

export function buildMemoryText(snippets) {
  return snippets
    .map(
      (snippet) =>
        `- On ${new Date(snippet.timestamp).toLocaleDateString()}, the user said: "${snippet.text}"`
    )
    .join("\n");
}

export function mergeScamAlertState(
  existingKeywords,
  existingSeverity,
  nextKeywords,
  nextSeverity
) {
  return {
    detected_keywords: [...new Set([...(existingKeywords ?? []), ...(nextKeywords ?? [])])],
    severity:
      existingSeverity === "critical" || nextSeverity === "critical"
        ? "critical"
        : "high",
  };
}

export function filterAccessibleMatches(matches, ownershipById, caretakerId) {
  return matches.filter((match) => {
    const owner = ownershipById.get(match.id);
    return owner == null || owner === caretakerId;
  });
}

export function chooseIntentBand(similarity, highThreshold, midThreshold) {
  if (similarity >= highThreshold) return "high";
  if (similarity < midThreshold) return "low";
  return "middle";
}
