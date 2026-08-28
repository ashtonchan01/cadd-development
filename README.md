# CADD — NSW Multi-Dwelling Development Finder

Live app: https://cadddevelopment.vercel.app (auto-deploys from `main` on push)

Scores residential properties in NSW for dual occupancy, multi-dwelling housing
(townhouses) and Torrens subdivision potential, based on:

- NSW Standard Instrument LEP zone defaults (`src/data/nswZoning.ts`)
- The statewide Low and Mid-Rise Housing SEPP (2023) walking-catchment uplift
- Per-property overrides for the council's actual LEP minimum lot size, since that
  is set per Local Government Area and isn't uniform across the state

## No live listing scraper

There's no self-serve, affordable API for realestate.com.au / domain.com.au listing
data or CoreLogic/RP Data's sale-price + AVM data — those are enterprise-only,
sales-contact-required licenses (this is reportedly what killed National Property
Data — enterprise CoreLogic-tier costs without enterprise-scale revenue). So
properties are added one at a time via the form, with the address field backed by
live autocomplete against the free, public NSW Government SIX Maps geocoder
(`src/services/addressSearch.ts`) — no API key needed, and it fails open to a plain
text field if that service is ever unreachable.

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

- Wire up the NSW Planning Portal's public spatial layers (zoning / minimum lot
  size) by address/lot-DP to auto-fill zone and council minimum lot size instead
  of manual entry, using the same address the autocomplete already resolves.
- If a Domain Developer API key becomes available (self-serve, free tier at
  developer.domain.com.au), use it for listing price/status lookups.
- Track listing price alongside estimated yield to surface $/potential-dwelling.
