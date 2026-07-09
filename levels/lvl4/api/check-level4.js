import crypto from "crypto";

function sha256(value) {
  return crypto.createHash("sha256").update(value, "utf8").digest("hex");
}

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
    const expectedHash = (process.env.LEVEL4_N_SHA256 || "").trim().toLowerCase();
    const secret = process.env.LEVEL4_COOKIE_SECRET || "";
    const submitted = (req.body?.product || "").trim();

    if (!expectedHash) {
      return res.status(500).json({ error: "Missing LEVEL4_N_SHA256" });
    }

    if (!secret) {
      return res.status(500).json({ error: "Missing LEVEL4_COOKIE_SECRET" });
    }

    if (!submitted) {
      return res.status(400).json({ error: "Missing product" });
    }

    const submittedHash = sha256(submitted).toLowerCase();
    const correct = submittedHash === expectedHash;

    if (!correct) {
      return res.status(200).json({ correct: false });
    }

    const payload = "level4:granted";
    const signature = signToken(payload, secret);
    const cookieValue = `${payload}.${signature}`;

    res.setHeader("Set-Cookie", makeCookie("level4_auth", cookieValue, 900));
    return res.status(200).json({ correct: true });
  } catch (err) {
    console.error("check-level4 error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
