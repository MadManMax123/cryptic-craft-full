/**
 * /api/frequency.js — Vercel serverless function
 * Optional server-side frequency validation endpoint
 * Frontend generates packets; this confirms legitimacy and returns server-side
 * harmonic mean check result. Actual packet content is generated client-side.
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

function harmonicMean(a, b) {
  return (2 * a * b) / (a + b);
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (enforceBrowserRequest(req, res)) return;

  const cookie = getSessionCookie(req);
  if (!cookie) return res.status(401).json({ error: "Not authenticated" });

  const session = parseSession(cookie, process.env.HMAC_SECRET);
  if (!session) return res.status(401).json({ error: "Invalid session" });

  const { frequency } = req.body || {};
  const freq = parseFloat(frequency);

  if (!frequency || isNaN(freq) || freq < 100 || freq > 1100) {
    return res.status(400).json({ error: "Invalid frequency" });
  }

  const TRUE_FREQ = parseFloat(process.env.TRUE_FREQ || "868.5");
  const hm = harmonicMean(freq, TRUE_FREQ);
  const authMatchesByHarmonic =
    Math.abs(hm % 3) < 0.001 || Math.abs((hm % 3) - 3) < 0.001;

  // Only reveal whether it's correct freq if the player truly hit it
  const isCorrectFreq = Math.abs(freq - TRUE_FREQ) < 0.001;

  return res.status(200).json({
    frequency:               freq,
    harmonic_mean:           parseFloat(hm.toFixed(6)),
    auth_matches_harmonic:   authMatchesByHarmonic,
    // Do not reveal isCorrectFreq directly — let player figure it out
    packet_count:            3,
  });
};
