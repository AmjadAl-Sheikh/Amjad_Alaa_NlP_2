# Deployment Guide (Frontend + Backend)

This document explains how to deploy the frontend (`artifacts/ppu-assistant`) to Vercel (free) and the backend (`artifacts/api-server`) to a Node host (Railway/Render/Fly). It also includes required environment variables and quick commands to build locally.

Summary (recommended):
- Deploy `artifacts/ppu-assistant` to Vercel (static Vite site).
- Deploy `artifacts/api-server` to any Node hosting (Railway/Render) and set `DATABASE_URL`.

Frontend (Vercel)
- Root Directory: `artifacts/ppu-assistant`
- Install Command: `pnpm install`
- Build Command: `pnpm run build`
- Output Directory: `dist/public`
- Files added: `artifacts/ppu-assistant/vercel.json` (already present)

Steps to deploy frontend on Vercel:
1. Push your repository to GitHub (or GitLab).
2. In Vercel, import the project and set the following:
   - Framework Preset: Vite
   - Root Directory: `artifacts/ppu-assistant`
   - Install Command: `pnpm install`
   - Build Command: `pnpm run build`
   - Output Directory: `dist/public`
3. Add any environment variable (optional): e.g., `VITE_API_BASE_URL` if you want the client to call a hosted backend.

Frontend (GitHub Pages)
- Repository: must be pushed to GitHub.
- Branch: `main` for source, `gh-pages` for published site.
- Root Directory: N/A (build output is `artifacts/ppu-assistant/dist/public`).
- Install Command: `pnpm install`
- Build Command: `pnpm run build`
- Output Directory: `dist/public`
- Pages Configuration: set GitHub Pages to publish from the `gh-pages` branch.

Steps to deploy frontend on GitHub Pages:
1. Push your repository to GitHub.
2. Ensure `homepage` in `artifacts/ppu-assistant/package.json` is set to your GitHub Pages URL.
3. Commit the repository changes.
4. From `artifacts/ppu-assistant`, run:
   - `pnpm install`
   - `pnpm run deploy`
5. In GitHub repository settings, choose Pages source: `gh-pages` branch, root.

Backend (Node host - Railway/Render)
- Working Directory: `artifacts/api-server`
- Install Command: `pnpm install`
- Build Command: `pnpm run build`
- Start Command: `node --enable-source-maps ./dist/index.mjs`

Required environment variables for backend:
- `DATABASE_URL` (postgres connection string) — REQUIRED
- `PORT` (optional, host may provide it)
- `SESSION_SECRET` (recommended)
- Optional: `GEMINI_API_KEY`, `EMAIL_USER`, `EMAIL_PASS`, `NODE_ENV`, `LOG_LEVEL`

Quick local build and run (example):
```bash
# Build frontend
cd artifacts/ppu-assistant
pnpm install
pnpm run build

# Build backend
cd ../../artifacts/api-server
pnpm install
pnpm run build
DATABASE_URL="postgres://postgres:postgres@127.0.0.1:5432/ppu" PORT=5000 NODE_ENV=production pnpm start
```

If you want me to convert the Express backend into Vercel Serverless functions, reply and I'll prepare the adapter and `vercel.json` changes (this requires code edits).
