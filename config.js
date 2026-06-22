/**
 * config.js — CH-149 - 615 W&B App
 * Exported by the Custodian Editor on 2026-06-22T04:00:47.904Z
 *
 * This file was generated from the editor. It contains the full
 * current state of all aircraft data. Rename to config.js and
 * replace your existing config.js to publish changes.
 */

// SECTION 1 — TAIL NUMBERS
const AC_TAILS = {
  "active": [
    "149920",
    "149921",
    "149922",
    "149923",
    "149924",
    "149925",
    "149926",
    "149927",
    "149928",
    "149929",
    "149930",
    "149931",
    "149932",
    "149933",
    "149934",
    "149935",
    "149936"
  ],
  "placeholders": [
    "149937",
    "149938",
    "149939",
    "149940"
  ]
};

// SECTION 1A — AUTH
const AC_AUTH = {
  "password": "custodian"
};

// SECTION 2 — CG ENVELOPE
const AC_ENVELOPE = {
  "envMain": [
    {
      "w": 13000,
      "cg": 7925
    },
    {
      "w": 14600,
      "cg": 7925
    },
    {
      "w": 15600,
      "cg": 8025
    },
    {
      "w": 15600,
      "cg": 8349
    },
    {
      "w": 12500,
      "cg": 8460
    },
    {
      "w": 9175,
      "cg": 8460
    },
    {
      "w": 9553,
      "cg": 8400
    },
    {
      "w": 10315,
      "cg": 8074
    },
    {
      "w": 11500,
      "cg": 7975
    }
  ],
  "envAlt": [
    {
      "w": 15600,
      "cg": 8025
    },
    {
      "w": 16000,
      "cg": 8065
    },
    {
      "w": 16000,
      "cg": 8335
    },
    {
      "w": 15600,
      "cg": 8349
    }
  ],
  "hardCg": {
    "min": 7925,
    "max": 8460
  },
  "cgBands": {
    "fwdMax": 8003,
    "midMax": 8257
  },
  "cgAbsolute": {
    "min": 7500,
    "max": 9000
  }
};

// SECTION 3 — BAY ARMS
const AC_BAY_ARMS = {
  "BAY1": 5375,
  "BAY2": 6375,
  "BAY3": 7375,
  "BAY4": 8375,
  "BAY5": 9375,
  "BAY55": 10125,
  "BAY6": 10884,
  "REAR": 12893
};

// SECTION 4 — RAMP LIMITS
const AC_RAMP = {
  "hinge": 11393,
  "end": 14393,
  "maxClosed": 350,
  "maxOpen": 450,
  "hingeMomentMax": 450
};

// SECTION 5 — FUEL TANKS
const AC_FUEL_TANK_ARMS = {
  "T1": 10884,
  "T2": 7375,
  "T3": 6375,
  "T4": 5375,
  "T5": 8375
};
const AC_FUEL_STAGES = [
  {
    "name": "Stage 1",
    "deltas": {
      "T1": 581.3,
      "T2": 581.3,
      "T3": 581.3,
      "T4": 0,
      "T5": 0
    }
  },
  {
    "name": "Stage 2",
    "deltas": {
      "T1": 249.1,
      "T2": 249.1,
      "T3": 0,
      "T4": 249.1,
      "T5": 0
    }
  },
  {
    "name": "Stage 3",
    "deltas": {
      "T1": 0,
      "T2": 0,
      "T3": 0,
      "T4": 332.2,
      "T5": 0
    }
  },
  {
    "name": "Stage 4",
    "deltas": {
      "T1": 0,
      "T2": 0,
      "T3": 249.1,
      "T4": 249.1,
      "T5": 0
    }
  },
  {
    "name": "Stage 5",
    "deltas": {
      "T1": 0,
      "T2": 0,
      "T3": 0,
      "T4": 0,
      "T5": 830.4
    }
  },
  {
    "name": "Stage 6",
    "deltas": {
      "T1": -249.1,
      "T2": -249.1,
      "T3": -124.6,
      "T4": -124.6,
      "T5": 0
    }
  },
  {
    "name": "Stage 7",
    "deltas": {
      "T1": 249.1,
      "T2": 249.1,
      "T3": -69.5,
      "T4": -69.5,
      "T5": -776.4
    }
  },
  {
    "name": "Stage 8",
    "deltas": {
      "T1": -110,
      "T2": -110,
      "T3": -55,
      "T4": -55,
      "T5": 0
    }
  },
  {
    "name": "Stage 9",
    "deltas": {
      "T1": -9.7,
      "T2": -9.7,
      "T3": 22.2,
      "T4": 22.2,
      "T5": -54
    }
  },
  {
    "name": "Stage 10",
    "deltas": {
      "T1": -129.4,
      "T2": -129.4,
      "T3": -64.7,
      "T4": -64.7,
      "T5": 0
    }
  },
  {
    "name": "Stage 11",
    "deltas": {
      "T1": 83.1,
      "T2": 83.1,
      "T3": 83.1,
      "T4": -538.7,
      "T5": 0
    }
  },
  {
    "name": "Stage 12",
    "deltas": {
      "T1": -664.4,
      "T2": -664.4,
      "T3": -621.8,
      "T4": 0,
      "T5": 0
    }
  }
];
const AC_MAX_FUEL_KG = 4152; // kg — sum of all positive fill stages

