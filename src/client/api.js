// Thin client for the Notion Notes backend (Node + Hono + SQLite).
// Auth model: anonymous device token. On first load we POST /auth/token,
// store the token in localStorage under "notion-notes-token", and send
// Authorization: Bearer <token> on every authenticated request.

const API = import.meta.env.VITE_API_URL || ''
const TOKEN_KEY = 'notion-notes-token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

// Raised for non-2xx responses so the UI can branch on status
// (402 = free page limit hit, 403 = Pro-only feature, etc.)
export class ApiError extends Error {
  constructor(status, body) {
    super(body?.error || `Request failed (${status})`)
    this.status = status
    this.body = body || {}
  }
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (auth) {
    const token = getToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    let parsed = null
    try {
      parsed = await res.json()
    } catch {
      /* response had no JSON body */
    }
    throw new ApiError(res.status, parsed)
  }

  if (res.status === 204) return null
  return res.json()
}

// Returns an existing device token or creates a new anonymous one.
export async function ensureToken() {
  let token = getToken()
  if (token) return token
  const data = await request('/auth/token', { method: 'POST', auth: false })
  setToken(data.token)
  return data.token
}

// Current user + page count + free-tier limit. pageLimit is null for Pro.
export function getMe() {
  return request('/me')
}

export async function listPages() {
  const data = await request('/pages')
  return data.pages
}

// Throws ApiError(402) when a free user is at the limit.
export async function createPage({ title, content } = {}) {
  const data = await request('/pages', {
    method: 'POST',
    body: { title, content },
  })
  return data.page
}

export async function updatePage(id, fields) {
  const data = await request(`/pages/${id}`, { method: 'PATCH', body: fields })
  return data.page
}

export async function deletePage(id) {
  return request(`/pages/${id}`, { method: 'DELETE' })
}

// Pro-only. Returns a Blob of the zip plus the suggested filename.
// Throws ApiError(403) for free users and ApiError(404) when there are no pages.
export async function exportAllPages() {
  const token = getToken()
  const res = await fetch(`${API}/pages/export-all`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) {
    let parsed = null
    try {
      parsed = await res.json()
    } catch {
      /* no body */
    }
    throw new ApiError(res.status, parsed)
  }
  const blob = await res.blob()
  const disposition = res.headers.get('Content-Disposition') || ''
  const match = disposition.match(/filename="?([^"]+)"?/)
  const filename = match ? match[1] : 'notion-notes.zip'
  return { filename, blob }
}

// Pro-only. Throws ApiError(403) for free users. Returns { filename, markdown }.
export async function exportPage(id, fallbackTitle = 'page') {
  const token = getToken()
  const res = await fetch(`${API}/pages/${id}/export`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) {
    let parsed = null
    try {
      parsed = await res.json()
    } catch {
      /* no body */
    }
    throw new ApiError(res.status, parsed)
  }
  const markdown = await res.text()
  const disposition = res.headers.get('Content-Disposition') || ''
  const match = disposition.match(/filename="?([^"]+)"?/)
  const filename = match ? match[1] : `${fallbackTitle || 'page'}.md`
  return { filename, markdown }
}

// Dev/testing only: flip a user's Pro flag via the admin endpoint.
// Requires the backend's ADMIN_TOKEN (not a device token). Real billing is
// out of scope per the PRD, so this stands in for the upgrade for demos.
export async function adminUpgrade(userId, adminToken, isPro = true) {
  const res = await fetch(`${API}/admin/users/${userId}/upgrade`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ isPro }),
  })
  if (!res.ok) {
    let parsed = null
    try {
      parsed = await res.json()
    } catch {
      /* no body */
    }
    throw new ApiError(res.status, parsed)
  }
  return res.json()
}
