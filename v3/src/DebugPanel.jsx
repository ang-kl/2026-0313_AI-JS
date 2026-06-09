// v3/src/DebugPanel.jsx — ?debug=panel — live view of the current session's debug capture
// (logic steps + API calls) with idle status and a Download button. Read-only; capture is
// driven by v3/src/debug.js (enable with ?debug=1). No effect on v1/v2.
import { useState, useEffect, useCallback } from 'react';

const C = { bg: '#0b1020', surface: '#121a2e', border: '#26324d', text: '#e6ecf7', sub: '#9fb0cc', accent: '#5b8cff' };
const KIND = { api: { c: '#5b8cff', l: 'API' }, logic: { c: '#2dd4bf', l: 'LOGIC' }, meta: { c: '#f59e0b', l: 'META' } };

export default function DebugPanel() {
  const dbg = typeof window !== 'undefined' ? window.__v3debug : null;
  const [, force] = useState(0);
  const [expanded, setExpanded] = useState(null);
  const [pg, setPg] = useState({ status: 'idle', logs: [] });

  useEffect(() => {
    if (!dbg || !dbg.subscribe) return;
    return dbg.subscribe(() => force((n) => n + 1));
  }, [dbg]);

  // Postgres step trail for THIS session (auto-logged by logStep → pipeline_logs)
  const loadPg = useCallback(() => {
    const sess = dbg && dbg.session;
    if (!sess) return;
    setPg((s) => ({ ...s, status: 'loading' }));
    fetch('/api/anatomy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'recentLogs', session: sess, limit: 400 }) })
      .then((r) => r.json())
      .then((d) => setPg({ status: 'done', logs: Array.isArray(d && d.logs) ? d.logs : [] }))
      .catch(() => setPg({ status: 'error', logs: [] }));
  }, [dbg]);
  useEffect(() => { loadPg(); }, [loadPg]);

  const wrap = { minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'ui-monospace,SFMono-Regular,Menlo,monospace', padding: 16, fontSize: 12 };

  if (!dbg || !dbg.enabled) {
    return (
      <div style={wrap}>
        <h1 style={{ fontSize: 16, margin: '0 0 8px' }}>v3 debug panel</h1>
        <p style={{ color: C.sub, lineHeight: 1.6 }}>
          Debug mode is <b>off</b>. Open the app with <code style={{ color: C.accent }}>?dmm=1</code> first
          (it stays on for this tab), use the app, then return here with <code style={{ color: C.accent }}>?dmm=panel</code> to view and download the session log.
        </p>
      </div>
    );
  }

  const buf = dbg.getBuffer();
  const st = dbg.status();
  const apiN = buf.filter((e) => e.kind === 'api').length;
  const logicN = buf.filter((e) => e.kind === 'logic').length;
  const idle = st.state === 'idle';

  const cell = { padding: '4px 8px', borderBottom: `1px solid ${C.border}`, verticalAlign: 'top', whiteSpace: 'pre-wrap', wordBreak: 'break-word' };
  const badge = (c, bg) => ({ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: c, background: bg, border: `1px solid ${c}55`, borderRadius: 999, padding: '2px 8px' });

  return (
    <div style={wrap}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <h1 style={{ fontSize: 16, margin: 0 }}>v3 debug</h1>
        <span style={badge(C.sub, C.surface)}>session {st.session}</span>
        <span style={badge(idle ? '#f59e0b' : '#2dd4bf', C.surface)}>{idle ? '● idle (logging paused)' : '● active'}</span>
        <span style={badge(C.accent, C.surface)}>{apiN} API · {logicN} logic · {buf.length} total</span>
        <button onClick={() => dbg.downloadJsonl()} style={{ marginLeft: 'auto', cursor: 'pointer', background: C.accent, color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', fontWeight: 700, fontSize: 12 }}>⬇ Download session log (.jsonl)</button>
        <button onClick={() => { force((n) => n + 1); loadPg(); }} style={{ cursor: 'pointer', background: C.surface, color: C.text, border: `1px solid ${C.border}`, borderRadius: 8, padding: '7px 12px', fontSize: 12 }}>refresh</button>
      </div>
      <p style={{ color: C.sub, margin: '0 0 10px' }}>
        Newest last · capture stops after 1 min idle, resumes on next activity.
        {' '}In local <code>npm run dev</code> these rows are also written to <code>v3/debug/{st.session}-&lt;date&gt;.jsonl</code>.
      </p>
      {!buf.length && <p style={{ color: C.sub }}>No entries yet — use the app (with ?dmm=1) to generate logic + API events.</p>}
      {!!buf.length && (
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead><tr style={{ textAlign: 'left', color: C.sub }}>
            {['#', 'kind', 'when', 'what', 'status', 'ms', ''].map((h) => <th key={h} style={{ padding: '4px 8px', borderBottom: `1px solid ${C.border}` }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {buf.map((e, i) => {
              const k = KIND[e.kind] || { c: C.sub, l: e.kind };
              const what = e.kind === 'api' ? `${e.method} ${e.endpoint}` : e.kind === 'logic' ? `${e.step}` : `${e.event}`;
              const status = e.kind === 'api' ? (e.error ? 'ERR' : e.status) : (e.status || '');
              const bad = e.error || e.status === 'error' || e.status === 'timeout' || (e.kind === 'api' && e.ok === false);
              const hasBody = e.reqBody || e.reqBodyRaw || e.respBody || e.respBodyRaw || e.detail;
              return (
                <>
                  <tr key={i} onClick={() => hasBody && setExpanded(expanded === i ? null : i)} style={{ cursor: hasBody ? 'pointer' : 'default', background: bad ? '#3b1d1d' : i % 2 ? '#0e1526' : 'transparent' }}>
                    <td style={{ ...cell, color: C.sub }}>{e.seq}</td>
                    <td style={cell}><span style={{ color: k.c, fontWeight: 700 }}>{k.l}</span></td>
                    <td style={{ ...cell, color: C.sub }}>{(e.ts || '').slice(11, 23)}</td>
                    <td style={{ ...cell, fontWeight: 600 }}>{what}{e.detail ? <span style={{ color: C.sub, fontWeight: 400 }}> · {String(e.detail).slice(0, 80)}</span> : null}</td>
                    <td style={{ ...cell, color: bad ? '#fca5a5' : C.text }}>{status}{e.aborted ? ' (abort)' : ''}{e.reqTruncated || e.respTruncated ? ' ✂' : ''}</td>
                    <td style={{ ...cell, textAlign: 'right' }}>{e.ms != null ? e.ms : ''}</td>
                    <td style={{ ...cell, color: C.sub }}>{hasBody ? (expanded === i ? '▾' : '▸') : ''}</td>
                  </tr>
                  {expanded === i && hasBody && (
                    <tr key={i + '-d'}><td colSpan={7} style={{ ...cell, background: '#0a0f1d' }}>
                      {e.error && <div style={{ color: '#fca5a5' }}>error: {e.error}</div>}
                      {e.reqBody != null && <Body label="request" v={e.reqBody} />}
                      {e.reqBodyRaw && <Body label="request" v={e.reqBodyRaw} />}
                      {e.respBody != null && <Body label="response" v={e.respBody} />}
                      {e.respBodyRaw && <Body label="response" v={e.respBodyRaw} />}
                    </td></tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      )}

      {/* Postgres step trail for THIS session (auto-logged by logStep → pipeline_logs) */}
      <div style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 13, margin: '0 0 6px', color: C.sub }}>
          Postgres step log · this session ({pg.logs.length}){pg.status === 'loading' ? ' · loading…' : pg.status === 'error' ? ' · store unavailable' : ''}
        </h2>
        {pg.status === 'done' && !pg.logs.length && <p style={{ color: C.sub }}>No persisted steps for this session yet (steps flush to pipeline_logs ~1s after each one). Run the app with ?dmm=1 first.</p>}
        {!!pg.logs.length && (
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead><tr style={{ textAlign: 'left', color: C.sub }}>
              {['when', 'step', 'status', 'ms', 'detail'].map((h) => <th key={h} style={{ padding: '4px 8px', borderBottom: `1px solid ${C.border}` }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {pg.logs.map((r, i) => {
                const bad = r.status === 'error' || r.status === 'timeout';
                return (
                  <tr key={i} style={{ background: bad ? '#3b1d1d' : i % 2 ? '#0e1526' : 'transparent' }}>
                    <td style={{ ...cell, color: C.sub }}>{String(r.ts || '').slice(11, 23)}</td>
                    <td style={{ ...cell, fontWeight: 600 }}>{r.step}</td>
                    <td style={{ ...cell, color: bad ? '#fca5a5' : C.text }}>{r.status}</td>
                    <td style={{ ...cell, textAlign: 'right' }}>{r.ms != null ? r.ms : ''}</td>
                    <td style={cell}>{r.detail || ''}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Body({ label, v }) {
  let text;
  try { text = typeof v === 'string' ? v : JSON.stringify(v, null, 2); } catch (_) { text = String(v); }
  if (text.length > 4000) text = text.slice(0, 4000) + '\n… (truncated in view; full body in the .jsonl)';
  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ color: '#9fb0cc', fontWeight: 700, marginBottom: 2 }}>{label}</div>
      <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: '#cbd5e1' }}>{text}</pre>
    </div>
  );
}
