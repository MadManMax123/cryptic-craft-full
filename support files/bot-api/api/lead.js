export default async function handler(req, res) {
  if (req.headers["x-bot-secret"] !== process.env.BOT_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { team_id, description, used_by } = req.body;

  if (!team_id || !description) {
    return res.status(400).json({ error: "Missing fields" });
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

    // 🔍 Get team
    const teamRes = await fetch(
      `${BASE}/entities/Team?q=${encodeURIComponent(JSON.stringify({ team_id }))}`,
      {
        headers: { api_key: process.env.BASE44_API_KEY }
      }
    );

    const teams = await teamRes.json();

    if (!Array.isArray(teams) || !teams.length) {
      return res.status(404).json({ error: "Team not found" });
    }

    const team = teams[0];

    // 🔍 Get all leads
    const leadsRes = await fetch(`${BASE}/entities/Leads`, {
      headers: { api_key: process.env.BASE44_API_KEY }
    });

    const allLeads = await leadsRes.json();

    if (!Array.isArray(allLeads)) {
      console.error("Base44 error:", allLeads);
      return res.status(500).json({ error: "Failed to fetch leads" });
    }

    // 📅 Filter for this team
    const leads = allLeads.filter(l => l.team_id === team_id);

    // 📅 "Today" in IST
    const todayIST = toISTDateString(new Date().toISOString());

    let today_count = 0;

    for (const lead of leads) {
      if (lead.timestamp && toISTDateString(lead.timestamp) === todayIST) {
        today_count++;
      }
    }

    // 🚫 ENFORCE LIMIT
    if (today_count >= 45) {
      return res.status(403).json({
        error: "Daily limit reached"
      });
    }

    // 🕒 Timestamp for this lead, e.g. 2026-07-02T02:12:04.642Z
    const timestamp = new Date().toISOString();

    // ✅ Create lead
    const leadRes = await fetch(`${BASE}/entities/Leads`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        api_key: process.env.BASE44_API_KEY
      },
      body: JSON.stringify({
        team_id,
        team_name: team.team_name,
        description,
        used_by,
        timestamp
      })
    });

    const lead = await leadRes.json();

    return res.status(200).json({
      success: true,
      team_name: team.team_name,
      lead_id: lead.id
    });

  } catch (err) {
    console.error("CRASH:", err);
    return res.status(500).json({ error: "Internal error" });
  }
}