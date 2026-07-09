import crypto from "crypto";

function parseCookies(cookieHeader = "") {
  const out = {};

  cookieHeader.split(";").forEach((part) => {
    const index = part.indexOf("=");
    if (index === -1) return;

    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    out[key] = decodeURIComponent(value);
  });

  return out;
}

function signToken(payload, secret) {
  return crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
}

function safeEqual(a, b) {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);

  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

export default async function handler(req, res) {
  try {
    const secret = process.env.LEVEL4_COOKIE_SECRET || "";
    const flag = process.env.LEVEL4_FLAG || "";

    if (!secret) {
      return res.status(500).json({ error: "Missing LEVEL4_COOKIE_SECRET" });
    }

    if (!flag) {
      return res.status(500).json({ error: "Missing LEVEL4_FLAG" });
    }

    const cookies = parseCookies(req.headers.cookie || "");
    const token = cookies.level4_auth;

    if (!token) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const lastDot = token.lastIndexOf(".");
    if (lastDot === -1) {
      return res.status(403).json({ error: "Invalid token" });
    }

    const payload = token.slice(0, lastDot);
    const signature = token.slice(lastDot + 1);

    if (payload !== "level4:granted") {
      return res.status(403).json({ error: "Invalid payload" });
    }

    const expectedSignature = signToken(payload, secret);

    if (!safeEqual(signature, expectedSignature)) {
      return res.status(403).json({ error: "Invalid signature" });
    }

    return res.status(200).json({ flag });
  } catch (err) {
    console.error("get-level4-flag error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
