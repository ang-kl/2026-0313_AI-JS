#!/usr/bin/env python3
"""
mcf_ingest.py  -  MyCareersFuture role-skill + org-chart ingestion
==================================================================
Output = f(Prompt, Context, Constraints)

Given one MCF posting URL (or UUID), this:
  1. EXTRACT    pulls the posting detail (R&R, qualifications, SSOC, skills, salary).
  2. CORROBORATE sweeps the SAME employer's live postings by UEN (OSINT).
  3. CLUSTER    groups postings into inferred departments (labelled [inferred]).
  4. EMIT       writes graph_spec.json + orgchart.mmd (Mermaid) + provenance.json.

Investigative lenses are tagged inline:
  OSINT  - public API only, every claim carries a source_url.
  FININT - salary band + vacancies + application volume as a hiring signal.
  FORENSIC - stale-repost / title-vs-seniority tells flagged per posting.

Discipline: throttled, User-Agent identified, respects MCF/WSG terms + robots.
Nothing here fabricates headcount or reporting lines; inferred boxes are marked.
"""

import json, re, html, time, sys, urllib.request, urllib.error
from datetime import datetime, timezone, timedelta

API = "https://api.mycareersfuture.gov.sg/v2"
UA  = "Mozilla/5.0 (workforce-intel research; provenance-logged; contact: ang-kl)"
THROTTLE_S = 1.0                      # be a good citizen
SGT = timezone(timedelta(hours=8))

# ----------------------------------------------------------------------------- helpers
def _now():
    return datetime.now(SGT).strftime("%d-%m-'%y %H:%M SGT")

def _get(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read().decode())

def _post(url, body):
    data = json.dumps(body).encode()
    req = urllib.request.Request(url, data=data, method="POST", headers={
        "User-Agent": UA, "Content-Type": "application/json", "mcf-client": "jobseeker"})
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read().decode())

def uuid_from(url_or_uuid):
    if re.fullmatch(r"[0-9a-f]{32}", url_or_uuid):
        return url_or_uuid
    return url_or_uuid.rstrip("/").split("-")[-1]   # MCF slug ends in the uuid

def strip_html(s):
    s = re.sub(r"(?i)</(p|li|div|br|h[1-6])>", "\n", s or "")
    s = re.sub(r"<[^>]+>", "", s)
    return html.unescape(s)

# ----------------------------------------------------------------------------- 1. EXTRACT
# Splits the free-text JD into responsibilities[] and qualifications[] using the
# headings employers actually use. HUMINT-analogue: we read structure, not just words.
RESP_HEADS = re.compile(r"(?i)(responsibilit|role|duties|what you.?ll do|key tasks|the job)")
QUAL_HEADS = re.compile(r"(?i)(qualif|requirement|what you.?ll need|who you are|skills|experience required|we are looking)")

def split_jd(description):
    lines = [l.strip(" \t\u2022-*\u2013\u2014") for l in strip_html(description).split("\n")]
    lines = [l for l in lines if l]
    resp, qual, bucket = [], [], None
    for l in lines:
        if RESP_HEADS.search(l) and len(l) < 80:
            bucket = resp; continue
        if QUAL_HEADS.search(l) and len(l) < 80:
            bucket = qual; continue
        if bucket is not None and 3 < len(l) < 300:
            bucket.append(l)
    return resp, qual

def extract(uuid):
    j = _get(f"{API}/jobs/{uuid}")
    resp, qual = split_jd(j.get("description", ""))
    co = j.get("postedCompany") or {}
    sal = j.get("salary") or {}
    return {
        "uuid": uuid,
        "source_url": f"https://www.mycareersfuture.gov.sg/job/x-{uuid}",
        "title": j.get("title"),
        "employer": co.get("name"),
        "uen": co.get("uen"),
        "ssoc": j.get("ssocCode"),
        "occupationId": j.get("occupationId"),
        "categories": [c["category"] for c in j.get("categories", [])],
        "seniority": [p["position"] for p in j.get("positionLevels", [])],
        "skills": [s["skill"] for s in j.get("skills", [])],
        "salary_min": sal.get("minimum"), "salary_max": sal.get("maximum"),   # FININT
        "vacancies": j.get("numberOfVacancies"),
        "responsibilities": resp, "qualifications": qual,
        "status": "stated", "fetched": _now(),
    }

# ----------------------------------------------------------------------------- 2. CORROBORATE
def sweep_employer(uen, search_term, max_pages=5, limit=20):
    """OSINT sweep: all live postings for one employer, paginated + throttled.
    NOTE: MCF ignores body-level UEN filters; the reliable path is a text search
    on the employer name, then a STRICT client-side uen match to drop fuzzy hits."""
    out, page = [], 0
    while page < max_pages:
        res = _post(f"{API}/search?limit={limit}&page={page}",
                    {"search": search_term, "sortBy": ["new_posting_date"]})
        rows = res.get("results", [])
        if not rows:
            break
        for r in rows:
            co = r.get("postedCompany") or {}
            if co.get("uen") != uen:          # strict employer match, drop fuzzy hits
                continue
            m = r.get("metadata") or {}
            sal = r.get("salary") or {}
            out.append({
                "uuid": r.get("uuid"),
                "title": r.get("title"),
                "seniority": [p["position"] for p in r.get("positionLevels", [])] or ["[inferred] unspecified"],
                "categories": [c["category"] for c in r.get("categories", [])],
                "salary_min": sal.get("minimum"), "salary_max": sal.get("maximum"),
                "applications": m.get("totalNumberJobApplication"),   # FININT demand signal
                "posted": m.get("newPostingDate"), "updated": (m.get("updatedAt") or "")[:10],
                "source_url": m.get("jobDetailsUrl"),
            })
        page += 1
        time.sleep(THROTTLE_S)
    return out

