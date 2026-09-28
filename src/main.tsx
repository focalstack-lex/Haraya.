import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Bundled from the installed package (was an unpkg link without integrity)
import 'leaflet/dist/leaflet.css'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
