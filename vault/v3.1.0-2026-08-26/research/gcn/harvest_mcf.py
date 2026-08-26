#!/usr/bin/env python3
"""Phase 0 harvester B — MyCareersFuture postings -> skill co-occurrence (offline substrate).

RUN THIS FROM A NETWORKED ENVIRONMENT. Authored in a sandbox whose egress policy BLOCKS
api.mycareersfuture.gov.sg (see data/PHASE0-FINDINGS.md), so it is UNTESTED here. It mirrors
the public, unauthenticated MCF v2 API the app's own (production-tested) v3/api/mcf.js uses:
  search: GET https://api.mycareersfuture.gov.sg/v2/jobs?search=<query>&limit=<n>&offset=<o>
          -> { results: [ { uuid, title, skills:[{skill}|str], categories:[...] }, ... ] }

We only keep, per posting, the SKILL TAG SET (j.skills -> list of names) + a few fields for
provenance. Skill co-occurrence (which skills appear together in one real posting) is the
INDEPENDENT signal the occupation text can't reproduce, and the whole reason the substrate
can beat a features-only baseline. Public data; still, harvest politely and store raw offline
(gitignored). Seed queries span the SSOC major groups so the sample isn't title-biased; widen
SEED_QUERIES or raise PAGES for a bigger sample (Phase-1 decision D1: ~3k postings / 90 days).

  python harvest_mcf.py                 # default sample (35 seeds x up to 10 pages)
  python harvest_mcf.py --pages 12      # deeper per-query, toward the ~3k Phase-1 target
The run is RESUMABLE and ADDITIVE: it reads any existing output, skips uuids already seen, and
appends only new postings - so re-running with more --pages or new seeds only grows the file.
Output: data/mcf_postings.jsonl   (one posting per line; deduped by uuid; gitignored)
"""
import json, os, sys, time, urllib.parse, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "data", "mcf_postings.jsonl")
# Proven endpoint from the production v3/api/mcf.js: GET /v2/jobs?search=&limit=&offset=
# (an earlier guess of POST /v2/jobs/search 404'd - the /search path does not exist).
MCF_BASE = "https://api.mycareersfuture.gov.sg/v2/jobs"
LIMIT = 30            # MCF page size
PAGES = 10           # pages per seed query (override with --pages; a query stops early when
                     # MCF returns an empty page, so this is a ceiling, not a fixed cost)
SLEEP_S = 0.5
TIMEOUT_S = 25

# Broad seeds spanning SSOC major groups so co-occurrence isn't one-domain biased.
# Two tiers:
#  (1) generic occupational stems - wide SSOC spread, keeps the sample from being title-biased;
#  (2) TECH-TARGETED seeds - added to thicken co-occurrence around software/data skills, which
#      the thin first harvest under-sampled (bare 'python'/'sql' had too few real neighbours to
#      bridge from). These pull postings dense in the exact skills the substrate was weakest on.
SEED_QUERIES = [
    # (1) generic occupational stems across SSOC major groups
    "manager", "engineer", "analyst", "executive", "officer", "assistant",
    "technician", "specialist", "developer", "consultant", "coordinator",
    "nurse", "teacher", "accountant", "designer", "operator", "sales",
    "administrator", "supervisor", "clerk",
    "finance", "marketing", "human resource", "logistics", "procurement",
    "researcher", "pharmacist", "electrician", "mechanic", "architect",
    # (2) tech-targeted seeds - close the residual software/data gap
    "software engineer", "data analyst", "data scientist", "python", "sql",
    "cloud", "cybersecurity", "devops", "machine learning", "full stack",
    "backend", "frontend", "network engineer", "database", "data engineer",
]


def get_json(url):
    req = urllib.request.Request(url, headers={"accept": "application/json"})
    with urllib.request.urlopen(req, timeout=TIMEOUT_S) as r:
        return json.load(r)


def skills_of(job):
    out = []
    for s in (job.get("skills") or []):
        name = s if isinstance(s, str) else (s or {}).get("skill", "")
        if name:
            out.append(name)
    return out


def categories_of(job):
    out = []
    for c in (job.get("categories") or []):
        name = c if isinstance(c, str) else (c or {}).get("category", "")
        if name:
            out.append(name)
    return out


def main():
    pages = PAGES
    if "--pages" in sys.argv:
        pages = int(sys.argv[sys.argv.index("--pages") + 1])
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    seen = set()
    if os.path.exists(OUT):
        for line in open(OUT):
            try: seen.add(json.loads(line)["uuid"])
            except Exception: pass
    print(f"{len(seen)} postings already harvested", file=sys.stderr)
    kept = 0
    with open(OUT, "a") as fout:
        for q in SEED_QUERIES:
            for page in range(pages):
                url = f"{MCF_BASE}?search={urllib.parse.quote(q)}&limit={LIMIT}&offset={page * LIMIT}"
                try:
                    data = get_json(url)
                except Exception as e:
                    print(f"  {q} p{page} ERROR {type(e).__name__}: {e}", file=sys.stderr)
                    time.sleep(SLEEP_S); continue
                results = data.get("results") or data.get("jobs") or []
                if not results:
                    break  # no more pages for this query
                for j in results:
                    uuid = j.get("uuid")
                    if not uuid or uuid in seen:
                        continue
                    sk = skills_of(j)
                    if len(sk) < 2:  # co-occurrence needs >=2 skills to contribute an edge
                        continue
                    seen.add(uuid); kept += 1
                    fout.write(json.dumps({
                        "uuid": uuid, "title": j.get("title", ""), "query": q,
                        "skills": sk, "categories": categories_of(j),
                    }) + "\n"); fout.flush()
                time.sleep(SLEEP_S)
            print(f"  seed '{q}' done; kept so far {kept}", file=sys.stderr)
    print(f"done -> {OUT}  ({kept} new postings this run)", file=sys.stderr)


if __name__ == "__main__":
    main()
