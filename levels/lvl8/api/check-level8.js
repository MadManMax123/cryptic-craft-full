import crypto from "crypto";

function signToken(payload, secret) {
  return crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
}

function makeCookie(name, value, maxAgeSeconds = 900) {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAgeSeconds}`
  ];

  if (process.env.NODE_ENV === "production") {
    parts.push("Secure");
  }

  return parts.join("; ");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const expected = (process.env.LEVEL8_ANSWER || "").trim().toUpperCase();
    const secret = process.env.LEVEL8_COOKIE_SECRET || "";
    const submitted = (req.body?.answer || "").trim().toUpperCase();

    if (!expected) {
      return res.status(500).json({ error: "Missing LEVEL8_ANSWER" });
    }

    if (!secret) {
      return res.status(500).json({ error: "Missing LEVEL8_COOKIE_SECRET" });
    }

    if (!submitted) {
      return res.status(400).json({ error: "Missing answer" });
    }

    const correct = submitted === expected;

    if (!correct) {
      return res.status(200).json({ correct: false });
    }

    const payload = "level8:granted";
    const signature = signToken(payload, secret);
    const cookieValue = `${payload}.${signature}`;

    res.setHeader("Set-Cookie", makeCookie("level8_auth", cookieValue, 900));
    return res.status(200).json({ correct: true });
  } catch (err) {
    console.error("check-level8 error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
