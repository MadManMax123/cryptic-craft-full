import requests
import os

API_BASE = os.getenv("API_BASE")
BOT_SECRET = os.getenv("BOT_SECRET")


def post(endpoint, data):
    try:
        res = requests.post(
            f"{API_BASE}{endpoint}",
            json=data,
            headers={"x-bot-secret": BOT_SECRET},
            timeout=5
        )

        return res.status_code, res.json()

    except Exception as e:
        print("API ERROR:", e)
        return 500, {"error": "API unreachable"}