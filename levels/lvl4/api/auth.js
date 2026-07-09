// api/auth.js — Vercel Serverless Function
// Validates the decryption init code against the environment variable

export default function handler(req, res) {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: "No code provided" });
  }

  const expected = process.env.DECRYPT_CODE;

  if (!expected) {
    // Env var not configured — fail safely
    console.error("DECRYPT_CODE environment variable is not set");
    return res.status(500).json({ error: "Server misconfiguration" });
  }

  // Constant-time string comparison to resist timing attacks
  const codeStr = String(code).trim();
  const expectedStr = String(expected).trim();

  const match =
    codeStr.length === expectedStr.length &&
    codeStr.split("").every((ch, i) => ch === expectedStr[i]);

  if (match) {
    return res.status(200).json({ success: true, message: "Code accepted. Recovery sequence initiated." });
  } else {
    return res.status(401).json({ success: false, message: "Invalid decryption code." });
  }
}
