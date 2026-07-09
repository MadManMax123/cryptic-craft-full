/**
 * /api/getEnv.js — Vercel serverless function
 * Returns limited env vars to authenticated frontend (session + HMAC required)
 * Never exposes secrets or full env
 */

const crypto = require("crypto");
const { enforceBrowserRequest } = require("./_browserGuard");

function hmacSign(data, secret) {
  return crypto
    .createHmac("sha256", secret)
    .update(typeof data === "string" ? data : JSON.stringify(data))
    .digest("hex");
}

function parseSession(cookie, secret) {
  try {
    const payload = JSON.parse(Buffer.from(cookie, "base64url").toString());
    const { sig, ...data } = payload;
    const expected = hmacSign(data, secret);
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    if (Date.now() - data.iat > 86400 * 1000) return null;
    return data;
  } catch { return null; }
}

function getSessionCookie(req) {
  const raw = req.headers.cookie || "";
  const match = raw.match(/null_session=([^;]+)/);
  return match ? match[1] : null;
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (enforceBrowserRequest(req, res)) return;

  const cookie = getSessionCookie(req);
  if (!cookie) return res.status(401).json({ error: "Not authenticated" });

  const session = parseSession(cookie, process.env.HMAC_SECRET);
  if (!session) return res.status(401).json({ error: "Invalid session" });

  // Only expose what frontend legitimately needs for the terminal UI
  // NEVER expose HMAC_SECRET, GOOGLE_SERVICE_ACCOUNT_JSON, GOOGLE_SHEET_ID
  return res.status(200).json({
    TRUE_SHA1_AUTH: process.env.TRUE_SHA1_AUTH,
    // TRUE_H2 and other secrets remain server-only
  });
};
