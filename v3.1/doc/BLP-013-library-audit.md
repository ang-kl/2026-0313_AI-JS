# BLP-013 - audit of the delivered-but-unconsumed review-state library

**Status: RULED by the Blueprint Supervisor 2026-09-20 10:03 SGT (Part II), and the
three escalated questions ANSWERED by the Human Lead 2026-09-20 10:10 SGT (Part III).
Adoption approved as shaped. The build is unblocked except for one version-bump
authorisation named in Part III.**

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

**And the first limit has a measured instance inside this very audit, which the draft
stated and did not apply to itself.** The Supervisor found it. **M05 was killed, and
the test that killed it is still wrong.** Line 107 hardcodes `ORIGIN.SOURCE_VERBATIM`,
so it would pass against an implementation that ignores the parent entirely; M05 died
only because it substituted a *different* constant. Therefore:

> **A killed mutant does not certify its test.** Seventeen kills tell us seventeen
> specific defects would be caught. They do not tell us the seventeen assertions say
> what their messages say. **The survivors tell you where there is no check; the kills
> do not tell you the checks are right.**

That governs how the table below must be read, and it is repeated in the register
entry for the same reason.

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

**Read the 17 with the limit from section 1 attached.** They are evidence about the
library's *behaviour*, not a clean bill for the *assertions* that caught it - M05 is
the proof, having been killed by a test that is itself wrong. Nothing in this document
should be read as saying the delivered suite verifies the adopted elements.

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

**Summary.** Fourteen elements adopt **on behavioural evidence with the instrument's
limit named**: the mutations show the behaviour survives those defects; they do not
show the delivered assertions say what they claim. Six adopt **pending** a test that
can fail - the four above, plus relabel-across-origins and multi-source merge, which
the Supervisor promoted from probe findings to obligations. One element, the status
vocabulary, cannot be adopted unchanged because it declares a state no operation
produces.

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


---

# Part II - Supervisor ruling on this audit, and what it obliges

Ruled 2026-09-20 10:03 SGT. The Supervisor independently re-verified M22, probe 1,
probe 2 and M21 against the artefacts before ruling. Adoption is **approved as
shaped**. What follows is binding on the build.

## 7. The measurement the ruling asked for: is `origin` surfaced to a person?

The Supervisor attached a condition to ruling (ii) - *"if `origin` is surfaced to a
person anywhere in the product, put it to the Human Lead before building it. I have
not checked whether it is, and you should."*

**Measured: yes, in one place today, and as a raw machine token.**

| Site | How it appears | Visible to a person? |
|---|---|---|
| `review/ResumeClaimWorkbench.jsx:34` | `authorship: {claim.authorship.origin} · {claim.authorship.actorId}` inside the "Inspect evidence and overclaim risk" disclosure | **Yes** - renders the literal constant, e.g. `USER_AUTHORED`, fed from `resumeClaimData.js:76` |
| `ReviewStudioLegacy.jsx:33` | `data-window-origin={r.origin || ""}` | No - DOM attribute only |
| `PrintPackage.jsx:32` | `data-window-origin={r.origin || ""}` | No - DOM attribute, but it travels in the print package |

Two consequences. First, the vocabulary is already reaching a reader unglossed: a
person opening that disclosure sees `USER_AUTHORED`, a token written for a schema.
Second - and this is what the condition turns on - **review-overlay origin is not
surfaced today only because the studio has no verb controls at all.** BLP-013 adds
them. Whether the eight-verb controls disclose an overlay's origin is therefore a
decision this build makes, not one it inherits, and ruling (ii) is escalated to the
Human Lead accordingly.

## 8. The five questions, as ruled

**(i) `undone` - two faults, separated.** The *test* must be replaced in either branch
of the product question, by an assertion that drives an operation and reads the
projected status; that is owed, not escalated. The *vocabulary* declares a state the
engine cannot produce, and the default ruling is to **remove `"undone"` from
`REVIEW_ITEM_STATUS`**, because folding an undone item back to its prior status is
the behaviour that exists and is defensible. Escalated to the Human Lead as a narrow
question with that default. Noted for them: `REVIEW_STATE_VERSION` is `"1.0.0"` and
removing a member from a frozen exported vocabulary is a contract change, so the
version bump is reserved to them on the LEDGER_VERSION / ADAPTER_VERSION precedent.

