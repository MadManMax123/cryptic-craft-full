/**
 * grader.js — NULL Challenge // Protocol 17
 *
 * Grades free-text responses to the Protocol 17 self-referential logic puzzle
 * using the Groq LLM API as a primary grader, with a keyword-based fallback
 * if the Groq call fails.
 *
 * The correct insight: steps 3–8 contain a CONTRADICTION/PARADOX — it is
 * impossible to follow the protocol consistently because:
 *   • Step 3 says you will do step 5.
 *   • Step 5 (conditional on step 3 being true) says skip step 7.
 *   • Step 4 says you will NOT do step 6.
 *   • Step 6 (conditional on step 4 being true) says do step 7.
 *   • Step 8 requires any number written in step 7 to be correct.
 *   Exactly one of steps 3–8 must be false, but no single assignment
 *   resolves the contradiction — the system is INCONSISTENT.
 *
 * Grading via Groq allows flexible natural-language understanding while
 * the fallback keyword grader ensures the endpoint never crashes silently.
 */

const { chat } = require("./groq");

// ── Groq grading prompt ───────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are grading a logic puzzle answer.

Correct idea:
* The system is impossible OR inconsistent OR self-contradictory.

Accept answers that:
* Show understanding of contradiction or impossibility
* Even if wording is imperfect

Reject:
* Very short answers
* No reasoning
* Random guesses

Respond ONLY with:
PASS
or
FAIL`;

// ── Keyword fallback (used when Groq API is unavailable) ─────────────────────
const KEYWORD_GROUPS = [
  ["impossible", "cannot be followed", "no solution", "unsolvable",
   "cannot all be true", "cannot all hold", "breaks down", "cannot work",
   "no valid", "cannot satisfy", "unresolvable"],
  ["contradiction", "inconsistent", "inconsistency", "paradox", "paradoxical",
   "self-referential", "circular", "conflict", "conflicting", "mutually exclusive",
   "irreconcilable", "contradictory"],
];
const REASONING_INDICATORS = [
  "because", "since", "therefore", "so ", "which means", "leads to",
  "results in", "implies", "this means", "step", "if ", "when ",
  "follow", "cannot follow", "protocol", "true", "false",
];
const MIN_CHARS = 15;

function keywordGrade(answer) {
  const lower = answer.trim().toLowerCase();
  if (lower.length < MIN_CHARS) return { pass: false, reason: "too_short" };

  const groupHits = KEYWORD_GROUPS.map(g => g.some(kw => lower.includes(kw)));
  if (!groupHits.every(Boolean)) return { pass: false, reason: "missing_key_concept" };

  const hasReasoning = REASONING_INDICATORS.some(ind => lower.includes(ind));
  if (!hasReasoning) return { pass: false, reason: "no_reasoning" };

  return { pass: true, reason: "correct_fallback" };
}

/**
 * Grade a free-text answer against the Protocol 17 puzzle.
 *
 * Tries Groq first; falls back to keyword matching on any API failure.
 *
 * @param {string} raw  — the untrimmed answer string
 * @returns {Promise<{ pass: boolean, reason: string }>}
 */
async function grade(raw) {
  if (!raw || typeof raw !== "string") {
    return { pass: false, reason: "empty_input" };
  }

  const trimmed = raw.trim();
  if (trimmed.length < MIN_CHARS) {
    return { pass: false, reason: "too_short" };
  }

  // ── Primary: Groq LLM grading ─────────────────────────────────────────────
  try {
    const reply = await chat([
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: trimmed },
    ]);

    // Strict parse: trim whitespace, uppercase, exact match only
    const verdict = reply.trim().toUpperCase();

    if (verdict === "PASS") return { pass: true, reason: "correct" };
    if (verdict === "FAIL") return { pass: false, reason: "incorrect" };

    // Any other response from the model counts as FAIL
    console.warn("[grader] Unexpected Groq response:", JSON.stringify(reply));
    return { pass: false, reason: "model_ambiguous" };

  } catch (err) {
    // ── Fallback: keyword-based grading ──────────────────────────────────────
    console.error("[grader] Groq API failed, using keyword fallback:", err.message);
    return keywordGrade(trimmed);
  }
}

module.exports = { grade };