/**
 * lib/sheets.js
 *
 * Google Sheets utilities for the NULL Challenge.
 * Uses the Google Sheets REST API directly with a service account JWT,
 * avoiding any heavy SDK dependencies.
 *
 * Sheet structure (sheet name: "webhook"):
 *   A: team_id
 *   B: password_sha256
 *   C: webhook_url
 *   D: level1_done
 */

const SHEET_ID   = "1t6jSKGBzq9ek_sxpn82WUSrAOiKRUnm4CLiV-HWA_kk";
const SHEET_NAME = "webhook";

// ── JWT / OAuth helpers ──────────────────────────────────────────────────────

async function getAccessToken() {
  const credsRaw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!credsRaw) throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is not set");

  const creds = JSON.parse(credsRaw);
  creds.private_key = creds.private_key.replace(/\\n/g, "\n");

  const now  = Math.floor(Date.now() / 1000);
  const exp  = now + 3600;

  const header  = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss:   creds.client_email,
    scope: "https://www.googleapis.com/auth/spreadsheets",
    aud:   "https://oauth2.googleapis.com/token",
    iat:   now,
    exp,
  };

  const encode = (obj) =>
    Buffer.from(JSON.stringify(obj)).toString("base64url");

  const sigInput = `${encode(header)}.${encode(payload)}`;

  const privateKey = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(creds.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    privateKey,
    new TextEncoder().encode(sigInput)
  );

  const jwt = `${sigInput}.${Buffer.from(signature).toString("base64url")}`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion:  jwt,
    }),
  });

  if (!tokenRes.ok) {
    const errText = await tokenRes.text();
    throw new Error(`Failed to get Google access token: ${errText}`);
  }

  const tokenData = await tokenRes.json();
  return tokenData.access_token;
}

function pemToArrayBuffer(pem) {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");
  const binary = atob(b64);
  const buffer = new ArrayBuffer(binary.length);
  const view   = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i++) view[i] = binary.charCodeAt(i);
  return buffer;
}

// ── Sheets helpers ───────────────────────────────────────────────────────────

const SHEETS_BASE = "https://sheets.googleapis.com/v4/spreadsheets";

async function readAllRows(token) {
  const range = `${encodeURIComponent(SHEET_NAME)}!A2:D`;
  const url   = `${SHEETS_BASE}/${SHEET_ID}/values/${range}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Sheets read error: ${errText}`);
  }

  const data = await res.json();
  const rows = data.values ?? [];

  return rows.map((row) => ({
    team_id:         row[0] ?? "",
    password_sha256: row[1] ?? "",
    webhook_url:     row[2] ?? "",
    level1_done:     (row[3] ?? "FALSE").toUpperCase() === "TRUE",
    _rowIndex:       rows.indexOf(row) + 2,
  }));
}

// ── Public API ───────────────────────────────────────────────────────────────

export async function getTeam(teamId) {
  const token      = await getAccessToken();
  const rows       = await readAllRows(token);
  const normalised = teamId.trim().toLowerCase(); // ← normalise input
  return rows.find((r) => r.team_id.trim().toLowerCase() === normalised) ?? null; // ← normalise sheet value too
}

export async function getAllTeams() {
  const token = await getAccessToken();
  const rows  = await readAllRows(token);
  return rows.map(({ _rowIndex, ...rest }) => rest);
}

export async function markLevel1Done(teamId) {
  const token      = await getAccessToken();
  const rows       = await readAllRows(token);
  const normalised = teamId.trim().toLowerCase(); // ← normalise here too
  const team       = rows.find((r) => r.team_id.trim().toLowerCase() === normalised);
  if (!team) throw new Error(`Team not found: ${teamId}`);

  const cellRange = `${encodeURIComponent(SHEET_NAME)}!D${team._rowIndex}`;
  const url = `${SHEETS_BASE}/${SHEET_ID}/values/${cellRange}?valueInputOption=RAW`;

  const res = await fetch(url, {
    method:  "PUT",
    headers: {
      Authorization:  `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      range:          cellRange,
      majorDimension: "ROWS",
      values:         [["TRUE"]],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Sheets write error: ${errText}`);
  }
}