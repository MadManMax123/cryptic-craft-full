from utils.api import post

async def run(message):
    parts = message.content.split(" ")
    if len(parts) < 3:
        await message.reply("Usage: !lead <team_id> <description>")
        return

    team_id = parts[1]
    description = " ".join(parts[2:])

    status, data = post("/api/lead", {
        "team_id": team_id,
        "description": description,
        "used_by": str(message.author)
    })

    if status != 200:
        await message.reply(f"❌ {data.get('error')}")
        return

    await message.reply(f"✅ Lead added for {data['team_name']}")