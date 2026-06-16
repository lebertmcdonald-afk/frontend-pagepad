import { useState } from 'react'
import WritingTracker from './WritingTracker.jsx'

// The signature element: five ink dots that fill as a free user uses pages.
// When full, the meter becomes the upgrade nudge. Pro users see no meter.
function PageMeter({ pageCount, pageLimit, isPro, onUpgrade, onExportAll }) {
  if (isPro || pageLimit == null) {
    return (
      <div className="meter meter-pro">
        <div className="meter-pro-head">
          <span className="pro-pill">Pro</span>
          <span className="meter-label">Unlimited pages</span>
        </div>
        {onExportAll && (
          <button className="meter-export-all" onClick={onExportAll}>
            Export all as .zip
          </button>
        )}
      </div>
    )
  }

  const dots = Array.from({ length: pageLimit }, (_, i) => i < pageCount)
  const atLimit = pageCount >= pageLimit
  // Soft warning starts one page before the cap, so users feel the wall
  // approaching instead of being surprised by a 402 on the next create.
  const nearLimit = !atLimit && pageCount === pageLimit - 1

  let className = 'meter'
  if (atLimit) className += ' meter-at-limit'
  else if (nearLimit) className += ' meter-near-limit'

  return (
    <div className={className}>
      <div className="meter-dots" aria-hidden="true">
        {dots.map((filled, i) => (
          <span key={i} className={filled ? 'dot dot-filled' : 'dot'} />
        ))}
      </div>
      <div className="meter-row">
        <span className="meter-label">
          {pageCount} of {pageLimit} pages
        </span>
        {atLimit && (
          <button className="meter-upgrade" onClick={onUpgrade}>
            Upgrade
          </button>
        )}
      </div>
      {nearLimit && (
        <p className="meter-hint">
          1 page left on free —{' '}
          <button className="meter-hint-link" onClick={onUpgrade}>
            upgrade for unlimited
          </button>
        </p>
      )}
      {atLimit && (
        <p className="meter-hint meter-hint-strong">
          You've used all your free pages.
        </p>
      )}
    </div>
  )
}

function IntroCard({ onDismiss }) {
  return (
    <div className="intro-card" role="note">
      <div className="intro-card-body">
        <strong>Notes is a quick place to write.</strong>
        <span>
          No setup. Hit <kbd>+</kbd>, give it a name, start typing. Everything
          saves as you go.
        </span>
      </div>
      <button
        className="intro-card-dismiss"
        onClick={onDismiss}
        aria-label="Dismiss intro"
        title="Dismiss"
      >
        ×
      </button>
    </div>
  )
}

export default function Sidebar({
  pages,
  activeId,
  onSelect,
  onCreate,
  onDelete,
  onReorder,
  pageCount,
  pageLimit,
  isPro,
  onUpgrade,
  onExportAll,
  showIntro,
  onDismissIntro,
}) {
  const [confirmId, setConfirmId] = useState(null)
  const [dragId, setDragId] = useState(null)
  const [overId, setOverId] = useState(null)

  function handleDragStart(id) {
    return (e) => {
      setDragId(id)
      e.dataTransfer.effectAllowed = 'move'
      // Required by Firefox to start a drag.
      e.dataTransfer.setData('text/plain', id)
    }
  }
  function handleDragOver(id) {
    return (e) => {
      if (!dragId || dragId === id) return
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
      setOverId(id)
    }
  }
  function handleDrop(id) {
    return (e) => {
      e.preventDefault()
      const src = dragId
      setDragId(null)
      setOverId(null)
      if (!src || src === id) return
      onReorder?.(src, id)
    }
  }
  function handleDragEnd() {
    setDragId(null)
    setOverId(null)
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-head">
        <span className="wordmark">Notion Notes</span>
        <button
          className="new-btn"
          onClick={onCreate}
          title="New page"
          aria-label="New page"
        >
          +
        </button>
      </div>

      {showIntro && <IntroCard onDismiss={onDismissIntro} />}

      <nav className="page-list">
        {pages.length === 0 && (
          <p className="page-list-empty">No pages yet.</p>
        )}
        {pages.map((page) => {
          let className = 'page-item'
          if (page.id === activeId) className += ' page-item-active'
          if (page.id === dragId) className += ' page-item-dragging'
          if (page.id === overId && page.id !== dragId) className += ' page-item-drop-target'
          return (
            <div
              key={page.id}
              className={className}
              onClick={() => onSelect(page.id)}
              draggable
              onDragStart={handleDragStart(page.id)}
              onDragOver={handleDragOver(page.id)}
              onDrop={handleDrop(page.id)}
              onDragEnd={handleDragEnd}
              onDragLeave={() => {
                if (overId === page.id) setOverId(null)
              }}
            >
              <span className="page-title">
                {page.title?.trim() || 'Untitled'}
              </span>
              {confirmId === page.id ? (
                <span className="confirm">
                  <button
                    className="confirm-yes"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete(page.id)
                      setConfirmId(null)
                    }}
                  >
                    Delete
                  </button>
                  <button
                    className="confirm-no"
                    onClick={(e) => {
                      e.stopPropagation()
                      setConfirmId(null)
                    }}
                  >
                    Keep
                  </button>
                </span>
              ) : (
                <button
                  className="page-delete"
                  title="Delete page"
                  aria-label="Delete page"
                  onClick={(e) => {
                    e.stopPropagation()
                    setConfirmId(page.id)
                  }}
                >
                  ×
                </button>
              )}
            </div>
          )
        })}
      </nav>

      <div className="sidebar-foot">
        <WritingTracker pages={pages} />
        <PageMeter
          pageCount={pageCount}
          pageLimit={pageLimit}
          isPro={isPro}
          onUpgrade={onUpgrade}
          onExportAll={onExportAll}
        />
      </div>
    </aside>
  )
}
