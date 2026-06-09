# Notion Notes Backend

REST API for Notion Notes. Node + Hono + SQLite + Drizzle.

Frontend ships separately and consumes this API.

## Quick start

```bash
npm install
cp .env.example .env          # edit ADMIN_TOKEN and CORS_ORIGIN
npm run db:migrate
npm run dev                   # http://localhost:8787
```

Run tests: `npm test`.

## Environment

| Var | Default | Notes |
|-----|---------|-------|
| `PORT` | `8787` | |
| `DATABASE_URL` | `./notion-notes.db` | SQLite file path |
| `ADMIN_TOKEN` | _(empty)_ | Required to call `/admin/*`. If empty, admin endpoints return 503. |
| `CORS_ORIGIN` | `*` | Set to the frontend origin in prod, e.g. `http://localhost:5173` |
| `FREE_PAGE_LIMIT` | `5` | Free-tier page cap |

## Auth model

There are no accounts. On first launch the frontend calls `POST /auth/token`, gets back an opaque device token, and stores it in localStorage. Every subsequent request sends `Authorization: Bearer <token>`. Pages are scoped to the token.

> Note: this product is internally code-named "Notion Notes". The name is provisional; a final brand will be chosen before public launch.

If the token is lost, the user's pages are gone. (Matches the PRD's no-sign-in spirit.)

## API

All `application/json` unless noted. All authenticated endpoints require `Authorization: Bearer <token>`.

### `POST /auth/token`
Create an anonymous user, return a device token.

**Response 201**
```json
{
  "token": "uuid-v4",
  "user": { "id": "uuid-v4", "isPro": false, "createdAt": 1717804800000 }
}
```

### `GET /me` 🔒
Current user + page count + free-tier limit.

**Response 200**
```json
{
  "user": { "id": "uuid-v4", "isPro": false, "createdAt": 1717804800000 },
  "pageCount": 3,
  "pageLimit": 5
}
```
`pageLimit` is `null` for Pro users.

### `GET /pages` 🔒
List all pages for the current user, ordered by `position` then `createdAt`.

**Response 200**
```json
{
  "pages": [
    {
      "id": "uuid",
      "userId": "uuid",
      "title": "Meeting notes",
      "content": "...",
      "position": 0,
      "createdAt": 1717804800000,
      "updatedAt": 1717804800000
    }
  ]
}
```

### `POST /pages` 🔒
Create a new page.

**Body** (all optional)
```json
{ "title": "Optional title", "content": "Optional content" }
```

**Response 201** — `{ "page": Page }`

**Response 402** when a free user has hit the limit:
```json
{ "error": "Page limit reached", "limit": 5, "upgradeRequired": true }
```
The frontend should show the upgrade prompt on 402.

### `GET /pages/:id` 🔒
**Response 200** — `{ "page": Page }`. **404** if not found or not owned by the caller.

### `PATCH /pages/:id` 🔒
Update title, content, or position. At least one field is required. Use this for autosave — call on every keystroke (debounced) or on blur.

**Body** (at least one field)
```json
{ "title": "New title", "content": "New body", "position": 2 }
```

**Response 200** — `{ "page": Page }`. **400** if body is empty. **404** if not found.

### `DELETE /pages/:id` 🔒
**Response 200** — `{ "deleted": "uuid" }`. **404** if not found.

### `GET /pages/:id/export` 🔒 (Pro only)
Returns the page rendered as Markdown.

**Response 200** — `text/markdown; charset=utf-8`, with `Content-Disposition: attachment; filename="<title>.md"`.

**Response 403** for free users:
```json
{ "error": "Export requires Pro tier", "upgradeRequired": true }
```

### `POST /admin/users/:id/upgrade` 🔐
Flip a user's Pro flag. Requires `Authorization: Bearer <ADMIN_TOKEN>` (not a device token).

**Body** — `{ "isPro": true }` or `{ "isPro": false }`

**Response 200** — `{ "user": { "id", "isPro", "createdAt" } }`
**Response 503** if `ADMIN_TOKEN` is unset.

### `GET /health`
Liveness check — `{ "status": "ok" }`. No auth.

## Frontend integration sketch

```ts
// On first load
let token = localStorage.getItem('notion-notes-token');
if (!token) {
  const res = await fetch(`${API}/auth/token`, { method: 'POST' });
  token = (await res.json()).token;
  localStorage.setItem('notion-notes-token', token);
}

// Every request
const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

// Autosave (debounce ~300ms)
await fetch(`${API}/pages/${id}`, { method: 'PATCH', headers, body: JSON.stringify({ content }) });

// Create — handle 402 by showing the upgrade prompt
const res = await fetch(`${API}/pages`, { method: 'POST', headers, body: JSON.stringify({ title: 'New' }) });
if (res.status === 402) showUpgradeModal();
```

## Status codes summary

| Code | Meaning |
|------|---------|
| 200 / 201 | Success |
| 400 | Invalid body |
| 401 | Missing or invalid device token |
| 402 | Free tier limit reached — show upgrade prompt |
| 403 | Pro-only feature or wrong admin token |
| 404 | Page or user not found |
| 503 | Admin endpoints disabled (ADMIN_TOKEN unset) |

## Project layout

```
src/
  app.ts                # buildApp() — wires CORS, context, routes
  server.ts             # entry point
  config.ts             # env loader
  types.ts              # AppEnv (Hono context types)
  db/
    schema.ts           # users + pages tables
    client.ts           # createDb()
    migrate.ts          # run migrations
  middleware/auth.ts    # requireAuth + requireAdmin
  routes/
    auth.ts             # POST /auth/token
    me.ts               # GET /me
    pages.ts            # CRUD + export
    admin.ts            # admin upgrade
  test/                 # vitest suites
drizzle/                # generated migrations
```

## Out of scope (deferred per PRD)

- Real auth / accounts
- Cloud sync across devices
- Search
- Payment processing (Stripe etc) — Pro flag is set manually via the admin endpoint
- Bulk export (export-all as zip — listed as P2 in the PRD)
