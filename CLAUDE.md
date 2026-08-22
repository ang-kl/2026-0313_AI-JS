# CLAUDE.md

@CLAUDE-protocol.md

The line above imports the project-neutral reply protocol — serial, time,
paragraph numbering, agent/token counts, the mental model, the custom
commands, and protocol points P1–P8. Same file in every repo. §§1–5 below
are this project's own and are NOT in the neutral copy: the serial rules
here carry detail the neutral §1 does not, and §3 (footnote attribution)
and §4 (result-page gates) exist only here.


> Auto-loaded by Claude Code at the start of every session in this repo. Supersedes the
> live-fetch and folder-taxonomy portions of `CLAUDE-FULL.md` v0.0.3 (see §0 below); carries
> forward its proven decision rules (§6.3) unchanged.

---

## 0. Contract

```yaml
contract:
  version: 1.5.0
  supersedes: CLAUDE-FULL.md v0.0.3
  last_updated: 22-08 '26   # see git log for this file's exact commit timestamp
  changelog:
    - version: 1.5.0
      date: 22-08 '26
      covers: [scripts/count-interactions.js, script/claude-code-deploy-prompt.txt, serial rebase records]
      change: >
        Closes the fourth defect named by the 22-08 '26 revision of the deployment
        prompt - the one the earlier three fixes left standing. Transcripts are keyed
        on the cwd PATH, not on the repository, so a repo opened at more than one path
        owns SEVERAL folders under ~/.claude/projects, and reading only the folder
        derived from the current cwd undercounts silently. The script now matches every
        folder whose name contains the munged repo-directory name, and prints each
        folder with its own session count so the scope of a measurement is visible
        rather than implied.
        The munge must happen BEFORE the compare, and this is where the deployment
        prompt's own STEP 5a scan was broken: it matched the RAW basename of the
        working directory against folder names in which Claude Code had already
        replaced "_", "." and spaces with "-". In this repo that meant
        "2026-0313_AI-JS" never matched "-home-user-2026-0313-AI-JS", so the step
        billed as the one most often got wrong could not run at all. It failed safely,
        exiting before SERIAL_MEASURED rather than printing a zero, but it measured
        nothing. Corrected in script/claude-code-deploy-prompt.txt, which entered the
        repo at 801aa83, and the corrected snippet was extracted from the tracked file
        and run to prove it.
        Also: --sessions on its own now implies --all. It is a scope flag, not a report
        flag, and alone it named a scope with nothing to report and printed usage -
        while STEP 6 asks for exactly that invocation.
        CLAUDE-protocol.md is deliberately UNCHANGED. The revision's PROTOCOL block
        would have removed §1's carried-forward-mode passage and reintroduced a
        cross-repo project name into §4 that PR #454 removed on the grounds that the
        file's own header forbids it; its SCRIPT block carries neither the multi-folder
        fix nor the partial-corpus ratchet. Adopting either verbatim would have traded
        merged decisions for a regression.
        Bump rationale: new_feature_added (the Serial rebase records section) alongside
        bug_fix (the folder scan), confirmed by the Human Lead in session before the
        work began.
    - version: 1.4.0
      date: 22-08 '26
      covers: [scripts/count-interactions.js, serial rebase record]
      change: >
        Ports the counting script the imported protocol has required since 1.3.0 and
        records this repo's serial rebase base, which together move protocol §1 out of
        carried-forward mode. Until now `node scripts/count-interactions.js --serial`
        failed with MODULE_NOT_FOUND here - the exact shape CLAUDE-protocol.md §1 calls
        out as "a mandatory instruction it cannot execute" - and §1's partial-corpus
        ratchet could not fire either, because it compares a measurement against a
        recorded baseline and no baseline existed in this file. Both halves are needed;
        one without the other leaves §1 half-on.
        The script implements the CURRENT protocol text, not the older draft in the
        deployment prompt: it matches BOTH subagent tool names (Task on older CLI
        builds, Agent on newer), prints tool_use_blocks_seen so a zero can be told from
        no-tool-calls-at-all, dedupes token usage on message.id (the transcript repeats
        one usage object per content block; summing per entry inflates every figure,
        measured at 1.91x), and reconciles the three input fields into tokens_in_total
        rather than reporting input_tokens alone. It also implements the ratchet: given
        --base, a measurement BELOW the base prints PARTIAL CORPUS and refuses to emit
        a next_serial, instead of letting the smaller number pass as diligence.
        No per-turn mode was added, so protocol §6 (the reply footer) stays OFF - §6
        turns on only in the same change that gives it real per-turn figures.
        Bump rationale: new_feature_added by this file's own bump_decision, which
        requires Human Lead confirmation (Rule V-1). Surfaced rather than assumed - the
        draft PR is the confirmation gate, and the diff is not merged until reviewed.
    - version: 1.3.0
      date: 22-08 '26
      covers: [PR 448, PR 450]
      change: >
        §6's own text replaced by an import of the shared CLAUDE-protocol.md at the repo
        root, and the commands registered as real slash-commands under .claude/commands/
        - previously §6 said, accurately, that no registration existed, so typing
        /UNDERSTANDING came back as an unknown command. FOUR commands now exist:
        /UNDERSTANDING, /GAPS, /DELTA and /INVARIANTS, the last added as the handle on
        P3 (state each material invariant Passed / Failed / Not Verifiable), which until
        then was the only protocol point without one. The eight-point discipline moved to
        the shared file as P1-P8; §§1-5 are unchanged and remain authoritative here.
        This version also covers #450's corrections to the imported protocol, each
        measured against a real corpus before landing: §4 matches both subagent tool
        names (Task on older CLI builds, Agent on newer - matching one reported a
        confident agents_total of 0 on a corpus that had subagent calls); §5 dedupes
        usage on message.id, because the transcript repeats one usage object per content
        block and summing per entry inflated every token figure 1.91x; and §1 gained the
        write-back rule for sessions whose transcript corpus was only partial.
        Recorded late: the import landed in #448 WITHOUT any bump, which the file's own
        bump_decision rule requires (identity_change / new_feature), and #450 then
        shipped a fourth command - also a new_feature - under the same unchanged version.
        PR #449, a parallel session's take on the same task, caught the first omission;
        Codex caught the second on this PR. 1.3.0 is declared as the contents of #448 and
        #450 together, so the version names what is actually in the file.
    - version: 1.2.0
      date: 22-08 '26
      change: >
        Added §6, a standing working protocol (Intent -> Interpretation -> Assumptions ->
        Invariants -> Execution -> Evidence) plus three in-conversation commands
        (/UNDERSTANDING, /GAPS, /DELTA) and an 8-point discipline for consequential
        replies (answer-first, source vs. inference, invariant pass/fail/not-verifiable,
        tool disclosure, deterministic calculation, gap/conflict flagging, pre-approval
        for consequential action, no invented model/routing/system metadata). Requested
        by the Human Lead as a durable session protocol, not scoped to one conversation.
        Old §6 (Retired) renumbered to §7; no other section changed.
    - version: 1.1.0
      date: 23-07 '26
      change: >
        §1 time source switched from passive context-derivation to an active per-response
        sandbox-clock fetch (`date -u` via Bash), after confirming the container clock is
        accurate (cross-checked against two independent GitHub webhook timestamps ~17
        minutes apart, agreement within seconds). CLAUDE-FULL.md's TF-6/TF-9 mandate was
        about *sovereign web-fetch* sources being unreliable in assistant-chat runtime
        (cached HTML, sensor lag) - it never tested the Claude Code sandbox's own system
        clock, which turns out to be trustworthy here. Ask-the-user remains the fallback
        for runtimes without Bash, or if the sandbox clock is ever caught drifting.
  reconciliation_note: >
    CLAUDE-FULL.md (root and v3/doc/, identical) defined a doc/Chat + doc/Journal +
    .serial-state.yml folder taxonomy that was drafted 07-07 '26 but never bootstrapped
    (no such folders or state file exist in this repo). Its §6.3 decision rules
    (R001-R010) are proven and in force in practice - preserved verbatim in §2 below.
    Serial and paragraph syntax updated to the form settled on in the 23-07 '26 session
    (see §1).
```

