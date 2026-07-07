# V3 Ads Template Doctrine — layout standard for Step 2 evidence surfaces

(№ 134 - 07-07 '26 07:13 SGT)

STATUS: READY_FOR_BUILD (T1 tokens; T2 refactor)
SCOPE: Step 2 posting cards, index rail, full-ad modal, OKF modal. Additive standard;
Step 3 surfaces adopt on next touch. Not a library adoption (SwiftUIX is Swift-native,
inapplicable to this React app) — this is the house equivalent: tokens + anatomy + rules.

## 1. Why

Human Lead audit (07-07 '26): step-2 type drifted below readable (9/8px chips), the card
grid packed 3-across, the rail read as raw fetch order, and badges only explained
themselves on hover. Fixed empirically in v3.0.226-227; this doctrine LOCKS those values
so drift cannot recur. Rule: no new font size, spacing step, radius, or chip colour on a
step-2 surface without amending this doc first (AU-7 applies).

## 2. Type scale (px; source: V2 empirical distribution + v3.0.226 fixes)

| Token        | px | Usage |
|--------------|----|-------|
| `T_TITLE_MD` | 22 | modal title (Newsreader serif 600) |
| `T_TITLE_SM` | 17 | card title (Newsreader serif 600, clamp 2 lines) |
| `T_HEAD`     | 15 | in-ad section headings (Spline Sans 700) |
| `T_BODY`     | 13-13.6 | synopsis, ad body, addresses (0.8125-0.85rem) |
| `T_UI`       | 12 | rail item title, buttons, links, facts |
| `T_SUB`      | 11 | rail employer line, meta chips, legends |
| `T_LABEL`    | 10 | kickers (SKILLSETS…), SSOC/tier chips — **hard floor** |
| `T_MICRO`    | 9  | NEW/confidence flags ONLY; never running text |

Nothing below 9px anywhere. Kickers: Spline Sans Mono 600, letterSpacing .12em, #b3ab9c.

## 3. Layout

- **Card grid**: `.step2-cards` — 1 column <640px, **2 columns max** ≥640px. Never 3.
- **Index rail**: 276px sticky; groups ranked by count (Unclassified last); items ranked
  match-tier → salary desc (same deterministic order as the cards); ranking rule stated
  on-screen ("Ranked by match tier, then salary."). Each row: band dot + title (12px) +
  employer (11px grey) + salary (10px mono).
- **Spacing steps**: 4 / 6 / 8 / 10 / 12 / 14 / 16 / 20. Radii: 4-6 (chips), 7-8 (buttons),
  9-11 (cards), 14 (panels/modals). No new values.

## 4. Card anatomy (top→bottom, fixed order)

1. Header strip (#f4f6fa): monogram 16px → employer (13px, 700) → `+N from employer`
   chip → match-tier chip (words only, NO glyph) → band dot (right).
2. Title (17px serif, 2-line clamp).
3. Age line (NEW flag 9px + age 10px).
4. SSOC chip row (10px): `SSOC <code> · <family>` + confidence + job level.
5. Meta chips (11px): salary, employment type (max 2).
6. Synopsis (13px, 6-line clamp).
7. Function/level/scheme chips (10px).
8. Action bar (top border): **Analyse** (13px, #142a8e) · Open · `{ } OKF` (right).

**Badge honesty rule**: every chip must be understandable without hover. The **Badge key**
line above the panels is mandatory whenever tier/+N chips render.

## 5. Full-ad modal anatomy

1. Header: employer kicker (11px mono) → title (22px serif) → 44px close.
2. Fact chips (11px): salary · type · experience · SSOC · band.
3. SKILLSETS block (10px kicker; 12px pill chips).
4. REGISTERED EMPLOYER block (#fbfaf8): address (13px) → map → source line (10px,
   **human date**: `Retrieved 7 Jul 2026, 07:03 SGT` — never raw ISO).
5. JOB AD · VERBATIM: heading heuristic (≤60 chars, ≤7 words, no terminal punctuation,
   starts uppercase → 15px bold, 16px top margin); body 13.6px/1.6; bullets indent 14px.
   Verbatim text never rewritten — hierarchy only.
6. Footer bar: **Analyse this posting** · Open on source · `{ } OKF` (right).

## 6. Governance

- Colour: blue/orange families only; state = shape + label + text, never hue alone.
- Touch: every interactive control ≥44px.
- Honesty: verbatim ad text untouched by the heading heuristic (presentation only);
  provenance lines keep Source · Match · Retrieved; withhold over guess.
- i18n: no CSS text-transform on data values; CJK-safe fonts already in stack.

## 7. Build slices

- **T1** (this doc + tokens): lift §2/§3 values into `STEP2_T` constants in App.jsx;
  replace magic sizes in step-2 surfaces. No visual change (values already shipped).
- **T2**: extract `Chip`/`Kicker` helpers reused by card + modal + rail. No visual change.
- Each slice: version bump, build green, live-verify, PR-it-now.

Source of truth: shipped code v3.0.227 (step-2 surfaces) > this doc > memory.