// SECTION 6 — SEATS
const AC_CREW_SEATS = {
  "C1": {
    "name": "C1 Pilot (Stbd)",
    "arm": 3673,
    "wSeat": 24.12
  },
  "C2": {
    "name": "C2 Pilot (Port)",
    "arm": 3673,
    "wSeat": 24.12
  },
  "C3": {
    "name": "C3 Cockpit Jump",
    "arm": 4599,
    "wSeat": 17.84
  },
  "C4": {
    "name": "C4 FE (Bay 2 Port)",
    "arm": 6469,
    "wSeat": 26.8
  },
  "C5": {
    "name": "C5 ST TL (Bay 4 Port)",
    "arm": 8444,
    "wSeat": 26.8
  },
  "C6": {
    "name": "C6 ST TM (Bay 5 Stbd)",
    "arm": 9434,
    "wSeat": 26.8
  }
};
const AC_PAX_SEATS = {
  "P1": {
    "name": "P1  Stbd Bay 5.5",
    "arm": 10125,
    "wSeat": 6.9
  },
  "P2": {
    "name": "P2  Stbd Rear Fuse",
    "arm": 11762,
    "wSeat": 9.35
  },
  "P3": {
    "name": "P3  Port Rear Fuse",
    "arm": 11760,
    "wSeat": 9.35
  },
  "P4": {
    "name": "P4  Stbd Bay 1 Aft",
    "arm": 5625,
    "wSeat": 6.9
  },
  "P5": {
    "name": "P5  Stbd Bay 2 Fwd",
    "arm": 6125,
    "wSeat": 6.9
  },
  "P6": {
    "name": "P6  Stbd Bay 2 Aft",
    "arm": 6625,
    "wSeat": 6.9
  },
  "P7": {
    "name": "P7  Stbd Bay 5 Fwd",
    "arm": 9125,
    "wSeat": 6.9
  },
  "P8": {
    "name": "P8  Stbd Bay 5 Aft",
    "arm": 9625,
    "wSeat": 6.9
  },
  "P9": {
    "name": "P9  Stbd Bay 6 Fwd",
    "arm": 10625,
    "wSeat": 6.9
  },
  "P10": {
    "name": "P10 Stbd Bay 6 Aft",
    "arm": 11125,
    "wSeat": 6.9
  },
  "P11": {
    "name": "P11 Port Bay 3 Fwd",
    "arm": 7125,
    "wSeat": 6.9
  },
  "P12": {
    "name": "P12 Port Bay 3 Aft",
    "arm": 7625,
    "wSeat": 6.9
  },
  "P13": {
    "name": "P13 Port Bay 4 Fwd",
    "arm": 8125,
    "wSeat": 6.9
  },
  "P14": {
    "name": "P14 Port Bay 4 Aft",
    "arm": 8625,
    "wSeat": 6.9
  },
  "P15": {
    "name": "P15 Port Bay 5 Fwd",
    "arm": 9125,
    "wSeat": 6.9
  },
  "P16": {
    "name": "P16 Port Bay 5 Aft",
    "arm": 9625,
    "wSeat": 6.9
  },
  "P17": {
    "name": "P17 Port Bay 5.5",
    "arm": 10125,
    "wSeat": 6.9
  },
  "P18": {
    "name": "P18 Port Bay 6 Fwd",
    "arm": 10626,
    "wSeat": 6.9
  }
};

