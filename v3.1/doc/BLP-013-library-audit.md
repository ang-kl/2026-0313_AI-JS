# BLP-013 - audit of the delivered-but-unconsumed review-state library

**Status: DRAFT, UNDER SUPERVISOR REVIEW. Not ruled. No engine code has been
written and none will be until the Blueprint Supervisor rules on this document.**

| | |
|---|---|
| Requirement | BLP-013, "Implement all first-class review operations" |
| Subject | `v3.1/src/review/reviewState.js` (291 lines) and `v3.1/tests/review-state-contract.mjs` (231 lines) |
| Tree audited | `origin/main` at `384e0e1`, branch at `7ca6931`, `git diff origin/main HEAD` empty |
| Authority for the terms | Blueprint Supervisor scope ruling, 2026-09-20 09:55 SGT, Q1 (a) to (e) |
| Written by | coordinating session, before any code |

---

## 0. What this audit is, and what it is not

The Supervisor ruled **audit-then-adopt**: audit the delivered library against the
acceptance criteria, adopt only what passes, record every adoption and every change
with its reason, and confer no retrospective provenance on `61531dc`.

It also ruled the decisive fact, which this audit verified independently before
proceeding:

```
$ git log --full-history --oneline --diff-filter=A -- \
    v3.1/src/review/reviewState.js v3.1/tests/review-state-contract.mjs
61531dc feat(v3.1): implement BLP-012 through BLP-028 (#508)
```

**Both files were introduced by the same undeclared merge.** The suite shipped with
its subject. It can therefore show that the two agree; it cannot show that either
matches the requirement. "It already passes 73 checks" is not independent evidence
of anything, and adopting the library on the strength of those checks would be the
circular form of the failure family this programme has now recorded six times.

So the 73 checks are a **subject** of this audit, not an instrument of it.

---

## 1. Method, stated with its limits

Two instruments, both run against the merged tree:

**Mutation testing.** Twenty-four deliberate defects, one at a time, each applied to
a *copy* of `reviewState.js`, with the delivered suite run against the copy. A
mutation the suite fails to notice is a defect the suite cannot see - a coverage gap
in the suite, not necessarily a defect in the library. Nothing tracked was modified:
the mutant and its test copy were created and removed per run, and `git status`
was clean before and after.

**Direct probes.** Three questions the suite does not ask at all, asked of the
unmodified library.

**What neither instrument can do.** Mutation testing proves a check *can* fail; it
cannot prove the check asserts the *right* thing. A mutation set is also only as
adversarial as the person who wrote it - the twenty-four defects below are the ones
I thought of, and their passing does not mean a twenty-fifth would be caught. Both
limits are stated here rather than discovered later.

---

## 2. Mutation results: 17 killed, 7 survived

| # | Deliberate defect | Result |
|---|---|---|
| M01 | `split` accepts a single part | KILLED |
| M02 | split overlay drops parent ids | KILLED |
| M03 | `merge` accepts one target | KILLED |
| M04 | overlay drops evidence ids | KILLED |
| M05 | `relabel` overrides the parent's origin | KILLED |
| **M06** | **`relabel` accepts an empty label** | **SURVIVED** |
| M07 | `escalate`/`withhold` need no reason | KILLED |
| **M08** | **`resolve` permitted from any status** | **SURVIVED** |
| **M09** | **`reopen` permitted from any status** | **SURVIVED** |
| M10 | `undo` always restores `open` | KILLED |
| M11 | history-prefix check removed | KILLED |
| M12 | any actor may decide | KILLED |
| M13 | stale targets allowed | KILLED |
| M14 | relabel provenance guard removed | KILLED |
| M15 | latest-event guard removed | KILLED |
| M16 | open-only guard removed | KILLED |
| M17 | `escalate` folds into `open` | KILLED |
| M18 | `withhold` folds into `open` | KILLED |
| M19 | overlay ids collide | KILLED |
| **M20** | **relabel invariant in `validateReviewState` removed** | **SURVIVED** |
| **M21** | **overlay-prefix check removed** | **SURVIVED** |
| **M22** | **source-immutability check in `validateReviewTransition` removed** | **SURVIVED** |
| M23 | a refusal appends history anyway | KILLED |
| **M24** | **`split` accepts more than one target span** | **SURVIVED** |

**The library survived every probe where the suite could see it.** Seventeen
deliberate defects were each caught. That is a real result and it counts in the
library's favour. The seven survivors are gaps in the **suite**, and each one leaves
a branch of the ruled criteria unverified.

### 2.1 What each survivor leaves unverified

- **M06** - the empty-label guard for `relabel` exists and is never exercised. Ruled
  criterion (1), "every canonical verb creates a guarded review-state transition",
  is unverified for this branch.
- **M08, M09** - the status preconditions for `resolve` and `reopen` are never
  exercised negatively. The suite only ever resolves an escalated item and reopens a
  resolved one, both of which are permitted. Nothing asserts that resolving an
  accepted item, or reopening an open one, is refused. This bears on ruled
  criterion (3): the guards that make reversibility orderly are untested.
