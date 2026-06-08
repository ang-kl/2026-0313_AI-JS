# CLAUDE - READ ME FIRST
**Project:** MCF Role-Skill Graph + Inferred Org Chart
**Framework:** Output = ƒ(Prompt, Context, Constraints)
**Owner:** ang-kl · **Zone:** SGT (UTC+8) · **Last verified:** 08-06-'26

---

## QUICK START - pick one
- **Continue this project (render / build the React graph):** say `Read CLAUDE_READ_ME_FIRST.md and follow it`. Section 8 carries the build prompt - that one line is enough. Do NOT paste any external prompt.
- **Generate a fresh map (new role or employer):** run `python3 mcf_ingest.py "<MCF_JOB_URL>" 5`. The script already encodes the generator logic - running it beats re-prompting.
- **Change the methodology itself (e.g. add ESCO enrichment):** then, and only then, paste the external generator prompt and ask Claude to extend `mcf_ingest.py`.

---

## 0. Your task when you read this
Read the four files in the order below, confirm you understand the data contract,
then wait for the owner's instruction (typically: build the React bidirectional-highlight
prototype, or enrich each posting with SSOC/ESCO codes). Do **not** fabricate headcount,
reporting lines, or salaries — every inferred box stays labelled `[inferred]`.

## 1. Read order
1. `CLAUDE_READ_ME_FIRST.md` — this file (context + contract).
2. `mcf_ingest.py` — the ingestion engine; read top docstring + the EMIT contract.
3. `graph_spec.json` — the live output you will render from.
4. `orgchart.mermaid` — the generated org chart (Mermaid `graph TD`).
5. `provenance.json` — source + stated/inferred audit trail.

## 2. File manifest
| File | What it is | You use it to |
|---|---|---|
| `mcf_ingest.py` | Python (stdlib only). EXTRACT → CORROBORATE → CLUSTER → EMIT. | Re-run, extend `DEPT_RULES`, or add per-posting SSOC enrichment. |
| `graph_spec.json` | `target` role (R&R, qualifications, skills, SSOC, salary) + `corroboration_set` (29 live employer postings). | Render the 4-column role-skill graph and the org chart. |
| `orgchart.mermaid` | Inferred department tree with seniority + salary bands. | Display / paste into any Mermaid renderer. |
| `provenance.json` | Claim → source_url, stated vs inferred. | Keep every rendered claim auditable (OSINT discipline). |

## 3. Verified API (no browser / no MCP needed)
- **Single posting:** `GET https://api.mycareersfuture.gov.sg/v2/jobs/{uuid}` — no special headers.
- **Employer sweep:** `POST https://api.mycareersfuture.gov.sg/v2/search?limit=20&page=N`
  - headers: `Content-Type: application/json`, `mcf-client: jobseeker`
  - body: `{"search":"<employer name>","sortBy":["new_posting_date"]}`
  - **Trap:** body-level `companyUens` / `hiringCompanyUen` are *ignored*. Search by name,
    then **strict-filter client-side** on `postedCompany.uen`.
- `{uuid}` = the last hyphen-segment of the MCF job slug URL.

## 4. Run it
```bash
python3 mcf_ingest.py "<MCF_JOB_URL>" 5     # arg2 = max search pages
# writes: graph_spec.json | orgchart.mmd | provenance.json
```
Discipline baked in: 1s throttle, identified User-Agent, provenance on every claim.
Respect MCF / WSG terms and robots — slow and auditable, never indiscriminate.

## 5. Data contract (what the render must honour)
- Columns: `role → isco/ssoc → esco_skill → responsibility`.
- Every node carries `group` (left-rail cluster) + `exposure` (0-100 AI-exposure bar).
- **Edges are reversible** → this is what enables bidirectional click-to-highlight:
  click any branch, walk edges both directions, highlight the mirror set, dim the rest.
- Every node/role has `status`: `"stated"` or `"inferred"`.

## 6. Investigative lenses (already wired)
- **OSINT** — public API only; provenance logged.
- **FININT** — `salary_min/max` + `vacancies` + `applications` as hiring-demand signal.
- **HUMINT (analogue)** — `split_jd()` separates stated duties from implied requirements.
- **Behaviour-forensic** — `posted` vs `updated` gap flags stale reposts (the "tell").

## 7. Known limits (state these, don't hide them)
- Org chart = hiring-demand snapshot, **not** a true reporting structure (MCF exposes no
  reporting lines). Hierarchy beyond seniority tier is inferred from title keywords.
- `DEPT_RULES` is a first-match heuristic; the `Unmapped/Other` bucket shrinks as you add rules.
- SSOC sits in the **detail** fetch only; the search rows do not carry it. To label every
  org-chart node with an occupation code, add one `extract()` call per posting (throttled).

## 8. Suggested next prompt (paste to act)
> Using `graph_spec.json`, build a single-file React component that renders the four-column
> role-skill graph with a collapsible left rail grouped by `group`, and bidirectional
> click-to-highlight (selecting any node highlights its full connected mirror set across all
> columns, dims the rest; group headers highlight when any child is selected). Use the
> `exposure` field as a left-bar on each skill/responsibility node. Keep all state in React
> (no browser storage). Mark `inferred` nodes visually distinct from `stated`.
