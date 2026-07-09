/**
 * hmac.js — NULL Challenge // Protocol 17
 * HMAC-SHA256 cookie signing utilities.
 *
 * How it works:
 *   sign(data)           → base64url-encoded HMAC-SHA256 of the JSON payload
 *   verify(data, sig)    → constant-time comparison to prevent timing attacks
 *
 * The secret is loaded from process.env.HMAC_SECRET at call time,
 * never cached at module load — so rotating the secret takes effect immediately.
 */

const crypto = require("crypto");

/**
 * Produce an HMAC-SHA256 signature for an arbitrary string payload.
 * @param {string} data  — the serialised payload (JSON string)
 * @returns {string}     — URL-safe base64 signature
 */
function sign(data) {
  const secret = process.env.HMAC_SECRET;
  if (!secret) throw new Error("HMAC_SECRET is not set");

  return crypto
    .createHmac("sha256", secret)
    .update(data, "utf8")
    .digest("base64url"); // base64url avoids + / = which can confuse cookie parsers
}

/**
 * Verify a signature against a payload using constant-time comparison.
 * Constant-time is critical — a naive === leaks timing information that
 * can allow an attacker to forge valid signatures byte-by-byte.
 *
 * @param {string} data       — the serialised payload
 * @param {string} signature  — the signature to verify
 * @returns {boolean}
 */
function verify(data, signature) {
  try {
    const expected = sign(data);
    // Both buffers must be the same byte-length for timingSafeEqual.
    const expBuf   = Buffer.from(expected, "utf8");
    const givenBuf = Buffer.from(signature || "", "utf8");

    if (expBuf.length !== givenBuf.length) return false;
    return crypto.timingSafeEqual(expBuf, givenBuf);
  } catch {
    return false;
  }
}

module.exports = { sign, verify };