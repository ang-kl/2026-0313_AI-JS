(No 130 - 2026-06-20 SGT)

# SG Career View v3 - Second job source: careers.gov.sg (`CSG` arc)

> **Target repo path:** `v3/script/v3-careers-source-spec.md` (build docs live in `v3/script/`).
> **Status:** CONFIRMED/built (re-cut onto v3.0.91 main). Ships as **v3.0.93** (2026-06-20).
> **Contract alignment:** the locked v3 contract governs every line (deterministic = control; LLM = advisory narration only; non-inventive; faithful fidelity; `[UNVERIFIED]`/withhold over a guess). The frozen door (`v3-result-engine-spec.md` §1) and house rules (`doc/CLAUDE-FULL.md` R001-R011, gates G1-G4, HDR blocks) bind this spec. R-FREEZE runs before the PR.
> **Reader priority:** (1) Claude Code, (2) Human Lead.
> **Directive (Human Lead, 19-06 '26):** "include careers.gov.sg ... when I search you fire to two job platforms." Scope CONFIRMED = **Browse SG jobs AND the role-analyse posting pull** (both fire to both platforms). Approach CONFIRMED = **server-side proxy + this spec first, then build.**

---

## CSG0. Goal and thesis

Add **careers.gov.sg** (Singapore public-service jobs) as a **second live job source** that fires **alongside** MyCareersFuture (MCF). When the user (a) Browses SG jobs or (b) analyses a role, the app queries **both** platforms, normalises each careers.gov.sg record into the **exact same internal posting shape** MCF already uses, merges + de-duplicates the two lists, and labels each card by source.

**Thesis:** this is **additive**. The careers.gov.sg records flow through the *same* downstream pipeline (posting -> responsibilities -> skills -> AI-readiness) with no new number authored. The only behaviour change is *where the postings come from*. `/api/mcf.js`, `normaliseJob`, `mcfSearch` stay **byte-identical**; the frozen Browse path gains the smallest possible additive hook (one fan-out wrapper), authorised by the AU-7 in §8.

---

## CSG1. The source (named, grounded)

- **Repo:** `https://github.com/opengovsg/careersgovsg-jobs-data` (Open Government Products, **MIT licence**).
- **What it is:** a *data* repository - a GitHub Action periodically dumps all current SG public-service job listings to `data/job-listings.json` (a **flat JSON array**, no wrapper key). There is **no query API**; access is reading the raw file.
- **Connect:** `GET https://raw.githubusercontent.com/opengovsg/careersgovsg-jobs-data/main/data/job-listings.json` (server-side only; see §5).
- **Record schema** (`.github/instructions/job-listings.instructions.md`, all fields present in every record; text may be empty; HTML preserved -> sanitise):
  `platform`, `jobId`, `postingNo`, `agencyId`, `jobTitle`, `agency`, `agencyDescription`, `startDate` (ms epoch), `closingDate` (ms|null), `closingDateText`, `remainingDays`, `employmentType`, `employmentTypeCode`, `workArrangement`, `experienceRequired`, `experienceYearsMin` (num), `experienceYearsMax` (num), `field`, `fieldCode`, `functionalArea`, `functionalAreaCode`, `industry`, `educationCode`, `category`, `jobDescription`, `jobResponsibilities`, `jobRequirements`, `isNew` (bool), `location`. **No salary field.**
- **Canonical job URL** (by `platform`): `hrp` -> `https://jobs.careers.gov.sg/jobs/{platform}/{jobId}/{postingNo}`; `greenhouse` -> `https://jobs.careers.gov.sg/jobs/{platform}/{jobId}?gh_jid={jobId}`; `workable` -> `https://apply.workable.com/j/{postingNo}`.

---

## CSG2. The contract a careers.gov.sg record must normalise INTO (frozen MCF shape)

The MCF `normaliseJob` output (`api/mcf.js:125-173`) is the internal posting contract every downstream reader expects. A careers.gov.sg record maps as follows (deterministic; no LLM):

| Internal field (frozen MCF shape) | careers.gov.sg source | Note |
|---|---|---|
| `uuid` | `csg:${platform}:${jobId}:${postingNo}` | synthetic, stable, source-prefixed so it never collides with an MCF 32-hex uuid |
| `title` | `jobTitle` | trimmed |
| `employer` | `agency` | |
| `postedCompanyName` / `hiringCompanyName` | `agency` / `agency` | no poster/hirer split in CSG -> both = agency (so the agency-posted flag never false-fires) |
| `salaryMin` / `salaryMax` | `null` / `null` | CSG has no salary; card already renders salary conditionally |
| `employmentType` | `employmentType` | |
| `postedDate` | `new Date(startDate).toISOString()` | startDate is ms epoch |
| `expiryDate` | `closingDate ? new Date(closingDate).toISOString() : ''` | |
| `minimumYearsExperience` | `experienceYearsMin` (number, else null) | feeds the "< 4 yrs" fresh-grad scout |
| `positionLevels` | `[]` | CSG has no level taxonomy |
| `schemes` | `[]` | |
| `description` | `htmlToText(jobDescription + "\n\n" + jobResponsibilities + "\n\n" + jobRequirements)` capped | sanitised (HTML preserved in source) |
| `responsibilitiesText` | `htmlToText(jobResponsibilities || jobDescription)` capped | **CSG gives duties verbatim** - higher fidelity than MCF's regex extraction |
| `categories` | `[functionalArea, field, industry].filter(Boolean)` | drives the archetype filter |
| `skills` | `[]` | CSG has no skill tags; downstream `getSkillsFromPosting` extracts from text via ESCO/LLM regardless |
| `mcfUrl` | canonical CSG URL (CSG1) | the card's link field (source-agnostic "open posting" URL) |
| **`source`** (NEW, additive) | `"careers.gov.sg"` | new optional field; MCF jobs are tagged `"MyCareersFuture"` at the merge. Absent => treated as MCF. |

`htmlToText` is identical in spirit to `api/mcf.js:78-91`; the proxy carries its own copy (it must not import from the frozen file). **No field is invented; salary/skills/levels are honestly empty, not fabricated.**

---

## CSG3. New code (additive; isolated)

### CSG3a. `v3/api/careers.js` (NEW serverless proxy)
- `POST /api/careers` body `{ action: "jobs", title, limit?: 10 }` and `{ action: "job", uuid }` - **mirrors the `/api/mcf` request/response contract** so the client merge is symmetric.
- Fetches the raw dump (CSG1) **once**, caches it in module scope with a TTL (default 6h; the dump refreshes ~daily) + a hard size guard; on cold/expired cache, re-fetch with an `AbortController` timeout.
- Filters the array by the searched `title` (token match on `jobTitle`, same stop-word + tokenise discipline as MCF tier-3), ranks, caps, maps each hit through `normaliseCsgJob` (CSG2).
- Response: `{ jobs: [...normalised, source:"careers.gov.sg"], total, source: "careers.gov.sg", fallback?, message? }` - same envelope keys MCF uses, **always 200** with a warm-empty on failure (mirrors `/api/mcf` resilience).
- `action:"job"` returns one normalised posting by synthetic uuid (re-derives from the cached dump; CSG has no per-job endpoint).

### CSG3b. Client merge layer (NEW helpers; the smallest hook into the frozen flow)
- `fetchCsgJobs(title, limit)` - thin client wrapper over `/api/careers` (mirrors the existing MCF fetch shape).
- `mergeJobSources(mcfJobs, csgJobs)` - tag MCF jobs `source:"MyCareersFuture"`, CSG jobs `source:"careers.gov.sg"`; **de-dupe by `title|employer` signature** (lower-cased, trimmed) preferring the MCF record on collision (it carries salary + skill tags), marking the survivor `seenInBoth:true`; concatenate CSG-only after. Returns the same `{jobs, ...}` array shape the panel already renders.

---

## CSG4. Frozen-door touch points (the AU-7 surface) + fire points

Per `v3-result-engine-spec.md` §1 the **"Browse SG jobs card + `/api/mcf` browse path"** is FROZEN. Firing a second source necessarily adds one hook in two consumers. The design keeps the frozen *files/functions* byte-identical and adds the merge at the call boundary:

1. **Browse fire** - `McfJobsPanel` fetch effect (`App.jsx`): today it calls `/api/mcf {action:"jobs"}`. Change: also call `fetchCsgJobs(...)` in parallel and pass both through `mergeJobSources` before `setState`. **MCF request body byte-identical**; render/sort/filter logic untouched (it iterates the same fields). One additive block.
2. **Role-analyse fire** - `getJobsForRole()` (`App.jsx`, feeds `buildResponsibilitiesData`): today fetches `/api/mcf {action:"jobs", detail:true}`. Change: also pull `fetchCsgJobs(...)`, merge into the same `jobs[]` that builds the responsibilities corpus (`buildResponsibilitiesCorpus`). `getSkillsFromPosting`/`getSkills` contracts **untouched** (they consume `responsibilitiesText`/`description`, which CSG provides).
3. **Single-posting analyse** - `handleAnalysePosting(job)` already reads `job.responsibilitiesText || job.description` + `job.title/uuid/skills/mcfUrl`; a CSG-normalised job satisfies all -> **no change needed**.

**Byte-frozen (asserted by R-FREEZE):** `api/mcf.js` whole file (`normaliseJob`, `mcfSearch`, `extractResponsibilities`, `handler`), `getSkills`, `getSkillsFromPosting` contract, `searchOccupations`, `/api/esco`, `api/claude.js`, `engine-data/*`. The careers proxy is a **separate new file**; the two `App.jsx` fire points are **additive blocks** (the MCF call is preserved verbatim, the CSG call is added beside it).

---

## CSG5. Security / CSP / provenance

- **CSP unchanged.** The browser only calls `/api/careers` (same origin) -> existing `connect-src 'self'` covers it. The proxy -> `raw.githubusercontent.com` fetch is **server-side** (Vercel function egress, not subject to browser CSP). No `vercel.json` CSP edit.
- **Sanitise** all CSG text via `htmlToText` (HTML is preserved in the source). No PII beyond the public posting fields is stored or forwarded.
- **Provenance / honesty (CLAUDE-FULL §7):** each posting card shows its **source by text + icon, never colour alone** - e.g. `SG flag MyCareersFuture` vs `building icon careers.gov.sg`. A merged ("seen in both") card says so in text. Postings feeding the responsibilities corpus keep their existing Prov chips; no new number is authored, so no new Prov kind is added. CSG `isNew` is the source's own flag (labelled as such), distinct from the device-local "new vs seen" memory.

---

## CSG6. Radicality / version

- **Band:** `new_data_source_integration` -> realised on the flat patch line as **v3.0.93** (2026-06-20). V-1 Human-Lead confirmation received.
- **Frozen-door AU-7 (confirmed):** the directive deliberately extends the frozen "Browse SG jobs / `/api/mcf`" door to fan out to a second source. Recorded as an AU-7 amendment in `v3-result-engine-spec.md` §1 (the original "Browse SG jobs card" frozen row quoted verbatim; amendment appended as per AU-7 convention). Human Lead confirmed.

---

## CSG7. Test fixtures and verification (per PR)

- **Proxy unit:** `normaliseCsgJob` on a sampled real record from the live dump produces every frozen field; empty salary/skills/levels are `null`/`[]` (not fabricated); HTML stripped; synthetic uuid stable across two runs of the same record.
- **Merge:** a title that exists on both platforms de-dupes to one card flagged "seen in both"; CSG-only and MCF-only titles both survive; ordering stable.
- **Browse fire:** Browsing a public-service title (e.g. "policy analyst", "software engineer") returns a merged list with both source labels; the "< 4 yrs" scout still filters on `minimumYearsExperience`; MCF request body is byte-identical (network diff).
- **Role-analyse fire:** analysing a posting/role pulls CSG postings into the corpus; the responsibilities -> skills -> AI-readiness pipeline renders unchanged (just more/again-grounded duties); determinism: same inputs -> same engine output (R-SNAPSHOT unchanged).
- **Resilience:** raw-dump fetch failure/timeout -> warm-empty, MCF results still render (one source down never blanks the other).
- **R-FREEZE exit 0** (`api/mcf.js` + listed symbols byte-identical); **build green**; live verify on v3.takearoundabout.com (desktop + mobile).

---

## CSG8. Confirmations

1. **Frozen-door AU-7 (CONFIRMED):** the Browse/`/api/mcf` door fans out to careers.gov.sg via the additive merge (MCF path byte-untouched). AU-7 recorded in `v3-result-engine-spec.md` §1.
2. **V-1 version bump (CONFIRMED):** v3.0.93 (2026-06-20).
3. **Dump size / caching:** the full dump is fetched + cached server-side (6h TTL). Size guard at 50 MB.
4. **De-dupe preference (confirmed default):** on a title+employer collision MCF wins (richer fields), survivor flagged "seen in both".

---

*End of spec.*
