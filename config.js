/**
 * config.js — CH-149 Cormorant W&B App
 * Aircraft: 615 Wing, DLTP 101C-615
 *
 * ══════════════════════════════════════════════════════════════════
 *  THIS IS THE ONLY FILE YOU SHOULD NEED TO EDIT FOR:
 *    • New or changed equipment weights / arms
 *    • Adding / removing tail numbers
 *    • Updating the CG envelope
 *    • Fuel stage changes
 *    • Seat additions or removals
 *    • New mission presets
 * ══════════════════════════════════════════════════════════════════
 *
 * HOW IT CONNECTS TO THE APP:
 *   This file must be loaded BEFORE app.js in index.html:
 *     <script src="config.js"></script>
 *     <script src="app.js"></script>
 *
 *   The app reads everything through the AC object exported here.
 *   Nothing in app.js contains aircraft numbers — they all live here.
 */

"use strict";

// ─────────────────────────────────────────────────────────────────
// SECTION 1 — TAIL NUMBERS
// ─────────────────────────────────────────────────────────────────
// Add or remove tails here. Placeholders show greyed-out on the
// home screen and cannot be selected for a W&B session.

const AC_TAILS = {
  active: [
    "149920", "149921", "149922", "149923", "149924",
    "149925", "149926", "149927", "149928", "149929",
    "149930", "149931", "149932", "149933", "149934",
    "149935", "149936"
  ],
  placeholders: [
    "149937", "149938", "149939", "149940"
  ]
};


// ─────────────────────────────────────────────────────────────────
// SECTION 1A — CUSTODIAN AUTHENTICATION
// ─────────────────────────────────────────────────────────────────
// Placeholder single-password auth for the config editor.
// When cloud hosting is added, this will be replaced by proper
// user accounts. For now: one shared password for the custodian.
//
// To change the password: edit the value below and reload.

const AC_AUTH = {
  password: "custodian"
};


// ─────────────────────────────────────────────────────────────────
// SECTION 2 — CG ENVELOPE
// ─────────────────────────────────────────────────────────────────
// Points are in { w: kg, cg: mm } pairs.
// envMain = primary envelope, clockwise from (13000, 7925).
// envAlt  = alternate max-AUW segment.

const AC_ENVELOPE = {

  envMain: [
    { w: 13000, cg: 7925 },
    { w: 14600, cg: 7925 },
    { w: 15600, cg: 8025 },
    { w: 15600, cg: 8349 },
    { w: 12500, cg: 8460 },
    { w:  9175, cg: 8460 },
    { w:  9553, cg: 8400 },
    { w: 10315, cg: 8074 },
    { w: 11500, cg: 7975 }
  ],

  envAlt: [
    { w: 15600, cg: 8025 },
    { w: 16000, cg: 8065 },
    { w: 16000, cg: 8335 },
    { w: 15600, cg: 8349 }
  ],

  // Hard CG limits (mm) — used for pass/fail logic
  hardCg: { min: 7925, max: 8460 },

  // CG band boundaries (mm) — used for FWD / MID / AFT band display
  cgBands: {
    fwdMax: 8003,
    midMax: 8257
    // anything above midMax is AFT band
  },

  // Absolute CG range for canvas drawing (extends beyond hard limits for context)
  cgAbsolute: { min: 7500, max: 9000 }
};


// ─────────────────────────────────────────────────────────────────
// SECTION 3 — BAY ARMS
// ─────────────────────────────────────────────────────────────────
// Mid-point longitudinal arms (mm) for each cabin bay.
// Used for bay load planning and cargo CG calculation.

const AC_BAY_ARMS = {
  BAY1:  5375,
  BAY2:  6375,
  BAY3:  7375,
  BAY4:  8375,
  BAY5:  9375,
  BAY55: 10125,   // Bay 5.5
  BAY6:  10884,
  REAR:  12893    // Ramp area centre
};


// ─────────────────────────────────────────────────────────────────
// SECTION 4 — RAMP LIMITS
// ─────────────────────────────────────────────────────────────────

