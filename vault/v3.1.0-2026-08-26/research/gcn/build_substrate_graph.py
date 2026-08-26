#!/usr/bin/env python3
"""Phase 1 — assemble the real occupation<->skill substrate from the Phase 0 harvests.

Reads the two harvest outputs and emits `substrate.npz` (+ `substrate_meta.json`), the
bipartite graph Phase 2 (linkpred.py) trains on. This is the swap the README anticipated:
the edges here carry signal the occupation TEXT does not — ESCO's curated occupation->skill
relations and, crucially, MCF skill co-occurrence (which skills actually appear together in
one real posting). Deterministic assembly; no LLM, no invented edge. Every edge is typed by
source so Phase 2 can ablate (ESCO-only vs +MCF) and Phase 3 can disclose provenance.

Inputs (from harvest_esco.py / harvest_mcf.py):
  data/esco_occupation_skills.jsonl   { ssoc, ssoc_title, resolved, skills:[{skill,escoUri,isEssential}] }
  data/mcf_postings.jsonl             { uuid, skills:[name,...] }

Output:
  substrate.npz        occ_labels, skill_labels, os_edges (occ,skill,essential),
                       cooc_edges (skill_i,skill_j,count)   — all index-encoded
  substrate_meta.json  counts + provenance

Run:  python build_substrate_graph.py            (uses data/*.jsonl)
      python build_substrate_graph.py --self-test  (generate a fixture, build, assert)
"""
import json, os, sys, collections
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, "data")
ESCO_IN = os.path.join(DATA, "esco_occupation_skills.jsonl")
MCF_IN = os.path.join(DATA, "mcf_postings.jsonl")
OUT_NPZ = os.path.join(HERE, "substrate.npz")
OUT_META = os.path.join(HERE, "substrate_meta.json")


def _norm(s):
    return " ".join(str(s or "").lower().split())


def read_jsonl(path):
    rows = []
    if os.path.exists(path):
        for line in open(path):
            line = line.strip()
            if line:
                try: rows.append(json.loads(line))
                except Exception: pass
    return rows


def build(esco_rows, mcf_rows):
    """Pure function (testable): rows -> arrays. Skill vocabulary is the union of ESCO
    skill names and MCF tags, matched by normalised name (Phase-1 decision D2: fold MCF
    onto ESCO by name; unmatched MCF tags still become skill nodes so co-occurrence isn't
    lost)."""
    skill_idx = {}
    def sid(name):
        k = _norm(name)
        if not k: return None
        if k not in skill_idx: skill_idx[k] = len(skill_idx)
        return skill_idx[k]

    occ_labels, os_edges = [], []
    for r in esco_rows:
        skills = r.get("skills") or []
        if not skills:
            continue  # an occupation with no resolved skills contributes no edge
        oi = len(occ_labels)
        occ_labels.append(r.get("ssoc_title") or r.get("ssoc") or f"occ{oi}")
        for s in skills:
            j = sid(s.get("skill"))
            if j is not None:
                os_edges.append((oi, j, 1 if s.get("isEssential") else 0))

    # MCF skill co-occurrence: count unordered pairs within each posting's skill set.
    pair = collections.Counter()
    for r in mcf_rows:
        ids = sorted({sid(n) for n in (r.get("skills") or []) if _norm(n)} - {None})
        for a in range(len(ids)):
            for b in range(a + 1, len(ids)):
                pair[(ids[a], ids[b])] += 1

    skill_labels = [None] * len(skill_idx)
    for k, i in skill_idx.items():
        skill_labels[i] = k

    os_arr = np.array(os_edges, dtype=np.int64) if os_edges else np.zeros((0, 3), np.int64)
    cooc_arr = (np.array([[i, j, c] for (i, j), c in pair.items()], dtype=np.int64)
                if pair else np.zeros((0, 3), np.int64))
    return {
        "occ_labels": np.array(occ_labels, dtype=object),
        "skill_labels": np.array(skill_labels, dtype=object),
        "os_edges": os_arr,
        "cooc_edges": cooc_arr,
    }


def summarize(g):
    return {
        "occupations": int(len(g["occ_labels"])),
        "skills": int(len(g["skill_labels"])),
        "occupation_skill_edges": int(g["os_edges"].shape[0]),
        "essential_edges": int((g["os_edges"][:, 2] == 1).sum()) if g["os_edges"].size else 0,
        "mcf_cooccurrence_edges": int(g["cooc_edges"].shape[0]),
        "sources": {"occupation_skill": "ESCO v1.2 (crosswalked from SSOC 2024)",
                    "skill_cooccurrence": "MyCareersFuture live postings"},
    }


def self_test():
    """Plant a signal only MCF sees, assert the assembler preserves it. Two skills that
    co-occur heavily in MCF postings but rarely share an ESCO occupation are the
    independent signal Phase 2 must be able to exploit."""
    esco = [{"ssoc_title": f"occ{o}", "skills": [
                {"skill": f"skill{o%5}", "isEssential": True},
                {"skill": f"skill{(o%5)+5}", "isEssential": False}]}
            for o in range(20)]
    # MCF: skillA and skillB always appear together, but ESCO never links them.
    mcf = [{"skills": ["skillA", "skillB", f"skill{i%5}"]} for i in range(40)]
    g = build(esco, mcf)
    s = summarize(g)
    assert s["occupations"] == 20, s
    assert s["occupation_skill_edges"] == 40, s
    idx = {lbl: i for i, lbl in enumerate(g["skill_labels"])}
    assert "skilla" in idx and "skillb" in idx, "MCF-only skills must become nodes"
    ab = {tuple(sorted((idx["skilla"], idx["skillb"])))}
    cooc = {tuple(sorted((int(i), int(j)))): int(c) for i, j, c in g["cooc_edges"]}
    key = next(iter(ab))
    assert cooc.get(key, 0) == 40, f"MCF co-occurrence signal lost: {cooc.get(key)}"
    print("self-test OK:", json.dumps(s))


def main():
    if "--self-test" in sys.argv:
        self_test(); return
    esco_rows, mcf_rows = read_jsonl(ESCO_IN), read_jsonl(MCF_IN)
    if not esco_rows:
        sys.exit(f"No ESCO data at {ESCO_IN}. Run harvest_esco.py first (see PHASE0-FINDINGS.md).")
    g = build(esco_rows, mcf_rows)
    np.savez(OUT_NPZ, **g)
    meta = summarize(g)
    json.dump(meta, open(OUT_META, "w"), indent=2)
    print("wrote", OUT_NPZ, "\n", json.dumps(meta, indent=2))


if __name__ == "__main__":
    main()
