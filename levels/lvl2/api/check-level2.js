import crypto from "crypto";

function sha256(value) {
  return crypto.createHash("sha256").update(value, "utf8").digest("hex");
}

function signToken(payload, secret) {
  return crypto
    .createHmac("sha256", secret)
    .update(payload, "utf8")
    .digest("hex");
}

function makeCookie(name, value, maxAgeSeconds = 900) {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAgeSeconds}`,
  ];
  if (process.env.NODE_ENV === "production") parts.push("Secure");
  return parts.join("; ");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const expectedHash = (process.env.LEVEL2_ANSWER_HASH || "").trim().toLowerCase();
    const link         = (process.env.LEVEL2_LINK         || "").trim();
    const secret       =  process.env.LEVEL2_COOKIE_SECRET || "";
    // Normalise to lowercase before hashing (mirror how the hash was generated)
    const userAnswer   = (req.body?.answer || "").trim().toLowerCase();

    if (!expectedHash) return res.status(500).json({ error: "Missing LEVEL2_ANSWER_HASH" });
    if (!link)         return res.status(500).json({ error: "Missing LEVEL2_LINK" });
    if (!secret)       return res.status(500).json({ error: "Missing LEVEL2_COOKIE_SECRET" });

    // Hash the normalised submission
    const userHash = sha256(userAnswer);

    // timingSafeEqual — both SHA-256 hex strings are always 64 chars, same length
    const userBuf     = Buffer.from(userHash,     "hex");
    const expectedBuf = Buffer.from(expectedHash, "hex");

    const correct =
      userBuf.length === expectedBuf.length &&
      crypto.timingSafeEqual(userBuf, expectedBuf);

    if (!correct) {
      return res.status(200).json({ correct: false });
    }

    // Build signed cookie: level2:granted.<hmac-sha256>
    const payload     = "level2:granted";
    const signature   = signToken(payload, secret);
    const cookieValue = `${payload}.${signature}`;

    res.setHeader("Set-Cookie", makeCookie("level2_auth", cookieValue, 900));

    return res.status(200).json({ correct: true, link });
  } catch (err) {
    console.error("check-level2 error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
