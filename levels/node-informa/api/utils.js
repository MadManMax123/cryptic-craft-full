'use strict';
const crypto = require('crypto');

/* ── Rate limiter ─────────────────────────────────────────────────────────── */
const _rates = new Map();
const LIMIT  = 10;
const WINDOW = 60_000; // 1 min

function checkRate(ip) {
  const now = Date.now();
  const r   = _rates.get(ip);
  if (!r || now > r.reset) { _rates.set(ip, { count: 1, reset: now + WINDOW }); return true; }
  if (r.count >= LIMIT) return false;
  r.count++;
  return true;
}

/* ── HMAC helpers ─────────────────────────────────────────────────────────── */
function _mac(data) {
  return crypto
    .createHmac('sha256', process.env.HMAC_SECRET || '')
    .update(data)
    .digest('hex');
}

function signCookie(payload) {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64');
  return data + '.' + _mac(data);
}

function verifyCookie(raw) {
  if (!raw) return null;
  const dot = raw.lastIndexOf('.');
  if (dot < 0) return null;
  const data     = raw.slice(0, dot);
  const sig      = raw.slice(dot + 1);
  const expected = _mac(data);
  try {
    const sigBuf = Buffer.from(sig,      'hex');
    const expBuf = Buffer.from(expected, 'hex');
    if (sigBuf.length !== expBuf.length) return null;
    if (!crypto.timingSafeEqual(sigBuf, expBuf)) return null;
  } catch { return null; }
  try {
    const p = JSON.parse(Buffer.from(data, 'base64').toString());
    if (Date.now() - p.ts > 600_000) return null; // 10 min expiry
    return p;
  } catch { return null; }
}

/* ── Cookie parser ────────────────────────────────────────────────────────── */
function getCookie(header, name) {
  if (!header) return '';
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq < 0) continue;
    if (part.slice(0, eq).trim() === name)
      return decodeURIComponent(part.slice(eq + 1).trim());
  }
  return '';
}

/* ── Body parser ─────────────────────────────────────────────────────────── */
function parseBody(req) {
  // Vercel auto-parses JSON; fall back to manual parsing if needed
  if (req.body && typeof req.body === 'object') return Promise.resolve(req.body);
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', c => { raw += c; });
    req.on('end',  () => { try { resolve(JSON.parse(raw)); } catch { resolve({}); } });
    req.on('error', () => resolve({}));
  });
}

module.exports = { checkRate, signCookie, verifyCookie, getCookie, parseBody };
