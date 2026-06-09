# Pagepad — Frontend

React + Vite frontend for Pagepad, the lightweight writing app. It talks to the
backend REST API (Node + Hono + SQLite) over the documented endpoints.

## Run it

```bash
npm install
cp .env.example .env     # point VITE_API_URL at the backend if it isn't localhost:8787
npm run dev              # http://localhost:5173
```

Make sure the backend is running first (default `http://localhost:8787`). The
frontend reads `VITE_API_URL` from `.env`; if unset it falls back to
`http://localhost:8787`.

## How it maps to the backend

- **Auth** — On first load the app calls `POST /auth/token`, stores the device
  token in `localStorage` under `pagepad-token`, and sends
  `Authorization: Bearer <token>` on every authenticated request. No login.
- **Loading** — `GET /me` for the user, page count, and free-tier limit;
  `GET /pages` for the list.
- **Writing** — Edits to the title or body autosave via `PATCH /pages/:id`,
  debounced ~400ms, with a Saving/Saved indicator.
- **Creating** — `POST /pages`. A `402` response (free user at 5 pages) opens the
  upgrade prompt.
- **Deleting** — `DELETE /pages/:id`, with an inline confirm.
- **Export** — `GET /pages/:id/export` downloads the page as Markdown. A `403`
  (free user) opens the upgrade prompt.

## The freemium gate

Free users get five pages, shown as five ink dots in the sidebar that fill as
pages are created. The sixth page triggers the `402` and the upgrade modal.
Pro unlocks unlimited pages and Markdown export.

Billing is out of scope for this build (per the PRD, the Pro flag is flipped
through the admin endpoint). For demos, the upgrade modal has a dev option:
paste the backend's `ADMIN_TOKEN` to call `POST /admin/users/:id/upgrade` and
unlock Pro for the current device.

## Project layout

```
src/
  api.js                 # API client: token bootstrap + all endpoints
  App.jsx                # state: load, autosave, create/delete, 402/403 handling
  styles.css             # paper-and-ink design system
  components/
    Sidebar.jsx          # page list + the ink-dot page meter
    Editor.jsx           # title field, autosizing textarea, save indicator, export
    UpgradeModal.jsx     # the 5-page wall / Pro-export upgrade prompt
```
