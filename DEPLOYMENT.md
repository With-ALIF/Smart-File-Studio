# 🚀 Deployment Guide — ALIF Tool

Next.js 16 (App Router) · Vercel-ready · no backend required

---

## 📋 Pre-deploy checklist

| Check | Status |
|---|---|
| `npm run build` passes | ✅ |
| `npx tsc --noEmit` clean | ✅ |
| All 16 tool routes prerendered | ✅ |
| Security headers configured | ✅ |
| `.env.local` gitignored | ✅ |
| `API_KEY` not in client bundle | ✅ |

---

## 1️⃣ Get your Gemini API key

1. Go to <https://aistudio.google.com/apikey>
2. Sign in with Google
3. Click **"Create API key"** → copy the key

> The key stays **server-side only** (`src/app/api/gemini/route.ts`).
> It is never sent to the browser.

---

## 2️⃣ Local development

```bash
# 1. copy the template
copy .env.example .env.local        # Windows
cp .env.example .env.local          # macOS / Linux

# 2. paste your key into .env.local
API_KEY=your_actual_key_here

# 3. run
npm install
npm run dev
```

Open <http://localhost:3000>

Without `API_KEY`, everything works **except** AI Image Describer,
which returns a clear 503 message instead of failing silently.

---

## 3️⃣ Deploy to Vercel

### Via GitHub (recommended)

1. Push this repo to GitHub
2. Go to <https://vercel.com/new>
3. Import the repository
4. Vercel detects Next.js automatically — **no build command needed**
5. Add the environment variable:
   - Settings → Environment Variables
   - Key: `API_KEY`
   - Value: *your Gemini key*
   - Environment: **Production, Preview, Development** (all three)
6. Click **Deploy**

### Via Vercel CLI

```bash
npm i -g vercel
vercel
vercel env add API_KEY production
vercel --prod
```

---

## 4️⃣ Custom domain

Vercel → Project → Settings → Domains → add `alif-tools.mnr.bd`

Then update DNS:

| Type | Name | Value |
|---|---|---|
| `A` | `@` | `76.76.21.21` |
| `CNAME` | `www` | `cname.vercel-dns.com` |

> Vercel auto-provisions SSL.

---

## 5️⃣ Post-deploy: tell Google

1. Go to <https://search.google.com/search-console>
2. **Add property** → URL prefix → `https://alif-tools.mnr.bd`
3. Verify (DNS TXT record or file)
4. **Sitemaps** → submit `sitemap.xml`
5. **URL Inspection** → paste `https://alif-tools.mnr.bd` → **Request Indexing**

Indexing usually takes 1–3 days.

---

## 6️⃣ Environment variables reference

| Variable | Where | Required | Purpose |
|---|---|---|---|
| `API_KEY` | server | optional | Gemini AI for Image Describer |

> Everything else runs entirely in the browser. No other secrets needed.

---

## 7️⃣ How it works (architecture)

```
Browser (client)                     Server
┌──────────────────────────┐         ┌─────────────────────┐
│ Next.js App Router        │         │                     │
│  /[category]/[id]         │────────▶│ /api/gemini/route.ts│
│  (16 static pages)        │  POST   │  reads API_KEY      │
│                           │◀────────│  calls Gemini       │
│ PDF.js, jsPDF, pdf-lib,   │  text   │                     │
│ tesseract.js (CDN)        │         │                     │
│                           │         │                     │
│ All files processed       │         │                     │
│ LOCALLY — no upload       │         │                     │
└──────────────────────────┘         └─────────────────────┘
```

Your files **never leave the device** except the image you explicitly send
to the AI describer.

---

## 8️⃣ Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| AI Describer says "not configured" | `API_KEY` missing | Add env var, redeploy |
| 404 on `/pdf/pdf-merge` | Old `vercel.json` rewrite | Already removed — redeploy |
| Blank page, CDN warning | Old `index.html` | Already removed — clear Vercel cache |
| Changes not showing | Stale cache | Vercel → Deployments → Redeploy |