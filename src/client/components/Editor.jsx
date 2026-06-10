import { useEffect, useRef } from 'react'

function SaveIndicator({ state }) {
  const text =
    state === 'saving' ? 'Saving…' : state === 'saved' ? 'Saved' : ''
  return <span className={`save-indicator save-${state}`}>{text}</span>
}

export default function Editor({ page, onEdit, onExport, saveState, isPro }) {
  const bodyRef = useRef(null)

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
        <SaveIndicator state={saveState} />
        <button
          className={isPro ? 'export-btn' : 'export-btn export-locked'}
          onClick={onExport}
          title={
            isPro
              ? 'Export as Markdown'
              : 'Export is a Pro feature'
          }
        >
          {isPro ? 'Export .md' : 'Export .md'}
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
