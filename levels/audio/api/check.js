// api/check.js
// POST /api/check
// Accepts { answer: string }, normalizes, hashes, and compares against ANSWER_HASH env var.
// On success: sets a signed HMAC cookie so /api/fetch can verify without storing state.

const crypto = require("crypto");

/* ──────────────────────────────────────────────────────────────────────
   Normalize: match what the frontend sends after its own cleaning pass.
   Steps: lowercase → strip non-[a-z0-9 ] → collapse spaces → trim.
────────────────────────────────────────────────────────────────────── */
function normalizeAnswer(input) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/ +/g, " ")
    .trim();
}

/* ──────────────────────────────────────────────────────────────────────
   Cookie signing
   Format: base64url(payload).HMAC-SHA256(base64url(payload), secret)
   Payload JSON: { v: "solved", t: <unix-ms> }
────────────────────────────────────────────────────────────────────── */
function createSignedCookie(secret) {
  const payload = Buffer.from(
    JSON.stringify({ v: "solved", t: Date.now() })
  ).toString("base64url");

  const sig = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("base64url");

  return `${payload}.${sig}`;
}

/* ──────────────────────────────────────────────────────────────────────
   Handler
────────────────────────────────────────────────────────────────────── */
module.exports = async function handler(req, res) {
  // Only allow POST
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  // req.body is auto-parsed by Vercel for application/json
  const { answer } = req.body || {};

  if (!answer || typeof answer !== "string") {
    return res.status(400).json({ error: "Missing or invalid answer field" });
  }

  // Re-normalize server-side (defense-in-depth; frontend already cleaned it)
  const normalized = normalizeAnswer(answer);

  // Hash
  const hash = crypto
    .createHash("sha256")
    .update(normalized, "utf8")
    .digest("hex");

  const expectedHash = process.env.ANSWER_HASH;

  if (!expectedHash) {
    console.error("[check] ANSWER_HASH env variable is not set");
    return res.status(500).json({ error: "Server configuration error" });
  }

  // Timing-safe comparison (hashes are hex strings of equal length, so safe)
  const hashBuf     = Buffer.from(hash,         "hex");
  const expectedBuf = Buffer.from(expectedHash, "hex");

  let isCorrect = false;
  try {
    isCorrect = (
      hashBuf.length === expectedBuf.length &&
      crypto.timingSafeEqual(hashBuf, expectedBuf)
    );
  } catch (_) {
    isCorrect = false;
  }

  if (!isCorrect) {
    return res.status(200).json({ correct: false });
  }

  // ── Correct answer ────────────────────────────────────────────────
  const secret = process.env.COOKIE_SECRET;
  if (!secret) {
    console.error("[check] COOKIE_SECRET env variable is not set");
    return res.status(500).json({ error: "Server configuration error" });
  }

  const cookieValue = createSignedCookie(secret);
  const maxAge      = 60 * 60; // 1 hour in seconds

  // HttpOnly: not accessible from JS (prevents XSS theft)
  // SameSite=Strict: CSRF protection
  // Secure: HTTPS only (Vercel is always HTTPS in production)
  // Path=/: entire site
  res.setHeader(
    "Set-Cookie",
    `ctf_auth=${cookieValue}; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}; Path=/`
  );

  return res.status(200).json({ correct: true });
};
