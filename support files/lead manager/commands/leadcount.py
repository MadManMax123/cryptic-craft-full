import discord
from utils.api import post

async def run(message):
    parts = message.content.split(" ")
    if len(parts) != 2:
        await message.reply("Usage: !leadcount <team_id>")
        return

    team_id = parts[1]

    status, data = post("/api/leadcount", {
        "team_id": team_id
    })

    if status != 200:
        await message.reply(f"❌ {data.get('error')}")
        return

    today = data["today_count"]

    # 🎨 dynamic color
    color = discord.Color.green()
    if today > 30:
        color = discord.Color.red()
    elif today > 15:
        color = discord.Color.orange()

    embed = discord.Embed(
        title=f"📊 Lead Usage — {data['team_name']}",
        color=color
    )

    embed.add_field(
        name="📅 Today",
        value=f"{today} / 45",
        inline=False
    )

    embed.add_field(
        name="📈 Total Usage",
        value=f"{data['total_count']}",
        inline=False
    )

    embed.set_footer(text=f"Team ID: {team_id}")

    await message.reply(embed=embed)