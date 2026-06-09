import { useState } from 'react'

// The signature element: five ink dots that fill as a free user uses pages.
// When full, the meter becomes the upgrade nudge. Pro users see no meter.
function PageMeter({ pageCount, pageLimit, isPro, onUpgrade }) {
  if (isPro || pageLimit == null) {
    return (
      <div className="meter meter-pro">
        <span className="pro-pill">Pro</span>
        <span className="meter-label">Unlimited pages</span>
      </div>
    )
  }

  const dots = Array.from({ length: pageLimit }, (_, i) => i < pageCount)
  const atLimit = pageCount >= pageLimit

  return (
    <div className="meter">
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
    </div>
  )
}

export default function Sidebar({
  pages,
  activeId,
  onSelect,
  onCreate,
  onDelete,
  pageCount,
  pageLimit,
  isPro,
  onUpgrade,
}) {
  const [confirmId, setConfirmId] = useState(null)

  return (
    <aside className="sidebar">
      <div className="sidebar-head">
        <span className="wordmark">Pagepad</span>
        <button
          className="new-btn"
          onClick={onCreate}
          title="New page"
          aria-label="New page"
        >
          +
        </button>
      </div>

      <nav className="page-list">
        {pages.length === 0 && (
          <p className="page-list-empty">No pages yet.</p>
        )}
        {pages.map((page) => (
          <div
            key={page.id}
            className={
              page.id === activeId ? 'page-item page-item-active' : 'page-item'
            }
            onClick={() => onSelect(page.id)}
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
        ))}
      </nav>

      <div className="sidebar-foot">
        <PageMeter
          pageCount={pageCount}
          pageLimit={pageLimit}
          isPro={isPro}
          onUpgrade={onUpgrade}
        />
      </div>
    </aside>
  )
}
