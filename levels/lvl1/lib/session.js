import crypto from "crypto";

const SESSION_LIFETIME_SECONDS = 10 * 60; // 10 minutes

/**
 * Creates a signed session cookie value for the given teamId.
 * Format: base64url(payload).hex(signature)
 *
 * @param {string} teamId
 * @returns {string} cookie value
 */
export function createSession(teamId) {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set");

  const payload = JSON.stringify({
    team_id: teamId,
    exp: Math.floor(Date.now() / 1000) + SESSION_LIFETIME_SECONDS,
  });

  const encoded = Buffer.from(payload, "utf8").toString("base64url");

  const signature = crypto
    .createHmac("sha256", secret)
    .update(encoded, "utf8")
    .digest("hex");

  return `${encoded}.${signature}`;
}

/**
 * Verifies and decodes a session cookie value.
 *
 * @param {string} cookieValue
 * @returns {{ team_id: string, exp: number } | null} parsed payload or null if invalid
 */
export function verifySession(cookieValue) {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return null;

  const lastDot = cookieValue.lastIndexOf(".");
  if (lastDot === -1) return null;

  const encoded  = cookieValue.slice(0, lastDot);
  const sigActual = cookieValue.slice(lastDot + 1);

  // Recompute expected signature
  const sigExpected = crypto
    .createHmac("sha256", secret)
    .update(encoded, "utf8")
    .digest("hex");

  // Timing-safe comparison
  const actualBuf   = Buffer.from(sigActual,   "hex");
  const expectedBuf = Buffer.from(sigExpected, "hex");

  if (
    actualBuf.length === 0 ||
    actualBuf.length !== expectedBuf.length ||
    !crypto.timingSafeEqual(actualBuf, expectedBuf)
  ) {
    return null;
  }

  // Decode and parse payload
  let payload;
  try {
    payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
  } catch {
    return null;
  }

  // Check expiry
  if (!payload.team_id || !payload.exp) return null;
  if (Math.floor(Date.now() / 1000) > payload.exp) return null;

  return payload;
}

/**
 * Parses cookies from a raw Cookie header string.
 *
 * @param {string} cookieHeader
 * @returns {Record<string, string>}
 */
export function parseCookies(cookieHeader = "") {
  return Object.fromEntries(
    cookieHeader.split(";").map((c) => {
      const [k, ...rest] = c.trim().split("=");
      return [k.trim(), rest.join("=").trim()];
    }).filter(([k]) => k.length > 0)
  );
}

/**
 * Builds a Set-Cookie header string for the session.
 *
 * @param {string} cookieValue
 * @returns {string}
 */
export function buildSessionCookieHeader(cookieValue) {
  return [
    `null_session=${cookieValue}`,
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    `Max-Age=${SESSION_LIFETIME_SECONDS}`,
    "Path=/",
  ].join("; ");
}

/**
 * Builds a Set-Cookie header that clears the session.
 *
 * @returns {string}
 */
export function clearSessionCookieHeader() {
  return [
    "null_session=",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    "Max-Age=0",
    "Path=/",
  ].join("; ");
}
