import test from "node:test";
import assert from "node:assert/strict";
import {
  buildMemoryText,
  chooseIntentBand,
  filterAccessibleMatches,
  mergeScamAlertState,
  normalizeTranscriptEntry,
} from "../lib/gemini/intelligence-utils.mjs";

test("normalizeTranscriptEntry prefers message then text and trims", () => {
  assert.equal(normalizeTranscriptEntry({ message: " hello " }), "hello");
  assert.equal(normalizeTranscriptEntry({ text: " hi " }), "hi");
  assert.equal(normalizeTranscriptEntry({}), "");
});

test("buildMemoryText formats snippets for tool output", () => {
  const output = buildMemoryText([
    { text: "I need help with photos", timestamp: "2026-04-01T12:00:00.000Z" },
  ]);

  assert.match(output, /I need help with photos/);
  assert.match(output, /On/);
});

test("mergeScamAlertState de-dupes keywords and preserves critical severity", () => {
  const merged = mergeScamAlertState(
    ["gift card", "bank"],
    "high",
    ["bank", "wire transfer"],
    "critical"
  );

  assert.deepEqual(merged.detected_keywords, ["gift card", "bank", "wire transfer"]);
  assert.equal(merged.severity, "critical");
});

test("filterAccessibleMatches keeps global and owned flows", () => {
  const matches = [{ id: "a" }, { id: "b" }, { id: "c" }];
  const ownership = new Map([
    ["a", null],
    ["b", "caretaker-1"],
    ["c", "caretaker-2"],
  ]);

  const filtered = filterAccessibleMatches(matches, ownership, "caretaker-1");

  assert.deepEqual(
    filtered.map((match) => match.id),
    ["a", "b"]
  );
});

test("chooseIntentBand classifies similarity buckets", () => {
  assert.equal(chooseIntentBand(0.9, 0.86, 0.68), "high");
  assert.equal(chooseIntentBand(0.7, 0.86, 0.68), "middle");
  assert.equal(chooseIntentBand(0.4, 0.86, 0.68), "low");
});
