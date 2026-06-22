import React, { Suspense, lazy } from 'react'
import ReactDOM from 'react-dom/client'
import App, { PipelineLogsView } from './App.jsx'
// AU-7 (SPH1, Human Lead approved): /spherical - the Analysis Sphere gallery.
// Lazy chunk so three/gsap never load on the main app path.
const SphericalGallery = lazy(() => import('./SphericalGallery.jsx'))
import LeapView from './LeapView.jsx'
import RoleGraph from './RoleGraph.jsx'
import DebugPanel from './DebugPanel.jsx'
import { initDebug } from './debug.js'
import { inject, track } from '@vercel/analytics'
import { SpeedInsights } from '@vercel/speed-insights/react'

// Make track globally available for App.jsx
window._vtrack = track

// Debug mode (OFF by default; ?debug=1 enables). Must run BEFORE any fetch fires so the
// capture patch is in place. No-op unless enabled — zero effect on normal users / v1 / v2.
initDebug()

inject()

const params = (() => { try { return new URLSearchParams(window.location.search); } catch (_) { return new URLSearchParams(); } })()
const dmm = params.get('dmm') || params.get('debug') // ?dmm= is the debug-mode switch; ?debug= kept as alias
const debugLogs = dmm === 'logs'
const debugPanel = dmm === 'panel'
const leap = params.get('view') === 'leap'
const graph = params.get('view') === 'graph'
const spherical = window.location.pathname.replace(/\/+$/, '') === '/spherical' || params.get('view') === 'spherical'
// WIKI1 (PR1): ?view=wiki routes to the main App with wiki mode pre-selected.
// The App handles step="wiki_view" via the fourth mode card and startWikiGraph().
// A bare ?view=wiki with no query just opens the App landing with the wiki card active.
const wikiView = params.get('view') === 'wiki'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {spherical ? (
      <Suspense fallback={<div style={{ position: 'fixed', inset: 0, background: '#0b1220', color: '#9aa5b4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Arial, sans-serif', fontSize: 14 }}>Entering the sphere...</div>}>
        <SphericalGallery />
      </Suspense>
    ) : graph ? <RoleGraph /> : leap ? <LeapView /> : debugPanel ? <DebugPanel /> : debugLogs ? <PipelineLogsView /> : <App initialSearchMode={wikiView ? "wiki" : undefined} />}
    <SpeedInsights />
  </React.StrictMode>,
)
