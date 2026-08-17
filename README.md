# BuddyAds — AI Visibility

Fresh monorepo: premium website + single Visibility Agent worker.

**Brand name:** BuddyAds  
Local: `http://localhost:3005` — production: set `PUBLIC_APP_URL` to your Railway web URL.

## Stack

| Piece | Role |
|-------|------|
| `apps/web` | Site, intake form, report page |
| `apps/worker` | Staged pipeline: crawl → technical → AEO → GEO → prompts → multi-LLM research → parse → evidence → graph → email/PDF |
| `prisma` | Postgres (local Docker or Railway) |

## Setup (local)

```bash
cd D:\Projects\BuddyAds-AI
copy .env.example .env
docker compose up -d
pnpm install
pnpm db:push
```

Add `OPENROUTER_API_KEY` and `RESEND_API_KEY` to `.env`.

```bash
pnpm dev      # http://localhost:3005
pnpm worker   # agent
```

## Deploy on Railway (web + worker + Postgres)

1. Push this repo to GitHub.
2. Railway → **New Project** → **Deploy from GitHub**.
3. **+ Create** → **Database** → **PostgreSQL**.
4. **Web** service (same repo):
   - Settings → **Config File** = `railway.web.json`
   - Variables: `DATABASE_URL` = reference Postgres; `PUBLIC_APP_URL` = generated web domain
   - Networking → **Generate Domain**
5. **Worker** service (same repo, second service):
   - Settings → **Config File** = `railway.worker.json`
   - Same `DATABASE_URL` reference
   - Same `PUBLIC_APP_URL` as web
   - Add `OPENROUTER_API_KEY`, `RESEND_API_KEY`, `FROM_EMAIL`
   - Do **not** generate a public domain
6. Open the web domain → `/check-report` and submit a test job.