const AC_RAMP = {
  hinge:          11393,  // mm — hinge station
  end:            14393,  // mm — ramp end station
  maxClosed:        350,  // kg — max load, ramp closed
  maxOpen:          450,  // kg — max load, ramp open
  hingeMomentMax:   450   // kgm — warning threshold (not structural limit)
};


// ─────────────────────────────────────────────────────────────────
// SECTION 5 — FUEL TANKS
// ─────────────────────────────────────────────────────────────────
// Arms (mm) for each fuel tank.
// Tank IDs must match the keys used in fuelStages below.

// Maximum fuel capacity — hard physical limit of the tanks.
// The aircraft cannot hold more than this regardless of AUW headroom.
const AC_MAX_FUEL_KG = 4152;  // 830.4 kg × 5 tanks

const AC_FUEL_TANK_ARMS = {
  T1: 10884,  // Bay 6 main
  T2:  7375,  // Bay 3 main
  T3:  6375,  // Bay 2 main
  T4:  5375,  // Bay 1 transfer
  T5:  8375   // Bay 4 transfer
};

// Fuel fill stage mapping.
// Deltas (kg) are applied sequentially when computing tank distribution
// from a total fuel figure. Positive = fill, negative = transfer/redistribute.
// The burn solver applies the same fill stages in reverse.

const AC_FUEL_STAGES = [
  { name: "Stage 1",  deltas: { T1:  581.3, T2:  581.3, T3:  581.3, T4:    0.0, T5:    0.0 } },
  { name: "Stage 2",  deltas: { T1:  249.1, T2:  249.1, T3:    0.0, T4:  249.1, T5:    0.0 } },
  { name: "Stage 3",  deltas: { T1:    0.0, T2:    0.0, T3:    0.0, T4:  332.2, T5:    0.0 } },
  { name: "Stage 4",  deltas: { T1:    0.0, T2:    0.0, T3:  249.1, T4:  249.1, T5:    0.0 } },
  { name: "Stage 5",  deltas: { T1:    0.0, T2:    0.0, T3:    0.0, T4:    0.0, T5:  830.4 } },
  { name: "Stage 6",  deltas: { T1: -249.1, T2: -249.1, T3: -124.6, T4: -124.6, T5:    0.0 } },
  { name: "Stage 7",  deltas: { T1:  249.1, T2:  249.1, T3:  -69.5, T4:  -69.5, T5: -776.4 } },
  { name: "Stage 8",  deltas: { T1: -110.0, T2: -110.0, T3:  -55.0, T4:  -55.0, T5:    0.0 } },
  { name: "Stage 9",  deltas: { T1:   -9.7, T2:   -9.7, T3:   22.2, T4:   22.2, T5:  -54.0 } },
  { name: "Stage 10", deltas: { T1: -129.4, T2: -129.4, T3:  -64.7, T4:  -64.7, T5:    0.0 } },
  { name: "Stage 11", deltas: { T1:   83.1, T2:   83.1, T3:   83.1, T4: -538.7, T5:    0.0 } },
  { name: "Stage 12", deltas: { T1: -664.4, T2: -664.4, T3: -621.8, T4:    0.0, T5:    0.0 } }
];


// ─────────────────────────────────────────────────────────────────
// SECTION 6 — SEATS
// ─────────────────────────────────────────────────────────────────
// arm   = longitudinal arm (mm) from datum
// wSeat = empty seat structure weight (kg)

const AC_CREW_SEATS = {
  C1: { name: "C1 Pilot (Stbd)",        arm: 3673, wSeat: 24.12 },
  C2: { name: "C2 Pilot (Port)",        arm: 3673, wSeat: 24.12 },
  C3: { name: "C3 Cockpit Jump",        arm: 4599, wSeat: 17.84 },
  C4: { name: "C4 FE (Bay 2 Port)",     arm: 6469, wSeat: 26.80 },
  C5: { name: "C5 ST TL (Bay 4 Port)",  arm: 8444, wSeat: 26.80 },
  C6: { name: "C6 ST TM (Bay 5 Stbd)", arm: 9434, wSeat: 26.80 }
};