// SECTION 7 — STOWAGE LOCATIONS
const AC_STOWAGE = {
  "SAR_CABINET_FWD_TOP": {
    "name": "SAR Cabinet FWD Top (Zone A)",
    "arm": 6275,
    "group": "SAR Cabinet"
  },
  "SAR_CABINET_FWD_BTM": {
    "name": "SAR Cabinet FWD Btm (Zone B)",
    "arm": 6275,
    "group": "SAR Cabinet"
  },
  "SAR_CABINET_UPPER": {
    "name": "SAR Cabinet Upper (Zone C)",
    "arm": 6275,
    "group": "SAR Cabinet"
  },
  "SAR_CABINET_TOP": {
    "name": "SAR Cabinet Top (Zone D)",
    "arm": 6275,
    "group": "SAR Cabinet"
  },
  "LOCKBOX_TOP": {
    "name": "Lockbox Top Shelf (Zone E)",
    "arm": 6275,
    "group": "SAR Cabinet"
  },
  "LOCKBOX_BTM": {
    "name": "Lockbox Bottom Shelf (Zone F)",
    "arm": 6275,
    "group": "SAR Cabinet"
  },
  "SAR_CABINET_MIDDLE": {
    "name": "SAR Cabinet Middle (Zone G)",
    "arm": 6275,
    "group": "SAR Cabinet"
  },
  "SAR_CABINET_BOTTOM": {
    "name": "SAR Cabinet Bottom (Zone H)",
    "arm": 6275,
    "group": "SAR Cabinet"
  },
  "CABIN_PORT_STOW": {
    "name": "Cabin Port Stowage",
    "arm": 10937,
    "group": "Cabin"
  },
  "CABIN_STBD_STOW": {
    "name": "Cabin Stbd Stowage",
    "arm": 10934,
    "group": "Cabin"
  },
  "CABIN_DEPLOYED": {
    "name": "Cabin Deployed",
    "arm": 7863,
    "group": "Cabin"
  },
  "PTA_COT_AREA": {
    "name": "PTA Cot Area",
    "arm": 10375,
    "group": "Cabin"
  },
  "OVERHEAD_STBD": {
    "name": "Overhead Bins (Stbd)",
    "arm": 10511,
    "group": "Cabin"
  },
  "OVERHEAD_PORT": {
    "name": "Overhead Bins (Port)",
    "arm": 10732,
    "group": "Cabin"
  },
  "PORT_FWD_SHELF_TOP": {
    "name": "Port Fwd Shelf (Top)",
    "arm": 5331,
    "group": "Port Fwd Shelves"
  },
  "PORT_FWD_SHELF_MID": {
    "name": "Port Fwd Shelf (Middle)",
    "arm": 5331,
    "group": "Port Fwd Shelves"
  },
  "PORT_FWD_SHELF_BOT": {
    "name": "Port Fwd Shelf (Bottom)",
    "arm": 5331,
    "group": "Port Fwd Shelves"
  },
  "RAMP_STOW": {
    "name": "Ramp Stowage (general)",
    "arm": 13132,
    "group": "Ramp"
  },
  "RAMP_PORT_FWD": {
    "name": "Ramp Shelf Port Fwd",
    "arm": 12463,
    "group": "Ramp"
  },
  "RAMP_PORT_AFT": {
    "name": "Ramp Shelf Port Aft",
    "arm": 13226,
    "group": "Ramp"
  },
  "RAMP_STBD_FWD": {
    "name": "Ramp Shelf Stbd Fwd",
    "arm": 12481,
    "group": "Ramp"
  },
  "RAMP_STBD_AFT": {
    "name": "Ramp Shelf Stbd Aft",
    "arm": 13228,
    "group": "Ramp"
  }
};