- **M20** - `validateReviewState`'s relabel-provenance invariant (lines 282-285) is
  defensive: no state the library itself builds can violate it, so it never fires.
  To exercise it the suite must hand-construct a state with a mismatched relabel
  overlay and assert rejection. **This is the invariant that carries ruled criterion
  (2)** in its stronger, ruled form, and it is the one with no test.
- **M21** - the overlay-prefix half of append-only is untested. The suite tests the
  *history* prefix (line 205) and never the *overlay* prefix.
- **M22** - subtle and worth the detail. Line 203 *does* mutate the source text and
  assert an error matching `/source/`. It still passes with the transition-level
  source check deleted, because `validateReviewState` independently catches the
  same mutation with "review source text or hash changed; source is immutable",
  which also matches `/source/`. **The check is satisfied by a different guard from
  the one its message names.** The transition-level guard is untested, and the test
  reads as though it were covered.
- **M24** - `split` requires exactly one target span; the suite never splits two.

---

## 3. Probe findings: three things the suite does not ask

### 3.1 `undone` is a declared status that no operation can reach

```
declared statuses      : open, accepted, rejected, resolved, escalated, withheld, undone
status after undo      : open
"undone" reachable     : false
```

`applyReviewOperation` sets `restoredStatus` for `undo` to
`predecessors.get(...)?.previousStatus || "open"` - always a non-empty string. The
projection then takes `event.restoredStatus || statusAfter(event.verb)`, so the
`undo` branch of `statusAfter` (`"undone"`) is dead code and the status is
unreachable.

**And the suite asserts it.** Line 30 reads:

```js
ok(REVIEW_ITEM_STATUS.includes("withheld") && REVIEW_ITEM_STATUS.includes("undone"),
   "projection states disclose withheld and undone rather than folding them into open");
```

The message claims undone is disclosed "rather than folding into open". Measured, an
undone item folds into exactly the status the message denies - here, `open`. The
check passes because it tests **membership of a frozen array**, not reachability of a
projection. It is a check that cannot fail on the thing it claims, which is
precisely the category the Supervisor ruled must be **reported, not counted**.

This is the same failure family this programme has now recorded five times: an
instrument that cannot distinguish the declared from the real. Here it is a constant
standing in for a behaviour.

**Not a defect in the engine's behaviour** - folding an undone item back to its prior
status is arguably the correct product behaviour, and the alternative (a visible
`undone` state) is a product decision. It is a defect in the **vocabulary and its
test**: either the status is removed from the declared set, or it is made reachable
and the projection discloses it. That choice belongs to the Supervisor and, if it
touches what a person sees, to the Human Lead.

### 3.2 Origin inheritance holds for all five origins - and is tested for one

```
parent SOURCE_VERBATIM  -> overlay SOURCE_VERBATIM  INHERITED
parent DETERMINISTIC    -> overlay DETERMINISTIC    INHERITED
parent AI_ASSISTED      -> overlay AI_ASSISTED      INHERITED
parent USER_AUTHORED    -> overlay USER_AUTHORED    INHERITED
parent WITHHELD         -> overlay WITHHELD         INHERITED
```

The library satisfies ruled criterion (2) in its stronger form - relabel cannot
change the origin, it inherits the parent's - for every declared origin.

**The suite tests one of the five.** All three fixture spans are `SOURCE_VERBATIM`,
and the relabel assertion at line 107 hardcodes the expected value:

```js
eq(relabelRow.origin, ORIGIN.SOURCE_VERBATIM, "relabel keeps the parent's provenance exactly");
```

An implementation that always emitted `SOURCE_VERBATIM`, ignoring the parent
entirely, would pass that check. The check cannot distinguish inheritance from a
constant. M05 killed only because it substituted a *different* constant.

**One consequence to name rather than leave silent**, per the Supervisor's Q5
instruction: relabelling a `WITHHELD` parent yields a `WITHHELD` overlay. That is the
conservative direction and consistent with the protected scope "evidence
withholding", but it means a relabel can never lift a withholding - which is
correct, and should be a stated property rather than an accident of inheritance.

### 3.3 Merge across two sources preserves both, and is untested

```
sourceId=null  sourceIds=["src:probe","src:other"]  parents=["span:p","span:q"]
merged text (no request.text supplied) = "Alpha duty.; Beta duty."  origin=USER_AUTHORED
state still validates: true
```

Criterion (2)'s "preserve all source and parent identifiers" holds across sources:
`sourceIds` carries both, `sourceId` degrades to `null` rather than silently picking
one, and `validateReviewState` accepts either shape (line 278). Every merge fixture
in the suite shares a single source, so this path is unexercised.

**Second consequence to name.** With no `request.text`, the merged text is a
deterministic join of the parents' verbatim text - and is labelled
`ORIGIN.USER_AUTHORED`. That understates the provenance: nothing about that string
was authored by the user. It is conservative, and conservative is the right
direction for an honesty contract, but the Supervisor asked that the split/merge
origin decision be made deliberately rather than inherited.

On the related point the Supervisor raised: `split` labelling its parts
`USER_AUTHORED` is **correct and not merely conservative**, because a split part's
text comes from `request.parts` - the person types it. A split in this engine is not
an offset-based division of the source; it replaces one span with user-authored
parts that cite the parent. Whether that is the product's intended meaning of
"split" is a question I am raising, not answering.