const AC_PAX_SEATS = {
  // Standard troop seats — 6.90 kg structure except P2/P3 (rear fuse fixed seats)
  P1:  { name: "P1  Stbd Bay 5.5",     arm: 10125, wSeat: 6.90 },
  P2:  { name: "P2  Stbd Rear Fuse",   arm: 11762, wSeat: 9.35 },
  P3:  { name: "P3  Port Rear Fuse",   arm: 11760, wSeat: 9.35 },
  P4:  { name: "P4  Stbd Bay 1 Aft",   arm:  5625, wSeat: 6.90 },
  P5:  { name: "P5  Stbd Bay 2 Fwd",   arm:  6125, wSeat: 6.90 },
  P6:  { name: "P6  Stbd Bay 2 Aft",   arm:  6625, wSeat: 6.90 },
  P7:  { name: "P7  Stbd Bay 5 Fwd",   arm:  9125, wSeat: 6.90 },
  P8:  { name: "P8  Stbd Bay 5 Aft",   arm:  9625, wSeat: 6.90 },
  P9:  { name: "P9  Stbd Bay 6 Fwd",   arm: 10625, wSeat: 6.90 },
  P10: { name: "P10 Stbd Bay 6 Aft",   arm: 11125, wSeat: 6.90 },
  P11: { name: "P11 Port Bay 3 Fwd",   arm:  7125, wSeat: 6.90 },
  P12: { name: "P12 Port Bay 3 Aft",   arm:  7625, wSeat: 6.90 },
  P13: { name: "P13 Port Bay 4 Fwd",   arm:  8125, wSeat: 6.90 },
  P14: { name: "P14 Port Bay 4 Aft",   arm:  8625, wSeat: 6.90 },
  P15: { name: "P15 Port Bay 5 Fwd",   arm:  9125, wSeat: 6.90 },
  P16: { name: "P16 Port Bay 5 Aft",   arm:  9625, wSeat: 6.90 },
  P17: { name: "P17 Port Bay 5.5",     arm: 10125, wSeat: 6.90 },
  P18: { name: "P18 Port Bay 6 Fwd",   arm: 10626, wSeat: 6.90 }
};


// ─────────────────────────────────────────────────────────────────
// SECTION 7 — STOWAGE LOCATIONS
// ─────────────────────────────────────────────────────────────────
// Every physical location in the aircraft where mission equipment
// can be stored. Each location has ONE arm value.
//
// Mission equipment items in Section 9 reference these by ID, so
// when the custodian adds new equipment, the arm comes automatically
// from the chosen stowage location — eliminating data-entry errors.
//
// Add a new location here if the airframe gets modified (rare).
// Do NOT delete a location that is referenced by any equipment item.

