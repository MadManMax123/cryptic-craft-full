import { createHmac } from "crypto";

/*
  ENV VARS — set these in Vercel dashboard:

  NODE6_X            correct X coordinate  (e.g. "128")
  NODE6_Y            correct Y coordinate  (e.g. "64")
  NODE6_Z            correct Z coordinate  (e.g. "-512")
  NODE6_HMAC_SECRET  long random secret string
  NODE6_NEXT_URL     path to reveal on success (e.g. "/node07")
*/

const COOKIE_NAME    = "n6_pass";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

/* ── constant-time string compare ─────────────────────────────────── */
function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  // always run HMAC so branch timing is uniform regardless of length mismatch
  const ha = createHmac("sha256", "cmp").update(a).digest();
  const hb = createHmac("sha256", "cmp").update(b).digest();
  let diff = 0;
  for (let i = 0; i < ha.length; i++) diff |= ha[i] ^ hb[i];
  return diff === 0;
}

/* ── HMAC signature over "n6:<x>:<y>:<z>" ─────────────────────────── */
function sign(x, y, z, secret) {
  return createHmac("sha256", secret)
    .update(`n6:${x}:${y}:${z}`)
    .digest("hex");
}

/* ── build Set-Cookie header ───────────────────────────────────────── */
function buildCookie(x, y, z, secret) {
  const payload = Buffer.from(`${x}:${y}:${z}:${sign(x, y, z, secret)}`).toString("base64");
  return [
    `${COOKIE_NAME}=${payload}`,
    `Max-Age=${COOKIE_MAX_AGE}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Strict",
    // "Secure",   ← uncomment for production (requires HTTPS)
  ].join("; ");
}

/* ── verify existing HMAC cookie ──────────────────────────────────── */
function verifyCookie(cookieHeader, cx, cy, cz, secret) {
  if (!cookieHeader) return false;
  const match = cookieHeader.split(";")
    .map(s => s.trim())
    .find(s => s.startsWith(`${COOKIE_NAME}=`));
  if (!match) return false;

  try {
    const raw    = Buffer.from(match.slice(COOKIE_NAME.length + 1), "base64").toString();
    const parts  = raw.split(":");
    // format: x:y:z:sig  — z may be negative so use fixed last segment
    if (parts.length < 4) return false;
    const sig    = parts[parts.length - 1];
    const z      = parts[parts.length - 2];
    const y      = parts[parts.length - 3];
    const x      = parts.slice(0, parts.length - 3).join(":"); // handles edge cases

    if (!safeEqual(x, cx) || !safeEqual(y, cy) || !safeEqual(z, cz)) return false;
    return safeEqual(sig, sign(cx, cy, cz, secret));
  } catch {
    return false;
  }
}

/* ── jitter to mask timing ─────────────────────────────────────────── */
const jitter = () => new Promise(r => setTimeout(r, 100 + Math.random() * 80));

/* ══ HANDLER ══════════════════════════════════════════════════════════ */
export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "method not allowed" });
  }

  const CX     = process.env.NODE6_X;
  const CY     = process.env.NODE6_Y;
  const CZ     = process.env.NODE6_Z;
  const SECRET = process.env.NODE6_HMAC_SECRET;

  if (!CX || !CY || !CZ || !SECRET) {
    console.error("[node06] missing env vars");
    return res.status(500).json({ success: false, message: "relay misconfigured" });
  }

  // ── 1. valid session cookie already? skip re-validation ──────────
  if (verifyCookie(req.headers.cookie || "", CX, CY, CZ, SECRET)) {
    return res.status(200).json({ success: true, message: "session active" });
  }

  // ── 2. parse body ─────────────────────────────────────────────────
  let body;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ success: false, message: "malformed payload" });
  }

  const { x, y, z } = body ?? {};
  if (x === undefined || y === undefined || z === undefined) {
    return res.status(400).json({ success: false, message: "missing coordinates" });
  }

  const sx = String(x).trim();
  const sy = String(y).trim();
  const sz = String(z).trim();

  // ── 3. compare — always run all three, always jitter ─────────────
  const ok = safeEqual(sx, CX) && safeEqual(sy, CY) && safeEqual(sz, CZ);
  await jitter();

  if (!ok) {
    return res.status(401).json({
      success: false,
      message: "coordinate mismatch — access denied",
    });
  }

  // ── 4. set HMAC cookie and respond ───────────────────────────────
  res.setHeader("Set-Cookie", buildCookie(CX, CY, CZ, SECRET));
  return res.status(200).json({ success: true, message: "coordinates verified" });
}