# BuddyAds — AI Visibility

Fresh monorepo: premium website + single Visibility Agent worker.

**Brand name:** BuddyAds  
**Do not** assume a specific brand domain (e.g. no invented `.ai` domain).  
Local: `http://localhost:3000` — production: set `PUBLIC_APP_URL` to your real host.

## Stack

| Piece | Role |
|-------|------|
| `apps/web` | Premium site, form, report page |
| `apps/worker` | Single agent loop (tools + OpenRouter) |
| `prisma` | SQLite jobs + reports |

## Agent (honest definition)

The worker runs a **single agent loop**:

1. Goal: produce a visibility report for this brand  
2. LLM decides the next **tool** (crawl, query LLMs, finalize)  
3. Code runs the tool, returns results  
4. Repeat until finalize or budget  

Multi-LLM research uses **OpenRouter** (one key, many models).

Without `OPENROUTER_API_KEY` the run still finishes with crawl + rule scores (weaker report).

## Setup

```bash
cd D:\Projects\BuddyAds-AI
copy .env.example .env
pnpm install
pnpm db:push
```

Add `OPENROUTER_API_KEY` (and optional `RESEND_API_KEY`) to `.env`.

## Run (two terminals)

```bash
pnpm dev      # http://localhost:3005
pnpm worker   # agent
```
