# v3/debug — debug-mode session logs

This folder holds per-session debug logs produced by **v3 debug mode** (logic flow + API
calls). One file per browser session: `<session>-<YYYY-MM-DD>.jsonl` (newline-delimited JSON).

## How it fills up
- Open the app with **`?debug=1`** (sticky for the tab). Use it normally.
- **Local `npm run dev`:** the Vite dev plugin (`../vite-debug-plugin.js`) writes files here
  automatically as you use the app.
- **Live site:** serverless can't write the repo filesystem, so nothing is auto-written —
  open **`?debug=panel`** and click **Download session log** to save the `.jsonl` here yourself.
- Logging **stops after 1 minute idle** and resumes on the next activity (same file).

## Entry shape (one JSON object per line)
- common: `v, ts, tMono, session, seq, kind`
- `kind:"api"` → `endpoint, method, status, ok, ms, reqBody/reqBodyRaw, respBody/respBodyRaw, reqBytes, respBytes, reqTruncated, respTruncated, contentType, aborted, error`
- `kind:"logic"` → `step, status, ms, detail, role, source`
- `kind:"meta"` → `event` (`session_start` / `idle_stop` / `resume`)

## ⚠️ Privacy
These files capture **full request/response bodies — including LLM prompts and any text you
typed or pasted** (e.g. CV-derived content). They are **git-ignored** (`../.gitignore`) so
they are never committed. **Do not commit or share them.** Debug mode is **off by default**.
