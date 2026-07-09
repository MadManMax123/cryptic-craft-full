# NULL Challenge — Setup & Deployment Guide

## File Tree

```
null-challenge/
├── api/
│   ├── check-level1.js        # Verifies cipher answer, issues team-scoped cookie
│   ├── get-level1-flag.js     # Triple-validates session + level cookie + team match; fires Discord webhook
│   ├── get-level1-hints.js    # Returns hints array (session-gated)
│   ├── login.js               # Validates team_id + password against Sheets, issues session
│   └── logout.js              # Clears session cookie
├── lib/
│   ├── session.js             # createSession / verifySession / cookie helpers
│   └── sheets.js              # getTeam / getAllTeams / markLevel1Done (Google Sheets API)
├── login.html                 # NEW: gated entry page
├── index.html                 # MODIFIED: session guard + existing challenge
├── flag.html                  # MODIFIED: session-aware redirect logic
├── access-denied.html         # Unchanged
├── script.js                  # Unchanged
├── style.css                  # Unchanged
├── text.json                  # Unchanged
├── 11zon_cropped.png          # Unchanged
├── vercel.json                # Routes + function runtime config
├── package.json               # type: "module"
├── .env.example               # All required env vars documented
└── .gitignore
```

---

## Environment Variables

Set all of these in **Vercel → Project → Settings → Environment Variables**.

| Variable | Description |
|---|---|
| `SESSION_SECRET` | Secret for HMAC-signing the `null_session` cookie. Long random string. |
| `LEVEL1_ANSWER_HASH` | SHA-256 hex of the correct answer (lowercase). |
| `LEVEL1_COOKIE_SECRET` | Secret for HMAC-signing the `level1_access` cookie. **Different from `SESSION_SECRET`**. |
| `LEVEL1_FLAG` | Flag string returned on success, e.g. `NULL{your_flag_here}`. |
| `LEVEL1_HINTS` | JSON array of hint strings, e.g. `["Hint 1","Hint 2"]`. |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Full service account JSON pasted as one line. |

### Generating secrets

```bash
# SESSION_SECRET and LEVEL1_COOKIE_SECRET
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"

# LEVEL1_ANSWER_HASH (replace "your answer" with the actual answer)
echo -n "your answer" | sha256sum | awk '{print $1}'
```

---

## Google Sheet Setup

### 1. Create the sheet

Open: `https://docs.google.com/spreadsheets/d/1t6jSKGBzq9ek_sxpn82WUSrAOiKRUnm4CLiV-HWA_kk/edit`

Create a sheet tab named exactly: **`webhook`**

Add this header row in row 1:

| A | B | C | D |
|---|---|---|---|
| team_id | password_sha256 | webhook_url | level1_done |

### 2. Add team rows (starting from row 2)

Example:

| team_id | password_sha256 | webhook_url | level1_done |
|---|---|---|---|
| team1 | `<sha256 of password>` | `https://discord.com/api/webhooks/...` | FALSE |

To generate a password hash:

```bash
echo -n "YourPassword123" | sha256sum | awk '{print $1}'
```

### 3. Create a Google Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or use existing)
3. Enable the **Google Sheets API**
4. Go to **IAM & Admin → Service Accounts → Create Service Account**
5. Name it (e.g. `null-challenge-sheets`)
6. Click **Create and Continue** → **Done** (no extra roles needed)
7. Open the service account → **Keys** → **Add Key → Create new key → JSON**
8. Download the JSON file

### 4. Share the sheet with the service account

1. Open your Google Sheet
2. Click **Share**
3. Paste the service account email (e.g. `null-challenge-sheets@your-project.iam.gserviceaccount.com`)
4. Grant **Editor** access (needed for marking `level1_done`)
5. Click **Send**

### 5. Store the JSON in Vercel

Open the downloaded JSON, copy its entire contents onto a single line, and paste as the value of `GOOGLE_SERVICE_ACCOUNT_JSON`.

> **Note:** Vercel handles special characters in env var values correctly when you paste through the dashboard. Do not wrap the value in quotes.

---

## Security Design

### Cookie architecture

| Cookie | Contents | Secret | Lifetime |
|---|---|---|---|
| `null_session` | `{ team_id, exp }` (base64url + HMAC) | `SESSION_SECRET` | 10 min |
| `level1_access` | `<team_id>:level1:granted` + HMAC | `LEVEL1_COOKIE_SECRET` | 15 min |

Both are `HttpOnly; Secure; SameSite=Lax`.

### Triple validation in `get-level1-flag`

1. **Session valid** — signature OK, not expired
2. **Level cookie valid** — HMAC matches
3. **Team cross-check** — session's `team_id` matches the prefix of the level cookie payload

All three must pass or the request is rejected with 403.

### Webhook deduplication

`markLevel1Done` writes `TRUE` to Google Sheets **before** sending the Discord webhook. On a race condition, the worst case is the Sheets write succeeds but the webhook fails (no double-send). Teams that already have `level1_done = TRUE` receive no webhook.

---

## Deployment

```bash
# 1. Install Vercel CLI if needed
npm i -g vercel

# 2. Link to your Vercel project
vercel link

# 3. Set env vars (or set them in the dashboard)
vercel env add SESSION_SECRET
vercel env add LEVEL1_ANSWER_HASH
vercel env add LEVEL1_COOKIE_SECRET
vercel env add LEVEL1_FLAG
vercel env add LEVEL1_HINTS
vercel env add GOOGLE_SERVICE_ACCOUNT_JSON

# 4. Deploy
vercel --prod
```

### Local development

```bash
# Requires a .env.local file with all variables set
vercel dev
```

---

## User Flow

```
GET /                 → redirected to /login.html  (vercel.json route)
  ↓
/login.html           → POST /api/login
  ↓ (sets null_session cookie)
/index.html           → session guard fires → loads challenge
  ↓ (correct answer)
POST /api/check-level1 → issues level1_access cookie (<team_id>:level1:granted)
  ↓
/flag.html            → click reveal → GET /api/get-level1-flag
                           → validates session + level cookie + cross-checks team
                           → fires Discord webhook (once) + marks Sheets
                           → returns flag
```