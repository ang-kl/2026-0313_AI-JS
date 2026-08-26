# vault/v3.1.0-2026-08-26

Snapshot of `v3/` at commit `7d3e910`, taken 2026-08-26.

Same purpose and shape as `vault/v3.0.71` and `vault/v3.1.0`: a self-contained
copy of the app tree at a known-good point, independent of branch history.

## Why this exists alongside `vault/v3.1.0`

`vault/v3.1.0` is the 22 August snapshot, taken immediately after the
Vercel→Railway migration. The code has moved since — the JSON export feature
and a crash fix — but the version string has deliberately **not** moved
(APP_VERSION is still `3.1.0`, at the Human Lead's instruction).

A version-named folder therefore cannot distinguish the two states, so this one
carries the date. Both restore points are kept; neither overwrites the other.

## What changed since `vault/v3.1.0`

Three files, +435 / −9:

| File | Change |
|---|---|
| `src/export-json.js` | **new** — the JSON export layer: provenance-tagged envelope, `downloadJson`, filename helpers |
| `src/App.jsx` | `DownloadJsonButton`, export handlers in `CompanyPanel` and `McfJobsPanel`, the role-analysis export, and the optional `onExport` prop on `McfJobCard` |
| `src/ReviewStudio.jsx` | the export control in the workspace toolbar |

Includes the fix for the regression that shipped with the feature: the export
`useCallback` hooks in `CompanyPanel` had been declared **below** the
`if (state.loading)` early return, so the second render ran two hooks more than
the first and React threw invariant #310. Every employer search crashed. The
hooks now sit above that return, and a comment in the file records why they must
stay there.

> If you are restoring this snapshot to debug that class of problem: a
> hooks-order violation is invisible to `npm run build` and to unit tests. It
> needs an actual second render to appear.

## What this snapshot is

A copy of every **tracked** file under `v3/` at `7d3e910`, with one deliberate
exclusion. Built with `git archive`, so it contains no `node_modules`, no
`dist/` build output, and no `.env` files.

- 254 files, ~41 MB
- Carries the Railway-era files: `server.js`, `railway.json`,
  `lib/admin/kv.js`, `lib/pg-sql-tag.js`
- `vercel.json` retained — the Vercel deployment was still live and unchanged at
  snapshot time, and remains the rollback target

## What is NOT in here — read before restoring

**`v3/data/` is excluded.** It is ~651 MB across 33 files, almost entirely the
raw ACRA corpus. Copying it would add more than five times the repository's
current `.git` size (147 MB) permanently, and git cannot later forget it without
a history rewrite. `v3/data/` is itself tracked, so any commit already restores
it — a vault copy adds no recoverability.

`vault/v3.0.71` and `vault/v3.1.0` excluded it on the same basis. Confirmed
again with the Human Lead for this snapshot.

> Restoring from this folder alone gives you an app tree with no `data/`.
> Take that directory from `v3/data/` at the matching commit.

## Companion document

`doc/v3-baseline-2026-08-22-post-railway-migration.md` remains the infrastructure
reference: restore anchors, Railway topology, the full DNS zone state, the
environment-variable inventory, and rollback steps. It predates this snapshot but
nothing it describes has changed — the deployment, domains and data layer are as
recorded there.

Two things from it worth repeating, because both are expensive to rediscover:
Vercel still hosts the DNS zone even though Railway hosts the app, so
decommissioning must delete the Vercel **project** and never the **domain**; and
when adding a Railway custom domain, the TXT verification record must go in
**before** the CNAME.

## Version

No version bump accompanied either the export feature or the fix. `CLAUDE.md`
Rule V-1 requires Human Lead confirmation for every bump and R003 requires
`App.jsx` line 1, `index.html` title and `README.md` to move together; the Human
Lead declined the bump and confirmed the line is still `3.0.x` in intent. So
`3.1.0` here is the string the code carries, not a release claim — this folder
marks a state.