const AC_STOWAGE = {

  // ── SAR Equipment Storage Cabinet (all zones share arm 6275) ──
  // Top and Upper are physically separate shelves that share an arm.
  SAR_CABINET_TOP:    { name: "SAR Cabinet Top",        arm:  6275, group: "SAR Cabinet" },
  SAR_CABINET_UPPER:  { name: "SAR Cabinet Upper",      arm:  6275, group: "SAR Cabinet" },
  SAR_CABINET_MIDDLE: { name: "SAR Cabinet Middle",     arm:  6275, group: "SAR Cabinet" },
  SAR_CABINET_BOTTOM: { name: "SAR Cabinet Bottom",     arm:  6275, group: "SAR Cabinet" },
  LOCKBOX_TOP:        { name: "Lockbox Top Shelf",      arm:  6275, group: "SAR Cabinet" },

  // ── Cabin ─────────────────────────────────────────────────────
  CABIN_PORT_STOW:    { name: "Cabin Port Stowage",     arm: 10937, group: "Cabin" },
  CABIN_STBD_STOW:    { name: "Cabin Stbd Stowage",     arm: 10934, group: "Cabin" },
  CABIN_DEPLOYED:     { name: "Cabin Deployed",         arm:  7863, group: "Cabin" },
  PTA_COT_AREA:       { name: "PTA Cot Area",           arm: 10375, group: "Cabin" },
  OVERHEAD_STBD:      { name: "Overhead Bins (Stbd)",   arm: 10511, group: "Cabin" },
  OVERHEAD_PORT:      { name: "Overhead Bins (Port)",   arm: 10732, group: "Cabin" },

  // ── Port Forward Shelves (Top / Middle / Bottom) ─────────────
  // The port fwd shelves are the only multi-level shelf assembly.
  PORT_FWD_SHELF_TOP: { name: "Port Fwd Shelf (Top)",    arm:  5331, group: "Port Fwd Shelves" },
  PORT_FWD_SHELF_MID: { name: "Port Fwd Shelf (Middle)", arm:  5331, group: "Port Fwd Shelves" },
  PORT_FWD_SHELF_BOT: { name: "Port Fwd Shelf (Bottom)", arm:  5331, group: "Port Fwd Shelves" },

  // ── Ramp Area ────────────────────────────────────────────────
  // Four single shelves at distinct longitudinal positions.
  // Arms verified against Load Planning load zones.
  RAMP_STOW:          { name: "Ramp Stowage (general)",  arm: 13132, group: "Ramp" },
  RAMP_PORT_FWD:      { name: "Ramp Shelf Port Fwd",     arm: 12463, group: "Ramp" },
  RAMP_PORT_AFT:      { name: "Ramp Shelf Port Aft",     arm: 13226, group: "Ramp" },
  RAMP_STBD_FWD:      { name: "Ramp Shelf Stbd Fwd",     arm: 12481, group: "Ramp" },
  RAMP_STBD_AFT:      { name: "Ramp Shelf Stbd Aft",     arm: 13228, group: "Ramp" }
};


// ─────────────────────────────────────────────────────────────────
// SECTION 8 — ROLE-FIT EQUIPMENT
// ─────────────────────────────────────────────────────────────────
// normally: true  = installed at basic weight (BW)
// normally: false = NOT installed at BW; must be explicitly added
//
// w   = weight (kg)
// arm = longitudinal arm (mm)

