(№ 131 - 02-07 '26 14:10 SGT)
<!-- Serial N assumed = 131 (next after the careers-source spec's No 130). Human Lead to reconcile against the serial-state counter per R011. -->

# SG Career View v3 - Employer registration pin + same-employer posting count (`EMP` arc)

> **Target repo path:** `v3/script/v3-employer-pin-spec.md` (build docs live in `v3/script/`).
> **Proposed version:** ships as **v3.0.184** on the flat patch line (never roll the minor). **G1 gate:** this spec is the gate; build does not start until STATUS is READY_FOR_BUILD and the Human Lead clears the one open provisioning question in EMP9.
> **Status:** READY_FOR_BUILD (deterministic core, EMP3-EMP4); the **map-pin visual (EMP5) is ADDITIVE-BLOCKED** pending EMP9.
> **Contract alignment:** locked v3 contract governs every line - deterministic = control; LLM = advisory only (no LLM authors an address, a count, or a coordinate); non-inventive (every field maps to a real source + is withheld over guessed); faithful fidelity (ACRA "na" -> withheld, never a fabricated address). Frozen door (`v3-result-engine-spec.md` §1) and house rules (`doc/CLAUDE-FULL.md` R001-R011, gates G1-G4, HDR blocks) bind this spec.
> **Reader priority:** (1) `result-engine-builder`, (2) Human Lead.

---

## EMP0. Scope (one paragraph)

Add an additive **"Registered employer"** block to the Posting Evidence Picker (Step 2). For a chosen posting it shows two deterministic, countable facts about that posting's employer: (1) the employer's **ACRA-registered address** (street / building / postal code), read from the already-shipped `api/ssic.js` `action:"lookup"` path, shown only on an **exact** ACRA match and otherwise honestly withheld; and (2) **"N other live postings from this same employer"**, counted client-side from the merged MCF + careers.gov.sg posting list already held in `PostingEvidencePicker` state. A map pin locating the postal code is specified as a **separate progressive-enhancement layer (EMP5)** that stays dark until a mapping provider + referrer-locked key are provisioned (EMP9); the address-and-count core ships without it.

**Placement decision (my call, stated as assumption):** Step 1 (role search) resolves to *many* employers, so there is no single employer "between Step 1 and Step 2" to pin. The smallest, non-restructuring home for a *per-employer* fact is the **existing per-posting full-ad view** (`fullAd` modal in `PostingEvidencePicker`) plus a **count chip on the card face**. This adds no new step, no new route, and touches the step flow zero times. If the Human Lead intended a company-first flow instead, that lives in `CompanyPanel` and is a different slice - flagged in EMP9.

---

## EMP1. Radicality band

**ADDITIVE.** One new isolated serverless file (`api/geocode.js`, EMP5 only), one new client helper (`fetchEmployerRegistration`), and additive render blocks inside `PostingEvidencePicker`. The deterministic core (EMP3-EMP4) reuses the **already-shipped** `api/ssic.js action:"lookup"` (v3.0.182, PR #256) and the **already-fetched** merged posting list - it authors no new number and adds no external dependency. Nothing on the frozen door (§1: search box, first-run, occupation resolve, Browse, data tables, `/api/claude`) is touched. The map layer (EMP5) is also additive but gated (EMP9); its provider fetch is server-side, so it needs **no `vercel.json` CSP edit** (see EMP6).

---

## EMP2. Grounded-in (named sources per claim)

| Claim rendered | Named source | Authority |
|---|---|---|
| Employer street / building / postal | `api/ssic.js` `mapAcraRow()` -> `street`/`building`/`postal`, from `acra_entities` (Postgres mirror) **or** `acraLiveLookup()` against data.gov.sg ACRA "Information on Corporate Entities" A-Z datasets (collection_id=2) | Authoritative (`source:"acra"`, `matched:"exact"` only) |
| "na" / blank suppressed | `api/ssic.js` `naToNull()` | ACRA data hygiene, already shipped |
| Namesake disclosure ("+N other entities share this name") | `api/ssic.js` `namesakes` field | Authoritative |
| "N other live postings from this same employer" | The merged `state.jobs` array in `PostingEvidencePicker` (MCF `normaliseJob.employer` + careers.gov.sg `agency`), grouped by normalised employer name | Countable fact from the already-fetched live posting list (no new fetch) |
| postal code -> lat/lng (EMP5 only) | forward geocode via chosen provider (EMP9) | External, paid/rate-limited; cached + exact-match-guarded |

**Non-inventive guard:** the address is shown **only** when `matched === "exact"`. A `fallback.source === "derived"` SSIC classifier result is **never** rendered as an address - if ACRA has no exact record, the block reads "No exact ACRA registration match" and stops. The engine withholds; it does not guess a location.

---

## EMP3. The same-employer posting count (deterministic, no new fetch)

- Compute in `PostingEvidencePicker`, from `state.jobs` (the merged, already-fetched MCF + careers.gov.sg list). No network call.
- Group by a **normalised employer key**: reuse the tokenising discipline already in the file (lower-case, trim, collapse whitespace); do **not** import `api/ssic.js`'s `normEntityName` (server-only). A small local `step2EmployerKey(job)` mirroring the "title|employer" signature style already used for CSG de-dup (`v3-careers-source-spec.md` §CSG3b).
- For a given card `c`: `count = state.jobs.filter(j => step2EmployerKey(j) === step2EmployerKey(c.job)).length`; display `count - 1` as "N other live postings from this employer" (the `- 1` excludes the posting in view). When `count - 1 === 0`, render "Only live posting from this employer in this result set" - a true statement scoped to the current search, **not** a claim about MCF globally.
- **Scope honesty:** the count is over the **current result set** (this role search, both platforms, live/open postings only). The footer states that window verbatim; it is never phrased as "total openings".

---

## EMP4. The ACRA address block (deterministic, reuses shipped lookup)

### EMP4a. Client helper (NEW)
`fetchEmployerRegistration(employerName)` - thin client wrapper:
```
POST /api/ssic  { action: "lookup", query: employerName }
```
- Returns the shipped envelope: `{ matched, source, street, building, postal, namesakes, primarySsicDescription, ... }` (EMP2). No shape change to `api/ssic.js`.
- Module-scope in-flight de-dup + a small `Map` cache keyed by normalised name (mirrors `acraLiveCache` posture) so re-opening the same posting does not re-hit the endpoint.
- Always resolves (never throws to render): on network failure return `{ matched: "none", reason: "fetch_error" }`.

### EMP4b. Render (additive, inside the existing `fullAd` modal)
- Fires lazily when the user opens a posting's full-ad view (`setFullAd(c)`), not for every card (keeps Step 2 load unchanged; ACRA lookup is one call per opened posting).
- On `matched === "exact"`: render address lines from `building` / `street` / `postal` (each shown only if non-null - `naToNull` already stripped "na"). If `namesakes > 0`, show "ACRA lists +N other entities with this name; showing the LIVE-status match" (disclosure, per the shipped `namesakes` semantics).
- On `matched !== "exact"`: render "No exact ACRA registration match for this employer name" - **do not** fall back to the derived SSIC classifier as if it were an address.
- **Provenance footer** (reuse the Step 2 / ReviewStudio footer pattern shipped in PR #257, v3.0.183): `Source: ACRA (data.gov.sg, Information on Corporate Entities) · Match: exact · Retrieved: <ISO>`. Confidence is carried as text, never colour-only (R: no red/green; user has deuteranopia). Touch targets on any control >= 44px; ASCII-only JSX.

---

## EMP5. Map pin (ADDITIVE, BLOCKED on EMP9 - progressive enhancement only)

Ships **dark** in v3.0.184; lights up in a follow-up PR once EMP9 clears. Designed so the deterministic core (EMP3-EMP4) is complete and shippable without it.

### EMP5a. `v3/api/geocode.js` (NEW serverless proxy, when unblocked)
- `POST /api/geocode { action: "locate", postal }` -> `{ matched, lat, lng, provider }`; forward-geocode the ACRA postal code (postal is the most exact, least ambiguous ACRA field). House pattern (per `api/ssic.js` `acraLiveLookup`): server-side `fetch` + `AbortController` timeout, module `Map` cache with TTL, **exact-match guard** (accept a geocode only when the provider returns a single high-confidence postal hit; otherwise `matched:"none"` - a fuzzy centroid is never presented as the pin). Always 200; graceful `{matched:"none"}` on failure.
- Provider recommendation (my call): **OneMap (Singapore Land Authority, data.gov.sg family)** - free, SG-gov, same non-inventive sourcing lineage as ACRA/MCF, and its search endpoint locates a postal code -> lat/lng without a Google billing key. `[UNVERIFIED: OneMap now issues a per-account token for some endpoints; exact auth for the search + static-map calls to be confirmed at build.]` Google Geocoding (the gia-web pattern) is the alternative and is the more expensive, key-gated path - see EMP9.

### EMP5b. Minimal pin renderer (NEW, ~30 lines - do NOT port gia-web `MapPane.tsx`)
- A single-pin static/leaflet-free map at the ACRA postal centroid. **Preferred:** proxy the provider's **static-map PNG** through `api/geocode.js` and render `<img src>` - this keeps `img-src 'self' data:` valid and needs **no CSP edit** (EMP6). No transport overlays, no clustering, no hawker/carpark layers (explicitly out of scope).
- Pin caption is the ACRA address text (EMP4), so the visual never asserts more precision than the source. If geocode `matched:"none"`, show the address text with "map unavailable" - the pin degrades, the fact does not.

---

## EMP6. Security / CSP / provenance

- **No CSP edit if the proxy pattern is used.** The browser calls only same-origin `/api/ssic` and `/api/geocode` (`connect-src 'self'` already covers both). The OneMap/Google fetch is **server-side** (Vercel egress, not browser CSP). A proxied static-map PNG served from `/api/geocode` satisfies `img-src 'self' data:`. **If** the builder instead chooses a client-side Google Maps JS embed, that **requires** `vercel.json` CSP additions (`script-src maps.googleapis.com`, `img-src maps.gstatic.com *.googleapis.com`, `connect-src maps.googleapis.com`) plus lifting `frame-src 'none'` - a real, flagged touch (EMP9). The proxy path is preferred precisely to avoid it.
- **No new PII.** ACRA registered address and UEN are public register fields; nothing beyond the shipped `mapAcraRow` output is stored or forwarded.
- **Provenance/honesty (CLAUDE-FULL §7):** every rendered fact carries Source / Match / Retrieved; count carries its result-set window; colour is never the sole signal.

---

## EMP7. Acceptance (testable, in-repo fixtures; determinism asserted)

Fixtures: `v3/Sample/` NHG + PSD postings; Metta uuid `2320493d…`.

1. **ACRA exact match:** `fetchEmployerRegistration("<PSD employer name>")` returns `matched:"exact"`, `source:"acra"`; the modal renders building/street/postal with only non-null lines; footer shows Source/Match/Retrieved. Two runs of the same name return byte-identical fields (determinism; served from cache on the second).
2. **ACRA no-match / withhold:** an employer with no exact ACRA record renders "No exact ACRA registration match" and **no** derived-SSIC address. `naToNull` "na" values never surface.
3. **Namesake disclosure:** an employer name with `namesakes > 0` renders the "+N other entities" line and the LIVE-status pick.
4. **Same-employer count:** in a role search where the NHG fixture returns >=2 postings from the same employer, an opened card shows "N other live postings from this employer" with N = (group size - 1); a sole-employer posting shows the sole-posting copy. Recompute over the same `state.jobs` is deterministic (pure function of the array).
5. **Resilience:** `/api/ssic` timeout/500 -> modal still renders the posting + count; address block reads "match unavailable"; no throw. Same for `/api/geocode` (map degrades to address text).
6. **Frozen-door / build:** `api/mcf.js`, `api/careers.js`, `api/ssic.js` (whole file - lookup reused, not modified), `api/claude.js`, `engine-data/*` byte-identical (R-FREEZE exit 0). Build green; live verify on v3.takearoundabout.com desktop + mobile (44px targets; ASCII-only).

---

## EMP8. Non-inventive gates (spec §6) + audits

- **G-source:** every rendered field maps to a named source (EMP2) or is withheld. Applies.
- **G-exact-match:** address shown only on `matched:"exact"`; geocode pin only on single high-confidence hit. Applies (the core guard of this slice).
- **G-fidelity:** ACRA "na"/blank -> withheld; count carries its result-set window. Applies.
- **G-no-LLM-number:** no LLM authors the address, the count, or the coordinate - all deterministic. Applies.
- **Audits:** this slice renders **live-read** artifacts (address + count) -> run the **G1-G8 live-read audit**. No static prompt is authored here, so the **D1-D8 static-prompt audit is N/A**.

---

## EMP9. Pre-mortem (spec §9 shape) + the one open question

| # | Failure mode | Guard |
|---|---|---|
| 1 | **No map key/provider provisioned** (confirmed: zero `MAPS`/`GEOCODE` env vars in `v3/api/*`, and `vercel.json` CSP blocks all external map hosts). Builder tries to embed Google Maps and ships a broken/CSP-violating pin. | **BLOCK EMP5 at G1.** Ship EMP3-EMP4 (address + count) only in v3.0.184. Map is a separate follow-up PR after the Human Lead answers the open question below. |
| 2 | Derived SSIC classifier result leaks in as an address when ACRA has no exact match | EMP4b hard rule: render only on `matched:"exact"`; `fallback.source:"derived"` is never shown as a location. Acceptance test 2. |
| 3 | Employer-name mismatch (MCF `postedCompanyName` vs ACRA registered name) yields silent `no_exact_match`, user thinks the tool is broken | Show the honest "No exact ACRA registration match" copy + the searched name, so the miss is legible, not a blank. Namesake disclosure covers the inverse (too many matches). |
| 4 | Count read as "total job openings at this employer" (over-claim) | Footer states the window verbatim: "in this result set (this search, MCF + careers.gov.sg, live postings)". Never "total". |
| 5 | Paid geocode/map call hammered per card | Lazy fire on full-ad open only (not per card); TTL `Map` cache + in-flight de-dup client-side and server-side (mirrors `acraLiveCache`). |

**OPEN QUESTION for the Human Lead (blocks EMP5 only, not the PR):**
Which mapping path do you want, and is a key provisioned?
1. **OneMap proxy** (recommended) - free, SG-gov, no Google billing, no CSP edit; I confirm OneMap's token requirement at build. Reply **1**.
2. **Google Maps** - needs a *fresh* API key referrer-locked to `v3.takearoundabout.com` (the gia-web key is locked to their domain and is **not** reusable), set as a Vercel env var, **and** a `vercel.json` CSP relaxation. This is a manual provisioning step the spec cannot resolve. Reply **2** and provision the key.
3. **Ship address + count now, defer the map entirely.** Reply **3**.

Absent an answer, the builder ships EMP3-EMP4 (which stand alone) and leaves EMP5 dark.

---

## EMP10. Change map (file-by-file, real symbols)

| File | Symbol | Action |
|---|---|---|
| `v3/src/App.jsx` | `PostingEvidencePicker` - add `step2EmployerKey(job)`, same-employer count in the `cards`/`fullAd` scope, `fetchEmployerRegistration` helper + cache, additive "Registered employer" block in the `fullAd` modal, count chip on `renderCard` face | **Touch** (additive blocks only) |
| `v3/api/ssic.js` | `action:"lookup"` path, `mapAcraRow`, `naToNull`, `acraLiveLookup`, `acraDbLookup` | **Freeze** (reused as-is; byte-identical) |
| `v3/api/mcf.js`, `v3/api/careers.js` | `normaliseJob`/`normaliseCsgJob` (`employer`/`agency` fields consumed by the count) | **Freeze** |
| `v3/api/geocode.js` | new proxy (EMP5) | **Add** - only when EMP9 unblocks; not in v3.0.184 |
| `v3/vercel.json` | CSP | **Freeze** (no edit under the proxy path; edited only if EMP9 answer = 2) |

---

**STATUS: READY_FOR_BUILD** (deterministic core EMP3-EMP4). Next agent: **`result-engine-builder`**. Build EMP3-EMP4 for v3.0.184; hold EMP5 until the Human Lead answers EMP9.

*End of spec.*
