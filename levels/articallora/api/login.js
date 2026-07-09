/**
 * /api/login.js — Vercel serverless function
 * Handles team authentication with Google Sheets + HMAC session
 */

const crypto = require("crypto");
const { google } = require("googleapis");
const { enforceBrowserRequest } = require("./_browserGuard");

// ── Helpers ──────────────────────────────────────────────────────────────────
function sha256(str) {
  return crypto.createHash("sha256").update(str).digest("hex");
}

function hmacSign(data, secret) {
  return crypto
    .createHmac("sha256", secret)
    .update(typeof data === "string" ? data : JSON.stringify(data))
    .digest("hex");
}

function buildSession(team_id, secret) {
  const payload = {
    team_id,
    iat: Date.now(),
    jti: crypto.randomBytes(16).toString("hex"),
  };
  const sig = hmacSign(payload, secret);
  return Buffer.from(JSON.stringify({ ...payload, sig })).toString("base64url");
}

// ── Google Sheets client ─────────────────────────────────────────────────────
async function getSheetsClient() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth });
}

async function getTeamRow(sheets, team_id) {
  const SHEET_ID = process.env.GOOGLE_SHEET_ID;
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "users!A:D", // team_id | password_sha256 | attempts | lockout
  });

  const rows = res.data.values || [];
  // Skip header (row 0)
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === team_id) {
      return {
        rowIndex: i + 1, // 1-indexed for Sheets
        team_id:  rows[i][0],
        hash:     rows[i][1] || "",
        attempts: parseInt(rows[i][2] || "0", 10),
        lockout:  rows[i][3] || "",
      };
    }
  }
  return null;
}

async function updateTeamRow(sheets, rowIndex, attempts, lockout) {
  const SHEET_ID = process.env.GOOGLE_SHEET_ID;
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `users!C${rowIndex}:D${rowIndex}`,
    valueInputOption: "RAW",
    requestBody: {
      values: [[String(attempts), lockout]],
    },
  });
}

// ── Handler ──────────────────────────────────────────────────────────────────
module.exports = async function handler(req, res) {
  // CORS pre-flight
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (enforceBrowserRequest(req, res)) return;

  const { team_id, password } = req.body || {};
  if (!team_id || !password) {
    return res.status(400).json({ error: "Missing credentials" });
  }

  let sheets;
  try {
    sheets = await getSheetsClient();
  } catch (e) {
    console.error("Sheets init error:", e.message);
    return res.status(500).json({ error: "Backend configuration error" });
  }

  // Look up team
  let team;
  try {
    team = await getTeamRow(sheets, team_id);
  } catch (e) {
    console.error("Sheets read error:", e.message);
    return res.status(500).json({ error: "Database error" });
  }

  if (!team) {
    // Timing-safe: still do hash work
    sha256(password + "decoy");
    return res.status(401).json({ error: "Invalid credentials" });
  }

  // Check lockout
  if (team.lockout) {
    const lockoutTs = parseInt(team.lockout, 10);
    if (!isNaN(lockoutTs) && Date.now() < lockoutTs) {
      const remaining = Math.ceil((lockoutTs - Date.now()) / 60000);
      return res.status(423).json({
        error: `Account locked. Try again in ${remaining} minute(s).`,
        locked: true,
      });
    }
    // Lockout expired — clear it
    team.lockout = "";
    team.attempts = 0;
  }

  // Verify password
  const inputHash = sha256(password);
  const hashMatch = crypto.timingSafeEqual(
    Buffer.from(inputHash),
    Buffer.from(team.hash.padEnd(64, "0"))
  );

  if (!hashMatch) {
    const newAttempts = team.attempts + 1;
    let lockout = "";

    if (newAttempts >= 3) {
      lockout = String(Date.now() + 6 * 60 * 60 * 1000); // +6h
      await updateTeamRow(sheets, team.rowIndex, 0, lockout);
      return res.status(429).json({
        error: "Too many failed attempts. Locked for 6 hours.",
        locked: true,
      });
    }

    await updateTeamRow(sheets, team.rowIndex, newAttempts, "");
    return res.status(401).json({
      error: "Invalid credentials",
      remaining_attempts: 3 - newAttempts,
    });
  }

  // Success — reset attempts, issue session cookie
  await updateTeamRow(sheets, team.rowIndex, 0, "");

  const secret  = process.env.HMAC_SECRET;
  const session = buildSession(team.team_id, secret);

  res.setHeader(
    "Set-Cookie",
    `null_session=${session}; HttpOnly; SameSite=Strict; Path=/; Max-Age=86400${
      process.env.NODE_ENV === "production" ? "; Secure" : ""
    }`
  );

  return res.status(200).json({ success: true, team_id: team.team_id });
};
