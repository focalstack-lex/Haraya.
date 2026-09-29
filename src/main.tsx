import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Bundled from the installed package (was an unpkg link without integrity)
import 'leaflet/dist/leaflet.css'
import './index.css'
import App from './App.tsx'
import { registerSW } from 'virtual:pwa-register'
import { installPrompt } from './components/install/installPromptStore'

// A new version waits until the visitor leaves the app, then activates; the next open is fresh
let updateQueued = false
const updateSW = registerSW({
  onNeedRefresh() {
    if (updateQueued) return
    updateQueued = true
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') void updateSW(true)
    })
  },
})

// beforeinstallprompt can fire before React mounts, so start listening now
installPrompt.listen(window)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
