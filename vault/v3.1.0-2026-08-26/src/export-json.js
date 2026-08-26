// JSON export layer (2026-08-25).
//
// v3 had no export of any kind before this - the only Blob in the app was a
// sendBeacon payload - so this file sets the pattern rather than following one.
//
// The design constraint that shapes everything here is the honesty contract in
// script/v3-result-engine-spec.md §7: every artifact carries "AI-assisted;
// human decides" plus Source / Confidence / Time-window, and derived or
// AI-authored content is never presented as if it were source data. A JSON file
// the user keeps, re-reads months later and possibly forwards is an artifact in
// exactly that sense - arguably more so than a screen, because the screen's
// surrounding context does not travel with it.
//
// So an export is not `JSON.stringify(whatever the panel holds)`. Every block
// is wrapped with a _provenance record naming its origin as exactly one of:
//
//   verbatim     - reproduced as received from a named external source
//                  (MyCareersFuture, careers.gov.sg, ACRA, OneMap)
//   derived      - computed by this app from verbatim inputs, deterministically
//   ai-authored  - written by a language model
//
// Nothing is dropped and nothing is silently promoted. A reader of the file can
// always tell which of the three they are looking at.

export const EXPORT_SCHEMA = "sgcv3.export/1";

/** The spec §7 footer, carried as data rather than prose. */
export const HUMAN_DECIDES = "AI-assisted; human decides.";

export const ORIGIN = {
  VERBATIM: "verbatim",
  DERIVED: "derived",
  AI: "ai-authored",
};

/** Filename-safe slug. Empty/undefined collapses to "export" so we never emit ".json". */
export function slugify(s) {
  const out = String(s == null ? "" : s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return out || "export";
}

/** YYYY-MM-DD in local time, for the filename only. Timestamps inside the file are ISO/UTC. */
export function stamp(d) {
  const t = d instanceof Date ? d : new Date();
  const p = (n) => String(n).padStart(2, "0");
  return t.getFullYear() + "-" + p(t.getMonth() + 1) + "-" + p(t.getDate());
}

/**
 * Wrap one block of data with its provenance.
 *
 * `origin` must be one of ORIGIN. `source` names WHERE it came from - an
 * external service for verbatim, this app for derived, the model for
 * ai-authored. `retrievedAt`/`timeWindow`/`confidence` are optional and are
 * omitted rather than guessed: a null confidence is honest, an invented one is
 * not.
 */
export function block(origin, meta, items) {
  const prov = { origin };
  if (meta && meta.source) prov.source = meta.source;
  if (meta && meta.retrievedAt) prov.retrievedAt = meta.retrievedAt;
  if (meta && meta.timeWindow) prov.timeWindow = meta.timeWindow;
  if (meta && meta.confidence) prov.confidence = meta.confidence;
  if (meta && meta.note) prov.note = meta.note;
  return { _provenance: prov, items: items === undefined ? null : items };
}

/**
 * Build the export envelope. `blocks` is an object of name -> block().
 *
 * Blocks whose items are null/empty are kept, not dropped: "we looked and there
 * was nothing" and "we never looked" are different facts, and a file that omits
 * empty blocks cannot tell them apart.
 */
export function envelope({ scope, query, appVersion, blocks }) {
  return {
    schema: EXPORT_SCHEMA,
    exportedAt: new Date().toISOString(),
    appVersion: appVersion || null,
    scope,
    query: query || null,
    notice: HUMAN_DECIDES,
    provenanceLegend: {
      verbatim: "Reproduced as received from the named external source.",
      derived: "Computed by this app from verbatim inputs, deterministically.",
      "ai-authored": "Written by a language model. Treat as draft, not fact.",
    },
    blocks: blocks || {},
  };
}

/**
 * Serialise and hand the file to the browser.
 *
 * Returns { ok } rather than throwing: an export failing must never take a
 * panel down with it, matching how persist.js swallows its own errors. The
 * object URL is revoked in a finally - a leaked one pins the whole blob in
 * memory for the life of the document.
 */
export function downloadJson(filename, obj) {
  let url = null;
  try {
    const text = JSON.stringify(obj, null, 2);
    const blob = new Blob([text], { type: "application/json" });
    url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename.endsWith(".json") ? filename : filename + ".json";
    // Firefox needs the anchor in the document for a programmatic click.
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return { ok: true, bytes: text.length };
  } catch (err) {
    console.error("[export] download failed:", err && err.message ? err.message : err);
    return { ok: false, reason: String(err && err.message ? err.message : err) };
  } finally {
    // Deferred: revoking synchronously can cancel the download in some browsers.
    if (url) setTimeout(() => { try { URL.revokeObjectURL(url); } catch (_) {} }, 30000);
  }
}

/** `sgcv3-<scope>-<subject>-<date>.json` */
export function exportFilename(scope, subject) {
  return "sgcv3-" + slugify(scope) + "-" + slugify(subject) + "-" + stamp() + ".json";
}
