/**
 * /api/submitCity.js — Vercel serverless function
 * Validates city guess, returns flag or increments attempt counter.
 * On a correct answer, fires a one-time webhook to the team's registered URL
 * (stored in the "webhook" sheet tab) and marks lora_done.
 */

const crypto = require("crypto");
const { google } = require("googleapis");
const { enforceBrowserRequest } = require("./_browserGuard");

const TRUE_CITY = process.env.TRUE_CITY || "Prague";
const FLAG = process.env.FLAG || "FLAG{ARTICAL_LORAWAN_PKG_RCVD}";

// ── Session ──────────────────────────────────────────────────────────────────

function hmacSign(data, secret) {
  return crypto
    .createHmac("sha256", secret)
    .update(typeof data === "string" ? data : JSON.stringify(data))
    .digest("hex");
}

function parseSession(cookie, secret) {
  try {
    const payload = JSON.parse(
      Buffer.from(cookie, "base64url").toString()
    );

    const { sig, ...data } = payload;

    const expected = hmacSign(data, secret);

    if (
      !crypto.timingSafeEqual(
        Buffer.from(sig),
        Buffer.from(expected)
      )
    ) {
      return null;
    }

    if (Date.now() - data.iat > 86400 * 1000) {
      return null;
    }

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

// ── Sheets ───────────────────────────────────────────────────────────────────

async function getSheetsClient() {
  const credentials = JSON.parse(
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  );

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: [
      "https://www.googleapis.com/auth/spreadsheets",
    ],
  });

  return google.sheets({
    version: "v4",
    auth,
  });
}

async function getTeamRow(sheets, team_id) {
  const SHEET_ID = process.env.GOOGLE_SHEET_ID;

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "users!A:D",
  });

  const rows = res.data.values || [];

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === team_id) {
      return {
        rowIndex: i + 1,
        team_id: rows[i][0],
        attempts: parseInt(rows[i][2] || "0", 10),
        lockout: rows[i][3] || "",
      };
    }
  }

  return null;
}

async function updateRow(
  sheets,
  rowIndex,
  attempts,
  lockout
) {
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

// ── Webhook Sheet Helpers ────────────────────────────────────────────────────
//
// A = team_id
// B = password_sha256
// C = webhook_url
// D = level1_done
// E = lora_done
//

async function getTeamWebhookRow(sheets, team_id) {
  const SHEET_ID = process.env.GOOGLE_SHEET_ID;

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "webhook!A:E",
  });

  const rows = res.data.values || [];

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === team_id) {
      return {
        rowIndex: i + 1,
        webhook_url: rows[i][2] || "",
        level1_done: rows[i][3] || "",
        lora_done: rows[i][4] || "",
      };
    }
  }

  return null;
}

async function markLoraDone(sheets, rowIndex) {
  const SHEET_ID = process.env.GOOGLE_SHEET_ID;

  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `webhook!E${rowIndex}`,
    valueInputOption: "RAW",
    requestBody: {
      values: [["TRUE"]],
    },
  });
}

/**
 * POST to team webhook.
 */
async function sendWebhook(webhookUrl, message) {
  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: message,
      }),
    });

    if (!res.ok) {
      console.error(
        "Webhook rejected:",
        res.status,
        await res.text()
      );
      return false;
    }

    return true;
  } catch (e) {
    console.error(
      "Webhook send error:",
      e.message
    );
    return false;
  }
}

// ── Handler ──────────────────────────────────────────────────────────────────

module.exports = async function handler(req, res) {
  res.setHeader(
    "Access-Control-Allow-Origin",
    req.headers.origin || "*"
  );

  res.setHeader(
    "Access-Control-Allow-Credentials",
    "true"
  );

  res.setHeader(
    "Access-Control-Allow-Methods",
    "POST, OPTIONS"
  );

  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (enforceBrowserRequest(req, res)) {
    return;
  }

  // ── Auth ────────────────────────────────────────────────────────────────

  const cookie = getSessionCookie(req);

  if (!cookie) {
    return res.status(401).json({
      error: "Not authenticated",
    });
  }

  const session = parseSession(
    cookie,
    process.env.HMAC_SECRET
  );

  if (!session) {
    return res.status(401).json({
      error: "Invalid session",
    });
  }

  const { city } = req.body || {};

  if (!city) {
    return res.status(400).json({
      error: "Missing city",
    });
  }

  // ── Sheets ──────────────────────────────────────────────────────────────

  let sheets;
  let team;

  try {
    sheets = await getSheetsClient();

    team = await getTeamRow(
      sheets,
      session.team_id
    );
  } catch (e) {
    console.error(
      "Sheets error:",
      e.message
    );

    return res.status(500).json({
      error: "Database error",
    });
  }

  if (!team) {
    return res.status(404).json({
      error: "Team not found",
    });
  }

  // ── Lockout ─────────────────────────────────────────────────────────────

  if (team.lockout) {
    const lockoutTs = parseInt(
      team.lockout,
      10
    );

    if (
      !isNaN(lockoutTs) &&
      Date.now() < lockoutTs
    ) {
      return res.status(423).json({
        error: "Account locked",
        locked: true,
      });
    }

    team.lockout = "";
    team.attempts = 0;
  }

  // ── Check Answer ────────────────────────────────────────────────────────

  const isCorrect =
    city.trim().toLowerCase() ===
    TRUE_CITY.toLowerCase();

  if (isCorrect) {
    await updateRow(
      sheets,
      team.rowIndex,
      0,
      ""
    );

    try {
      const webhookRow =
        await getTeamWebhookRow(
          sheets,
          session.team_id
        );

      const alreadyDone =
        String(
          webhookRow?.lora_done || ""
        )
          .trim()
          .toUpperCase() === "TRUE";

      if (
        webhookRow &&
        webhookRow.webhook_url &&
        !alreadyDone
      ) {
        const sent = await sendWebhook(
          webhookRow.webhook_url,
          "`nodecompiler.vercel.app` You're gonna need those warden coords now..."
        );

        if (sent) {
          await markLoraDone(
            sheets,
            webhookRow.rowIndex
          );

          console.log(
            "Marked lora_done for",
            session.team_id
          );
        }
      }
    } catch (e) {
      console.error(
        "Webhook dispatch error:",
        e.message
      );
    }

    return res.status(200).json({
      correct: true,
      flag: FLAG,
    });
  }

  // ── Wrong Answer ────────────────────────────────────────────────────────

  const newAttempts =
    team.attempts + 1;

  let lockout = "";

  if (newAttempts >= 3) {
    lockout = String(
      Date.now() +
        6 * 60 * 60 * 1000
    );

    await updateRow(
      sheets,
      team.rowIndex,
      0,
      lockout
    );

    return res.status(200).json({
      correct: false,
      locked: true,
      error:
        "Too many wrong answers. Locked for 6 hours.",
    });
  }

  await updateRow(
    sheets,
    team.rowIndex,
    newAttempts,
    ""
  );

  return res.status(200).json({
    correct: false,
    remaining_attempts:
      3 - newAttempts,
    error: `Wrong city. ${
      3 - newAttempts
    } attempt(s) remaining.`,
  });
};