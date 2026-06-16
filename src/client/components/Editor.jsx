import { useEffect, useMemo, useRef } from 'react'

function SaveIndicator({ state }) {
  const text =
    state === 'saving' ? 'Saving…' : state === 'saved' ? 'Saved' : ''
  return <span className={`save-indicator save-${state}`}>{text}</span>
}

function countWords(text) {
  if (!text) return 0
  const trimmed = text.trim()
  if (!trimmed) return 0
  return trimmed.split(/\s+/).length
}

export default function Editor({ page, onEdit, onExport, saveState, isPro }) {
  const bodyRef = useRef(null)
  const wordCount = useMemo(() => countWords(page.content), [page.content])

  // Keep the textarea height matched to its content for a paper-like feel.
  useEffect(() => {
    const el = bodyRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [page.content])

  function handleBody(e) {
    onEdit({ content: e.target.value })
    const el = bodyRef.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = `${el.scrollHeight}px`
    }
  }

  return (
    <div className="editor">
      <div className="editor-bar">
        <div className="editor-bar-left">
          <SaveIndicator state={saveState} />
          <span className="word-count" aria-label="Word count">
            {wordCount} {wordCount === 1 ? 'word' : 'words'}
          </span>
        </div>
        <button
          className={isPro ? 'export-btn' : 'export-btn export-locked'}
          onClick={onExport}
          title={isPro ? 'Export as Markdown' : 'Export is a Pro feature'}
        >
          Export .md
          {!isPro && <span className="lock" aria-hidden="true">🔒</span>}
        </button>
      </div>

      <div className="editor-surface">
        <input
          className="editor-title"
          value={page.title || ''}
          placeholder="Untitled"
          onChange={(e) => onEdit({ title: e.target.value })}
          aria-label="Page title"
        />
        <textarea
          ref={bodyRef}
          className="editor-body"
          value={page.content || ''}
          placeholder="Start writing…"
          onChange={handleBody}
          aria-label="Page content"
        />
      </div>
    </div>
  )
}
