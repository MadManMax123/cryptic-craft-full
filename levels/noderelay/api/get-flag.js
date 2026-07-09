/**
 * /api/get-flag.js — NULL Challenge // Protocol 17
 *
 * Reads the p17_session cookie, verifies the HMAC signature,
 * and returns the flag if the session is authentic.
 *
 * Security model:
 *   Cookie value format: base64url(payload) + "." + hmac_signature
 *   The payload is never trusted until the signature is verified.
 *   We use constant-time comparison in verify() to prevent timing attacks.
 */

const { verify } = require("../lib/hmac");

// ── Cookie parser ─────────────────────────────────────────────────────────────
function parseCookies(cookieHeader) {
  if (!cookieHeader) return {};
  return Object.fromEntries(
    cookieHeader.split(";").map(c => {
      const [k, ...v] = c.trim().split("=");
      return [k, decodeURIComponent(v.join("="))];
    })
  );
}

// ── Handler ───────────────────────────────────────────────────────────────────
module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const cookies = parseCookies(req.headers["cookie"]);
  const raw     = cookies["p17_session"];

  // ── 1. Cookie must exist ──────────────────────────────────────────────────
  if (!raw) {
    return res.status(403).json({ error: "Access Denied. No session found." });
  }

  // ── 2. Split cookie into payload + signature ──────────────────────────────
  const dotIdx = raw.indexOf(".");
  if (dotIdx === -1) {
    return res.status(403).json({ error: "Access Denied. Malformed session." });
  }

  const b64Payload = raw.slice(0, dotIdx);
  const signature  = raw.slice(dotIdx + 1);

  // ── 3. Decode payload ─────────────────────────────────────────────────────
  let payload;
  try {
    payload = JSON.parse(Buffer.from(b64Payload, "base64url").toString("utf8"));
  } catch {
    return res.status(403).json({ error: "Access Denied. Corrupt payload." });
  }

  // ── 4. Verify HMAC — always verify the ORIGINAL encoded string, not the
  //       decoded object, to prevent JSON normalisation attacks ──────────────
  const rawPayload = Buffer.from(b64Payload, "base64url").toString("utf8");
  const valid = verify(rawPayload, signature);

  if (!valid) {
    return res.status(403).json({ error: "Access Denied. Signature invalid." });
  }

  // ── 5. Sanity-check the payload content ──────────────────────────────────
  if (!payload.solved || typeof payload.ts !== "number") {
    return res.status(403).json({ error: "Access Denied. Session incomplete." });
  }

  // Reject sessions older than 1 hour
  const SESSION_TTL_MS = 60 * 60 * 1000;
  if (Date.now() - payload.ts > SESSION_TTL_MS) {
    return res.status(403).json({ error: "Access Denied. Session expired." });
  }

  // ── 6. Issue flag ─────────────────────────────────────────────────────────
  const flag = process.env.FLAG;

    console.log("\n╔════════════════════════════════════════════════════════╗");
  console.log("║ S = k × ln(Ω) + \"channel\"                              ║");
  console.log("║ Craft your own URL                                     ║");
  console.log("╚════════════════════════════════════════════════════════╝\n");

  if (!flag) {
    return res.status(500).json({ error: "FLAG environment variable not set." });
  }

  // ── Log flag exposure to console ──────────────────────────────────────────
  console.log("\n╔════════════════════════════════════════════════════════╗");
  console.log("║ S = k × ln(Ω) + \"channel\"                              ║");
  console.log("║ Craft your own URL                                     ║");
  console.log("╚════════════════════════════════════════════════════════╝\n");

  // ── Delete session cookie ────────────────────────────────────────────────
  res.setHeader("Set-Cookie", "p17_session=; Max-Age=0; Path=/; HttpOnly; SameSite=Strict");

  return res.status(200).json({ flag });
};