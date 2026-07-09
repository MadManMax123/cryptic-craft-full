// api/auth.js
// POST /api/auth
// Body: { speed, zone, street }
// Returns: { success: true, token } on correct answers
//          { success: false, error } on wrong answers

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "method not allowed" });
  }

  // Rate-limit hint: add Vercel Edge Config or KV for prod deployments
  const { speed, zone, street } = req.body || {};

  if (!speed || !zone || !street) {
    return res.status(400).json({ success: false, error: "missing fields" });
  }

  // Pull expected answers from env (never exposed to client)
  const expectedSpeed  = (process.env.ANSWER_SPEED  || "").trim();
  const expectedZone   = (process.env.ANSWER_ZONE   || "").trim();
  const expectedStreet = (process.env.ANSWER_STREET || "").trim();
  const accessToken    = process.env.FLAG_ACCESS_TOKEN;

  // Case-insensitive, trimmed comparison
  const normalize = s => String(s).trim().toLowerCase();

  const correct =
    normalize(speed)  === normalize(expectedSpeed)  &&
    normalize(zone)   === normalize(expectedZone)   &&
    normalize(street) === normalize(expectedStreet);

  if (!correct) {
    // Deliberate vague response — no hints
    return res.status(401).json({ success: false, error: "sequence mismatch" });
  }

  return res.status(200).json({ success: true, token: accessToken });
}