// SECTION 8 — ROLE-FIT EQUIPMENT
const AC_ROLE_FIT = {
  "RF_SECONDARY_HOIST": {
    "name": "Secondary Hoist",
    "w": 82.34,
    "arm": 9255,
    "normally": true
  },
  "RF_TRAKKA": {
    "name": "TRAKKA A-800 Searchlight",
    "w": 34.47,
    "arm": 6340,
    "normally": true
  },
  "RF_SEA_TRAY": {
    "name": "Sea Tray",
    "w": 10.3,
    "arm": 8127,
    "normally": true
  },
  "RF_DIVE_O2_RACK": {
    "name": "Dive Bottle / O2 Rack",
    "w": 7,
    "arm": 10849,
    "normally": true
  },
  "RF_SAR_CABINET": {
    "name": "SAR Equipment Storage Cabinet",
    "w": 73.7,
    "arm": 6275,
    "normally": false
  },
  "RF_PTA_COT": {
    "name": "PTA Cot System",
    "w": 110,
    "arm": 10375,
    "normally": false
  },
  "RF_SENSOR_WS": {
    "name": "Sensor Workstation",
    "w": 46.69,
    "arm": 5830,
    "normally": false
  },
  "RF_EOIR_MX15": {
    "name": "EO/IR MX-15 Package (incl. blanking plug)",
    "w": 45.53,
    "arm": 1684,
    "normally": true
  },
  "RF_EOIR_HANDCTRL": {
    "name": "EO/IR Hand Controller",
    "w": 1.7,
    "arm": 5828,
    "normally": true
  },
  "RF_AIR_COOLING": {
    "name": "Air Cooling Pack",
    "w": 64.62,
    "arm": 9673,
    "normally": true
  },
  "RF_FLOAT_SYS": {
    "name": "Floatation System",
    "w": 83.91,
    "arm": 8478,
    "normally": true
  },
  "RF_LIFERAFT_SPONSONS": {
    "name": "10-man Life Rafts (x2) Sponsons",
    "w": 66.03,
    "arm": 9588,
    "normally": true
  },
  "RF_LASHING_KIT": {
    "name": "Lashing / Tie-down Kit",
    "w": 9.76,
    "arm": 7243,
    "normally": true
  },
  "RF_RIPU": {
    "name": "RIPU",
    "w": 34.88,
    "arm": 5520,
    "normally": true
  },
  "RF_RIPU_CABLES": {
    "name": "RIPU Cables (Removable)",
    "w": 2.5,
    "arm": 5112,
    "normally": true
  },
  "RF_MR_SLIP": {
    "name": "Main Rotor Slip Ring",
    "w": 12,
    "arm": 8000,
    "normally": true
  },
  "RF_TR_SLIP": {
    "name": "Tail Rotor Slip Ring",
    "w": 2.4,
    "arm": 19500,
    "normally": true
  },
  "RF_FIELD_TOOLKIT": {
    "name": "Field Tool Kit & Spares",
    "w": 5.98,
    "arm": 12688,
    "normally": true
  },
  "RF_STOW_TOOLKIT": {
    "name": "Stowage Tool Kit / Emergency Spares",
    "w": 1.6,
    "arm": 12491,
    "normally": true
  },
  "RF_STOW_STOKES_RAMP": {
    "name": "Stowage: Stokes (Ramp) fittings",
    "w": 2.11,
    "arm": 13132,
    "normally": true
  },
  "RF_STOW_STOKES_CABIN": {
    "name": "Stowage: Stokes (Cabin) fittings",
    "w": 2.11,
    "arm": 7863,
    "normally": true
  },
  "RF_STOW_BASKET_PORT": {
    "name": "Stowage: Basket (Port) fittings",
    "w": 2.61,
    "arm": 10937,
    "normally": true
  },
  "RF_STOW_BASKET_STBD": {
    "name": "Stowage: Basket (Stbd) fittings",
    "w": 2.61,
    "arm": 10934,
    "normally": true
  }
};

