import crypto from "crypto";
import { parseCookies, verifySession } from "../lib/session.js";
import { getTeam, markLevel1Done } from "../lib/sheets.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const flag = process.env.LEVEL1_FLAG;
  const cookieSecret = process.env.LEVEL1_COOKIE_SECRET;

  if (!flag || !cookieSecret) {
    return res.status(500).json({ error: "Server misconfiguration" });
  }

  const cookies = parseCookies(req.headers.cookie ?? "");

  // ─────────────────────────────────────────────────────────────
  // Verify session
  // ─────────────────────────────────────────────────────────────

  const session = verifySession(cookies["null_session"] ?? "");

  if (!session) {
    return res.status(401).json({ error: "Login required" });
  }

  const teamId = session.team_id;

  // ─────────────────────────────────────────────────────────────
  // Verify level cookie
  // ─────────────────────────────────────────────────────────────

  const raw = cookies["level1_access"] ?? "";

  const lastDot = raw.lastIndexOf(".");

  if (lastDot === -1) {
    return res.status(403).json({ error: "Access denied" });
  }

  const levelPayload = raw.slice(0, lastDot);
  const sigActual = raw.slice(lastDot + 1);

  const sigExpected = crypto
    .createHmac("sha256", cookieSecret)
    .update(levelPayload, "utf8")
    .digest("hex");

  const actualBuf = Buffer.from(sigActual, "hex");
  const expectedBuf = Buffer.from(sigExpected, "hex");

  let sigValid = false;

  if (
    actualBuf.length > 0 &&
    actualBuf.length === expectedBuf.length
  ) {
    sigValid = crypto.timingSafeEqual(
      actualBuf,
      expectedBuf
    );
  }

  if (!sigValid) {
    return res.status(403).json({ error: "Access denied" });
  }

  const expectedLevelPayload =
    `${teamId}:level1:granted`;

  if (levelPayload !== expectedLevelPayload) {
    return res.status(403).json({ error: "Access denied" });
  }

  // ─────────────────────────────────────────────────────────────
  // Trigger webhook BEFORE returning response
  // ─────────────────────────────────────────────────────────────

  try {
    await triggerWebhookIfNeeded(teamId);
  } catch (err) {
    console.error(
      "[get-level1-flag] triggerWebhookIfNeeded failed:",
      err
    );
  }

  return res.status(200).json({ flag });
}

async function triggerWebhookIfNeeded(teamId) {
  console.log("[webhook] Looking up team:", teamId);

  const team = await getTeam(teamId);

  console.log("[webhook] Team object:", team);

  if (!team) {
    throw new Error(`Team '${teamId}' not found`);
  }

  const alreadyDone =
    String(team.level1_done)
      .trim()
      .toUpperCase() === "TRUE";

  console.log(
    "[webhook] level1_done:",
    team.level1_done,
    "=>",
    alreadyDone
  );

  if (alreadyDone) {
    console.log(
      "[webhook] Level already marked complete"
    );
    return;
  }

  if (!team.webhook_url) {
    throw new Error(
      `No webhook_url found for team '${teamId}'`
    );
  }

  console.log("[webhook] Marking level1 done");

  await markLevel1Done(teamId);

  console.log("[webhook] markLevel1Done succeeded");

  const message = [
    "✅ **Level 1 completed!**",
    "",
    `**Team:** ${teamId}`,
    "",
    "Flag unlocked.",
    "",
    "**Next clue:**",
    "> https://drive.google.com/file/d/1IgPYxhea_Fj81Sm8KBHsDUBkxPQVj0MP/view?usp=sharing"
  ].join("\n");

  console.log("[webhook] Sending Discord webhook");

  const webhookRes = await fetch(team.webhook_url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      content: message
    })
  });

  console.log(
    "[webhook] Discord status:",
    webhookRes.status
  );

  if (!webhookRes.ok) {
    const body = await webhookRes.text();

    throw new Error(
      `Discord returned ${webhookRes.status}: ${body}`
    );
  }

  console.log("[webhook] Discord message sent");
}