---

## 4. Element-by-element adoption recommendation

Per Q1(b) each element is named with the observation that would have failed it.

| Element | Observation that would fail it | Shown failing | Recommendation |
|---|---|---|---|
| `FIRST_CLASS_REVIEW_OPERATIONS` | list differs from the eight | M-none needed; suite line 29 | **Adopt** |
| `REVIEW_ITEM_STATUS` | declares an unreachable status | probe 3.1 | **Adopt with change** - resolve `undone` |
| `createReviewState` | source/spans not frozen | suite line 34 | **Adopt** |
| `projectReviewItems` | status folds or mis-roots | M10, M17, M18 | **Adopt** |
| `seedReviewEvent` | admits a duplicate or invalid event | suite lines 58, 118 | **Adopt** |
| `applyReviewOperation` - `split` | single part; parent ids dropped | M01, M02 | **Adopt**; add the two-target negative (M24) |
| `applyReviewOperation` - `merge` | one target; evidence ids dropped | M03, M04 | **Adopt**; add multi-source coverage (3.3) |
| `applyReviewOperation` - `relabel` | origin overridden; guard removed | M05, M14 | **Adopt**; add empty-label (M06) and all-origins (3.2) |
| `applyReviewOperation` - `escalate` | no reason required; folds to open | M07, M17 | **Adopt** |
| `applyReviewOperation` - `withhold` | no reason required; folds to open | M07, M18 | **Adopt** |
| `applyReviewOperation` - `resolve` | permitted from any status | **not shown - M08 survived** | **Adopt pending** the negative test |
| `applyReviewOperation` - `reopen` | permitted from any status | **not shown - M09 survived** | **Adopt pending** the negative test |
| `applyReviewOperation` - `undo` | always restores open | M10 | **Adopt** |
| `operationGuard` - actor, stale, latest, open-only | each removed | M12, M13, M15, M16 | **Adopt** |
| `validateReviewTransition` - history prefix | removed | M11 | **Adopt** |
| `validateReviewTransition` - overlay prefix | removed | **not shown - M21 survived** | **Adopt pending** |
| `validateReviewTransition` - source | removed | **not shown - M22 survived** | **Adopt pending** |
| `validateReviewState` - relabel invariant | removed | **not shown - M20 survived** | **Adopt pending** |
| `refusal` | appends history | M23 | **Adopt** |

**Summary.** Fourteen elements adopt on evidence shown. Four adopt **pending** a test
that can fail, which this build must write before any of them may be counted. One
element - the status vocabulary - cannot be adopted unchanged, because it declares a
state no operation produces.

**No element was found that fails a criterion outright.** On the evidence of
twenty-four adversarial probes and three direct ones, the library's *behaviour*
satisfies criteria (1), (2) and (3) as ruled. What it lacks is a suite that could
have told us so.

---

## 5. Ruled criteria: where each stands before any code

| Criterion, as ruled | Library behaviour | Evidence today |
|---|---|---|
| (1) every canonical verb creates a guarded transition | Satisfied for all eight | 6 of 8 guard sets shown failing; M06, M08, M09, M24 leave four branches unverified |
| (2) split/merge preserve source and parent identifiers | Satisfied, including across two sources | M02, M04 shown; multi-source untested |
| (2) relabel cannot change the origin | Satisfied for all five origins | 1 of 5 tested; M20's invariant untested |
| (3) escalate/withhold require explicit reasons | Satisfied | M07 shown |
| (3) append-only is the mechanism | Satisfied for history; overlays unverified | M11 shown, M21 survived |
| (3) resolve/reopen/undo per-verb reversible | Satisfied; undo is itself undoable (probe: undo of undo returns `escalated`) | resolve->reopen and reopen->undo tested; undo->undo untested |

---

## 6. Questions the audit cannot settle, put to the Supervisor

1. **`undone`.** Remove it from the declared vocabulary, or make it reachable and
   disclosed? The second changes what a person sees and would need the Human Lead.
   The suite's line 30 must change either way, because its message is false today.
2. **Merge text provenance.** A deterministic join labelled `USER_AUTHORED`. Leave
   conservative, or label a no-text merge `DETERMINISTIC`? I recommend leaving it
   and recording the consequence - but the Supervisor asked for deliberate.
3. **The meaning of `split`.** User-typed parts citing a parent, not an offset-based
   division. Correct as built, but if the product means offsets, that is a different
   engine and a Human Lead question.
4. **The four "adopt pending" elements.** Confirm that writing the missing failing
   test is sufficient to adopt, rather than replacing the element.
5. **Disposal.** Nothing here recommends discarding the library, so the Supervisor's
   separate-ruling condition on deleting `reviewState.js` is not triggered.

---

*Audit instruments: `scratchpad/blp013/mutate.mjs` (24 mutations) and
`scratchpad/blp013/probe.mjs` (3 probes). Both are throwaway measurement tools, not
deliverables; the tests this build owes the register are the ones named in section 4
and they will live in `v3.1/tests/`.*