// SECTION 9 — MISSION EQUIPMENT
const AC_MISSION_EQUIP = {
  "ME_SAR_ZONEH": {
    "name": "SAR Equipment (Alpine/Camp/Drill/Extraction/MedSled/MTN-Belay/REEL/Rope x2)",
    "w": 112.5,
    "stow": "SAR_CABINET_BOTTOM",
    "group": "SAR Equipment",
    "on": true
  },
  "ME_RESCUE_BASKET_PORT": {
    "name": "Rescue Basket (Port)",
    "w": 31.8,
    "stow": "CABIN_PORT_STOW",
    "group": "SAR Equipment",
    "on": true
  },
  "ME_RESCUE_BASKET_STBD": {
    "name": "Rescue Basket (Stbd)",
    "w": 31.8,
    "stow": "CABIN_STBD_STOW",
    "group": "SAR Equipment",
    "on": false
  },
  "ME_STOKES_RAMP": {
    "name": "Stokes Litter (Ramp)",
    "w": 49,
    "stow": "RAMP_STOW",
    "group": "SAR Equipment",
    "on": true
  },
  "ME_STOKES_CABIN": {
    "name": "Stokes Litter (Cabin)",
    "w": 49,
    "stow": "CABIN_DEPLOYED",
    "group": "SAR Equipment",
    "on": false
  },
  "ME_MED_ZONEG": {
    "name": "Medical Equipment (Supp/Pen x2/Casualty/AED/Misc Bag)",
    "w": 68,
    "stow": "SAR_CABINET_MIDDLE",
    "group": "Medical Equipment",
    "on": true
  },
  "ME_AVIOX_O2_PRIMARY": {
    "name": "AviOx O2 Primary (est)",
    "w": 10,
    "stow": "PTA_COT_AREA",
    "group": "Medical Equipment",
    "on": true
  },
  "ME_AVIOX_O2_SPARE": {
    "name": "AviOx O2 Spare (est)",
    "w": 10,
    "stow": "PTA_COT_AREA",
    "group": "Medical Equipment",
    "on": true
  },
  "ME_ALSE_ZONED": {
    "name": "ALSE Equipment (Arctic tent/sleep/basic/pax vests)",
    "w": 50.5,
    "stow": "SAR_CABINET_TOP",
    "group": "ALSE",
    "on": true
  },
  "ME_QDIS_X3": {
    "name": "Quick Don Immersion Suits x3",
    "w": 6,
    "stow": "SAR_CABINET_UPPER",
    "group": "ALSE",
    "on": true
  },
  "ME_NVGS_X5": {
    "name": "NVGs x5",
    "w": 4.5,
    "stow": "LOCKBOX_TOP",
    "group": "Misc / Mission Kits",
    "on": true
  },
  "ME_SAR_RIFLE": {
    "name": "SAR Rifle",
    "w": 2.5,
    "stow": "OVERHEAD_STBD",
    "group": "Misc / Mission Kits",
    "on": true
  },
  "ME_SAR_DRUG": {
    "name": "SAR Drug Kit",
    "w": 1,
    "stow": "OVERHEAD_PORT",
    "group": "Medical Equipment",
    "on": true
  },
  "ME_PORT_FWD_SHELF_TOP": {
    "name": "Port Fwd Shelf Top",
    "w": 0,
    "stow": "PORT_FWD_SHELF_TOP",
    "group": "Stowage",
    "on": false
  },
  "ME_PORT_FWD_SHELF_MID": {
    "name": "Port Fwd Shelf Middle",
    "w": 0,
    "stow": "PORT_FWD_SHELF_MID",
    "group": "Stowage",
    "on": false
  },
  "ME_PORT_FWD_SHELF_BOT": {
    "name": "Port Fwd Shelf Bottom",
    "w": 0,
    "stow": "PORT_FWD_SHELF_BOT",
    "group": "Stowage",
    "on": false
  },
  "ME_RAMP_SHELF_PORT_FWD": {
    "name": "Ramp Shelf Port Fwd",
    "w": 0,
    "stow": "RAMP_PORT_FWD",
    "group": "Stowage",
    "on": false
  },
  "ME_RAMP_SHELF_PORT_AFT": {
    "name": "Ramp Shelf Port Aft",
    "w": 0,
    "stow": "RAMP_PORT_AFT",
    "group": "Stowage",
    "on": false
  },
  "ME_RAMP_SHELF_STBD_FWD": {
    "name": "Ramp Shelf Stbd Fwd",
    "w": 0,
    "stow": "RAMP_STBD_FWD",
    "group": "Stowage",
    "on": false
  },
  "ME_RAMP_SHELF_STBD_AFT": {
    "name": "Ramp Shelf Stbd Aft",
    "w": 0,
    "stow": "RAMP_STBD_AFT",
    "group": "Stowage",
    "on": false
  },
  "ME_OVERHEAD_PORT": {
    "name": "Overhead Bin (Port)",
    "w": 0,
    "stow": "OVERHEAD_PORT",
    "group": "Stowage",
    "on": true
  },
  "ME_OVERHEAD_STBD": {
    "name": "Overhead Bin (Stbd)",
    "w": 0,
    "stow": "OVERHEAD_STBD",
    "group": "Stowage",
    "on": true
  },
  "ME_AC_B25": {
    "name": "AC B25",
    "w": 20,
    "stow": "PORT_FWD_SHELF_MID",
    "group": "Personal Equipment",
    "on": false
  },
  "ME_FO_B25": {
    "name": "FO B25",
    "w": 20,
    "stow": "PORT_FWD_SHELF_TOP",
    "group": "Personal Equipment",
    "on": false
  },
  "ME_FE_B25": {
    "name": "FE B25",
    "w": 20,
    "stow": "PORT_FWD_SHELF_BOT",
    "group": "Personal Equipment",
    "on": false,
    "customArm": 6262
  },
  "ME_STTL_B25": {
    "name": "Team Lead B25/Dive Gear",
    "w": 40,
    "stow": "RAMP_PORT_FWD",
    "group": "Personal Equipment",
    "on": false
  },
  "ME_STTM_B25": {
    "name": "Team Member B25/Dive Gear",
    "w": 40,
    "stow": "RAMP_STBD_FWD",
    "group": "Personal Equipment",
    "on": false
  },
  "ME_AC_RON_BAG": {
    "name": "AC RON bag",
    "w": 10,
    "stow": "SAR_CABINET_FWD_BTM",
    "group": "Personal Equipment",
    "on": false
  },
  "ME_FO_RON_BAG": {
    "name": "FO RON Bag",
    "w": 10,
    "stow": "SAR_CABINET_FWD_BTM",
    "group": "Personal Equipment",
    "on": false
  },
  "ME_FE_RON_BAG": {
    "name": "FE RON Bag",
    "w": 10,
    "stow": "SAR_CABINET_FWD_BTM",
    "group": "Personal Equipment",
    "on": false
  },
  "ME_STTL_RON_BAG": {
    "name": "Team Lead RON Bag",
    "w": 10,
    "stow": "RAMP_PORT_AFT",
    "group": "Personal Equipment",
    "on": false
  },
  "ME_STTM_RON_BAG": {
    "name": "Team Member RON Bag",
    "w": 10,
    "stow": "RAMP_STBD_AFT",
    "group": "Personal Equipment",
    "on": false
  },
  "ME_AC_EFB_BAG": {
    "name": "AC EFB Bag",
    "w": 5,
    "stow": "CUSTOM",
    "group": "Personal Equipment",
    "on": false,
    "customArm": 3473
  },
  "ME_FO_EFB_BAG": {
    "name": "FO EFB Bag",
    "w": 5,
    "stow": "CUSTOM",
    "group": "Personal Equipment",
    "on": false,
    "customArm": 3473
  },
  "ME_FE_HELMET_BAG": {
    "name": "FE Helmet Bag",
    "w": 10,
    "stow": "CUSTOM",
    "group": "Personal Equipment",
    "on": false,
    "customArm": 6262
  },
  "ME_STTL_HOIST_BAG": {
    "name": "Team Lead Hoist Bag",
    "w": 10,
    "stow": "CUSTOM",
    "group": "Personal Equipment",
    "on": false,
    "customArm": 8244
  },
  "ME_STTM_HOIST_BAG": {
    "name": "Team Member Hoist Bag",
    "w": 10,
    "stow": "CUSTOM",
    "group": "Personal Equipment",
    "on": false,
    "customArm": 9234
  }
};

