// api/fetch.js
// GET /api/fetch
// Reads the ctf_auth cookie set by /api/check, verifies its HMAC signature,
// checks expiry, and returns the FLAG env var if everything checks out.

const crypto = require("crypto");

/* ──────────────────────────────────────────────────────────────────────
   Cookie parser: raw Cookie header → { name: value, ... }
────────────────────────────────────────────────────────────────────── */
function parseCookies(header) {
  const map = {};
  if (!header) return map;
  header.split(";").forEach(pair => {
    const eq = pair.indexOf("=");
    if (eq === -1) return;
    const key = pair.slice(0, eq).trim();
    const val = pair.slice(eq + 1).trim();
    if (key) map[key] = val;
  });
  return map;
}

/* ──────────────────────────────────────────────────────────────────────
   Cookie verifier
   Expects: base64url(payload).base64url(HMAC-SHA256(payload, secret))
   Returns: parsed payload object on success, null on failure.
────────────────────────────────────────────────────────────────────── */
function verifySignedCookie(raw, secret) {
  if (!raw || typeof raw !== "string") return null;

  const dot = raw.lastIndexOf(".");
  if (dot === -1) return null;

  const payload = raw.slice(0, dot);
  const sig     = raw.slice(dot + 1);

  // Re-compute expected signature
  const expectedSig = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("base64url");

  // Timing-safe comparison
  let valid = false;
  try {
    const sigBuf = Buffer.from(sig,         "base64url");
    const expBuf = Buffer.from(expectedSig, "base64url");
    valid = (
      sigBuf.length === expBuf.length &&
      crypto.timingSafeEqual(sigBuf, expBuf)
    );
  } catch (_) {
    return null;
  }

  if (!valid) return null;

  // Decode payload
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch (_) {
    return null;
  }
}

/* ──────────────────────────────────────────────────────────────────────
   Handler
────────────────────────────────────────────────────────────────────── */
module.exports = async function handler(req, res) {
  // Only allow GET
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const secret = process.env.COOKIE_SECRET;
  const flag   = process.env.FLAG;

  if (!secret || !flag) {
    console.error("[fetch] Missing required env variable(s): COOKIE_SECRET, FLAG");
    return res.status(500).json({ error: "Server configuration error" });
  }

  const cookies = parseCookies(req.headers.cookie);
  const rawCookie = cookies["ctf_auth"];

  const payload = verifySignedCookie(rawCookie, secret);

  if (!payload) {
    return res.status(401).json({ error: "Unauthorized — solve the challenge first" });
  }

  // Confirm the cookie encodes the expected claim
  if (payload.v !== "solved") {
    return res.status(401).json({ error: "Unauthorized — invalid session claim" });
  }

  // Enforce 1-hour expiry (belt-and-suspenders alongside Max-Age)
  const AGE_LIMIT_MS = 60 * 60 * 1000;
  if (!payload.t || Date.now() - payload.t > AGE_LIMIT_MS) {
    return res.status(401).json({ error: "Session expired — resubmit your answer" });
  }

  // All checks passed: return the flag
  return res.status(200).json({ flag });
};