const AC_ROLE_FIT = {

  // ── Rescue / SAR systems ──────────────────────────────────────
  RF_SECONDARY_HOIST:   { name: "Secondary Hoist",                          w:  82.34, arm:  9255, normally: true  },
  RF_TRAKKA:            { name: "TRAKKA A-800 Searchlight",                 w:  34.47, arm:  6340, normally: true  },
  RF_SEA_TRAY:          { name: "Sea Tray",                                  w:  10.30, arm:  8127, normally: true  },
  RF_DIVE_O2_RACK:      { name: "Dive Bottle / O2 Rack",                    w:   7.00, arm: 10849, normally: true  },
  RF_SAR_CABINET:       { name: "SAR Equipment Storage Cabinet",            w:  73.70, arm:  6275, normally: false },
  RF_PTA_COT:           { name: "PTA Cot System",                           w: 110.00, arm: 10375, normally: false },
  RF_SENSOR_WS:         { name: "Sensor Workstation",                       w:  46.69, arm:  5830, normally: false },

  // ── EO/IR package ────────────────────────────────────────────
  // Note: MX-15 weight = 43.20 + 0.11 + 3.17 - 0.95 (blanking plug delta)
  RF_EOIR_MX15:         { name: "EO/IR MX-15 Package (incl. blanking plug)", w: 45.53, arm:  1684, normally: true  },
  RF_EOIR_HANDCTRL:     { name: "EO/IR Hand Controller",                    w:   1.70, arm:  5828, normally: true  },

  // ── Cabin systems ─────────────────────────────────────────────
  RF_AIR_COOLING:       { name: "Air Cooling Pack",                         w:  64.62, arm:  9673, normally: true  },
  RF_FLOAT_SYS:         { name: "Floatation System",                        w:  83.91, arm:  8478, normally: true  },
  RF_LIFERAFT_SPONSONS: { name: "10-man Life Rafts (x2) Sponsons",          w:  66.03, arm:  9588, normally: true  },
  RF_LASHING_KIT:       { name: "Lashing / Tie-down Kit",                   w:   9.76, arm:  7243, normally: true  },

  // ── Anti-ice / de-ice ─────────────────────────────────────────
  RF_RIPU:              { name: "RIPU",                                      w:  34.88, arm:  5520, normally: true  },
  RF_RIPU_CABLES:       { name: "RIPU Cables (Removable)",                  w:   2.50, arm:  5112, normally: true  },
  RF_MR_SLIP:           { name: "Main Rotor Slip Ring",                     w:  12.00, arm:  8000, normally: true  },
  RF_TR_SLIP:           { name: "Tail Rotor Slip Ring",                     w:   2.40, arm: 19500, normally: true  },

  // ── Tool kits ─────────────────────────────────────────────────
  RF_FIELD_TOOLKIT:     { name: "Field Tool Kit & Spares",                  w:   5.98, arm: 12688, normally: true  },
  RF_STOW_TOOLKIT:      { name: "Stowage Tool Kit / Emergency Spares",      w:   1.60, arm: 12491, normally: true  },

  // ── Stowage fittings ──────────────────────────────────────────
  RF_STOW_STOKES_RAMP:  { name: "Stowage: Stokes (Ramp) fittings",         w:   2.11, arm: 13132, normally: true  },
  RF_STOW_STOKES_CABIN: { name: "Stowage: Stokes (Cabin) fittings",        w:   2.11, arm:  7863, normally: true  },
  RF_STOW_BASKET_PORT:  { name: "Stowage: Basket (Port) fittings",         w:   2.61, arm: 10937, normally: true  },
  RF_STOW_BASKET_STBD:  { name: "Stowage: Basket (Stbd) fittings",         w:   2.61, arm: 10934, normally: true  }
};


// ─────────────────────────────────────────────────────────────────
// SECTION 9 — MISSION EQUIPMENT
// ─────────────────────────────────────────────────────────────────
// Each item references a stowage location by ID (see Section 7).
// The stowage provides the arm automatically — items only carry
// their own weight, name, group, and default on/off state.
//
// on: true  = loaded by default at session start
// on: false = available but not loaded by default
//
// To add a new item: pick a stow ID from AC_STOWAGE, give it a
// unique key (ME_...), name, weight (kg), and group.

