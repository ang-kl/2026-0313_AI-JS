# vault/v3.1.0

Snapshot of `v3/` at **`ai-job-analyser-v3@3.1.0`**, taken 2026-08-22 immediately
after v3 moved off Vercel onto Railway, before the next round of change.

Same purpose as `vault/v3.0.71`: a self-contained copy of the app tree at a
known-good point, independent of branch history.

## What this snapshot is

A copy of every **tracked** file under `v3/` at commit `dd01f34`, with one
deliberate exclusion (below). Built with `git archive`, so it contains no
`node_modules`, no `dist/` build output, and no `.env` files.

- 253 files, ~41 MB
- Includes the Railway-era additions: `server.js`, `railway.json`,
  `lib/admin/kv.js`, `lib/pg-sql-tag.js`
- `vercel.json` is retained — the Vercel deployment was still live and
  unchanged at snapshot time, and it is the rollback target

## What is NOT in here — read before restoring

**`v3/data/` is excluded.** It is ~652 MB, almost entirely the raw ACRA
corpus under `data/ACRA/`. Copying it would permanently double that volume in
git history for no recoverability gain: `v3/data/` is itself tracked, so any
commit already restores it.

`vault/v3.0.71` excluded it on the same basis.

> Restoring from this folder alone gives you an app tree with no `data/`.
> Take that directory from `v3/data/` at the matching commit.

## Companion document

`doc/v3-baseline-2026-08-22-post-railway-migration.md` is the reference for this
snapshot: restore anchors, Railway topology, the full DNS zone state, the
environment-variable inventory, what the shared-process model changed, the
verified state with its evidence, the known gaps, and rollback steps.

Read that before restoring. In particular it records two things that are
expensive to rediscover: Vercel still hosts the DNS zone even though Railway
hosts the app, and the TXT verification record must be added before the CNAME.

## Version

No version bump accompanied the migration. `CLAUDE.md` Rule V-1 requires Human
Lead confirmation for every bump, and R003 requires `App.jsx` line 1,
`index.html` title and `README.md` to move together. `3.1.0` is therefore the
same version string the code carried before the migration — this folder marks a
state, not a release.
