// api/auth.js  — Vercel Serverless Function
// ENV VARS required in Vercel dashboard:
//   CORRECT_CODE            = <6-digit code>
//   CORRECT_FLAG            = FLAG{NULL_CODE_RESTORED}
//   KV_REST_API_URL         (Upstash Redis REST URL)
//   KV_REST_API_TOKEN       (Upstash Redis REST token)

const IP_LOCK_DURATION_MS = 1 * 60 * 60 * 1000; // 1 hour

async function kvGet(key) {
  const res = await fetch(
    `${process.env.KV_REST_API_URL}/get/${encodeURIComponent(key)}`,
    { headers: { Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}` } }
  );
  if (!res.ok) return null;
  const json = await res.json();
  return json.result ?? null;
}

async function kvSet(key, value, exSeconds) {
  const url = `${process.env.KV_REST_API_URL}/set/${encodeURIComponent(key)}/${encodeURIComponent(value)}`;
  const fullUrl = exSeconds ? `${url}?ex=${exSeconds}` : url;
  await fetch(fullUrl, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}` },
  });
}

function getClientIp(req) {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.headers["x-real-ip"] ||
    req.socket?.remoteAddress ||
    "unknown"
  );
}

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const ip = getClientIp(req);
  const lockKey = `iplock:${ip}`;

  // ── Check existing IP lock ──
  try {
    const lockedUntil = await kvGet(lockKey);
    if (lockedUntil) {
      const remaining = parseInt(lockedUntil, 10) - Date.now();
      if (remaining > 0) {
        const mins = Math.ceil(remaining / 60000);
        return res.status(403).json({
          success: false,
          locked: true,
          remainingMs: remaining,
          message: `ACCESS DENIED — IP locked. Try again in ${mins} minute${mins !== 1 ? "s" : ""}.`,
        });
      }
    }
  } catch (e) {
    // KV unavailable — fail open so legitimate players aren't blocked
    console.error("KV read error:", e);
  }

  // ── Parse body ──
  let body;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ success: false, error: "Invalid JSON" });
  }

  const { code, flag } = body || {};

  const CORRECT_CODE = (process.env.CORRECT_CODE || "").trim();
  const CORRECT_FLAG = (process.env.CORRECT_FLAG || "").trim().toUpperCase();

  const submittedCode = String(code || "").trim();
  const submittedFlag = String(flag || "").trim().toUpperCase();

  const codeOk = submittedCode === CORRECT_CODE;
  const flagOk = submittedFlag === CORRECT_FLAG;

  if (codeOk && flagOk) {
    // ── Correct — clear any stale lock ──
    try { await kvSet(lockKey, "0", 1); } catch (_) {}
    return res.status(200).json({ success: true, message: "AUTHENTICATION SUCCESSFUL" });
  }

  // ── Wrong — apply IP lock for 1 hour ──
  const unlockAt = Date.now() + IP_LOCK_DURATION_MS;
  try {
    await kvSet(lockKey, String(unlockAt), Math.ceil(IP_LOCK_DURATION_MS / 1000));
  } catch (e) {
    console.error("KV write error:", e);
  }

  return res.status(401).json({
    success: false,
    locked: true,
    remainingMs: IP_LOCK_DURATION_MS,
    codeCorrect: codeOk,
    flagCorrect: flagOk,
    message: "ACCESS DENIED — IP locked for 1 hour.",
  });
}