const AC_MISSION_EQUIP = {

  // ── SAR Equipment ─────────────────────────────────────────────
  ME_SAR_ZONEH:          { name: "SAR Equipment (Alpine/Camp/Drill/Extraction/MedSled/MTN-Belay/REEL/Rope x2)",
                           w: 112.50, stow: "SAR_CABINET_BOTTOM", group: "SAR Equipment",       on: true  },
  ME_RESCUE_BASKET_PORT: { name: "Rescue Basket (Port)",
                           w:  31.80, stow: "CABIN_PORT_STOW",    group: "SAR Equipment",       on: true  },
  ME_RESCUE_BASKET_STBD: { name: "Rescue Basket (Stbd)",
                           w:  31.80, stow: "CABIN_STBD_STOW",    group: "SAR Equipment",       on: false },
  ME_STOKES_RAMP:        { name: "Stokes Litter (Ramp)",
                           w:  49.00, stow: "RAMP_STOW",          group: "SAR Equipment",       on: true  },
  ME_STOKES_CABIN:       { name: "Stokes Litter (Cabin)",
                           w:  49.00, stow: "CABIN_DEPLOYED",     group: "SAR Equipment",       on: false },

  // ── Medical Equipment ─────────────────────────────────────────
  ME_MED_ZONEG:          { name: "Medical Equipment (Supp/Pen x2/Casualty/AED/Misc Bag)",
                           w:  68.00, stow: "SAR_CABINET_MIDDLE", group: "Medical Equipment",   on: true  },
  ME_AVIOX_O2_PRIMARY:   { name: "AviOx O2 Primary (est)",
                           w:  10.00, stow: "PTA_COT_AREA",       group: "Medical Equipment",   on: true  },
  ME_AVIOX_O2_SPARE:     { name: "AviOx O2 Spare (est)",
                           w:  10.00, stow: "PTA_COT_AREA",       group: "Medical Equipment",   on: true  },

  // ── ALSE ──────────────────────────────────────────────────────
  ME_ALSE_ZONED:         { name: "ALSE Equipment (Arctic tent/sleep/basic/pax vests)",
                           w:  50.50, stow: "SAR_CABINET_TOP",    group: "ALSE",                on: true  },
  ME_QDIS_X3:            { name: "Quick Don Immersion Suits x3",
                           w:   6.00, stow: "SAR_CABINET_UPPER",  group: "ALSE",                on: true  },

  // ── Misc / Mission Kits ───────────────────────────────────────
  ME_NVGS_X5:            { name: "NVGs x5",
                           w:   4.50, stow: "LOCKBOX_TOP",        group: "Misc / Mission Kits", on: true  },
  ME_SAR_RIFLE:          { name: "SAR Rifle",
                           w:   2.50, stow: "OVERHEAD_STBD",      group: "Misc / Mission Kits", on: true  },
  ME_SAR_DRUG:           { name: "SAR Drug Kit",
                           w:   1.00, stow: "OVERHEAD_PORT",      group: "Misc / Mission Kits", on: true  },

  // ── Stowage Placeholders ──────────────────────────────────────
  // These represent shelf locations with no specific equipment assigned yet.
  // Set w: to actual weight when a piece of equipment is determined for that shelf.
  ME_PORT_FWD_SHELF_TOP:  { name: "Port Fwd Shelf Top",    w: 0.00, stow: "PORT_FWD_SHELF_TOP", group: "Stowage", on: false },
  ME_PORT_FWD_SHELF_MID:  { name: "Port Fwd Shelf Middle", w: 0.00, stow: "PORT_FWD_SHELF_MID", group: "Stowage", on: false },
  ME_PORT_FWD_SHELF_BOT:  { name: "Port Fwd Shelf Bottom", w: 0.00, stow: "PORT_FWD_SHELF_BOT", group: "Stowage", on: false },
  ME_RAMP_SHELF_PORT_FWD: { name: "Ramp Shelf Port Fwd",   w: 0.00, stow: "RAMP_PORT_FWD",     group: "Stowage", on: false },
  ME_RAMP_SHELF_PORT_AFT: { name: "Ramp Shelf Port Aft",   w: 0.00, stow: "RAMP_PORT_AFT",     group: "Stowage", on: false },
  ME_RAMP_SHELF_STBD_FWD: { name: "Ramp Shelf Stbd Fwd",   w: 0.00, stow: "RAMP_STBD_FWD",     group: "Stowage", on: false },
  ME_RAMP_SHELF_STBD_AFT: { name: "Ramp Shelf Stbd Aft",   w: 0.00, stow: "RAMP_STBD_AFT",     group: "Stowage", on: false }
};


// ─────────────────────────────────────────────────────────────────
// SECTION 10 — MISSION PRESETS
// ─────────────────────────────────────────────────────────────────
// Each preset defines the full aircraft configuration for a role.
// roleFitOn / roleFitOff use keys from AC_ROLE_FIT.
// missionOn / missionOff use keys from AC_MISSION_EQUIP.
// Any key not listed keeps its default state from those sections.

