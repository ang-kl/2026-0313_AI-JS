This folder contain sample roles and other samples

## Golden test fixtures (R-SNAPSHOT, spec section 8)

These three roles are the engine's golden fixtures. The committed snapshot of their
engine outputs lives at `v3/script/r-snapshot.golden.json` - a changed snapshot must be
explained in the HDR `[DELTA]` line of the PR that changes it.

| Fixture | SSOC used | Where the SSOC comes from |
|---|---|---|
| NHG - Asst Director, Technology Strategic Planning | `13304` (ICT service manager) | TITLE-MATCHED from the SingStat SSOC2024 table. The NHG PDF/MD export carries no MCF SSOC tag - this is a recorded fixture-input choice, not an MCF fact. |
| PSD - Senior Manager / Asst Director, Job Redesign | `12131` (Policy manager) | TITLE-MATCHED from the SingStat SSOC2024 table. The LinkedIn PDF export carries no MCF SSOC tag - recorded fixture-input choice, not an MCF fact. |
| Metta - Transformation Manager (default Leap posting) | `13302` (Software and applications manager) | REAL MCF tag, read from the live posting `uuid 2320493d0e875075d4dbfa6a893b3fdb` (`ssocCode` field, MCF API). Note: the engine's reconcile path exists precisely because tags like this one can mis-describe the role. |
