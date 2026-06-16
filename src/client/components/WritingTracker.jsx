import { useEffect, useMemo, useRef, useState } from 'react'

// Lives in the sidebar foot. Tracks "words written today" across all notes
// plus a 7-day streak strip. State is held in localStorage so the counter
// survives reloads and rolls over correctly across days.
//
// Storage shape (key: 'notion-notes-writing'):
//   {
//     baseline: { date: 'YYYY-MM-DD', words: <total at start of that day> },
//     history:  { 'YYYY-MM-DD': <words added on that day>, ... }
//   }
// todayAdded = max(0, currentTotal - baseline.words)

const STORAGE_KEY = 'notion-notes-writing'

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function dateNDaysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

function countWords(text) {
  if (!text) return 0
  const trimmed = text.trim()
  return trimmed ? trimmed.split(/\s+/).length : 0
}

function loadStored() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

export default function WritingTracker({ pages }) {
  const today = todayISO()
  const totalWords = useMemo(
    () => pages.reduce((sum, p) => sum + countWords(p.content), 0),
    [pages]
  )

  // Lazy init: on first mount, if the stored baseline is from a prior day,
  // archive that day's contribution into history before resetting baseline.
  const [state, setState] = useState(() => {
    const stored = loadStored()
    if (stored.baseline?.date === today) return stored
    const history = { ...(stored.history || {}) }
    if (stored.baseline) {
      const yest = Math.max(0, totalWords - stored.baseline.words)
      if (yest > 0) history[stored.baseline.date] = yest
    }
    return { baseline: { date: today, words: totalWords }, history }
  })

  // Detect day rollover during a long-running session (rare but real:
  // user leaves the app open past midnight).
  useEffect(() => {
    if (state.baseline.date === today) return
    setState((prev) => {
      const history = { ...prev.history }
      const yest = Math.max(0, totalWords - prev.baseline.words)
      if (yest > 0) history[prev.baseline.date] = yest
      return { baseline: { date: today, words: totalWords }, history }
    })
  }, [today, totalWords, state.baseline.date])

  const todayAdded = Math.max(0, totalWords - state.baseline.words)

  // Persist live so the streak strip reflects today's writing immediately.
  // Debounced so rapid keystrokes don't spam localStorage.
  const persistTimer = useRef(null)
  useEffect(() => {
    if (persistTimer.current) clearTimeout(persistTimer.current)
    persistTimer.current = setTimeout(() => {
      const history =
        todayAdded > 0
          ? { ...state.history, [today]: todayAdded }
          : state.history
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ baseline: state.baseline, history })
        )
      } catch {
        /* quota or storage disabled — silent */
      }
    }, 250)
    return () => {
      if (persistTimer.current) clearTimeout(persistTimer.current)
    }
  }, [todayAdded, today, state.baseline, state.history])

  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = dateNDaysAgo(6 - i)
      const wroteToday = date === today && todayAdded > 0
      const wroteHistory = (state.history?.[date] ?? 0) > 0
      return { date, isToday: date === today, wrote: wroteToday || wroteHistory }
    })
  }, [today, todayAdded, state.history])

  return (
    <div className="tracker" aria-label="Writing progress">
      <div className="tracker-row">
        <span className="tracker-icon" aria-hidden="true">
          ✎
        </span>
        <span className="tracker-label">
          <strong className="tracker-count">{todayAdded}</strong>{' '}
          {todayAdded === 1 ? 'word' : 'words'} today
        </span>
      </div>
      <div className="tracker-strip" role="presentation">
        {days.map((d) => {
          let cn = 'tracker-dot'
          if (d.wrote) cn += ' tracker-dot-filled'
          if (d.isToday) cn += ' tracker-dot-today'
          return <span key={d.date} className={cn} title={d.date} />
        })}
      </div>
    </div>
  )
}