---

## 1. Reply serial number

Prefix every substantive reply with a serial tag on its own line:

```
№ N · DD-MM'YY HH:MM TZ
```

| Component | Rule |
|---|---|
| `№` | numero sign U+2116, literal |
| `N` | running counter; no leading zeros; thousands separated by a comma (`1,234`). Continue from the last serial seen in context - never restart at 1, including across a compacted or resumed session. If unknown, ask once, then continue. |
| `DD-MM'YY` | day-month-year, two digits each, apostrophe directly before the year, no space |
| `HH:MM` | 24-hour clock |
| `TZ` | short zone label (`SGT`, `UTC`, ...); default `SGT` unless the user states another zone, which then stays active until changed |

Example: `№ 1,024 · 23-07'26 20:08 SGT`

### Serial rebase records

```yaml
serial_rebase:
  - base: 49
    date: 22-08 '26
    measured: false
    source: >
      Carried forward from the last serial of the 2026-08-22 Vercel->Railway
      migration session, stated by the Human Lead in the handoff that opened the
      next session. It is a CARRIED figure, not a measurement - no full-corpus
      run of scripts/count-interactions.js has ever been made, because the script
      did not exist until this entry's own commit.
    corpus_note: >
      The first run of the new script, in the remote container of session
      0a895e14, measured serial 2 against this base of 49 and correctly printed
      PARTIAL CORPUS: that container held exactly one transcript - its own. This
      is the protocol §1 case, not a correction, and the base stands.
    next_action: >
      Run `node scripts/count-interactions.js --sessions --all --base 49` on the
      machine holding the FULL local transcript set. If the measurement comes
      back at or above 49, replace this entry with a measured one and set
      measured: true. If it comes back below, the corpus is still partial and
      this base continues to hold.

  - row: 2
    date: 22-08 '26
    where: >
      Remote container of session 0a895e14 (Claude Code on the web), project
      folder -home-user-2026-0313-AI-JS. One folder, one transcript - its own.
    measured: 16
    is_new_base: false
    derivation: >
      scripts/count-interactions.js --sessions --base 49, and independently the
      STEP 5a scan extracted verbatim from script/claude-code-deploy-prompt.txt.
      Both read the same single folder and agreed.
    ratchet: >
      16 is BELOW the base of 49, so it is refused as a reading and recorded
      only as a write-back. It is NOT a new base. This is the protocol §1 case
      working as intended, not a correction to row 1.
    why_recorded: >
      Protocol §1's write-back rule. Replies made in a container the local
      corpus never sees would otherwise leave no trace, so a later local
      re-measure reads low, gets discarded as partial corpus, and the count
      thereafter advances only by context-carried increments - the same drift
      arriving through the opposite door. The file is the ledger; a container
      is not.
    caveat: >
      Taken at commit time, not at session end, so it undercounts the replies
      made after it. Append a further row rather than editing this one.
```

