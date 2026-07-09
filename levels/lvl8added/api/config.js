// GET /api/config
// Returns the embed URL stored in the environment, so it's never hardcoded
// into the static HTML/JS that ships to the browser.

module.exports = (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'method not allowed' });
    return;
  }

  res.status(200).json({
    embedUrl: process.env.EMBED_URL || ''
  });
};