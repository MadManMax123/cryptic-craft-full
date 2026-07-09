'use strict';
const { checkRate, signCookie, parseBody } = require('./utils');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'anon';
  if (!checkRate(ip)) return res.status(429).json({ error: 'rate limited' });

  let body;
  try { body = await parseBody(req); } catch { return res.status(400).json({ error: 'bad request' }); }

  const answer   = (body.answer   || '').trim().toLowerCase();
  const expected = (process.env.LAYER1_ANSWER || '').trim().toLowerCase();

  if (!answer || answer !== expected)
    return res.status(401).json({ error: 'incorrect' });

  const token = signCookie({ layer: 1, ts: Date.now() });
  res.setHeader(
    'Set-Cookie',
    `null_relay=${encodeURIComponent(token)}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=600`
  );
  return res.status(200).json({ ok: true });
};
