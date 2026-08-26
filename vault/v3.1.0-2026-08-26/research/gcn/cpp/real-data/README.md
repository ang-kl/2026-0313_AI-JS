# real-data — drop the real harvest output here to go live

The Railway image **prefers this folder** over `../sample-data` when it contains the two
harvest files, and flips the service from demo to real automatically:

- if `real-data/esco_occupation_skills.jsonl` **and** `real-data/mcf_postings.jsonl` exist
  → the build uses them, and the service reports `synthetic: false` (DEMO badge disappears).
- otherwise → the build falls back to the synthetic `../sample-data` (`synthetic: true`).

## How to populate it

1. Run the harvest from any machine with normal internet (no API key, no `pip install`):
   ```sh
   cd v3/research/gcn
   python3 harvest_esco.py     # ~20 min -> data/esco_occupation_skills.jsonl
   python3 harvest_mcf.py      # ~3 min  -> data/mcf_postings.jsonl
   ```
2. Copy the two outputs here and commit them:
   ```sh
   cp ../data/esco_occupation_skills.jsonl ../data/mcf_postings.jsonl ./
   git add esco_occupation_skills.jsonl mcf_postings.jsonl
   git commit -m "gcn: real ESCO+MCF harvest data" && git push
   ```
3. Redeploy the Railway service. `/health` will then show `"synthetic": false`, and the
   Step 3 panel serves real, sourced suggestions with no DEMO badge.

The data is derived + non-personal (occupation→skill relations, skill co-occurrence counts).
ESCO is CC-BY — attribute the European Commission in any published result.
