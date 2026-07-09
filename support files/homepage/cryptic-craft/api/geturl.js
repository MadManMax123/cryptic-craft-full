// api/geturl.js — Vercel Serverless Function
// Reads PORTAL_URL from environment variables and returns it.
// If empty or unset, returns { url: "" } so the frontend shows the waiting state.

export default function handler(req, res) {
  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const url = process.env.PORTAL_URL || '';

  // Return the URL (may be empty string if not configured yet)
  return res.status(200).json({ url: url.trim() });
}