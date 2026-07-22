# SYNTHETIC sample data

These two files are **hand-written, synthetic** placeholders — not real ESCO or
MyCareersFuture data. They exist so the Railway service boots with a working substrate and
returns illustrative suggestions before the Phase 0 harvest is unblocked.

The service reports `"synthetic": true` on every response while running on this data, so no
consumer can mistake a demo suggestion for a real, sourced one.

To run on real data: harvest with `../../harvest_esco.py` / `../../harvest_mcf.py` (see
`../../data/PHASE0-FINDINGS.md` for the egress gate), point the Docker build at the real
`data/` directory, and set `SYNTHETIC=0`.
