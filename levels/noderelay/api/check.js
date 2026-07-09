/**
 * /api/check.js — NULL Challenge // Protocol 17
 *
 * Receives a POST with { answer: string }.
 * Grades the answer via Groq, issues a signed cookie on success,
 * and returns progressive hints on failure.
 *
 * Rate limiting: per-IP, in-memory (resets on cold start).
 * For a persistent limit use Vercel KV — this is intentionally
 * lightweight to match the zero-dependency constraint.
 */

const { grade } = require("../lib/grader");
const { sign }  = require("../lib/hmac");

// ── In-memory rate limit store ───────────────────────────────────────────────
// { [ip]: { count: number, windowStart: number } }
const RATE_STORE  = {};
const WINDOW_MS   = 60_000; // 1-minute window
const MAX_PER_WIN = 10;     // max submissions per IP per window

function isRateLimited(ip) {
  const now  = Date.now();
  const slot = RATE_STORE[ip];

  if (!slot || now - slot.windowStart > WINDOW_MS) {
    RATE_STORE[ip] = { count: 1, windowStart: now };
    return false;
  }

  slot.count++;
  return slot.count > MAX_PER_WIN;
}

// ── Progressive hints ────────────────────────────────────────────────────────
const HINTS = [
  "Wrong... but you're on the right track. Look for contradictions in the steps.",
  "Still not correct. Focus on steps 3 to 8 and how they relate to each other.",
  "Think about whether it's possible to follow all the steps without conflict.",
  "Consider what happens if you assume step 3 is true. What about step 5?",
  "Try assuming step 4 is true. What does that imply for step 6 and step 7?",
];

// ── Cookie helpers ───────────────────────────────────────────────────────────
function parseCookies(cookieHeader) {
  if (!cookieHeader) return {};
  return Object.fromEntries(
    cookieHeader.split(";").map(c => {
      const [k, ...v] = c.trim().split("=");
      return [k, decodeURIComponent(v.join("="))];
    })
  );
}

function getAttemptCount(req) {
  const cookies = parseCookies(req.headers["cookie"]);
  const raw = parseInt(cookies["p17_attempts"] || "0", 10);
  return isNaN(raw) ? 0 : Math.min(raw, 99);
}

// ── Handler ──────────────────────────────────────────────────────────────────
module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Derive IP (Vercel forwards real IP in x-forwarded-for)
  const ip = (req.headers["x-forwarded-for"] || "").split(",")[0].trim()
           || req.socket?.remoteAddress
           || "unknown";

  if (isRateLimited(ip)) {
    return res.status(429).json({
      success: false,
      hint: "Too many requests. Slow down, investigator.",
    });
  }

  const { answer } = req.body || {};

  if (!answer || typeof answer !== "string") {
    return res.status(400).json({ success: false, hint: "No answer provided." });
  }

  const attempts = getAttemptCount(req);
  const result   = await grade(answer);

  // Increment attempt counter cookie (non-sensitive, not signed)
  const nextAttempts  = attempts + 1;
  const attemptsCookie = [
    `p17_attempts=${nextAttempts}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Strict",
    ...(process.env.NODE_ENV === "production" ? ["Secure"] : []),
  ].join("; ");

  if (result.pass) {
    // ── Issue signed session cookie ──────────────────────────────────────────
    const payload = JSON.stringify({ solved: true, ts: Date.now() });
    const sig     = sign(payload);

    // Cookie value: base64url(payload).signature
    const cookieVal = Buffer.from(payload).toString("base64url") + "." + sig;

    const sessionCookie = [
      `p17_session=${cookieVal}`,
      "Path=/",
      "HttpOnly",
      "SameSite=Strict",
      ...(process.env.NODE_ENV === "production" ? ["Secure"] : []),
    ].join("; ");

    res.setHeader("Set-Cookie", [sessionCookie, attemptsCookie]);
    return res.status(200).json({ success: true });
  }

  // ── Wrong answer — return progressive hint ───────────────────────────────
  const hintIdx = Math.min(attempts, HINTS.length - 1);
  res.setHeader("Set-Cookie", attemptsCookie);
  return res.status(200).json({
    success: false,
    hint: HINTS[hintIdx],
  });
};