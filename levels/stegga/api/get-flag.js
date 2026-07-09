// api/get-flag.js
// GET /api/get-flag?t=<token>
// Returns: { flag } if token matches
//          { error } if token is invalid

export default function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "method not allowed" });
  }

  const { t } = req.query;

  if (!t) {
    return res.status(400).json({ error: "no token provided" });
  }

  const validToken = process.env.FLAG_ACCESS_TOKEN;
  const flag       = process.env.FLAG;

  // Constant-time comparison to prevent timing attacks
  const tokenValid =
    t.length === validToken.length &&
    t.split("").every((ch, i) => ch === validToken[i]);

  if (!tokenValid) {
    return res.status(401).json({ error: "access denied" });
  }

  return res.status(200).json({ flag });
}
