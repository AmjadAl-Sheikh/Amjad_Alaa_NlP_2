# Deploying the Express Backend (artifacts/api-server)

This file explains how to deploy the Express API to a Node hosting provider (Railway, Render, Fly, Heroku).

Steps (general):
1. Push the repository to a Git provider.
2. Create a new service on your host and point it to this repository (or the `artifacts/api-server` subdirectory if the host supports monorepos).
3. Set the build and start commands:
   - Install: `pnpm install`
   - Build: `pnpm run build`
   - Start: `node --enable-source-maps ./dist/index.mjs`
4. Set environment variables in the host UI:
   - `DATABASE_URL` (required): e.g. `postgres://user:pass@host:5432/dbname`
   - `PORT` (optional): host may set this automatically
   - `SESSION_SECRET`
   - `GEMINI_API_KEY` (optional)
   - `EMAIL_USER` / `EMAIL_PASS` (optional)

Notes:
- The `build.mjs` script bundles the server into `dist` using `esbuild`.
- Some hosts may not have `pnpm` preinstalled; either enable `pnpm` support or use a custom Dockerfile to install `pnpm` and run the commands.

Example Dockerfile (if needed):
```dockerfile
FROM node:20
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate
COPY artifacts/api-server/package.json ./
COPY artifacts/api-server/pnpm-lock.yaml ./
COPY artifacts/api-server/ .
RUN pnpm install --frozen-lockfile
RUN pnpm run build
ENV NODE_ENV=production
EXPOSE 5000
CMD ["node","--enable-source-maps","./dist/index.mjs"]
```
