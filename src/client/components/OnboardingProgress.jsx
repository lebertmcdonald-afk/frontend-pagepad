const STEP_LABELS = ['Name your note', 'Write something', 'Save it']

function getMessage(completedCount) {
  if (completedCount === 0) return 'Complete these 3 steps to write your first note.'
  if (completedCount === 3) return 'Your first note is complete — welcome to Notion Notes!'
  const remaining = 3 - completedCount
  return `You're ${remaining === 1 ? '1 step' : `${remaining} steps`} away from your first complete note.`
}

export default function OnboardingProgress({ titled, written, saved }) {
  const steps = [titled, written, saved]
  const completedCount = steps.filter(Boolean).length
  const allDone = completedCount === 3
  const pct = Math.round((completedCount / 3) * 100)

  return (
    <div className="onboarding" aria-label="First-note progress">
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

      {/* Step chips — always visible */}
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

      {/* Contextual message */}
      <div className="onboarding-footer">
        <span className={`onboarding-msg${allDone ? ' onboarding-msg-done' : ''}`}>
          {getMessage(completedCount)}
        </span>
      </div>
    </div>
  )
}
