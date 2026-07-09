import { parseCookies, verifySession } from "../lib/session.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Hints require a valid session so that only logged-in teams can access them
  const cookies = parseCookies(req.headers.cookie ?? "");
  const session = verifySession(cookies["null_session"] ?? "");

  if (!session) {
    return res.status(401).json({ error: "Login required" });
  }

  // LEVEL1_HINTS is a JSON array stored as an env var, e.g.:
  // ["The signal begins with sound.","Decoding once is not enough.", ...]
  const raw = process.env.LEVEL1_HINTS ?? "[]";

  let hints;
  try {
    hints = JSON.parse(raw);
    if (!Array.isArray(hints)) throw new Error("not an array");
  } catch {
    return res.status(500).json({ error: "LEVEL1_HINTS env var is not valid JSON array" });
  }

  return res.status(200).json({ hints });
}
