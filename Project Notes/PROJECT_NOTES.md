# 615 W&B App — Project Notes

This file captures design discussions, parked ideas, and future work
so context is not lost between work sessions.

Edit this file as the project evolves. Each parked idea includes the
original context so whoever revisits it (which is often future-you)
can reconstruct the reasoning.


---

## Parked Ideas — Revisit During or After OT&E


### 1. Aircraft as a Walkable Configuration Map

**The idea:**
Turn the app into a guided walk-through of the aircraft. When an FE
applies a mission preset (e.g. SAR-3), the app generates a checklist
organized by stowage location showing exactly where each piece of
equipment goes, weights, and (eventually) photos. FE walks the
aircraft with the iPad, checks off each item, and the configuration
is verified when the list is complete.

**Why it matters:**
This is what replaces the paper "Configuration Handbook" that each
squadron currently maintains. The app becomes the definitive
"this goes here" guide — always in sync with the live data, always
current, always specific to the selected mission preset.

**Why parked until OT&E:**
The actual loading order, groupings, and walk sequence should be
designed by FEs walking a real airframe. Building it now would be
guesswork that would almost certainly need to be redone after real
operational use.

**What we already have that supports this:**
- Mission equipment items already reference stowage by ID
- Stowage locations are a first-class entity with names and arms
- Config editor can already manage all the data
- PDF generation is already modular

**What would need to be built:**
- A new "Walk-Through" view that groups mission equipment by stowage
- Check-off UI (touch-friendly, matches iPad workflow)
- Optional photo integration (see #4)
- Save walk-through status to session state
- Possibly a new PDF section showing the walkthrough as a load sheet


### 2. Individual Equipment Items Instead of Grouped Bundles

**The idea:**
Replace grouped items like "NVGs x5" (4.50 kg) with individual items
(NVG_1 through NVG_5, each at 0.90 kg). FEs would toggle specific
items on/off depending on actual mission needs — e.g. take 6 NVGs
for a 6-crew mission by toggling on an extra one, or take 4 if one
is out for service.

**Why it matters:**
- Matches how FEs actually think ("how many NVGs?" not "4.5 kg of NVGs")
- Eliminates the need to use Load Planning for equipment quantity changes
- More accurate representation of what's actually on board
- Aligns with the "definitive configuration guide" vision

**Why parked:**
- Need real aircraft experience to know which items truly need
  individual tracking vs. which make sense as bundles
- Would expand the Mission Equipment list significantly (30 → ~80 items)
- Best done incrementally, starting with clearly-numbered items
  (NVGs, QDIS, AviOx bottles) and leaving bundles alone

**Scope of work:**
- Mostly a config.js data entry job (no code changes required)
- Presets would need updating to list individual keys instead of bundles
- Custodian editor already supports this workflow


### 3. Asset Tracking / Serial Numbers (DECLINED, kept for context)

**Colleague suggestion:**
Add serial number tracking, inspection dates, and expiration tracking
for all life-support equipment installed on the aircraft.

**Why we declined:**
- Process already exists: maintenance record set has a table showing
  every piece of aircraft life support equipment with expiry dates
- One FE per squadron already owns LSE database maintenance
- FEs don't need serial numbers during launch workflow — they need
  to know "is the equipment installed and airworthy," which is
  a binary check done elsewhere
- Combining a W&B calculator with an asset tracker creates scope
  creep and two sources of truth
- Massive ongoing data entry burden for no operational benefit
  to the daily FE workflow

**When to revisit:** Probably never. Noted here so the decision and
reasoning don't get relitigated.


### 4. Photos for Stowage Locations and Equipment

**The idea:**
Attach a photo to each stowage location (and possibly each piece of
equipment) showing where it actually is in the aircraft. Editor allows
the custodian to upload photos. Walk-through view shows photos as
visual confirmation.

**Why parked until OT&E:**
We don't have a -615 yet. Can't photograph an aircraft that doesn't
exist. During OT&E is when real photos get taken for the first time.

**Implementation approach (already designed):**
- Photos stored as base64 in localStorage (offline, self-contained)
- Editor has upload/remove buttons per stowage/item
- Tap to see full-size in modal
- Designed to port cleanly to cloud hosting later


---

## Open Architectural Questions


### Cloud Hosting / Fleet Distribution

Right now the app is a static folder of files. Distribution is via
thumb drive, email, or SharePoint. Works but has limits:
- Custodian changes don't sync to other users automatically
- Each device runs its own localStorage for overrides
- No central audit trail of configuration changes

**Future options to explore:**
- Host on squadron SharePoint (static files, shared to the fleet)
- Build a simple backend (Firebase, Supabase, or a small custom API)
  to centralize config changes and overrides
- Full cloud app with proper user accounts (replaces shared password)


### Performance Calculator for -511 and -615

Separate calculator project discussed early. Manufacturer provides
charts, not raw data. Plan is to digitize charts using WebPlotDigitizer,
build interpolation tables, structure config like the W&B app so
both variants can share calculation logic with different data.

Not started. Separate project when ready.


---

## Completed Milestones (for reference)

- Phase 1: Separated aircraft data into config.js
- Phase 2: Split single HTML file into proper multi-file project
- Stowage locations restructured as first-class entities with correct arms
- PDF report generation with burn track and MCDU cross-check highlighting
- Custodian editor with login, CRUD for mission/stowage/role-fit
- Light/dark theme toggle
- iPad/touch-friendly responsive layout
- Certify tab redesigned into 4-step workflow
- App fully self-contained (local jsPDF, no internet required)
- Hard fuel capacity limit (4152 kg) enforced throughout
- Git version control established


---

## How to Revisit a Parked Idea

1. Read the relevant section above
2. Check if the "why parked" reasoning still applies
3. Discuss scope and trade-offs before coding
4. Add a new section under "Completed Milestones" when done
