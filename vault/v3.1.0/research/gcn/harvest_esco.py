#!/usr/bin/env python3
"""Phase 0 harvester A — ESCO occupation -> skill relations (offline substrate build).

RUN THIS FROM A NETWORKED ENVIRONMENT. It was authored in a sandbox whose egress policy
BLOCKS ec.europa.eu (see data/PHASE0-FINDINGS.md), so it is UNTESTED end-to-end here. It
mirrors the request shapes the app's own (production-tested) v3/api/esco.js uses:
  search:      GET {ESCO_BASE}/search?text=<title>&type=occupation&language=en&selectedVersion=v1.2.0&limit=10
  occupation:  GET {ESCO_BASE}/resource/occupation?uri=<uri>&language=en&selectedVersion=v1.2.0
               -> _links.hasEssentialSkill[] / hasOptionalSkill[]  (each: {title, uri, skillType})

Enumeration: every leaf occupation in engine-data/ssoc2024-hierarchy.json is resolved to an
ESCO occupation by title search (the same path api/esco.js uses), then its essential +
optional skills are pulled. Output is one JSON object per line (resumable): rerunning skips
occupations already in the checkpoint. Title->ESCO search can mis-resolve (documented in the
SSOCRG spec); acceptable research noise, and every row records the resolution so Phase 1 can
filter. CC-BY: attribute ESCO (European Commission) in any published result.

  python harvest_esco.py                 # full run, resumable
  python harvest_esco.py --limit 25      # smoke test on 25 occupations
Output: data/esco_occupation_skills.jsonl   (gitignored)
"""
import json, os, sys, time, urllib.parse, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
ENGINE = os.path.normpath(os.path.join(HERE, "..", "..", "engine-data"))
OUT = os.path.join(HERE, "data", "esco_occupation_skills.jsonl")
ESCO_BASE = "https://ec.europa.eu/esco/api"
ESCO_VERSION = "v1.2.0"
SLEEP_S = 0.4            # be polite to a public API
TIMEOUT_S = 20


def get_json(url):
    req = urllib.request.Request(url, headers={"accept": "application/json"})
    with urllib.request.urlopen(req, timeout=TIMEOUT_S) as r:
        return json.load(r)


def leaf_occupations(node, trail=()):
    """Walk the SSOC hierarchy to leaves; yield (code, title). A leaf is a node with no
    child list among the known nesting keys."""
    child_keys = ("sub_major_groups", "minor_groups", "unit_groups", "occupations", "children")
    kids = next((node[k] for k in child_keys if isinstance(node.get(k), list) and node[k]), None)
    if kids:
        for k in kids:
            yield from leaf_occupations(k, trail + (node.get("code"),))
    else:
        title = node.get("title") or node.get("label")
        if title:
            yield node.get("code"), title


def clean_title(raw):
    import re
    s = re.sub(r"[([][^)\]]*[)\]]", " ", str(raw or "")).strip()
    s = re.split(r"\s+[–—-]\s+", s)[0]
    s = re.sub(r"\s{2,}", " ", s).strip()
    return s if len(s) >= 3 else str(raw or "").strip()


def resolve_occupation(title):
    q = urllib.parse.quote(clean_title(title))
    url = f"{ESCO_BASE}/search?text={q}&type=occupation&language=en&selectedVersion={ESCO_VERSION}&limit=10"
    data = get_json(url)
    results = (data.get("_embedded") or {}).get("results") or []
    if not results:
        return None
    low = clean_title(title).lower()
    exact = next((r for r in results if str(r.get("title", "")).lower() == low), None)
    chosen = exact or results[0]
    return {"uri": chosen.get("uri"), "label": chosen.get("title", ""), "match": "exact" if exact else "top_hit"}


def occupation_skills(uri):
    url = f"{ESCO_BASE}/resource/occupation?uri={urllib.parse.quote(uri)}&language=en&selectedVersion={ESCO_VERSION}"
    data = get_json(url)
    links = data.get("_links") or {}
    def pull(key, essential):
        return [{"skill": s.get("title"), "escoUri": s.get("uri"),
                 "skillType": s.get("skillType", "skill/competence"), "isEssential": essential}
                for s in (links.get(key) or []) if s.get("title")]
    return pull("hasEssentialSkill", True) + pull("hasOptionalSkill", False)


def main():
    limit = None
    if "--limit" in sys.argv:
        limit = int(sys.argv[sys.argv.index("--limit") + 1])
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    hier = json.load(open(os.path.join(ENGINE, "ssoc2024-hierarchy.json")))
    done = set()
    if os.path.exists(OUT):
        for line in open(OUT):
            try: done.add(json.loads(line)["ssoc"])
            except Exception: pass
    occs = list(leaf_occupations({"sub_major_groups": hier["major_groups"]}))
    if limit: occs = occs[:limit]
    print(f"{len(occs)} SSOC leaf occupations; {len(done)} already harvested", file=sys.stderr)
    with open(OUT, "a") as fout:
        for i, (code, title) in enumerate(occs):
            if code in done:
                continue
            row = {"ssoc": code, "ssoc_title": title, "resolved": None, "skills": [], "error": None}
            try:
                occ = resolve_occupation(title)
                if occ:
                    row["resolved"] = occ
                    row["skills"] = occupation_skills(occ["uri"])
            except Exception as e:  # never crash the whole run on one occupation
                row["error"] = f"{type(e).__name__}: {e}"
            fout.write(json.dumps(row) + "\n"); fout.flush()
            if i % 25 == 0:
                print(f"  {i}/{len(occs)}  {code} {title[:40]} -> {len(row['skills'])} skills", file=sys.stderr)
            time.sleep(SLEEP_S)
    print("done ->", OUT, file=sys.stderr)


if __name__ == "__main__":
    main()
