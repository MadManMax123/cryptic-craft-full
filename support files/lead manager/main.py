import discord
import os
from dotenv import load_dotenv

from commands import lead, leadcount

load_dotenv()

TOKEN = os.getenv("DISCORD_TOKEN")

ALLOWED_ROLES = {
    1481580338605068368,
    1482057635799765043
}

ALLOWED_CATEGORY = 1481580180219887616

intents = discord.Intents.all()
client = discord.Client(intents=intents)


@client.event
async def on_ready():
    print(f"✅ Logged in as {client.user}")


@client.event
async def on_message(message):
    if message.author.bot:
        return

    content = message.content.strip()

    # 🔓 leadcount (no restrictions)
    if content.startswith("!leadcount"):
        await leadcount.run(message)
        return

    # 🔒 lead (restricted)
    if content.startswith("!lead"):
        if message.channel.category_id != ALLOWED_CATEGORY:
            return

        user_roles = {role.id for role in message.author.roles}
        if not user_roles.intersection(ALLOWED_ROLES):
            return

        await lead.run(message)
        return


client.run(TOKEN)