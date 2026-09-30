import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Bundled from the installed package (was an unpkg link without integrity)
import 'leaflet/dist/leaflet.css'
import './index.css'
import App from './App.tsx'
import { registerSW } from 'virtual:pwa-register'
import { createBackgroundUpdate } from './utils/backgroundUpdate'
import { installPrompt } from './components/install/installPromptStore'
import { ErrorBoundary } from './components/common/ErrorBoundary'
import { installErrorReporting } from './services/telemetry'

// A new version waits until the visitor has been away for a while, then activates; the next open is fresh
const UPDATE_AFTER_HIDDEN_MS = 10 * 60 * 1000
const UPDATE_CHECK_MS = 60 * 60 * 1000
let updateQueued = false
const updateSW = registerSW({
  onNeedRefresh() {
    if (updateQueued) return
    updateQueued = true
    const background = createBackgroundUpdate({
      delayMs: UPDATE_AFTER_HIDDEN_MS,
      apply: () => void updateSW(true),
      setTimer: (fn, ms) => window.setTimeout(fn, ms),
      clearTimer: (id) => window.clearTimeout(id as number),
    })
    document.addEventListener('visibilitychange', () => background.onVisibility(document.visibilityState))
  },
  // Installed apps stay open for days, so look for a new version now and then
  onRegisteredSW(_url, registration) {
    if (registration) setInterval(() => void registration.update(), UPDATE_CHECK_MS)
  },
})

// beforeinstallprompt can fire before React mounts, so start listening now
installPrompt.listen(window)
// Uncaught errors are reported to the Control Room from the first moment
installErrorReporting()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
