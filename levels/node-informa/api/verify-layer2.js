'use strict';

const {
  checkRate,
  verifyCookie,
  getCookie,
  parseBody
} = require('./utils');

const round2 = (n) => Math.round(n * 100) / 100;

// 🔧 Normalize weird unicode minus/dash characters
const normalizeNumberString = (s) =>
  (s ?? '').toString().trim().replace(/[−–—]/g, '-');

const toNumber = (v) =>
  Number(normalizeNumberString(v));

const parseEnvFloat = (v) => {
  const n = parseFloat(normalizeNumberString(v));
  return Number.isFinite(n) ? n : NaN;
};

module.exports = async (req, res) => {
  console.log('➡️ Incoming request:', {
    method: req.method,
    url: req.url,
    headers: req.headers
  });

  try {
    if (req.method !== 'POST') {
      return res.status(405).end();
    }

    const ip =
      (req.headers['x-forwarded-for'] || '')
        .split(',')[0]
        .trim() || 'anon';

    if (!checkRate(ip)) {
      return res.status(429).json({ error: 'rate limited' });
    }

    const rawCookie = getCookie(req.headers.cookie, 'null_relay');
    const payload = verifyCookie(rawCookie);

    console.log('🔐 Cookie payload:', payload);

    if (!payload || payload.layer !== 1) {
      return res.status(403).json({ error: 'forbidden' });
    }

    let body;
    try {
      body = await parseBody(req);
    } catch (err) {
      console.error('💥 Body parse failed:', err);
      return res.status(400).json({ error: 'bad request' });
    }

    console.log('📦 Parsed body:', body);

    const r1 = toNumber(body.root1);
    const r2 = toNumber(body.root2);

    console.log('🔢 Parsed roots:', { r1, r2 });

    if (!Number.isFinite(r1) || !Number.isFinite(r2)) {
      return res.status(400).json({ error: 'invalid roots' });
    }

    const e1 = parseEnvFloat(process.env.ROOT1);
    const e2 = parseEnvFloat(process.env.ROOT2);

    if (!Number.isFinite(e1) || !Number.isFinite(e2)) {
      return res.status(500).json({ error: 'server misconfigured' });
    }

    console.log('🧪 Env:', { e1, e2 });

    const [a, b, c, d] = [r1, r2, e1, e2].map(round2);

    const ok =
      (a === c && b === d) ||
      (a === d && b === c);

    console.log('📊 Compare:', { a, b, c, d, ok });

    if (!ok) {
      return res.status(401).json({ error: 'incorrect' });
    }

    res.setHeader(
      'Set-Cookie',
      'null_relay=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0'
    );

    return res.status(200).json({
      flag: process.env.FLAG || '',
      notice: "📋🗑️\n✂️🕒\nV1yzlvMU"
    });

  } catch (err) {
    console.error('🔥 Unexpected error:', err);
    return res.status(500).json({ error: 'internal error' });
  }
};