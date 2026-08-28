# CADD — NSW Multi-Dwelling Development Finder

Live app: https://cadddevelopment.vercel.app (auto-deploys from `main` on push)

Scores residential properties in NSW for dual occupancy, multi-dwelling housing
(townhouses) and Torrens subdivision potential, based on:

- NSW Standard Instrument LEP zone defaults (`src/data/nswZoning.ts`)
- The statewide Low and Mid-Rise Housing SEPP (2023) walking-catchment uplift
- Per-property overrides for the council's actual LEP minimum lot size, since that
  is set per Local Government Area and isn't uniform across the state

## Data sources

There's no self-serve, affordable API for realestate.com.au / domain.com.au listing
data or CoreLogic/RP Data's sale-price + AVM data — those are enterprise-only,
sales-contact-required licenses (this is reportedly what killed National Property
Data — enterprise CoreLogic-tier costs without enterprise-scale revenue). So
properties are added one at a time via the form, using free public data instead:

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
- If a Domain Developer API key becomes available (self-serve, free tier at
  developer.domain.com.au), use it for listing price/status lookups.
- Track listing price alongside estimated yield to surface $/potential-dwelling.
