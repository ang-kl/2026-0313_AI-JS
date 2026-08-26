// v3/vite-debug-plugin.js — DEV-ONLY sink for debug mode.
// Adds POST /__debug/log to the Vite dev server; appends NDJSON to
// v3/debug/<session>-<YYYY-MM-DD>.jsonl. apply:'serve' → never in the production build,
// so it cannot affect the deployed site (and v1/v2 never load it).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function debugSinkPlugin() {
  const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'debug');
  return {
    name: 'v3-debug-sink',
    apply: 'serve', // dev server only
    configureServer(server) {
      try { fs.mkdirSync(dir, { recursive: true }); } catch (_) {}
      const write = (body, res) => {
        try {
          const data = JSON.parse(body || '{}');
          const sess = String(data.session || '').replace(/[^a-z0-9]/gi, '').slice(0, 16) || 'unknown'; // no path traversal
          const entries = Array.isArray(data.entries) ? data.entries : [];
          const day = new Date().toISOString().slice(0, 10);
          const file = path.join(dir, `${sess}-${day}.jsonl`);
          const lines = entries.map((e) => JSON.stringify(e)).join('\n') + (entries.length ? '\n' : '');
          fs.appendFile(file, lines, () => {});
          res.statusCode = 200; res.setHeader('content-type', 'application/json'); res.end(JSON.stringify({ ok: true, written: entries.length }));
        } catch (_) { res.statusCode = 500; res.end('{"ok":false}'); }
      };
      server.middlewares.use('/__debug/log', (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end('method'); return; }
        const chunks = [];
        let size = 0;
        req.on('data', (c) => { size += c.length; if (size > 8 * 1024 * 1024) req.destroy(); else chunks.push(c); });
        req.on('end', () => write(Buffer.concat(chunks).toString('utf8'), res));
        req.on('error', () => { try { res.statusCode = 400; res.end('{"ok":false}'); } catch (_) {} });
        // Safety: if the stream never emits 'end' (some dev-server states), flush what we have.
        setTimeout(() => { if (!res.writableEnded) write(Buffer.concat(chunks).toString('utf8'), res); }, 1500);
      });
    },
  };
}