Run the script with the base: `node scripts/count-interactions.js --serial --base 49`.
Protocol §1's write-back rule applies - a session whose corpus was partial appends its
reached count here at the end, because the file is the ledger and a container is not.

**Time source (fresh every response).** Before stamping the serial on any substantive reply, run `date -u` via Bash and convert from UTC to the active TZ (default SGT = UTC+8; see the TZ table if another zone is active). This is a genuine, no-egress, per-response live clock - not a passive wait for context evidence. Cross-check opportunistically against any timestamp present in context (a GitHub webhook, a system date-change notice); if the sandbox clock and a context timestamp disagree by more than a few minutes, trust the more specific/freshest source and note the discrepancy once.

**Sanity check.** Before trusting `date -u`, sanity-check the returned year/date against the conversation's known epoch (a container with an unset or broken clock can return an obviously wrong value, e.g. 1970 or a year that contradicts a recent webhook). If it looks wrong, don't use it - fall back to context-derived evidence.

**Fallback (no Bash available, or the sandbox clock is caught drifting).** Derive the time from the newest evidence in context; a time the user states is always authoritative and overrides any estimate. If no reliable evidence exists and more than roughly an hour may have passed, ask once ("Time check: what's the current time and timezone?"), adopt the answer, and correct any drift on the next reply.

