import { useEffect, useRef, useState, useCallback } from 'react'
import {
  ensureToken,
  getMe,
  listPages,
  createPage,
  updatePage,
  deletePage,
  exportPage,
  ApiError,
} from './api.js'
import Sidebar from './components/Sidebar.jsx'
import Editor from './components/Editor.jsx'
import UpgradeModal from './components/UpgradeModal.jsx'
import OnboardingProgress from './components/OnboardingProgress.jsx'


export default function App() {
  const [me, setMe] = useState(null) // { user, pageCount, pageLimit }
  const [pages, setPages] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [status, setStatus] = useState('loading') // loading | ready | error
  const [errorMsg, setErrorMsg] = useState('')
  const [saveState, setSaveState] = useState('idle') // idle | saving | saved
  const [upgradeOpen, setUpgradeOpen] = useState(false)

  // Track whether autosave has fired at least once (step 3 of progress bar).
  // Persisted to localStorage so it survives a page refresh.
  const [hasSaved, setHasSaved] = useState(
    () => !!localStorage.getItem('onboardingHasSaved')
  )

  const saveTimer = useRef(null)
  const savedTimer = useRef(null)

  const isPro = !!me?.user?.isPro
  const activePage = pages.find((p) => p.id === activeId) || null

  // Bootstrap: ensure a device token, then load the user and their pages.
  useEffect(() => {
    let cancelled = false
    async function boot() {
      try {
        await ensureToken()
        const [meData, pageList] = await Promise.all([getMe(), listPages()])
        if (cancelled) return
        setMe(meData)
        setPages(pageList)
        setActiveId(pageList[0]?.id ?? null)
        setStatus('ready')
      } catch (err) {
        if (cancelled) return
        setErrorMsg(
          err instanceof ApiError
            ? `Couldn't reach Notion Notes (${err.status}). Is the backend running on the API URL?`
            : "Couldn't reach the Notion Notes backend. Check that it's running."
        )
        setStatus('error')
      }
    }
    boot()
    return () => {
      cancelled = true
    }
  }, [])

  // Promote saveState → hasSaved once autosave succeeds, and persist it.
  useEffect(() => {
    if (saveState === 'saved') {
      setHasSaved(true)
      localStorage.setItem('onboardingHasSaved', 'true')
    }
  }, [saveState])

  const refreshMe = useCallback(async () => {
    try {
      setMe(await getMe())
    } catch {
      /* non-fatal: count refresh can fail quietly */
    }
  }, [])

  async function handleCreate() {
    try {
      const page = await createPage({ title: '', content: '' })
      setPages((prev) => [...prev, page])
      setActiveId(page.id)
      refreshMe()
    } catch (err) {
      // 402 means a free user hit the 5-page wall — this is the upgrade moment.
      if (err instanceof ApiError && err.status === 402) {
        setUpgradeOpen(true)
      } else {
        setErrorMsg('Could not create a new page. Try again.')
      }
    }
  }

  // Autosave: debounce edits, then PATCH. Title and content both flow here.
  function handleEdit(fields) {
    setPages((prev) =>
      prev.map((p) => (p.id === activeId ? { ...p, ...fields } : p))
    )
    setSaveState('saving')
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      try {
        const updated = await updatePage(activeId, fields)
        setPages((prev) =>
          prev.map((p) => (p.id === activeId ? { ...p, ...updated } : p))
        )
        setSaveState('saved')
        if (savedTimer.current) clearTimeout(savedTimer.current)
        savedTimer.current = setTimeout(() => setSaveState('idle'), 1500)
      } catch {
        setSaveState('idle')
        setErrorMsg('Changes could not be saved. Check your connection.')
      }
    }, 400)
  }

  async function handleDelete(id) {
    const remaining = pages.filter((p) => p.id !== id)
    setPages(remaining)
    if (activeId === id) setActiveId(remaining[0]?.id ?? null)
    try {
      await deletePage(id)
      refreshMe()
    } catch {
      setErrorMsg('Could not delete that page.')
    }
  }

  async function handleExport(id) {
    try {
      const { filename, markdown } = await exportPage(
        id,
        pages.find((p) => p.id === id)?.title
      )
      const blob = new Blob([markdown], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      // 403 = export is Pro-only — send free users to the upgrade prompt.
      if (err instanceof ApiError && err.status === 403) {
        setUpgradeOpen(true)
      } else {
        setErrorMsg('Could not export this page.')
      }
    }
  }

  // Called by the upgrade modal after a successful dev/admin upgrade.
  async function handleUpgraded() {
    setUpgradeOpen(false)
    await refreshMe()
  }

  if (status === 'loading') {
    return (
      <div className="boot">
        <div className="wordmark">Notion Notes</div>
        <p className="boot-note">Opening your workspace…</p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="boot">
        <div className="wordmark">Notion Notes</div>
        <p className="boot-error">{errorMsg}</p>
        <button className="btn" onClick={() => window.location.reload()}>
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="app">
      <Sidebar
        pages={pages}
        activeId={activeId}
        onSelect={setActiveId}
        onCreate={handleCreate}
        onDelete={handleDelete}
        pageCount={me?.pageCount ?? pages.length}
        pageLimit={me?.pageLimit ?? null}
        isPro={isPro}
        onUpgrade={() => setUpgradeOpen(true)}
      />

      <main className="editor-pane">
        {activePage && (
          <OnboardingProgress
            titled={!!(activePage.title?.trim())}
            written={!!(activePage.content?.trim())}
            saved={hasSaved}
          />
        )}
        {activePage ? (
          <Editor
            key={activePage.id}
            page={activePage}
            onEdit={handleEdit}
            onExport={() => handleExport(activePage.id)}
            saveState={saveState}
            isPro={isPro}
          />
        ) : (
          <div className="empty">
            <h2>Nothing open yet</h2>
            <p>Create a page from the sidebar and start writing.</p>
            <button className="btn btn-primary" onClick={handleCreate}>
              New page
            </button>
          </div>
        )}
      </main>

      {errorMsg && (
        <div className="toast" role="status" onClick={() => setErrorMsg('')}>
          {errorMsg}
          <span className="toast-dismiss">Dismiss</span>
        </div>
      )}

      {upgradeOpen && (
        <UpgradeModal
          userId={me?.user?.id}
          onClose={() => setUpgradeOpen(false)}
          onUpgraded={handleUpgraded}
        />
      )}
    </div>
  )
}