const AC_PRESETS = {

  SAR3: {
    name: "SAR-3 Pax",
    notes: "EO/IR + Sensor WS + SAR Cabinet + PTA Cot installed.",
    image: "images/SAR_3_Pax.png",
    seats: {
      crew: ["C1", "C2", "C3", "C4", "C5", "C6"],
      pax:  ["P1", "P2", "P3"]
    },
    roleFitOn: [
      "RF_SECONDARY_HOIST", "RF_TRAKKA", "RF_SEA_TRAY", "RF_DIVE_O2_RACK",
      "RF_AIR_COOLING", "RF_FLOAT_SYS", "RF_LIFERAFT_SPONSONS", "RF_LASHING_KIT",
      "RF_RIPU", "RF_RIPU_CABLES", "RF_MR_SLIP", "RF_TR_SLIP",
      "RF_FIELD_TOOLKIT", "RF_STOW_TOOLKIT",
      "RF_STOW_STOKES_RAMP", "RF_STOW_STOKES_CABIN",
      "RF_STOW_BASKET_PORT", "RF_STOW_BASKET_STBD",
      "RF_EOIR_MX15", "RF_SENSOR_WS", "RF_PTA_COT", "RF_SAR_CABINET"
    ],
    roleFitOff: [],
    missionOn: [
      "ME_SAR_ZONEH", "ME_MED_ZONEG", "ME_AVIOX_O2_PRIMARY", "ME_AVIOX_O2_SPARE",
      "ME_ALSE_ZONED", "ME_RESCUE_BASKET_STBD", "ME_STOKES_RAMP",
      "ME_QDIS_X3", "ME_NVGS_X5", "ME_SAR_RIFLE", "ME_SAR_DRUG",
      "ME_PORT_FWD_SHELF_TOP", "ME_PORT_FWD_SHELF_MID", "ME_PORT_FWD_SHELF_BOT",
      "ME_RAMP_SHELF_PORT_FWD", "ME_RAMP_SHELF_PORT_AFT",
      "ME_RAMP_SHELF_STBD_FWD", "ME_RAMP_SHELF_STBD_AFT"
    ],
    missionOff: []
  },

  SAR10: {
    name: "SAR-10 Pax",
    notes: "PTA Cot removed vs SAR-3.",
    image: "images/SAR_10_Pax.png",
    seats: {
      crew: ["C1", "C2", "C3", "C4", "C5", "C6"],
      pax:  ["P1", "P9", "P10", "P2", "P3", "P17", "P16", "P15", "P12", "P11"]
    },
    roleFitOn: [
      "RF_SECONDARY_HOIST", "RF_TRAKKA", "RF_SEA_TRAY", "RF_DIVE_O2_RACK",
      "RF_AIR_COOLING", "RF_FLOAT_SYS", "RF_LIFERAFT_SPONSONS", "RF_LASHING_KIT",
      "RF_RIPU", "RF_RIPU_CABLES", "RF_MR_SLIP", "RF_TR_SLIP",
      "RF_FIELD_TOOLKIT", "RF_STOW_TOOLKIT",
      "RF_STOW_STOKES_RAMP", "RF_STOW_STOKES_CABIN",
      "RF_STOW_BASKET_PORT", "RF_STOW_BASKET_STBD",
      "RF_EOIR_MX15", "RF_SENSOR_WS", "RF_SAR_CABINET"
    ],
    roleFitOff: ["RF_PTA_COT"],
    missionOn: [
      "ME_SAR_ZONEH", "ME_MED_ZONEG", "ME_AVIOX_O2_PRIMARY", "ME_AVIOX_O2_SPARE",
      "ME_ALSE_ZONED", "ME_RESCUE_BASKET_PORT", "ME_STOKES_RAMP",
      "ME_QDIS_X3", "ME_NVGS_X5", "ME_SAR_RIFLE", "ME_SAR_DRUG",
      "ME_PORT_FWD_SHELF_TOP", "ME_PORT_FWD_SHELF_MID", "ME_PORT_FWD_SHELF_BOT",
      "ME_RAMP_SHELF_PORT_FWD", "ME_RAMP_SHELF_PORT_AFT",
      "ME_RAMP_SHELF_STBD_FWD", "ME_RAMP_SHELF_STBD_AFT"
    ],
    missionOff: []
  },

  CASEVAC: {
    name: "CASEVAC",
    notes: "Sensor WS removed; SAR cabinet removed; mission gear baseline off.",
    image: "images/CASEVAC.png",
    seats: {
      crew: ["C1", "C2", "C3", "C4"],
      pax:  ["P2", "P3"]
    },
    roleFitOn: [
      "RF_SECONDARY_HOIST", "RF_TRAKKA", "RF_SEA_TRAY", "RF_DIVE_O2_RACK",
      "RF_AIR_COOLING", "RF_FLOAT_SYS", "RF_LIFERAFT_SPONSONS", "RF_LASHING_KIT",
      "RF_RIPU", "RF_RIPU_CABLES", "RF_MR_SLIP", "RF_TR_SLIP",
      "RF_FIELD_TOOLKIT", "RF_STOW_TOOLKIT",
      "RF_EOIR_MX15"
    ],
    roleFitOff: [
      "RF_SAR_CABINET", "RF_SENSOR_WS", "RF_PTA_COT",
      "RF_STOW_STOKES_RAMP", "RF_STOW_STOKES_CABIN",
      "RF_STOW_BASKET_PORT", "RF_STOW_BASKET_STBD"
    ],
    // All mission equipment off — populated at runtime from AC_MISSION_EQUIP keys
    missionOn:  [],
    missionOff: "ALL"   // special value: app will expand this to all ME keys at init
  },

  TRANSPORT: {
    name: "Transport",
    notes: "Transport: SAR cabinet removed; Sensor WS removed; EO/IR + TRAKKA stay.",
    image: "images/Transport.png",
    seats: {
      crew: ["C1", "C2", "C3", "C4"],
      pax:  ["P1", "P2", "P3", "P4", "P5", "P6",
             "P7", "P8", "P9", "P10", "P11", "P12",
             "P15", "P16", "P17", "P18"]
    },
    roleFitOn: [
      "RF_SECONDARY_HOIST", "RF_TRAKKA", "RF_SEA_TRAY", "RF_DIVE_O2_RACK",
      "RF_AIR_COOLING", "RF_FLOAT_SYS", "RF_LIFERAFT_SPONSONS", "RF_LASHING_KIT",
      "RF_EOIR_MX15", "RF_MR_SLIP", "RF_TR_SLIP",
      "RF_FIELD_TOOLKIT", "RF_STOW_TOOLKIT",
      "RF_RIPU", "RF_RIPU_CABLES"
    ],
    roleFitOff: [],
    missionOn:  [],
    missionOff: []
  }
};


