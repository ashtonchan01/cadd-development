# CADD — NSW Multi-Dwelling Development Finder

Scores residential properties in NSW for dual occupancy, multi-dwelling housing
(townhouses) and Torrens subdivision potential, based on:

- NSW Standard Instrument LEP zone defaults (`src/data/nswZoning.ts`)
- The statewide Low and Mid-Rise Housing SEPP (2023) walking-catchment uplift
- Per-property overrides for the council's actual LEP minimum lot size, since that
  is set per Local Government Area and isn't uniform across the state

## Why no live listing scraper

This build environment has no working access to realestate.com.au, domain.com.au,
or the NSW Planning Portal's spatial APIs, so instead of a scraper that can't be
tested end-to-end, the app takes properties via:

1. A manual add-property form, or
2. Bulk CSV import (template downloadable in-app) — export shortlisted addresses
   from listing sites or the NSW Planning Portal into the CSV and import them here.

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
  size) by address/lot-DP, if/when API access is available, to auto-fill zone and
  council minimum lot size instead of manual entry.
- Add a geocoding step so CSV rows only need an address.
- Track listing price alongside estimated yield to surface $/potential-dwelling.