**(ii) No-text merge - DETERMINISTIC, departing from this audit's recommendation.**
The audit recommended leaving it `USER_AUTHORED` as conservative. The Supervisor
ruled otherwise and the reasoning is better than mine: `ORIGIN` says how a *string*
came to exist, not who decided to make it, and the library already separates those -
the decision event carries `reviewerId: request.actorId` with `USER_AUTHORED`, the
system change event carries `SYSTEM_ACTOR` with `DETERMINISTIC`. Labelling the
overlay produced by that deterministic change `USER_AUTHORED` when no human supplied
a character of it is an **internal inconsistency inside the library**, not a
conservative choice. Ruled: no supplied text produces a `DETERMINISTIC` overlay;
supplied text produces `USER_AUTHORED`; both branches asserted by a test that can
fail. Declared as a **protected-scope touch** on *"deterministic and AI provenance
separation"*, in the direction of sharpening it. Escalated per section 7.

**(iii) Split - build what exists, disclose it regardless.** BLP-013 builds the engine
that exists: parts the person authors, citing the parent. Changing what "split" means
to a user is not this build's decision. The audit's reading that `USER_AUTHORED` is
*correct* for those parts, not merely conservative, is adopted. **But the disclosure
is not optional:** if the studio offers a control labelled "Split" and a person
expects the source text to be divided, the interface is lying to them. The control
must say, in the product's own words, that splitting replaces one span with parts you
write which cite the original, and does not divide the source text. That stands
whatever the Human Lead rules on the meaning.

**(iv) A failing test suffices, and is not a licence.** The survivors are gaps in the
instrument, not faults in the behaviour; replacing working code because its test was
weak would discard proven behaviour under the felt authority of having found
something. The condition is specific: **each new test must be demonstrated killing
the exact mutation that survived**, recorded with the failure it now produces.

**(v) Disposal untriggered.** `reviewState.js` is not to be deleted.

## 9. The obligations, as a checklist with a falsification against each

| # | Owed | Falsification required |
|---|---|---|
| 1 | empty-label guard for `relabel` | new test kills **M06** |
| 2 | `resolve` status precondition | new test kills **M08** |
| 3 | `reopen` status precondition | new test kills **M09** |
| 4 | relabel invariant in `validateReviewState` | new test kills **M20** |
| 5 | overlay half of append-only | new test kills **M21** |
| 6 | `split` one-target rule | new test kills **M24** |
| 7 | **tighten** the existing line-203 assertion | mutate text *and* hash consistently so `validateReviewState` passes and only `:257` can fire, or match the exact message - **a new test beside a loose one leaves the loose one for the next reader** |
| 8 | relabel origin inheritance | parametrised over all five origins, with fixtures that are **not** all `SOURCE_VERBATIM` |
| 9 | merge across two sources | fixtured; criterion (2) is *"preserve all source and parent identifiers"* |
| 10 | `undone` test | drives an operation and reads the projected status, in either branch of the product question |
| 11 | merge origin branches | both asserted, per ruling (ii) |

## 10. Record conditions

- Adopted elements are recorded as adopted **by this build**. `61531dc` is cited as
  the **origin of the material and never as provenance**. BLP-013's
  `implementationCommit` is the commit this build produces.
- The 17 kills are recorded with the section 1 limit beside them, **M05 named** as the
  instance that proves it.
- Every element **changed** - the `undone` vocabulary, the merge origin, and whatever
  the pending tests expose - is recorded as a change with its reason, never as an
  adoption.

## 11. Blocking

No engine code until escalations (i), (ii) and (iii) are with the Human Lead. Their
answers are not needed to begin the parts those questions do not touch; the questions
must be **asked before the build reaches them**, not after.


