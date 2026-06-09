# Pagepad

Monorepo containing the Pagepad frontend and backend.

## Structure

```
frontend/   React + Vite app (port 5173)
backend/    Node + Hono + SQLite API (port 8787)
```

## Quick start

Open two terminals.

**Terminal 1 — backend**
```bash
cd backend
npm install
cp .env.example .env   # set ADMIN_TOKEN to any random string
npm run db:migrate
npm run dev
```

**Terminal 2 — frontend**
```bash
cd frontend
npm install
npm run dev
```

Then open http://localhost:5173.

## More detail

- [frontend/README.md](frontend/README.md)
- [backend/README.md](backend/README.md)
