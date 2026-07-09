# NULL CTF — Setup & Deployment Guide

## Project Structure

```
null-ctf/
├── public/
│   ├── index.html       ← Login page
│   ├── main.html        ← Main operator terminal
│   ├── style.css        ← Shared styles (your provided file)
│   ├── script.js        ← Frontend game logic
│   └── doc.pdf          ← ⚠ YOU MUST ADD THIS (archive document)
├── api/
│   ├── login.js         ← POST /api/login
│   ├── session.js       ← GET  /api/session
│   ├── submitCity.js    ← POST /api/submitCity
│   ├── getEnv.js        ← GET  /api/getEnv  (session-protected)
│   ├── frequency.js     ← POST /api/frequency
│   └── archivepull.js   ← GET  /api/archivepull (hidden command)
├── .env.example         ← Copy to .env.local and fill in values
├── package.json
└── vercel.json
```

---

## 1. Google Sheets Setup

Create a Google Sheet named **"users"** with this structure:

| A (team_id) | B (password_sha256) | C (attempts) | D (lockout) |
|-------------|---------------------|--------------|-------------|
| team_001    | `<sha256_of_pw>`    | 0            |             |
| team_002    | `<sha256_of_pw>`    | 0            |             |

**Generate SHA256 of a password:**
```bash
echo -n "yourpassword" | sha256sum
# or in Node.js:
node -e "const c=require('crypto'); console.log(c.createHash('sha256').update('yourpassword').digest('hex'))"
```

**Share the sheet** with your service account email (e.g. `ctf-sa@project.iam.gserviceaccount.com`) as **Editor**.

---

## 2. Google Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a project → Enable **Google Sheets API**
3. Create a **Service Account** → Generate JSON key
4. Copy the entire JSON as a single line into `GOOGLE_SERVICE_ACCOUNT_JSON` env var

---

## 3. Environment Variables

Copy `.env.example` → `.env.local` and fill in all values:

```bash
cp .env.example .env.local
# Edit .env.local with real values
```

Key variables:
- `HMAC_SECRET` — strong random hex (48+ bytes)
- `GOOGLE_SHEET_ID` — from your Sheets URL
- `GOOGLE_SERVICE_ACCOUNT_JSON` — single-line JSON

---

## 4. Add doc.pdf

Place your lore/clue PDF at `public/doc.pdf`.  
This is served only via the hidden `archivepull();` DevTools command.

---

## 5. Deploy to Vercel

```bash
npm install
npx vercel login
npx vercel --prod
```

Set env vars in Vercel dashboard: **Settings → Environment Variables**

---

## 6. Local Development

```bash
npm install
npx vercel dev
# Visit http://localhost:3000
```

---

## Game Flow Summary

1. **Login** → `index.html` → POST `/api/login` → HMAC session cookie
2. **Terminal boot** → `main.html` → brief SHA1(AUTH) in logs, `archivepull();` hint
3. **Lore text** → typewriter reveals backstory
4. **Frequency input** → user tries frequencies, 868.5 MHz is correct
5. **Packet generation** → 3 packets, only one at correct freq has TRUE_AUTH + TRUE_SIG
6. **City decode** → decode BASE32 DATA → `50.082553, 14.428998` → Prague
7. **Submit city** → POST `/api/submitCity` → returns FLAG
8. **Flag** → `FLAG{ARTICAL_LORAWAN_PKG_RCVD}`

---

## Hidden Command

In DevTools console on `main.html`, type:
```javascript
archivepull();
```
This fetches `/api/archivepull` (session-protected) and opens/downloads `doc.pdf`.

---

## Security Notes

- Passwords stored as SHA256 in Sheets — never plaintext
- Sessions signed with HMAC-SHA256 — tamper-proof
- Lockout after 3 failed logins → 6 hour cooldown
- All API routes require valid session cookie
- `HMAC_SECRET` and Google credentials never leave server
- Only `TRUE_SHA1_AUTH` is ever sent to frontend (via `/api/getEnv`)

---

## Packet Logic

**AUTH rule:** `harmonic_mean(user_freq, 868.5)` divisible by 3 → AUTH = `A86TFG`, else random

**Correct frequency (868.5 MHz):**
- Exactly 1 packet has TRUE_AUTH + TRUE_SIG + `base32(50.082553,14.428998)`
- 2 decoy packets with random Europe coords + random auth/sig

**Wrong frequency:**
- All 3 packets random, Europe coords only, random auth/sig

BASE32 of `50.082553,14.428998` → `KFBVKZKUJVEQ====` (decodable by player)
