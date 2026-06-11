# SG Career View v3 - Professional Read arc spec

> **Status:** active arc (Human Lead: "go until complete"). Flat `v3.0.<N>`; frozen door + R-FREEZE per
> `v3-result-engine-spec.md` §1. Contract: deterministic = control, LLM = advisory narration only,
> non-inventive, withhold over fabricate, no red/green, 44px + aria, R007 ASCII.
> Build order: PRO1 -> PRO5 -> PRO6 -> PRO4 -> PRO2 -> PRO3 (data-grounded first, narration last).

| PR | Slice | Grounded in | Accept |
|---|---|---|---|
| **PRO1** | Company Background + outsourced flag | Entities Registered with ACRA (data.gov.sg, `d_3f960c10...`); MCF postedCompany vs hiringCompany | SHIPPED v3.0.65: `acra` action in api/datagov.js (datastore_search, DATA_GOV_SG_API_KEY when present, NORMALISED EXACT-NAME guard - fuzzy hits withheld, verified live: "FINTECH SOLUTIONS" not shown for "PERCEPT SOLUTIONS"); postingMeta carries postedCompanyName/hiringCompanyName; `CompanyBackground` panel in Deep Read - register facts verbatim (UEN/type/status/since/address/namesakes) or withheld; flags: "posted by a third party" (poster!=hirer, computed) + "reads as a staffing firm" (shared _isAgencyName stems, derived) + tech-role caution (iscoMajor 2/3); deregistered-status warning; source/confidence/time-window footer. |
| PRO5 | Work-Mode Mix | the extracted duty texts (verb signals) | deterministic classifier: supervision / teamwork / self-contributor per duty; mix bar + duty evidence; mixed-mode caution tied to Role-Mix coherence; no LLM number |
| PRO6 | Same job, other names | ESCO altLabels (already on result); roleMix candidates; live MCF scan | "also advertised as" card: sibling titles with overlap evidence + live ads cited; deterministic overlap |
| PRO4 | Agentic shift | goal paper §3 phase 2 (control surface); w34854 new-task-creating | per-level operator->agent-crafter crosswalk (deterministic copy) on HIGH/MEDIUM skills + ONE Fable 5 role-level advisory line (no digits, duty-grounded, withheld thin) |
| PRO2 | Cover Letter Workbench | the extracted duties; CV evidence buckets (A/B/C) when pasted | Fable 5 scaffold-of-PROMPTS per paragraph - the model authors structure + questions ONLY, never the candidate's claims; Rehearsal triple-lock (HARD RULE + digit strip + duty-exists filter); withheld under thin duties |
| PRO3 | Explain this analysis | the panels that actually rendered for this result | Fable 5 collapsible reading guide; narration only, authors no number; grounded in the live tab list |

Gates per PR: R-FREEZE exit 0; D1-D8 on any new prompt; a11y self-check (44px/aria/no red-green/text-not-colour);
3-site bump + HDR + squash-merge + live-verify.
