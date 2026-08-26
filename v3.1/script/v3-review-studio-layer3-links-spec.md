(№ 1 - 21-07 '26 09:00 SGT)

> **Serial-number note:** `doc/.serial-state.yml` was not found in-tree at author time (TF-9 runtime
> constraint); the counter above is provisional. Human Lead to reconcile against the live serial state
> before commit (Rule S-4). The date is anchored to the session `currentDate` 21-07-2026; time of day
> is an estimate, not a sovereign fetch (Rule TF-8 - user-stated authority pending).

# SG Career View v3 - Review Studio: Layer 3 AI-suggested cross-panel links (advisory only)

> **Target repo path:** `v3/script/v3-review-studio-layer3-links-spec.md` (build docs live in `v3/script/`).
> **Status:** READY_FOR_BUILD. **Proposed version:** flat patch line, `v3.0.<N+1>` per the result-engine-spec §11 AU-7 (11-06 '26 directive - no minor roll before v3.0.999). Version bump is a **G1 gate** (Rule V-1) - do not bump without Human Lead sign-off.
> **Contract alignment:** the locked v3 contract governs every line - deterministic = control; LLM = advisory narration only; non-inventive; faithful fidelity; `[UNVERIFIED]`/withhold over a guess. House rules in `doc/CLAUDE-FULL.md` (R005-R007, gates G1-G4, HDR) and the frozen door in `v3-result-engine-spec.md` §1 bind this spec. R-FREEZE runs before packaging.
> **Reader priority:** (1) Claude Code, (2) Human Lead.
> **Builder:** `result-engine-builder`. **Auditor before merge:** `conformance-auditor` (+ `a11y-honesty-reviewer`).

---

## 1. Scope

One new, opt-in **fourth link layer** in Step 3 Review Studio: dashed **AI-suggested** connectors between a left-panel manuscript phrase (responsibility / requirement / ad line) and a right-panel O-I-A card **or** skill that the three deterministic layers cannot join, because there is **no shared dissection-span id** between them. This is the sole inference layer in the connector subsystem. It proposes; it never asserts. Every suggestion renders visually distinct (dashed line + `AI-suggested - review` label + `AI estimate` chip), is off by default behind its own toggle, and resolves to exactly one of two user actions: **accept** (one click promotes it to a real blue locked link via the existing `addLink`) or **dismiss**. The engine authors no number, band, rank or verdict from this layer, and no Layer-3 suggestion is ever a locked fact until the human accepts it.

The existing three layers are untouched:

| Layer | Colour / shape | Source | Determinism | State |
|---|---|---|---|---|
| Amber hover-trace | solid amber `#b45309` | `deriveLinks(tab, d)` (`review/registry.jsx`) | deterministic, active-span gated | ephemeral |
| Grey provenance (L1) | thin faint grey `#94a3b8` | `autoLinks` useMemo, `showAuto` toggle | deterministic (card `sN` IS duty `sN`) | opt-in |
| Blue locked (user) | solid blue `#1d4ed8` | `links` state, `addLink`/`removeLink`, persisted `saveState("links")` | user-authored | persistent |
| Same-term highlight (L2) | (in progress) | deterministic token match | deterministic | opt-in |
| **AI-suggested (L3, this spec)** | **dashed violet, `AI-suggested - review`** | **`/api/claude` judge over deterministic candidate pairs** | **advisory - inference** | **session-only, never persisted until accepted** |

---

## 2. Radicality band

**ADDITIVE** (advisory-inference; net-new LLM surface in a previously LLM-free connector subsystem).

Justification: it adds a new opt-in feature that changes no existing computed value, no existing layer, no frozen surface and no engine output. Per `v3-result-engine-spec.md` §3, a new opt-in feature that authors no number is ADDITIVE, not REWIRE. The one novelty worth flagging in review: it introduces the **first LLM call into the connector subsystem**, which until now was deterministic end to end (amber/grey/blue/L2 all join on ids that already exist). That novelty is contained by the governance in §7-§8: the LLM only judges relatedness over an engine-enumerated candidate set and can only ever point at anchors the deterministic layers already own.

---

## 3. Change map (file by file - real symbols)

`Touch` = edit, `Add` = new, `Freeze` = leave byte-identical.

### `v3/src/ReviewStudio.jsx` - Touch (ADDITIVE)
- **Add** state, mirroring the `showAuto`/`links` idioms (near line 749 / 697):
  - `const [showSuggest, setShowSuggest] = useState(false)` - the opt-in toggle (off by default).
  - `const [suggestState, setSuggestState] = useState({ status: "idle", items: [] })` - `status: "idle"|"loading"|"ready"|"empty"|"error"`; `items: [{ id, from, to, dismissed }]` where `from`/`to` are the SAME anchor shape the blue layer uses (`{ t:'phrase'|'duty'|'oia'|'skill', id?, block?, quote?, pre?, suf? }`).
  - `const suggestSeq = useRef(0)`, `const suggestCacheRef = useRef({})` - per-posting memo so re-toggling never re-calls the LLM.
- **Add** `buildSuggestCandidates(dissection, skillObjs)` (pure, deterministic, no LLM): enumerate cross-panel pairs that the deterministic layers do NOT already join - each left phrase/duty span against each O-I-A card / skill that does **not** share its span id. Cap the candidate set (e.g. <=40 pairs, longest-phrase-first, same posture as `rsSkillTermRe`'s `slice(0,40)`) so the prompt stays inside `MAX_PROMPT_CHARS`. Returns `[{ fromId, fromQuote, toId, toLabel }]` keyed to ids that already exist in `dissection.spans` / `skillObjs`.
- **Add** `requestSuggestions()` - an async named function (R006: NOT an inline multi-line async arrow in a JSX prop). Guards: only runs when `showSuggest` flips on AND `suggestCacheRef` has no entry for `postingKey`; sets `status:"loading"`; calls `claudeCall(prompt, maxTokens, 1, SYSTEM_L3)` with the cheapest model (see §6); `extractJSON`s the reply; **filters every returned pair against the candidate set by exact id** (drop any `fromId`/`toId` not in the enumerated set - never mis-point); applies the engine-owned confidence threshold (§7); maps survivors to anchor pairs; sets `status:"ready"` (or `"empty"` when zero survive, `"error"` on any throw / malformed JSON -> draws nothing).
- **Add** `acceptSuggestion(item)` -> calls the EXISTING `addLink(item.from, item.to)` (promotes to a persistent blue locked link), then removes it from `suggestState.items`. **Add** `dismissSuggestion(id)` -> marks `dismissed`.
- **Add** the toggle button on the `duties` tab toolbar, beside the `showAuto` "Show connections" button (line ~1367). `aria-pressed={showSuggest}`, `minHeight: 44` (see §9 - the sibling `showAuto`/`linkMode` buttons are 36px; L3 ships at 44 and a follow-up lifts the siblings). Label `AI-suggested links` / `Suggestions on`. Distinct violet family styling (not blue, not amber, not grey).
- **Add** a `suggestLinks` array (analogue of `autoLinks`, line ~1174) passed to `<Desk .../>`: only non-dismissed `ready` items, each `{ id, from, to, kind:"suggest" }`.
- **Add** the L3 review affordance UI: a per-suggestion inline card (in the Locked-links bar region, line ~1391, or an adjacent "Suggested links" bar) listing each suggestion `from -> to` with an **Accept** button (44px, `aria-label="Accept AI-suggested link and lock it"`) and a **Dismiss** button. Header copy: `AI-suggested - review each before you keep it. These are guesses, not engine facts.`
- **Touch** the line legend (line ~1409) to add a fourth entry: dashed violet swatch = `AI-suggested (review)`, so no colour alone carries meaning (a11y).
- **Freeze** all deterministic paths: `buildDissection`, `deriveLinks`, `autoLinks`, `addLink`/`removeLink`/`anchorKey`, `showAuto`, the persist effect (`saveState("links")`). L3 items are **never** written to `saveState` until `acceptSuggestion` converts them into a normal blue link.

### `v3/src/review/Desk.jsx` - Touch (ADDITIVE)
- **Touch** the props destructure (line 46) to accept `suggestLinks`.
- **Touch** the measure effect (line 62-163): add a `suggestLines` pass identical to the `autoLines`/`userLines` both-endpoints-live rule (a suggestion with an unresolved endpoint simply does not draw - the same honesty guard the grey layer uses). Add `suggest` to `conn` state and to the effect dep key.
- **Touch** the SVG overlay (line 178-231): render `conn.suggest` as **dashed** paths in the violet family (`strokeDasharray="6 5"`, distinct hue), painted UNDER amber and blue so the user's own work reads on top, but visibly dashed so it never reads as a solid/committed line. A small inline `AI` glyph or the label sits at the midpoint; the `<svg aria-hidden="true">` keeps the textual review affordance (the Accept/Dismiss cards) as the accessible surface, not the SVG.
- **Touch** the overlay render gate (line 177) to include `conn.suggest.length > 0`.

### `v3/api/claude.js` - Freeze
- **No change.** L3 reuses the existing proxy exactly as the company-summary narration does. Provider chain (OpenAI-first, Anthropic gated) is untouched. This file is a frozen surface (`v3-result-engine-spec.md` §3).

### New API file
- **None.** No `/api/*` file is added. L3 is a client-side batched call through the frozen `claudeCall` -> `/api/claude`, in the same posture as FR1's `SYSTEM_FR` and D4/T3's inline reads.

### Out of scope (explicit)
- Persisting suggestions across sessions (they are session-ephemeral until accepted).
- Any engine number, band or score derived from a suggestion.
- Auto-accepting above any threshold (the human always decides).
- Layer 2 same-term (separate in-progress slice).
- The `market`/RoleGraph tab (no `data-node-anchor` yet, same deferral as `deriveLinks`).

---

## 4. Anchor / data model (reused, not invented)

L3 reuses the **exact anchor contract** the blue locked-link layer already ships (ReviewStudio.jsx line 690-721):

- **Element anchor:** `{ t:'duty'|'oia'|'skill', id, quote }` where `id` is a real `dissection.spans[*].id` (`s0..sN`, `q0..qN`) or a skill id. The card `data-oia-anchor` and duty `#li-<id>` selectors already exist in the DOM (Desk.jsx `rectOfAnchor`).
- **Phrase anchor (W3C TextQuote):** `{ t:'phrase', block, quote, pre, suf }` re-resolved to a `Range` at draw time via `findQuoteRange` (Desk.jsx) - survives re-render without mutating the manuscript DOM. This is the same TextQuote model P2 phrase-links use.

The candidate enumeration and the LLM judge operate **only over ids/quotes that already exist** in `dissection.spans` and `skillObjs`. The LLM is never asked to author an id, a quote, a coordinate or a number - only to judge relatedness of a pair the engine handed it. A returned pair whose ids are not in the enumerated candidate set is dropped (mis-point guard). `anchorKey` dedupe applies on accept, so accepting a suggestion that duplicates an existing blue link is a no-op.

---

## 5. How a suggestion is generated (the flow, with the number-firewall)

```
dissection.spans + skillObjs            (deterministic, already in state)
  -> buildSuggestCandidates()           ENGINE enumerates cross-panel pairs NOT sharing a span id
     [{ fromId, fromQuote, toId, toLabel }]  capped <=40, id-real
  -> claudeCall(SYSTEM_L3, cheapest model)  LLM JUDGES relatedness of each given pair
     returns JSON: [{ fromId, toId, related:bool, strength:"strong"|"weak" }]  (NO free-text ids)
  -> extractJSON + validate             malformed / non-array / unknown id  ->  DRAW NOTHING (status:error/empty)
  -> id-membership filter               drop any pair whose ids are not in the candidate set
  -> ENGINE confidence gate             keep only related===true AND strength==="strong"
                                        (the gate is engine-owned; the model's own words are NOT displayed)
  -> map to anchor pairs -> suggestLines (dashed, violet, AI estimate chip, Accept/Dismiss)
```

**The number-firewall (hard):** the LLM returns a boolean + a coarse categorical `strength`, and **neither is rendered as a number**. The threshold is a fixed engine constant applied client-side; the displayed footprint's "Confidence" is a **qualitative, engine-authored** label (`advisory - not a fact`), never the model's value. No LLM string is ever parsed into a number that reaches the page. If the model returns confidence as a float, it is ignored for display and used, if at all, only as the internal keep/drop gate. Withhold over fabricate: any parse failure, empty array, unknown-id, or below-gate result draws **nothing** (`status:"empty"`), never a wrong line.

`SYSTEM_L3` contract (new prompt template - D1-D8 applies):
- **D1** role: "You judge whether two short work phrases refer to related work. You do not rank, score, or invent."
- **D2** output: JSON-only array `[{fromId, toId, related, strength}]`, no prose, ids echoed verbatim from the input.
- **D4** no invention licence: "Use ONLY the given ids. Do not add pairs. If unsure, set related:false. Never guess."
- Cache key carries an `l3` version tag (D8); bump on prompt change.

---

## 6. LLM proxy usage (cheapest-model precedent)

Reuse `claudeCall(prompt, maxTokens, 1, SYSTEM_L3, model)` from `App.jsx` (line 1834) unchanged; route through the frozen `/api/claude`. Follow the **company-summary cheapest-model precedent**: request the cheapest model in the active chain (OpenAI-first per `claude.js` `DEFAULT_CHAIN`, Anthropic gated). One batched call per posting (all candidate pairs in a single request), memoised in `suggestCacheRef` by `postingKey` so re-toggling never re-bills (H1 idiom). `maxTokens` small (JSON verdicts only). G4 external-API-cost gate: this is a quota-consuming call - it fires **only** on explicit opt-in (toggle on), never on page load.

---

## 7. Rendering + honesty footprint (§7 of the engine spec)

- **Visually distinct from all three other layers:** dashed line (`strokeDasharray`), violet family (not blue/amber/grey), painted under the committed layers. A persistent `AI-suggested - review` label on each suggestion. The `AI estimate` Prov chip (`shared.jsx` PROV vocabulary, amber family) on the review card - this is the exact existing chip vocabulary, not a new one.
- **Per-suggestion footprint:** `Source: AI suggestion (LLM) - Confidence: advisory, not a fact - Time-window: this session`. Matches the artifact-footer contract (`Source - Confidence - Time-window`) already at the Studio footer (line 1439).
- **No red/green** anywhere; state carried by shape (dashed vs solid) + label + text, never colour alone. The fourth legend entry names the dashed violet swatch.
- **44px touch targets** on the toggle, Accept and Dismiss controls; `aria-label` on each (`"Accept AI-suggested link and lock it"`, `"Dismiss AI-suggested link"`, toggle `aria-pressed`). The SVG stays `aria-hidden`; the Accept/Dismiss cards are the accessible surface.
- **Human decides:** every suggestion is inert until accepted. Accept promotes to a normal blue locked link (persisted); dismiss removes it. Nothing auto-locks.

---

## 8. Non-inventive gates (which apply)

**Instrument D1-D8 (static, on `SYSTEM_L3`)** - REQUIRED, this is a new prompt template:
- D1 role bounded (judge, not author). D2 JSON-only, ids echoed. D3 the prompt **cannot author a number** reaching the page (boolean + categorical only, and even those are not displayed as values). D4 no invention licence (ids only, "if unsure, related:false"). D5 inputs scoped (phrase text + ids; no PII, no CV free-text into the judge). D6 determinism boundary stated (advisory; engine gate wins; the deterministic layers are unaffected). D7 failure behaviour = withhold/draw-nothing on malformed output. D8 `l3` cache-version tag bumps on prompt change.

**Instrument G1-G8 (dynamic, on a live read - NHG / PSD / Metta)** - REQUIRED:
- G1 the suggestion carries an `AI estimate` chip. G2 n/a (L3 authors no headline number). G3 **no LLM string parsed into a number** on the page (the firewall in §5). G4 unknown-id / unverifiable pair -> withheld, never drawn. G5 n/a (no crosswalk range here). G6 engine-wins (the deterministic layers and the confidence gate are authoritative; the LLM only proposes). G7 determinism of the deterministic layers is unchanged (L3 is explicitly advisory and may vary - it must therefore be visibly, permanently labelled advisory, which it is). G8 the suggestion's provenance footprint is present and traceable.

**Spec §6 hard gates (block merge):**
1. No LLM-authored number on the page - **enforced by the §5 firewall.**
2. Prov chip on every figure - the `AI estimate` chip + footprint on every suggestion.
3. Withhold / `[UNVERIFIED]` over fabrication - malformed/empty/unknown-id draws nothing.
4. Range over fake point - n/a (L3 emits no numeric estimate).
5. Snapshot determinism on the 3 fixtures - the **deterministic layers** stay byte-identical (L3 is off by default, so the default render is unchanged); assert L3 toggled off changes no existing snapshot.

R-FREEZE: assert the frozen symbols (`buildDissection`, `deriveLinks`, `autoLinks`, `addLink`, `anchorKey`, the `saveState("links")` effect, `api/claude.js`) are contract-unchanged before packaging.

---

## 9. Acceptance (testable, in-repo fixtures)

Fixtures: `v3/Sample/2026-0607_Job-Role_NHG_AD_Tech-Strategic-Planning-2.md` (+PDF), `v3/Sample/2026-0607_Job-Role_PSD_Senior-Mgr-AD_Job-Redesign-2.md` (+PDF), Metta uuid `2320493d0e875075d4dbfa6a893b3fdb`.

1. **Off by default:** on first load of Step 3 for any fixture, no dashed line and no suggestion card renders; `showSuggest === false`; no `/api/claude` L3 call fires (network assert).
2. **Opt-in fires once:** toggling `AI-suggested links` on issues exactly ONE batched `claudeCall`; toggling off then on again issues zero further calls (cache hit).
3. **Distinct render:** any drawn suggestion is dashed + violet + carries `AI-suggested - review` + the `AI estimate` chip + the `Source - Confidence - Time-window` footprint; it is visually and textually distinguishable from amber/grey/blue with colour removed (a11y: shape+label).
4. **No mis-point / withhold:** feed a malformed JSON stub and a stub returning an id not in the candidate set - the layer draws NOTHING in both cases (`status:"empty"`/`"error"`), never a wrong line.
5. **Number-firewall:** grep the L3 render path - no `Number(...)`/`parseFloat(...)` over any `claudeCall` reply field reaches a rendered value; the displayed Confidence is the fixed engine string, not a model value.
6. **Accept promotes:** clicking Accept on a suggestion calls `addLink` and the pair appears in the persistent blue Locked-links bar (`saveState("links")` written); the suggestion leaves the L3 set. Dismiss removes it with no persistence.
7. **Determinism of neighbours:** with L3 off, `computeEngine` and the deterministic connector snapshots for all 3 fixtures are byte-identical to `main` (L3 changes nothing when off).
8. **44px + aria:** toggle, Accept, Dismiss each >=44px with an `aria-label`; toggle carries `aria-pressed`.

Determinism note: L3 output itself is advisory and MAY vary run to run - this is why it is permanently, visibly labelled advisory and never persisted until the human accepts. The determinism assertion binds the deterministic layers and the default (off) render, not the LLM verdicts.

---

## 10. Pre-mortem (run before build)

| # | Failure mode | Likelihood | Guard |
|---|---|---|---|
| 1 | LLM returns a confidence float that leaks onto the page as a displayed number | Med | §5 firewall: model numbers are never rendered; Confidence is a fixed engine string; acceptance test 5 greps the render path |
| 2 | Model points at an id/quote that is not on-screen -> a line to nothing (mis-point) | Med | id-membership filter drops unknown ids; Desk both-endpoints-live rule draws nothing for unresolved anchors (same guard as grey layer) |
| 3 | Suggestion read as a committed fact rather than a guess | Med | dashed shape + `AI-suggested - review` label + `AI estimate` chip + inert-until-accepted; painted UNDER the committed layers |
| 4 | Toggle-on bills the LLM repeatedly / on every render | Low-Med | one batched call per posting, memoised by `postingKey` in `suggestCacheRef`; fires only on explicit opt-in (G4) |
| 5 | Malformed JSON blanks or crashes the connector overlay | Low | `status:"error"` path draws nothing and leaves amber/grey/blue intact; `extractJSON` try/catch; withhold over fabricate |
| 6 | New inference path drifts a frozen deterministic symbol during the big edit | Low | R-FREEZE before packaging; L3 adds only new state + a new candidate/render path, touches no frozen function |
| 7 | em/en dash or non-ASCII in the new JSX strings | Low | R007 - ASCII, hyphens only; label copy uses hyphens |

---

## 11. Version gate

On landing: surface `Rule V-1 / G1` to the Human Lead - `L3 AI-suggested links: new opt-in advisory connector layer. Prescribed: bump v3.0.<N> -> v3.0.<N+1> (new feature, flat patch line). Confirm? (yes/no/modify)`. On yes: R003 x3 (App.jsx header line 1, index.html title, package.json), HDR journal entry, `.serial-state.yml` bump, live verify desktop + mobile on the 3 fixtures (dashed violet present only when toggled on; no red/green; 44px; Accept promotes to blue).

```
[HDR] #NNN | HH:MM:SS SGT DD-M-YY | v3.0.N | NNNkb | N,NNN lines
[INTENT] Layer 3 AI-suggested cross-panel links (advisory, opt-in) in Review Studio
[DELTA] one line per change
[RISK] Med - first LLM call in the connector subsystem; contained by the number-firewall + opt-in
[STATUS] BETA
[TEST] D1-D8 on SYSTEM_L3 + G1-G8 on NHG/PSD/Metta + off-by-default snapshot
[NEXT] one action for the Lead
[ADVICE] JSON-only judge contract + id-echo - the model classifies, the engine gates
```

---

## 12. Proposed new rule (G3)

**R012 (propose, do not assume):** *inference-into-a-deterministic-subsystem gate.* When a new LLM/embedding call is added to a subsystem that was previously deterministic end to end (here: the Review Studio connector layers), it MUST (a) be opt-in and off by default, (b) render visually distinct from every deterministic sibling by shape+label, not colour alone, (c) pass the number-firewall (no model value rendered), and (d) draw nothing on malformed/uncertain output. Surface to the Human Lead via G3 before adoption.

*End of spec. Layer 3 is READY_FOR_BUILD. Next agent: `result-engine-builder`; audit before merge: `conformance-auditor` + `a11y-honesty-reviewer`.*
