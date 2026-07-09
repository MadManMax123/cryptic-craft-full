// POST /api/verify
// body: { "answer": "..." }
//
// ANSWER holds the correct answer in plaintext in the env. It's never
// compared with a plain string check though — both the submitted answer
// and the stored answer are run through HMAC-SHA256(_, HMAC_SECRET) at
// request time and the two digests are compared with a timing-safe
// comparison. This keeps the HMAC verification step without requiring
// you to precompute a digest by hand.
//
// On a correct answer this also reads clue.txt (deploy it alongside this
// file) and returns its SHA-256 digest so the client can log it to the
// console — it is never exposed before the puzzle is solved.

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

module.exports = (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method not allowed' });
    return;
  }

  let body = req.body;
  if (!body || typeof body === 'string') {
    try { body = JSON.parse(body || '{}'); } catch (e) { body = {}; }
  }

  const answer = String((body && body.answer) || '').trim().toLowerCase();

  const secret = process.env.HMAC_SECRET;
  const correctAnswer = process.env.ANSWER;

  if (!secret || !correctAnswer) {
    res.status(500).json({ error: 'server not configured' });
    return;
  }

  const computed = crypto.createHmac('sha256', secret).update(answer).digest('hex');
  const expected = crypto.createHmac('sha256', secret).update(correctAnswer.trim().toLowerCase()).digest('hex');

  const a = Buffer.from(computed, 'hex');
  const b = Buffer.from(expected, 'hex');

  const correct = a.length === b.length && crypto.timingSafeEqual(a, b);

  if (!correct) {
    res.status(200).json({ correct: false });
    return;
  }

  let clueHash = null;
  try {
    const clueContents = fs.readFileSync(
  path.join(process.cwd(), "clue.txt")
);
    clueHash = crypto.createHash('sha256').update(clueContents).digest('hex');
  } catch (e) {
    console.warn('clue.txt not found or unreadable:', e.message);
    // clue.txt wasn't deployed next to this function — skip, don't fail the request
  }

  res.status(200).json({
    correct: true,
    flag: process.env.FLAG,
    clueHash
  });
};