---

## 2. Section and paragraph numbering

Once a reply has two or more distinct points, letter its sections and number paragraphs within each:

```
§N·A    - section A of reply N (B, C, ... for further sections)
¶A·1    - paragraph 1 within section A (restarts at 1 per section)
```

`§N·A` (with the reply number) marks a section header; `¶A·1` (with the section letter) marks a paragraph inside it. A bare `§n` with no dot (e.g. `§7`) is a spec/document section reference, not a reply address - the presence of a reply number or section letter plus a dot disambiguates. Short one-point replies need no markers.

---

## 3. Footnote attribution

Where a reply makes a nontrivial factual or methodological claim, close with a short line:

```
Footnote - attribution: <what grounds the claim - source, methodology, whose expertise>
```

Skip it on replies that don't need it (pure confirmations, simple lookups).

---

## 4. Result-page honesty and accessibility gates

Any change to a user-facing result page in this app must pass the non-inventive/honesty contract before merge: no red/green as the sole signal, state conveyed by shape or text rather than colour alone, 44px touch targets, aria labels, withhold rather than invent when data is missing, and the literal footer phrase "AI-assisted; human decides" plus a Source/Confidence/Time-window line. Run the `conformance-auditor` and `a11y-honesty-reviewer` agents before merging any such change. Full spec: `v3/script/v3-result-engine-spec.md` and `v3/script/v3-stewardship-spec.md`.

---

## 5. Decision rules (carried forward from CLAUDE-FULL.md v0.0.3 §6.3)

Proven in practice on this project ("Project A lineage", takearoundabout.com). Preserved verbatim; extend by appending a new `R0##` entry with source and confirmation gate when a new pattern is observed three or more times in a session, or the Human Lead states a new preference.

```yaml
rules:
  R001:
    name: redaction_across_data_embedded_UI
    if: organisation_names_replaced_throughout_data_embedded_dashboard
    then: bump_minor_not_patch
    rationale: redaction_changes_public_identity_warrants_version_identity_change
    source: builder-framework Session 6 28-03-26
    confirmation: human_lead_required

  R002:
    name: sed_cascade_corruption
    if: sed_replacement_with_overlapping_numeric_or_token_pairs_executed_in_sequence
    then: restore_from_last_known_good_zip_before_continuing
    rationale: cascading_substitutions_corrupt_originals_silently
    source: builder-framework v2 build day 23-03-26
    confirmation: human_lead_required_for_restore

  R003:
    name: multi_file_version_consistency
    if: version_bump_triggered
    then: update_all_of [App.jsx_line_1, index.html_title, README.md_heading_and_version]
    rationale: redaction_passes_on_one_file_do_not_cover_others
    source: builder-framework Session 6 28-03-26
    confirmation: human_lead_review_diff

  R004:
    name: plural_before_singular_sed
    if: sed_replacement_with_plural_singular_pair
    then: execute_plural_form_first
    example: UNIONS_to_FORCES_before_UNION_to_FORCE
    rationale: singular_first_double_hits_plural_producing_FORCESS
    source: builder-framework Session 6 28-03-26
    confirmation: residual_count_must_verify_zero_before_packaging

  R005:
    name: grep_before_packaging
    if: deployment_zip_about_to_be_created
    then: grep_for_critical_globals_in_App.jsx
    list: [C, LEVELS, PERSONA_CONFIG, claudeCall, extractJSON, searchOccupations, getSkills, rateSkills, getEscoSkills, escoUri, escoDescription, reuseLevel, altLabels]
    rationale: chat_compaction_silently_removes_module_level_constants
    source: builder-lens v2 build day 23-03-26
    confirmation: missing_constant_blocks_packaging

  R006:
    name: vite_v5_jsx_async_arrow
    if: multi_line_async_arrow_function_used_as_JSX_prop
    then: extract_to_named_function_above_return_statement
    rationale: vite_v5_esbuild_rejects_multi_line_async_arrow_in_JSX_props
    source: builder-framework v2 24-03-26
    confirmation: not_required_pattern_is_deterministic

  R007:
    name: non_ASCII_in_JSX
    if: em_dash_or_en_dash_or_dagger_or_triangle_or_arrow_in_JSX_string_literal
    then: replace_with_ASCII_equivalent_before_packaging
    rationale: esbuild_parse_failure_even_inside_quoted_strings
    source: builder-framework wfg-plans Session 4 26-03-26
    confirmation: not_required_pattern_is_deterministic

  R008:
    name: vercel_MIME_error_root_cause
    if: vercel_serves_text_html_MIME_for_javascript_request
    then: diagnose_npm_run_build_locally_first
    do_not: modify_vercel.json_routing_until_local_build_passes
    rationale: MIME_error_is_downstream_symptom_of_failed_build_not_routing_config
    source: builder-framework wfg-plans Session 4 26-03-26
    confirmation: human_lead_review_build_log

  R009:
    name: deploy_zip_filename_stability
    if: project_uses_terminal_deploy_workflow_with_fixed_filename
    then: never_serialise_zip_filename_with_version_or_date
    rationale: lead_runs_terminal_commands_must_not_retype_filenames
    source: builder-framework Section 8 wfg-plans Session 5 26-03-26
    confirmation: human_lead_required_to_change_zip_filename

  R010:
    name: document_update_method
    if: documentation_update_required
    then: unpack_then_append_XML_then_repack
    do_not: regenerate_document_from_scratch
    rationale: regeneration_loses_styles_fonts_paragraph_formatting
    source: builder-framework Session 6 28-03-26
    confirmation: human_lead_review_diff
```