// SECTION 10 — MISSION PRESETS
const AC_PRESETS = {
  "SAR3": {
    "name": "SAR-3 Pax",
    "notes": "EO/IR + Sensor WS + SAR Cabinet + PTA Cot installed.",
    "image": "images/SAR_3_Pax.png",
    "seats": {
      "crew": [
        "C1",
        "C2",
        "C3",
        "C4",
        "C5",
        "C6"
      ],
      "pax": [
        "P1",
        "P2",
        "P3"
      ]
    },
    "occupants": [
      "C1",
      "C2",
      "C4",
      "C5",
      "C6"
    ],
    "roleFitOn": [
      "RF_SECONDARY_HOIST",
      "RF_TRAKKA",
      "RF_SEA_TRAY",
      "RF_DIVE_O2_RACK",
      "RF_AIR_COOLING",
      "RF_FLOAT_SYS",
      "RF_LIFERAFT_SPONSONS",
      "RF_LASHING_KIT",
      "RF_RIPU",
      "RF_RIPU_CABLES",
      "RF_MR_SLIP",
      "RF_TR_SLIP",
      "RF_FIELD_TOOLKIT",
      "RF_STOW_TOOLKIT",
      "RF_STOW_STOKES_RAMP",
      "RF_STOW_STOKES_CABIN",
      "RF_STOW_BASKET_PORT",
      "RF_STOW_BASKET_STBD",
      "RF_EOIR_MX15",
      "RF_SENSOR_WS",
      "RF_PTA_COT",
      "RF_SAR_CABINET"
    ],
    "roleFitOff": [],
    "missionOn": [
      "ME_SAR_ZONEH",
      "ME_MED_ZONEG",
      "ME_AVIOX_O2_PRIMARY",
      "ME_AVIOX_O2_SPARE",
      "ME_ALSE_ZONED",
      "ME_RESCUE_BASKET_STBD",
      "ME_STOKES_RAMP",
      "ME_QDIS_X3",
      "ME_NVGS_X5",
      "ME_SAR_RIFLE",
      "ME_SAR_DRUG",
      "ME_PORT_FWD_SHELF_TOP",
      "ME_PORT_FWD_SHELF_MID",
      "ME_PORT_FWD_SHELF_BOT",
      "ME_RAMP_SHELF_PORT_FWD",
      "ME_RAMP_SHELF_PORT_AFT",
      "ME_RAMP_SHELF_STBD_FWD",
      "ME_RAMP_SHELF_STBD_AFT",
      "ME_ALSE_ARCTIC2",
      "ME_NEW_THINGY",
      "ME_OVERHEAD_PORT",
      "ME_OVERHEAD_STBD",
      "ME_STTL_B25",
      "ME_STTM_B25",
      "ME_FO_B25",
      "ME_FE_B25",
      "ME_AC_B25",
      "ME_STTM_HOIST_BAG",
      "ME_STTL_HOIST_BAG",
      "ME_FO_EFB_BAG",
      "ME_FE_HELMET_BAG",
      "ME_AC_EFB_BAG"
    ],
    "missionOff": []
  },
  "SAR10": {
    "name": "SAR-10 Pax",
    "notes": "PTA Cot removed vs SAR-3.",
    "image": "images/SAR_10_Pax.png",
    "seats": {
      "crew": [
        "C1",
        "C2",
        "C3",
        "C4",
        "C5",
        "C6"
      ],
      "pax": [
        "P1",
        "P9",
        "P10",
        "P2",
        "P3",
        "P17",
        "P16",
        "P15",
        "P12",
        "P11"
      ]
    },
    "occupants": [
      "C1",
      "C2",
      "C4",
      "C5",
      "C6"
    ],
    "roleFitOn": [
      "RF_SECONDARY_HOIST",
      "RF_TRAKKA",
      "RF_SEA_TRAY",
      "RF_DIVE_O2_RACK",
      "RF_AIR_COOLING",
      "RF_FLOAT_SYS",
      "RF_LIFERAFT_SPONSONS",
      "RF_LASHING_KIT",
      "RF_RIPU",
      "RF_RIPU_CABLES",
      "RF_MR_SLIP",
      "RF_TR_SLIP",
      "RF_FIELD_TOOLKIT",
      "RF_STOW_TOOLKIT",
      "RF_STOW_STOKES_RAMP",
      "RF_STOW_STOKES_CABIN",
      "RF_STOW_BASKET_PORT",
      "RF_STOW_BASKET_STBD",
      "RF_EOIR_MX15",
      "RF_SENSOR_WS",
      "RF_SAR_CABINET"
    ],
    "roleFitOff": [
      "RF_PTA_COT"
    ],
    "missionOn": [
      "ME_SAR_ZONEH",
      "ME_MED_ZONEG",
      "ME_AVIOX_O2_PRIMARY",
      "ME_AVIOX_O2_SPARE",
      "ME_ALSE_ZONED",
      "ME_RESCUE_BASKET_PORT",
      "ME_STOKES_RAMP",
      "ME_QDIS_X3",
      "ME_NVGS_X5",
      "ME_SAR_RIFLE",
      "ME_SAR_DRUG",
      "ME_PORT_FWD_SHELF_TOP",
      "ME_PORT_FWD_SHELF_MID",
      "ME_PORT_FWD_SHELF_BOT",
      "ME_RAMP_SHELF_PORT_FWD",
      "ME_RAMP_SHELF_PORT_AFT",
      "ME_RAMP_SHELF_STBD_FWD",
      "ME_RAMP_SHELF_STBD_AFT",
      "ME_ALSE_ARCTIC2",
      "ME_OVERHEAD_PORT",
      "ME_OVERHEAD_STBD",
      "ME_STTL_B25",
      "ME_STTM_B25",
      "ME_FO_B25",
      "ME_FE_B25",
      "ME_AC_B25",
      "ME_STTM_HOIST_BAG",
      "ME_STTL_HOIST_BAG",
      "ME_FO_EFB_BAG",
      "ME_FE_HELMET_BAG",
      "ME_AC_EFB_BAG"
    ],
    "missionOff": []
  },
  "CASEVAC": {
    "name": "CASEVAC",
    "notes": "Sensor WS removed; SAR cabinet removed; mission gear baseline off.",
    "image": "images/CASEVAC.png",
    "seats": {
      "crew": [
        "C1",
        "C2",
        "C3",
        "C4"
      ],
      "pax": [
        "P2",
        "P3"
      ]
    },
    "occupants": [
      "C1",
      "C2",
      "C4",
      "P2",
      "P3"
    ],
    "roleFitOn": [
      "RF_SECONDARY_HOIST",
      "RF_TRAKKA",
      "RF_SEA_TRAY",
      "RF_DIVE_O2_RACK",
      "RF_AIR_COOLING",
      "RF_FLOAT_SYS",
      "RF_LIFERAFT_SPONSONS",
      "RF_LASHING_KIT",
      "RF_RIPU",
      "RF_RIPU_CABLES",
      "RF_MR_SLIP",
      "RF_TR_SLIP",
      "RF_FIELD_TOOLKIT",
      "RF_STOW_TOOLKIT",
      "RF_EOIR_MX15"
    ],
    "roleFitOff": [
      "RF_SAR_CABINET",
      "RF_SENSOR_WS",
      "RF_PTA_COT",
      "RF_STOW_STOKES_RAMP",
      "RF_STOW_STOKES_CABIN",
      "RF_STOW_BASKET_PORT",
      "RF_STOW_BASKET_STBD"
    ],
    "missionOn": [
      "ME_OVERHEAD_PORT",
      "ME_OVERHEAD_STBD",
      "ME_FO_B25",
      "ME_FE_B25",
      "ME_AC_B25",
      "ME_FO_EFB_BAG",
      "ME_FE_HELMET_BAG",
      "ME_AC_EFB_BAG"
    ],
    "missionOff": [
      "ME_SAR_ZONEH",
      "ME_RESCUE_BASKET_PORT",
      "ME_RESCUE_BASKET_STBD",
      "ME_STOKES_RAMP",
      "ME_STOKES_CABIN",
      "ME_MED_ZONEG",
      "ME_AVIOX_O2_PRIMARY",
      "ME_AVIOX_O2_SPARE",
      "ME_ALSE_ZONED",
      "ME_QDIS_X3",
      "ME_NVGS_X5",
      "ME_SAR_RIFLE",
      "ME_SAR_DRUG",
      "ME_PORT_FWD_SHELF_TOP",
      "ME_PORT_FWD_SHELF_MID",
      "ME_PORT_FWD_SHELF_BOT",
      "ME_RAMP_SHELF_PORT_FWD",
      "ME_RAMP_SHELF_PORT_AFT",
      "ME_RAMP_SHELF_STBD_FWD",
      "ME_RAMP_SHELF_STBD_AFT",
      "ME_ALSE_KIT"
    ]
  },
  "TRANSPORT": {
    "name": "Transport",
    "notes": "Transport: SAR cabinet removed; Sensor WS removed; EO/IR + TRAKKA stay.",
    "image": "images/Transport.png",
    "seats": {
      "crew": [
        "C1",
        "C2",
        "C3",
        "C4"
      ],
      "pax": [
        "P1",
        "P2",
        "P3",
        "P4",
        "P5",
        "P6",
        "P7",
        "P8",
        "P9",
        "P10",
        "P11",
        "P12",
        "P15",
        "P16",
        "P17",
        "P18"
      ]
    },
    "occupants": [
      "C1",
      "C2",
      "C4"
    ],
    "roleFitOn": [
      "RF_SECONDARY_HOIST",
      "RF_TRAKKA",
      "RF_SEA_TRAY",
      "RF_DIVE_O2_RACK",
      "RF_AIR_COOLING",
      "RF_FLOAT_SYS",
      "RF_LIFERAFT_SPONSONS",
      "RF_LASHING_KIT",
      "RF_EOIR_MX15",
      "RF_MR_SLIP",
      "RF_TR_SLIP",
      "RF_FIELD_TOOLKIT",
      "RF_STOW_TOOLKIT",
      "RF_RIPU",
      "RF_RIPU_CABLES"
    ],
    "roleFitOff": [],
    "missionOn": [
      "ME_OVERHEAD_PORT",
      "ME_OVERHEAD_STBD",
      "ME_FO_B25",
      "ME_FE_B25",
      "ME_AC_B25",
      "ME_FO_EFB_BAG",
      "ME_FE_HELMET_BAG",
      "ME_AC_EFB_BAG"
    ],
    "missionOff": []
  }
};

