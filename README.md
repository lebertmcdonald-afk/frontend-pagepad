# Notion Notes

Full-stack note-taking app. React + Vite frontend, Node + Hono + SQLite backend — one repo, one command.

## Quick start

```bash
npm install
cp .env.example .env   # set ADMIN_TOKEN to any random string
npm run db:migrate
npm run dev
```

Open http://localhost:5173.

The Vite dev server proxies all API calls (`/auth`, `/me`, `/pages`, `/admin`) to the Hono backend on port 8787.

## Production build

```bash
npm run build          # compiles frontend → dist/client/
npm start              # Hono serves API + static files on PORT (default 8787)
```

## Environment variables

| Variable | Default | Notes |
|---|---|---|
| `PORT` | `8787` | Backend listen port |
| `DATABASE_URL` | `./notion-notes.db` | SQLite file path |
| `ADMIN_TOKEN` | _(empty)_ | Enables `/admin` endpoints |
| `CORS_ORIGIN` | `*` | Restrict in production |
| `FREE_PAGE_LIMIT` | `5` | Free-tier page cap |

## Tests

```bash
npm test
```
