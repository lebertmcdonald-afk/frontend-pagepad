import { useEffect, useState } from 'react'

const STEP_LABELS = ['Name your note', 'Write something', 'Save it']

function getMessage(completedCount) {
  if (completedCount === 0) return 'Complete these 3 steps to finish your first note.'
  const remaining = 3 - completedCount
  return `You're ${remaining === 1 ? '1 step' : `${remaining} steps`} away from your first complete note.`
}

export default function OnboardingProgress({ titled, written, saved, onComplete, onDismiss }) {
  const steps = [titled, written, saved]
  const completedCount = steps.filter(Boolean).length
  const allDone = completedCount === 3
  const pct = Math.round((completedCount / 3) * 100)

  const [fading, setFading] = useState(false)

  // Once all steps are done: celebrate for 2 s, then fade out and mark complete.
  useEffect(() => {
    if (!allDone) return
    const fadeTimer = setTimeout(() => setFading(true), 2000)
    const doneTimer = setTimeout(() => onComplete(), 2500)
    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(doneTimer)
    }
  }, [allDone, onComplete])

  return (
    <div className={`onboarding${fading ? ' onboarding-fade' : ''}`} aria-label="First-note progress">
      {/* Progress track */}
      <div
        className="onboarding-bar-track"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${pct}% complete`}
      >
        <div className="onboarding-bar-fill" style={{ width: `${pct}%` }} />
      </div>

      {allDone ? (
        /* Celebration state */
        <div className="onboarding-celebration">
          <span className="celebration-check" aria-hidden="true">✓</span>
          Your first note is complete — welcome to Notion Notes!
        </div>
      ) : (
        <>
          {/* Step chips */}
          <div className="onboarding-steps">
            {STEP_LABELS.map((label, i) => (
              <div key={label} className={`onboarding-step${steps[i] ? ' step-done' : ''}`}>
                <span className="step-icon" aria-hidden="true">
                  {steps[i] ? '✓' : i + 1}
                </span>
                {label}
              </div>
            ))}
          </div>

          {/* Contextual message + dismiss */}
          <div className="onboarding-footer">
            <span className="onboarding-msg">{getMessage(completedCount)}</span>
            <button className="onboarding-skip" onClick={onDismiss}>
              Skip
            </button>
          </div>
        </>
      )}
    </div>
  )
}
