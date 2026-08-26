(№ 1 - 09-06 '26 22:57 SGT)

# v3 Result-Engine - Recipes

> **Target repo path:** `v3/script/v3-result-engine.recipes.md`.
> Reusable build + prompt recipes for the result-page arc. Each recipe states **When**, the **Run** (a runnable command or a prompt skeleton), and the **Expect**. Recipes pair with the agents in `v3/agents/` and the spec `v3/script/v3-result-engine-spec.md`. House rules in `doc/CLAUDE-FULL.md` bind all of them. Hyphens only, never em/en dashes (R007).

---

## R-FREEZE - freeze-guard the door (propose as Rule R011)

**When:** before packaging ANY result-page PR. Asserts the "landing + search" surfaces did not move.

> **AU-7 amendment (11-06 '26, audit G1):** the prior Run block (superseded, kept for the record) extracted
> symbols with the unanchored awk `"/$sym/{f=1} f{print} /^}/{if(f)exit}"` and reported via
> `&& echo "FROZEN OK" || echo "BLOCK: ..."`. Two observed defects: (1) the unanchored pattern starts
> matching at ANY line containing the symbol name - during T3 it matched `searchOccupations` inside an
> HDR journal COMMENT and produced a false BLOCK; (2) the `|| echo` swallows the failing exit status, so
> a real BLOCK could not stop a pipeline - the recipe printed BLOCK yet exited 0. The corrected block
> below anchors the match to the function definition line (`^(async )?function <sym>(`) and accumulates
> a `fail` flag that becomes the exit code. Source wins; prior preserved verbatim above.

> **AU-7 amendment (ESCO-DIS, v3.0.57):** `getEscoSkills` is REMOVED from the byte-identical
> list below and demoted to a contract check (step 3 already greps it as a required global). Reason:
> spec §1 AU-7 (ESCO-DIS) made the occupation resolver an ADDITIVE + OPT-IN skill-overlap fix - the
> one-arg `getEscoSkills(title)` call path is unchanged, but the signature gained an optional second
> arg, so a byte-identical assertion would false-BLOCK a deliberate, Human-Lead-approved change.
> `resolveOccupation` (the original resolver) stays byte-frozen via the file check on `api/esco.js`
> being additive-only. Prior list preserved in git history; source wins.

**Run** (from repo root, against `main`; exits non-zero on any BLOCK):
```bash
# 1. Frozen symbols must be byte-identical to main (anchored to the definition line).
#    getEscoSkills demoted to a contract check (step 3) per AU-7 ESCO-DIS - additive optional arg.
git fetch origin main
fail=0
for sym in searchOccupations detectFunctionKeyword lookupSeniorMgmt \
           checkIscoCoherence getSkills getSkillsFromPosting ; do
  echo "== $sym =="
  if diff <(git show origin/main:v3/src/App.jsx | awk -v s="$sym" '$0 ~ "^(async )?function "s"\\(" {f=1} f{print} f&&/^}/{exit}') \
          <(awk -v s="$sym" '$0 ~ "^(async )?function "s"\\(" {f=1} f{print} f&&/^}/{exit}' v3/src/App.jsx) >/dev/null ; then
    echo "FROZEN OK"
  else
    echo "BLOCK: $sym changed"; fail=1
  fi
done
# 2. Data tables + claude proxy untouched.
if git diff --quiet origin/main -- v3/engine-data/aioe.js v3/engine-data/ssoc-isco.js \
   v3/engine-data/isco-soc.js v3/engine-data/provenance.js v3/api/claude.js ; then
  echo "DATA+PROXY FROZEN OK"
else
  echo "BLOCK: a frozen file changed"; fail=1
fi
# 3. R005 globals still present.
for g in C LEVELS PERSONA_CONFIG claudeCall extractJSON searchOccupations getSkills \
         rateSkills getEscoSkills escoUri escoDescription reuseLevel altLabels ; do
  grep -q "\\b$g\\b" v3/src/App.jsx || { echo "BLOCK: missing global $g"; fail=1; }
done
exit $fail
```
**Expect:** all `FROZEN OK` / no `BLOCK` and exit code 0. Any `BLOCK` exits 1, stops packaging, and is surfaced to the Human Lead.

---

## R-SPEC - enhancement to PR-sized spec slice

**When:** a new result-page idea arrives. Drives `agent spec-author`.

**Run** (prompt skeleton):
```
Use the spec-author subagent. Enhancement: "<one line>".
Produce doc/v3-<slice>-spec.md with: scope, radicality band (FROZEN/ADDITIVE/REWIRE/RADICAL-REPLACE),
file-by-file change map (real symbols only), grounded-in (named source per claim),
acceptance on the NHG/PSD/Metta fixtures with determinism, the spec-§6 gates that apply,
and a 3-5 row pre-mortem. Honour the frozen door (spec §1). Set STATUS READY_FOR_BUILD.
```
**Expect:** a slice that the builder can implement without a single invented symbol or unsourced claim.

---

## R-AUDIT - non-inventive conformance (D1-D8 + G1-G8)

**When:** after any result change, before a version bump. Drives `agent conformance-auditor`.

**Run** (prompt skeleton):
```
Use the conformance-auditor subagent on this diff.
1) D1-D8 (static) on every prompt template touched - confirm none can author a number that
   reaches the result page; JSON-only where the value feeds compute; no invention licence.
2) G1-G8 (dynamic) on a live read for NHG, PSD and Metta (uuid 2320493d…) - Prov chip on every
   figure; headline is ✓ computed; no LLM string parsed to a number; withhold over fabricate;
   range over point; engine-wins; determinism; provenance traceable.
3) Spec §6 hard gates: any FAIL blocks merge.
Report PASS/FAIL with file+line and a Critical/Warning/Suggestion fix list. Do not edit.
```
**Expect:** two tables (D1-D8, G1-G8), a hard-gate verdict, a prioritised fix list. No code edited.

---

## R-SNAPSHOT - engine determinism on the golden fixtures

**When:** in E2/H1/A8 and on every later PR that touches the engine. Determinism is the contract.

**Run** (Node, from `v3/`):
```bash
node --input-type=module -e '
import { computeEngine } from "./engine-data/engine-core.js";
// SSOCs as committed in v3/script/r-snapshot.golden.json (NHG/PSD title-matched from
// SingStat; Metta is the real MCF tag, uuid 2320493d0e875075d4dbfa6a893b3fdb).
const fixtures = [
  { name: "NHG-AD-TechStratPlanning", ssoc: "13304" },
  { name: "PSD-SrMgr-JobRedesign",    ssoc: "12131" },
  { name: "Metta-TransformationMgr",  ssoc: "13302" },
];
for (const f of fixtures) {
  const a = JSON.stringify(computeEngine({ ssoc: f.ssoc }));
  const b = JSON.stringify(computeEngine({ ssoc: f.ssoc }));
  console.log(f.name, a === b ? "DETERMINISTIC OK" : "NON-DETERMINISTIC FAIL",
    "| ok=" + JSON.parse(a).ok, "| index=" + (JSON.parse(a).exposure?.index ?? "withheld"));
}'
```
**Expect:** `DETERMINISTIC OK` for each; record the `index` + `zRange` + `coherence` as the committed snapshot. A changed snapshot must be explained in the HDR `[DELTA]`.

---

## R-PREMORTEM - failure-mode pre-mortem before a risky PR

**When:** before E2 (engine rewire), H1 (headline swap), D4 (FCF/ghost-post classifier), F5 (fairness).

**Run** (prompt skeleton):
```
Pre-mortem this PR: assume it shipped and quietly caused harm. List the top 5 ways it failed
(trust-eroding silent result change; SSOC-miscode mislabelled; ghost-post false positive;
US fairness threshold imported wrongly; frozen-symbol drift). For each: likelihood, the
earliest signal, and the guard already in spec §9 or a new guard to add. Output the spec-§9
table shape. Recommend whether to gate the PR behind a hand-labelled validation sample.
```
**Expect:** a 5-row table; at least one guard per row; an explicit go / hold-for-validation call.

---

## R-PORT - port a v2 "AI skilling" behaviour into a v3 result panel

**When:** a v2 (repo-root / `v2_2026-04-08/`) skilling behaviour should inform a v3 panel - **without** touching the v2 build and **without** importing v2's LLM-authors-the-number pattern (the exact thing the v3 contract fixes).

**Run** (prompt skeleton):
```
Identify the v2 behaviour: "<name>" (file + function in src/App.jsx or v2_2026-04-08/...).
Re-express it as a v3 panel that obeys the contract: the number/verdict moves to the engine
or server compute; the LLM is demoted to narration (~ AI estimate). Map old field -> new
Prov chip. Confirm the frozen door is untouched (R-FREEZE). Do NOT edit any v2 file.
Output: change map for v3 only + the demotion note for the journal.
```
**Expect:** a v3-only change map; v2 left byte-identical; the LLM-authored value demoted, not carried over.

---

## R-DEBUG - systematic result-page debug

**When:** a result figure is wrong, missing, or non-deterministic.

**Run** (ordered):
```
1. Reproduce on a fixture (NHG/PSD/Metta). Capture the exact /api/* request + response
   via the debug trail (?dmm=panel; src/debug.js fetch patch; /api/anatomy recentLogs).
2. Isolate the layer: is the bad value from the ENGINE (engine-core) or the LLM narration?
   If a number looks LLM-shaped on a ✓ computed chip -> contract breach, stop and fix the wiring.
3. For an engine number: re-run R-SNAPSHOT; check the SSOC->ISCO->SOC->AIOE chain in
   engine-core (ssocToIsco / iscoToSocs / exposureForIsco); confirm withhold-vs-fabricate.
4. For a build/MIME error: npm run build locally first; do NOT edit vercel.json routing (R008).
5. Fix the smallest cause; re-run R-SNAPSHOT + R-AUDIT + R-FREEZE; draft the [HDR] block.
```
**Expect:** root cause named by layer; the fix re-passes snapshot, audit and freeze; a journal-ready HDR.

---

*Recipes end. Pair R-SPEC -> (build) -> R-SNAPSHOT -> R-AUDIT -> R-FREEZE -> a11y review -> G1 version-bump gate for every PR.*