// SECTION 11 — CONFIG META (data version, separate from app code version)
// configVersion increments by 1 on every custodian export. changelog is
// newest-first. This is the DATA version; APP_VERSION (persist.js) is the
// CODE version. The two are independent on purpose.
const AC_META = {
  "configVersion": 1,
  "configReleasedAt": "2026-06-22T04:00:47.904Z",
  "changelog": [
    {
      "version": 1,
      "at": "2026-06-22T04:00:47.904Z",
      "note": "Baseline configuration."
    }
  ]
};

// EXPORT
const AC = {
  meta:          AC_META,
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

// Apply localStorage overrides
try {
  const saved = localStorage.getItem('ac_config_overrides');
  if (saved) {
    const ov = JSON.parse(saved);
    if (ov.missionEquip) AC.missionEquip = ov.missionEquip;
    if (ov.stowage)      AC.stowage      = ov.stowage;
    if (ov.roleFit)      AC.roleFit      = ov.roleFit;
    // Restore preset missionOn/missionOff and roleFitOn/Off overrides
    if (ov.presets) {
      for (const pk of Object.keys(ov.presets)) {
        if (AC.presets[pk]) {
          if (ov.presets[pk].missionOn)  AC.presets[pk].missionOn  = ov.presets[pk].missionOn;
          if (ov.presets[pk].missionOff) AC.presets[pk].missionOff = ov.presets[pk].missionOff;
          if (ov.presets[pk].roleFitOn)  AC.presets[pk].roleFitOn  = ov.presets[pk].roleFitOn;
          if (ov.presets[pk].roleFitOff) AC.presets[pk].roleFitOff = ov.presets[pk].roleFitOff;
        }
      }
    }
  }
} catch (e) { console.warn('Could not load config overrides:', e); }