// api/flag.js — Vercel Serverless Function
// Serves all 16 fragment flags from env vars.
// No auth required — flags are only shown on the success screen
// after the client has already authenticated via /api/auth.

export default function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const flags = [
    process.env.FLAG_01,
    process.env.FLAG_02,
    process.env.FLAG_03,
    process.env.FLAG_04,
    process.env.FLAG_05,
    process.env.FLAG_06,
    process.env.FLAG_07,
    process.env.FLAG_08,
    process.env.FLAG_09,
    process.env.FLAG_10,
    process.env.FLAG_11,
    process.env.FLAG_12,
    process.env.FLAG_13,
    process.env.FLAG_14,
    process.env.FLAG_15,
    process.env.FLAG_16,
  ];

  const fragments = flags.map((flag, i) => ({
    id: `F-${String(i + 1).padStart(2, "0")}`,
    label: `FRAGMENT ${String(i + 1).padStart(2, "0")}`,
    flag: flag || "",
  }));

  return res.status(200).json({
    fragments,
    masterFlag: process.env.CORRECT_FLAG || "",
    correctCode: process.env.CORRECT_CODE || "",
  });
}