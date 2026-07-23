# CLAUDE.md

> Auto-loaded by Claude Code at the start of every session in this repo. Supersedes the
> live-fetch and folder-taxonomy portions of `CLAUDE-FULL.md` v0.0.3 (see §0 below); carries
> forward its proven decision rules (§6.3) unchanged.

---

## 0. Contract

```yaml
contract:
  version: 1.0.0
  supersedes: CLAUDE-FULL.md v0.0.3
  last_updated: 23-07 '26   # see git log for this file's exact commit timestamp
  reconciliation_note: >
    CLAUDE-FULL.md (root and v3/doc/, identical) defined a doc/Chat + doc/Journal +
    .serial-state.yml folder taxonomy that was drafted 07-07 '26 but never bootstrapped
    (no such folders or state file exist in this repo). Its live time-fetch mandate
    (Rule TF-6/TF-9) is documented, by its own §15 worked example, as unreliable in this
    runtime (cached HTML, sensor-lag APIs, blocked egress) - its own case study concludes
    the human-stated-time fallback (TF-8) is what actually works, so this file promotes
    that fallback to the primary path. Its §6.3 decision rules (R001-R010) are proven and
    in force in practice - preserved verbatim in §2 below. Serial and paragraph syntax
    updated to the form settled on in the 23-07 '26 session (see §1).
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

**Time source.** No live clock is available in this environment (sovereign time-fetch endpoints are egress-blocked here - see the §0 reconciliation note). Derive the time from context: the newest timestamp actually present in the conversation (a webhook, a system date-change notice, or a time the user states). A time the user states is always authoritative and overrides any estimate.

**Freshness.** Re-derive the time on every reply from the newest available evidence - do not carry an old stamp forward unchanged once newer evidence exists. When the newest reliable timestamp is more than roughly an hour old, a new session is starting, or the gap since the last message is unknown, do not guess: ask once ("Time check: what's the current time and timezone?"), adopt the answer, and correct any drift on the next reply.

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

## 6. Retired

`CLAUDE-FULL.md` (root and `v3/doc/`) is retired by this file for the serial-number, paragraph-tagging, and time-fetch sections (§§3-5 of that file). Its folder taxonomy (`doc/Chat/`, `doc/Journal/`, `.serial-state.yml`, etc.) was never bootstrapped in this repo and is not adopted. §6.3's decision rules are carried forward unchanged in §5 above.
