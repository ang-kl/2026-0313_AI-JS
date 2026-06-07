import React from 'react'
import ReactDOM from 'react-dom/client'
import App, { PipelineLogsView } from './App.jsx'
import LeapView from './LeapView.jsx'
import { inject, track } from '@vercel/analytics'
import { SpeedInsights } from '@vercel/speed-insights/react'

// Make track globally available for App.jsx
window._vtrack = track

inject()

const params = (() => { try { return new URLSearchParams(window.location.search); } catch (_) { return new URLSearchParams(); } })()
const debugLogs = params.get('debug') === 'logs'
const leap = params.get('view') === 'leap'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {leap ? <LeapView /> : debugLogs ? <PipelineLogsView /> : <App />}
    <SpeedInsights />
  </React.StrictMode>,
)