// ─────────────────────────────────────────────────────────────────
// EXPORT — single AC object consumed by app.js
// ─────────────────────────────────────────────────────────────────
// The AC object starts with the defaults defined above, then
// applies any overrides saved by the custodian editor (localStorage).
// This means changes made in the editor persist across reloads
// without the custodian having to modify this file.
//
// To reset to factory defaults: clear the "ac_config_overrides"
// key in browser localStorage, or use the "Reset" button in the
// editor tab.

const AC = {
  auth:          AC_AUTH,
  tails:         AC_TAILS,
  envelope:      AC_ENVELOPE,
  bayArms:       AC_BAY_ARMS,
  ramp:          AC_RAMP,
  fuelTankArms:  AC_FUEL_TANK_ARMS,
  fuelStages:    AC_FUEL_STAGES,
  maxFuelKg:     AC_MAX_FUEL_KG,
  crewSeats:     AC_CREW_SEATS,
  paxSeats:      AC_PAX_SEATS,
  stowage:       AC_STOWAGE,
  roleFit:       AC_ROLE_FIT,
  missionEquip:  AC_MISSION_EQUIP,
  presets:       AC_PRESETS
};

// Apply saved overrides from localStorage (editor changes persist here).
try {
  const saved = localStorage.getItem("ac_config_overrides");
  if (saved) {
    const ov = JSON.parse(saved);
    // Only override the editable sections for now
    if (ov.missionEquip) AC.missionEquip = ov.missionEquip;
    if (ov.stowage)      AC.stowage      = ov.stowage;
    if (ov.roleFit)      AC.roleFit      = ov.roleFit;
  }
} catch (e) {
  console.warn("Could not load config overrides:", e);
}