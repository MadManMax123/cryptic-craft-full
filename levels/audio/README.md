# NULL // Spectrogram Analysis Terminal — CTF Challenge

## File Structure

```
project-root/
├── public/
│   ├── index.html          ← main challenge page (served at /)
│   └── challenge.mp3       ← YOUR audio file (add this yourself!)
├── api/
│   ├── check.js            ← POST /api/check  — answer verification
│   └── fetch.js            ← GET  /api/fetch  — flag delivery
├── vercel.json             ← Vercel configuration
├── .env.example            ← env variable template
└── README.md
```

---

## Audio File

Place your challenge audio file at `public/challenge.mp3`.
The audio should have a message **visually encoded in its spectrogram** (e.g. drawn with an audio editing tool like Audacity or Adobe Audition). Players will need to open the file in a spectrogram viewer (Audacity, Sonic Visualizer, etc.) to read the hidden text.

---

## Deployment on Vercel

### 1. Install Vercel CLI (optional, or deploy via Git)
```bash
npm i -g vercel
```

### 2. Set Environment Variables
In the Vercel dashboard → Project Settings → Environment Variables, add:

| Variable       | Value                                                              |
|----------------|--------------------------------------------------------------------|
| `ANSWER_HASH`  | `e77fda0aae406429846bc6de1ee78a28e4b40f7eaa54d636a2b57b8620c55323` |
| `FLAG`         | `FLAG{SPECTRO_FREQ_ANALYSIS}`                                      |
| `COOKIE_SECRET`| *(random 32+ byte hex string — see below)*                         |

Generate a secure `COOKIE_SECRET`:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Deploy
```bash
vercel --prod
```
or push to a connected Git repo for automatic deployment.

---

## How It Works

### Frontend Flow
1. **Cinematic intro** — lore lines typed out one by one, skippable.
2. **Terminal log** — lore summary with animated line reveals.
3. **Challenge view** — audio player + live spectrogram canvas + answer input.
4. **Flag view** — character-by-character flag reveal on success.

### Answer Processing (Frontend)
Input is cleaned before sending:
- Converted to **lowercase**
- All non-`[a-z0-9 ]` characters **removed**
- Multiple spaces **collapsed**, leading/trailing **trimmed**

### Backend Flow
```
POST /api/check  { answer: "normalized string" }
  → normalize again server-side (defense-in-depth)
  → SHA-256 hash
  → timing-safe compare vs ANSWER_HASH
  → if match: create HMAC-signed cookie, return { correct: true }
  → if no match: return { correct: false }

GET /api/fetch
  → read ctf_auth cookie
  → verify HMAC signature (timing-safe)
  → check 1-hour expiry
  → if valid: return { flag: FLAG }
  → else: 401 Unauthorized
```

### Cookie Security
- **HMAC-SHA256** signed with `COOKIE_SECRET` — cannot be forged without the secret.
- **HttpOnly** — inaccessible to JavaScript (XSS-safe).
- **Secure** — HTTPS only (Vercel is always HTTPS).
- **SameSite=Strict** — CSRF protection.
- **1-hour expiry** enforced both via `Max-Age` and server-side timestamp check.

---

## Security Properties

| Requirement                        | How it's met                                          |
|------------------------------------|-------------------------------------------------------|
| Flag never in frontend code        | ✅ Flag only in `process.env.FLAG` on server          |
| Answer never exposed               | ✅ Only the hash is stored; answer is not recoverable  |
| Cookie can't be forged             | ✅ HMAC-SHA256 with `COOKIE_SECRET`                   |
| Timing-safe hash comparison        | ✅ `crypto.timingSafeEqual` used throughout           |
| Flag only served after solving     | ✅ `/api/fetch` requires verified cookie              |

---

## Next Clue

When the player solves the challenge, the browser console logs:
```
next clue: node-interf.vercel.app
```
This is triggered client-side in `showFlag()`.