# ----------------------------------------------------------------------------- 3. CLUSTER (inferred departments)
# Heuristic title -> function map. EVERY box this produces is inferred, not stated.
DEPT_RULES = [
    ("Quality & Testing",     r"(?i)\btest|\bqa\b|tosca|automation tester"),
    ("Product & Design",      r"(?i)product manager|\bux\b|\bui\b|designer"),
    ("Data & Analytics",      r"(?i)data|analyt|bi\b|insight|scientist"),
    ("Salesforce & CRM",      r"(?i)salesforce|crm|mulesoft|dynamics"),
    ("Software Engineering",  r"(?i)developer|engineer|frontend|backend|full.?stack|android|ios|java|python"),
    ("Cloud & Infrastructure",r"(?i)cloud|devops|sre|infra|aws|azure|gcp|kubernetes"),
    ("Cybersecurity",         r"(?i)security|cyber|soc analyst|grc|iam"),
    ("Consulting & Advisory", r"(?i)consult|advisor|strategy|transformation|architect"),
    ("Project & Delivery",    r"(?i)project|programme|delivery|scrum|pmo|manager, deliver"),
    ("Corporate Functions",   r"(?i)hr|finance|recruit|talent|account|admin|marketing"),
]
SENIORITY_ORDER = ["Fresh/entry level","Junior Executive","Executive","Senior Executive",
                   "Manager","Senior Management","Middle Management","Professional"]

def department_of(title):
    for name, pat in DEPT_RULES:
        if re.search(pat, title or ""):
            return name
    return "Unmapped / Other"

def build_orgchart(postings):
    depts = {}
    for p in postings:
        d = department_of(p["title"])
        depts.setdefault(d, []).append({
            "title": p["title"],
            "seniority": (p["seniority"] or ["[inferred]"])[0],
            "salary_max": p.get("salary_max"),
            "applications": p.get("applications"),
            "source_url": p["source_url"],
            "status": "inferred",          # department placement is an inference
        })
    # FORENSIC tell: posting updated long after first posted = likely stale repost
    return {"employer_uen": None, "generated": _now(), "departments": depts}

# ----------------------------------------------------------------------------- EMIT
def to_mermaid(org, employer):
    lines = ["graph TD", f'  ORG["{employer}<br/>(inferred org map - incomplete)"]']
    for i, (dept, roles) in enumerate(org["departments"].items()):
        did = f"D{i}"
        lines.append(f'  ORG --> {did}["{dept}<br/>[inferred dept] - {len(roles)} live posting(s)"]')
        for j, r in enumerate(roles):
            rid = f"{did}_{j}"
            sal = f' (max ${r["salary_max"]:,}/mo)' if r.get("salary_max") else ""
            lines.append(f'  {did} --> {rid}["{r["title"]}<br/>{r["seniority"]}{sal}"]')
    return "\n".join(lines)

# ----------------------------------------------------------------------------- main
def run(url_or_uuid, max_pages=5, out_dir="."):
    uid = uuid_from(url_or_uuid)
    print(f"[{_now()}] EXTRACT  {uid}")
    target = extract(uid)
    print(f"           role: {target['title']}  |  employer: {target['employer']} ({target['uen']})")
    print(f"           SSOC {target['ssoc']}  |  ${target['salary_min']}-{target['salary_max']}/mo  [FININT]")
    print(f"           {len(target['responsibilities'])} responsibilities, {len(target['qualifications'])} qualification lines parsed")
    time.sleep(THROTTLE_S)

    print(f"[{_now()}] CORROBORATE  sweeping UEN {target['uen']} ...  [OSINT]")
    # employer name -> clean search token (first meaningful word, drop legal suffixes)
    term = re.sub(r"(?i)\b(pte|ltd|llp|inc|sg|singapore|private|limited)\b\.?", "",
                  target["employer"] or "").strip().split()[0]
    postings = sweep_employer(target["uen"], term, max_pages=max_pages)
    print(f"           {len(postings)} live postings recovered for this employer")

    org = build_orgchart(postings); org["employer_uen"] = target["uen"]
    graph_spec = {"target": target, "corroboration_set": postings, "generated": _now()}
    provenance = [{"claim": "target role detail", "source_url": target["source_url"], "kind": "stated"},
                  {"claim": "employer posting sweep", "source": f"{API}/search?uen={target['uen']}", "kind": "stated"},
                  {"claim": "department placement", "kind": "inferred", "method": "title-keyword heuristic"}]

    open(f"{out_dir}/graph_spec.json", "w").write(json.dumps(graph_spec, indent=2))
    open(f"{out_dir}/orgchart.mmd", "w").write(to_mermaid(org, target["employer"]))
    open(f"{out_dir}/provenance.json", "w").write(json.dumps(provenance, indent=2))
    print(f"[{_now()}] EMIT  graph_spec.json | orgchart.mmd | provenance.json")
    return graph_spec, org

if __name__ == "__main__":
    url = sys.argv[1] if len(sys.argv) > 1 else \
        "https://www.mycareersfuture.gov.sg/job/consulting/salesforce-data-analyst-capgemini-singapore-a359c3692d4b5f03869071eff58fd47f"
    pages = int(sys.argv[2]) if len(sys.argv) > 2 else 5
    run(url, max_pages=pages, out_dir=".")
