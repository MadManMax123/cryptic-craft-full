import crypto from "crypto";
import { parseCookies, verifySession } from "../lib/session.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // ── env vars ────────────────────────────────────────────────────────────────
  const answerHash   = process.env.LEVEL1_ANSWER_HASH;
  const cookieSecret = process.env.LEVEL1_COOKIE_SECRET;

  if (!answerHash || !cookieSecret) {
    return res.status(500).json({ error: "Server misconfiguration" });
  }

  // ── Verify session ──────────────────────────────────────────────────────────
  const cookies = parseCookies(req.headers.cookie ?? "");
  const session = verifySession(cookies["null_session"] ?? "");

  if (!session) {
    return res.status(401).json({ error: "Login required" });
  }

  const teamId = session.team_id;

  // ── Validate answer input ───────────────────────────────────────────────────
  const userAnswer = (req.body?.answer ?? "").trim().toLowerCase();

  if (!userAnswer) {
    return res.status(400).json({ error: "Answer is required" });
  }

  // ── SHA-256 the submission and compare ──────────────────────────────────────
  const submittedHash = crypto
    .createHash("sha256")
    .update(userAnswer, "utf8")
    .digest("hex");

  const submittedBuf = Buffer.from(submittedHash, "hex");
  const expectedBuf  = Buffer.from(answerHash,    "hex");

  let correct = false;
  if (submittedBuf.length === expectedBuf.length) {
    correct = crypto.timingSafeEqual(submittedBuf, expectedBuf);
  }

  if (!correct) {
    return res.status(200).json({ correct: false });
  }

  // ── Build signed cookie: payload = "<teamId>:level1:granted" ───────────────
  const payload   = `${teamId}:level1:granted`;
  const signature = crypto
    .createHmac("sha256", cookieSecret)
    .update(payload, "utf8")
    .digest("hex");

  const cookieValue = `${payload}.${signature}`;

  // ── Set HttpOnly, SameSite=Lax, 15-min cookie ──────────────────────────────
  const maxAge = 15 * 60; // 900 seconds
  res.setHeader(
    "Set-Cookie",
    [
      `level1_access=${cookieValue}`,
      "HttpOnly",
      "SameSite=Lax",
      `Max-Age=${maxAge}`,
      "Path=/",
    ].join("; ")
  );

  return res.status(200).json({ correct: true });
}
