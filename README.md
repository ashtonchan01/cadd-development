# CADD — NSW Multi-Dwelling Development Finder

Live app: https://cadddevelopment.vercel.app (auto-deploys from `main` on push)

A single-search property intelligence tool, modelled on National Property Data's
"search an address → get a report" UX. Scores residential properties in NSW for
dual occupancy, multi-dwelling housing (townhouses) and Torrens subdivision
potential, based on:

- NSW Standard Instrument LEP zone defaults (`src/data/nswZoning.ts`)
- The statewide Low and Mid-Rise Housing SEPP (2023) walking-catchment uplift
- Per-property overrides for the council's actual LEP minimum lot size, since that
  is set per Local Government Area and isn't uniform across the state

## How this compares to National Property Data / CoreLogic-Cotality

National Property Data's single-search product is built on Valuer General sale
data back to 1986, property portal listing feeds, and government/CRM ownership
records — all under commercial data licenses. Those aren't self-serve for an
individual, so this app matches their UX shape (search → report) but runs
entirely on free public data instead:

- **Address autocomplete** — Nominatim (OpenStreetMap), `src/services/addressSearch.ts`.
  No API key. Fails open to a plain text field if unreachable.
- **Zone / council / minimum lot size auto-fill** — NSW Planning Portal's public
  spatial layers (EPI Primary Planning Layers), `src/services/planningLookup.ts`,
  queried by the lat/lon the address autocomplete resolves. No API key. Also fails
  open — fields just stay manually editable if the lookup finds nothing.
- **Comparable sales** — no live per-address API exists for this (NSW Valuer
  General publishes registered bulk-file downloads, not a queryable service), so
  each property's detail row links out to the NSW Government's sale price search
  instead of pulling data in automatically.

Each saved property also has a **feasibility calculator** (`src/engine/feasibility.ts`,
`src/components/FeasibilityCalculator.tsx`) — site purchase, build and other costs,
revenue by unit type, loan/interest, a monthly cashflow schedule and IRR — the
same development-appraisal functionality as Aprao's cashflow tool, built as our
own implementation rather than a copy of it. It's a simplified model (straight-line
cost/revenue spreading, simple loan interest, not a drawdown schedule) — treat it
as a working estimate, not a bank-ready appraisal.

Everything is scored client-side and persisted to `localStorage` — no backend.

## Run locally

```bash
npm install
npm run dev
```

## Important caveat

Scores are a **planning-rules heuristic**, not a substitute for a council planning
certificate (s10.7), pre-DA advice, or checking the exact LEP minimum lot size map
for a parcel on the [NSW Planning Portal](https://www.planningportal.nsw.gov.au/).
Zoning codes and dwelling minimums vary by council LEP clause 4.1/4.1A — always
verify before acting on a result.

## Possible next steps

- Verify the exact layer/field names in `planningLookup.ts` against real NSW
  Planning Portal responses (built from public docs, not tested live from this
  sandbox — same caveat the address geocoder had before it was fixed).
- **Phase 2 — real listing/sale data**: Domain's Developer API (self-serve, free
  tier) and Cotality's (formerly CoreLogic) new self-serve sandbox
  (developer.corelogic.asia) both use a client secret that can't safely live in
  browser code, so wiring either in needs a small serverless function (a
  `api/` route on Vercel) to hold the secret server-side and proxy requests —
  not yet built. Once a key is available, this is the next real upgrade.
- Track listing price alongside estimated yield to surface $/potential-dwelling.