---

# Part III - Human Lead decisions on the three escalated questions

Put to the Human Lead 2026-09-20 10:10 SGT with the Supervisor's defaults stated, and
answered in the same turn. Each answer is recorded as given, with what it settles and
what it deliberately leaves alone.

## 12. The decisions

**(i) `undone` - REMOVE IT.** The Human Lead took the Supervisor's default. `"undone"`
comes out of `REVIEW_ITEM_STATUS`. An undo restores the item to the status it held
before - escalated, accepted, open - and the vocabulary now describes the engine that
exists rather than one that was declared and never built.

*Settled:* the vocabulary, and with it the honesty of the status list.
*Owed regardless:* the line-30 test is replaced by one that drives an undo and reads
the projected status, per the Supervisor's ruling that the test was owed in either
branch.
*STILL OPEN AND BLOCKING THAT ONE CHANGE:* removing a member from a frozen exported
vocabulary is a contract change. `REVIEW_STATE_VERSION` is `"1.0.0"` and under
CLAUDE.md Rule V-1 the bump is the Human Lead's to authorise, on the
LEDGER_VERSION / ADAPTER_VERSION precedent. Under `bump_decision` this reads as
`breaking_API_change` - a consumer switching on `"undone"` would break - which points
to `2.0.0` rather than `1.1.0`. **Surfaced per Rule V-2 and not chosen here.** Every
other obligation proceeds; this single edit waits on the bump.

**(ii) No-text merge - DETERMINISTIC.** The Human Lead took the Supervisor's ruling
over this audit's original recommendation. A merge with no supplied text produces a
`DETERMINISTIC` overlay; a merge with supplied text produces `USER_AUTHORED`. Both
branches get an assertion that can fail.

*Recorded as a change, not an adoption*, per the Supervisor's record conditions, with
its reason: labelling the overlay of a `SYSTEM_ACTOR` / `DETERMINISTIC` change event
`USER_AUTHORED` when no human supplied a character of the string was an internal
inconsistency in the library, not a conservative choice.
*Declared as a protected-scope touch* on *"deterministic and AI provenance
separation"*, in the direction of sharpening it.
*Deliberately NOT taken:* the third option, glossing the raw schema tokens wherever a
person meets them. So the measured finding in section 7 stands unremedied and is
recorded here as **known, owned and out of scope**: a person opening the "Inspect
evidence and overclaim risk" disclosure in `ResumeClaimWorkbench.jsx:34` still reads
the literal string `USER_AUTHORED`, a token written for a schema. That is a candidate
for its own requirement and must not be quietly folded into BLP-013.

**(iii) Split - BUILD AS-IS, LABEL IT HONESTLY.** BLP-013 builds the engine that
exists: parts the person authors, citing the parent, never an offset-based division of
the source text. The control must say so in the product's own words.

*Settled:* the engine, and that the wording is mine to draft rather than to bring back.
*Standing constraint from the Supervisor, unaffected by the answer:* a control
labelled "Split" that a reader takes as dividing the source text would be the
interface misleading them. The disclosure is a requirement of the build, not a
courtesy, and the browser suite must assert the disclosure is present - otherwise the
honesty obligation rests on a string nobody checks, which is the shape this audit
exists to refuse.

## 13. Build status after Part III

| Obligation (section 9) | Blocked? |
|---|---|
| 1-6, kill M06, M08, M09, M20, M21, M24 | No - proceed |
| 7, tighten the line-203 assertion | No - proceed |
| 8, relabel across all five origins | No - proceed |
| 9, multi-source merge fixture | No - proceed |
| 10, the `undone` test | No - proceed; branch decided by (i) |
| 11, both merge-origin branches | No - proceed; decided by (ii) |
| **Removing `"undone"` from `REVIEW_ITEM_STATUS`** | **YES - waits on the `REVIEW_STATE_VERSION` bump authorisation** |
| Studio controls for the eight verbs | No - proceed, with the (iii) disclosure |
