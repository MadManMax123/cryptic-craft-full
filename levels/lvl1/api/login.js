import crypto from "crypto";
import { getTeam } from "../lib/sheets.js";
import {
  createSession,
  buildSessionCookieHeader,
} from "../lib/session.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // ── Parse body ──────────────────────────────────────────────────────────────
  const teamId  = (req.body?.team_id  ?? "").trim().toLowerCase(); // ← back to lowercase
  const password = (req.body?.password ?? "").trim();

  if (!teamId || !password) {
    return res.status(400).json({ error: "team_id and password are required" });
  }

  // ── Validate environment ────────────────────────────────────────────────────
  if (!process.env.SESSION_SECRET || !process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    return res.status(500).json({ error: "Server misconfiguration" });
  }

  // ── Fetch team from Google Sheets ───────────────────────────────────────────
  let team;
  try {
    team = await getTeam(teamId);
  } catch (err) {
    console.error("[login] Sheets error:", err.message);
    return res.status(502).json({ error: "Failed to reach database" });
  }

  console.log("[login] team lookup result:", JSON.stringify(team));

  if (!team) {
    crypto.createHash("sha256").update(password, "utf8").digest("hex");
    return res.status(401).json({ error: "Invalid credentials" });
  }

  // ── Hash supplied password and compare ──────────────────────────────────────
  const submittedHash = crypto
    .createHash("sha256")
    .update(password, "utf8")
    .digest("hex");

  const submittedBuf = Buffer.from(submittedHash,        "hex");
  const storedBuf    = Buffer.from(team.password_sha256, "hex");

  console.log("[login] submittedHash:", submittedHash);
  console.log("[login] storedHash:",    team?.password_sha256);
  console.log("[login] lengths:",       submittedBuf.length, storedBuf.length);

  let valid = false;
  if (submittedBuf.length > 0 && submittedBuf.length === storedBuf.length) {
    valid = crypto.timingSafeEqual(submittedBuf, storedBuf);
  }

  if (!valid) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  // ── Issue session cookie ────────────────────────────────────────────────────
  let sessionValue;
  try {
    sessionValue = createSession(team.team_id);
  } catch (err) {
    console.error("[login] Session creation error:", err.message);
    return res.status(500).json({ error: "Server error" });
  }

  res.setHeader("Set-Cookie", buildSessionCookieHeader(sessionValue));
  return res.status(200).json({ ok: true, team_id: team.team_id });
}