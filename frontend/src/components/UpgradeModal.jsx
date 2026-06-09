import { useState } from 'react'
import { adminUpgrade, ApiError } from '../api.js'

// The upgrade moment. Real billing is out of scope per the PRD (Pro is flipped
// manually through the admin endpoint), so this modal explains the value and,
// for demos, lets you simulate the upgrade with the backend's ADMIN_TOKEN.
export default function UpgradeModal({ userId, onClose, onUpgraded }) {
  const [showDev, setShowDev] = useState(false)
  const [adminToken, setAdminToken] = useState('')
  const [working, setWorking] = useState(false)
  const [devError, setDevError] = useState('')

  async function simulateUpgrade() {
    setWorking(true)
    setDevError('')
    try {
      await adminUpgrade(userId, adminToken.trim(), true)
      onUpgraded()
    } catch (err) {
      if (err instanceof ApiError && err.status === 503) {
        setDevError('Admin endpoints are disabled (ADMIN_TOKEN is unset on the server).')
      } else if (err instanceof ApiError && err.status === 403) {
        setDevError('That admin token was rejected.')
      } else {
        setDevError('Upgrade failed. Check the token and that the backend is running.')
      }
    } finally {
      setWorking(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="upgrade-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="upgrade-title" className="modal-title">
          You&apos;ve filled your free workspace
        </h2>
        <p className="modal-sub">
          The free plan holds five pages. Upgrade to Pagepad Pro to keep going.
        </p>

        <div className="tier-compare">
          <div className="tier">
            <span className="tier-name">Free</span>
            <ul>
              <li>Up to 5 pages</li>
              <li>Clean writing &amp; autosave</li>
              <li>Sidebar navigation</li>
            </ul>
          </div>
          <div className="tier tier-pro">
            <span className="tier-name">
              Pro <span className="pro-pill">Pro</span>
            </span>
            <ul>
              <li>Unlimited pages</li>
              <li>Export any page as Markdown</li>
              <li>Everything in Free</li>
            </ul>
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn" onClick={onClose}>
            Not now
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setShowDev((v) => !v)}
          >
            Upgrade to Pro
          </button>
        </div>

        {showDev && (
          <div className="dev-upgrade">
            <p className="dev-note">
              Billing isn&apos;t wired up for this build. To unlock Pro for
              testing, paste the backend&apos;s admin token.
            </p>
            <div className="dev-row">
              <input
                className="dev-input"
                type="password"
                placeholder="ADMIN_TOKEN"
                value={adminToken}
                onChange={(e) => setAdminToken(e.target.value)}
              />
              <button
                className="btn btn-primary"
                disabled={!adminToken.trim() || working}
                onClick={simulateUpgrade}
              >
                {working ? 'Unlocking…' : 'Unlock Pro'}
              </button>
            </div>
            {devError && <p className="dev-error">{devError}</p>}
          </div>
        )}
      </div>
    </div>
  )
}
