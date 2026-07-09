// api/check.js — Vercel serverless function
// Reads answers and the flag exclusively from environment variables.
// Set these in your Vercel project → Settings → Environment Variables:
//   ANSWER_1   e.g. "haunted house"
//   ANSWER_2   e.g. "secret code"
//   ANSWER_3   e.g. "tomb"
//   FLAG       e.g. "FLAG{NODE_SPHINX_CRACKED}"
//
// Each env var may contain multiple accepted answers separated by "|"
//   e.g.  ANSWER_1="haunted house|a haunted house"

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { riddle, answer } = req.body ?? {};

  if (!riddle || typeof answer !== "string") {
    return res.status(400).json({ error: "Bad request" });
  }

  const riddleNum = Number(riddle);
  if (![1, 2, 3].includes(riddleNum)) {
    return res.status(400).json({ error: "Invalid riddle number" });
  }

  // Load accepted answers from env var, split on "|"
  const rawEnv = process.env[`ANSWER_${riddleNum}`] ?? "";
  const accepted = rawEnv
    .split("|")
    .map(s => normalize(s))
    .filter(Boolean);

  const norm = normalize(answer);
  const correct = accepted.includes(norm);

  // Return the flag only when the final (3rd) riddle is solved
  const flag = correct && riddleNum === 3 ? (process.env.FLAG ?? "") : null;

  return res.status(200).json({ correct, flag });
}

function normalize(s) {
  return s.trim().toLowerCase().replace(/^(a|an|the)\s+/i, "");
}
