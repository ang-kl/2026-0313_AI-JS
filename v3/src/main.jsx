import React from 'react'
import ReactDOM from 'react-dom/client'
import App, { PipelineLogsView } from './App.jsx'
import { inject, track } from '@vercel/analytics'
import { SpeedInsights } from '@vercel/speed-insights/react'

// Make track globally available for App.jsx
window._vtrack = track

inject()

const debugLogs = (() => { try { return new URLSearchParams(window.location.search).get('debug') === 'logs'; } catch (_) { return false; } })()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {debugLogs ? <PipelineLogsView /> : <App />}
    <SpeedInsights />
  </React.StrictMode>,
)
