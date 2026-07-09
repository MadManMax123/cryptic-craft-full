export default async function handler(req, res) {
  if (req.headers["x-bot-secret"] !== process.env.BOT_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { team_id } = req.body;

  if (!team_id) {
    return res.status(400).json({ error: "Missing team_id" });
  }

  // 🕒 Converts a UTC ISO timestamp string to its IST calendar date (YYYY-MM-DD)
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // 19,800,000 ms
  function toISTDateString(isoTimestamp) {
    const utcDate = new Date(isoTimestamp);
    const istShifted = new Date(utcDate.getTime() + IST_OFFSET_MS);
    return istShifted.toISOString().slice(0, 10);
  }

  try {
    const BASE = "https://cryptic-craft.base44.app/api";

    const leadsRes = await fetch(
      `${BASE}/entities/Leads?q=${encodeURIComponent(JSON.stringify({ team_id }))}`,
      {
        headers: { api_key: process.env.BASE44_API_KEY }
      }
    );

    const leads = await leadsRes.json();

    // 📅 "Today" in IST
    const todayIST = toISTDateString(new Date().toISOString());

    let today_count = 0;

    for (const lead of leads) {
      if (lead.timestamp && toISTDateString(lead.timestamp) === todayIST) {
        today_count++;
      }
    }

    return res.status(200).json({
      team_id,
      team_name: leads[0]?.team_name || "Unknown",
      today_count,
      total_count: leads.length
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal error" });
  }
}