/**
 * /api/session.js — Vercel serverless function
 * Verifies HMAC-signed session cookie, returns team info
 */

const crypto = require("crypto");
const { google } = require("googleapis");
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
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
      return null;
    }
    // Check not older than 24h
    if (Date.now() - data.iat > 86400 * 1000) return null;
    return data;
  } catch {
    return null;
  }
}

function getSessionCookie(req) {
  const raw = req.headers.cookie || "";
  const match = raw.match(/null_session=([^;]+)/);
  return match ? match[1] : null;
}

async function getSheetsClient() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth });
}

async function getTeamAttempts(sheets, team_id) {
  const SHEET_ID = process.env.GOOGLE_SHEET_ID;
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "users!A:D",
  });
  const rows = res.data.values || [];
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === team_id) {
      return parseInt(rows[i][2] || "0", 10);
    }
  }
  return 0;
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (enforceBrowserRequest(req, res)) return;

  const cookie = getSessionCookie(req);
  if (!cookie) return res.status(401).json({ error: "No session" });

  const session = parseSession(cookie, process.env.HMAC_SECRET);
  if (!session) return res.status(401).json({ error: "Invalid session" });

  let attempts = 0;
  try {
    const sheets = await getSheetsClient();
    attempts = await getTeamAttempts(sheets, session.team_id);
  } catch {
    // non-fatal — just skip attempts count
  }

  return res.status(200).json({
    team_id: session.team_id,
    attempts,
    iat: session.iat,
  });
};