**Rule V-1:** Every version bump gets reviewed and confirmed by the Human Lead before commit, except where a rule above marks confirmation `not_required`.

**Rule V-2:** When a rule's `if` clause matches, surface the rule ID, the trigger, and the prescribed action, and request confirmation before executing - unless `confirmation: not_required`.

### Version bump triggers

```yaml
bump_decision:
  major:
    triggers: [breaking_API_change, data_source_replacement, architecture_rewrite]
    confirmation_required: human_lead
  minor:
    triggers: [new_feature_added, data_redaction_across_data_embedded_UI, tool_rename, new_data_source_integration, identity_change]
    confirmation_required: human_lead
  patch:
    triggers: [bug_fix, copy_change, prompt_tweak, dependency_pin_update]
    confirmation_required: human_lead_optional
```

---

## 6. Working protocol: Intent -> Evidence

For any nontrivial task, frame the work through this chain rather than jumping straight
to execution:

```
Intent -> Interpretation -> Assumptions -> Invariants -> Execution -> Evidence
```

`Intent` - what the Human Lead actually wants. `Interpretation` - how the request is being
read. `Assumptions` - what's being treated as given without confirming. `Invariants` -
what must hold true regardless of approach taken. `Execution` - the actual work.
`Evidence` - what backs the result (source, tool output, calculation).

### Commands

REGISTERED, not merely conventional (changed 2026-08-22): the three
commands now exist as project slash-commands in
`.claude/commands/{understanding,gaps,delta}.md`, so typing `/UNDERSTANDING`
resolves against a real command instead of coming back unknown. The earlier
text here said no registration existed; that was accurate when written and
is no longer true. Their question text is in `CLAUDE-protocol.md` §10.

### Consequential-reply discipline

The eight points moved to `CLAUDE-protocol.md` P1–P8, imported at the top of
this file — same substance, lettered P1–P8 there so a bare "#N" in any repo
still means whatever that repo already numbers. What remains specific to
this project: the discipline layers onto, and does not replace, §§1-5 above
(serial number, section/paragraph tags, footnote attribution, result-page
gates, decision rules).

source: Human Lead session 22-07/2026-08-22, requested as a standing protocol

confirmation: not_required - reporting discipline, no code or data changed by adopting it

---

## 7. Retired

`CLAUDE-FULL.md` (root and `v3/doc/`) is retired by this file for the serial-number, paragraph-tagging, and time-fetch sections (§§3-5 of that file). Its folder taxonomy (`doc/Chat/`, `doc/Journal/`, `.serial-state.yml`, etc.) was never bootstrapped in this repo and is not adopted. §6.3's decision rules are carried forward unchanged in §5 above.
