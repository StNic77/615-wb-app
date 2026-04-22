/* compute.js — All W&B math and calculations */
/* =========================
   CORE MATH
   ========================= */

function roundKg(x){ return Math.round(x); } // per your rounding requirement
function roundMm(x){ return Math.round(x); }

function cgFromMoment(totalW, totalM){
  if (totalW <= 0) return null;
  return totalM / totalW;
}

function computeRoleFitTotals(s){
  // EOIR hand controller dependency:
  // "installed any time Sensor WS and EOIR pkg are installed"
  const eoir = !!s.roleFit.RF_EOIR_MX15;
  const ws = !!s.roleFit.RF_SENSOR_WS;
  s.roleFit.RF_EOIR_HANDCTRL = (eoir && ws);

  let w=0, m=0;
  for (const k of Object.keys(AC.roleFit)){
    if (!s.roleFit[k]) continue;
    const it = AC.roleFit[k];
    w += it.w;
    m += it.w * it.arm;
  }
  return {w, m};
}

function computeMissionTotals(s){
  let w=0, m=0;
  for (const k of Object.keys(AC.missionEquip)){
    if (!s.mission[k]) continue;
    const it = AC.missionEquip[k];
    const ww = it.w;
    w += ww;
    m += ww * it.arm;
  }
  return {w, m};
}

function computeSeatTotals(s){
  // installed seat structures + occupants (90 kg each)
  const personW = 90;
  let w=0, m=0;

  // crew seats
  for (const k of Object.keys(AC.crewSeats)){
    if (s.seats[k]){
      const seat = AC.crewSeats[k];
      w += seat.wSeat;
      m += seat.wSeat * seat.arm;
    }
    if (s.occupants[k]){
      w += personW;
      m += personW * (AC.crewSeats[k]?.arm ?? AC.paxSeats[k]?.arm ?? 8000);
    }
  }
  // pax seats
  for (const k of Object.keys(AC.paxSeats)){
    if (s.seats[k]){
      const seat = AC.paxSeats[k];
      w += seat.wSeat;
      m += seat.wSeat * seat.arm;
    }
    if (s.occupants[k]){
      w += personW;
      m += personW * (AC.paxSeats[k]?.arm ?? 8000);
    }
  }
  return {w, m};
}

function computeBayTotals(s){
  let w=0, m=0;
  for (const bay of Object.keys(s.bays)){
    const ww = +s.bays[bay] || 0;
    const arm = AC.bayArms[bay];
    w += ww;
    m += ww * arm;
  }
  return {w, m};
}

function computeCargoTotals(s){
  let w=0, m=0;
  for (const c of s.cargo){
    const ww = +c.w || 0;
    const arm = +c.arm || 0;
    w += ww;
    m += ww * arm;
  }
  return {w, m};
}

function solveFuelTanksFromTotal(totalKg){
  // Fill from stages, applying positive deltas only, sequentially, partially if needed.
  // This is a distribution solver for a total fuel (good for demo).
  // Any negative stages are ignored for fill distribution; they’re transfer dynamics not a fill bucket.
  const tanks = {T1:0,T2:0,T3:0,T4:0,T5:0};
  let remaining = Math.max(0, totalKg);

  for (const st of AC.fuelStages){
    // stage capacity = sum of positive deltas
    const posKeys = Object.keys(st.deltas).filter(k => st.deltas[k] > 0);
    const cap = posKeys.reduce((a,k)=>a+st.deltas[k], 0);
    if (cap <= 0) continue;
    if (remaining <= 0) break;

    const take = Math.min(remaining, cap);
    const frac = take / cap;

    for (const k of posKeys){
      tanks[k] += st.deltas[k] * frac;
    }
    remaining -= take;
  }

  // rounding to nearest kg at end (you asked for that)
  for (const k of Object.keys(tanks)){
    tanks[k] = roundKg(tanks[k]);
  }

  // adjust rounding drift to match totalKg exactly by distributing +/-
  let sum = Object.values(tanks).reduce((a,b)=>a+b,0);
  let drift = roundKg(totalKg) - sum;
  const order = ["T3","T2","T1","T4","T5"]; // arbitrary stable order
  let i=0;
  while (drift !== 0 && i < 5000){
    const kk = order[i % order.length];
    tanks[kk] += (drift > 0 ? 1 : -1);
    drift += (drift > 0 ? -1 : 1);
    i++;
  }

  return tanks;
}

function computeFuelTotals(s){
  const total = roundKg(+s.fuel.total || 0);
  let tanks = s.fuel.tanks;

  if (!s.fuel.manualTanks){
    tanks = solveFuelTanksFromTotal(total);
    s.fuel.tanks = {...tanks};
  } else {
    // manual tanks: total is sum
    const sum = roundKg(Object.values(tanks).reduce((a,b)=>a+(+b||0),0));
    s.fuel.total = sum;
  }

  let w=0, m=0;
  for (const k of Object.keys(tanks)){
    const ww = +tanks[k] || 0;
    const arm = AC.fuelTankArms[k];
    w += ww;
    m += ww * arm;
  }
  return {w: roundKg(w), m};
}

function cgBand(cg){
  if (cg == null) return "—";
  if (cg < AC.envelope.cgBands.fwdMax) return "FWD";
  if (cg <= AC.envelope.cgBands.midMax) return "MID";
  return "AFT";
}

function pointInPoly(pt, poly){
  // ray-casting for convex/concave polygons
  let inside = false;
  for (let i=0, j=poly.length-1; i<poly.length; j=i++){
    const xi=poly[i].cg, yi=poly[i].w;
    const xj=poly[j].cg, yj=poly[j].w;
    const intersect = ((yi > pt.w) !== (yj > pt.w)) &&
      (pt.cg < (xj - xi) * (pt.w - yi) / ((yj - yi) || 1e-9) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function computeWB(tail){
  const s = STORE.sessions[tail];

  // basic
  const basicW = +s.accepted.basicW || 0;
  const basicCG = +s.accepted.basicCG || 0;
  const basicM = basicW * basicCG;

  // Role fit / mission / seats
  const rf = computeRoleFitTotals(s);
  const me = computeMissionTotals(s);
  const st = computeSeatTotals(s);

  // Cabin bay loads (tactical / optional)
  const bay = computeBayTotals(s);

    // Cargo
  const cargo = computeCargoTotals(s);

  // Load zones / shelves (discrete stowage locations)
  // NOTE: entries may optionally include an 'arm' field. If missing, that entry contributes weight only if arm is known.
  const zones = (() => {
    const list = Array.isArray(s.zones) ? s.zones : [];
    let w = 0;
    let m = 0;
    for (const z of list){
      if (!z) continue;
      const zw = +z.w || 0;
      const arm = +z.arm; // may be NaN if not present yet
      if (!Number.isFinite(zw)) continue;
      w += zw;
      if (Number.isFinite(arm)) m += zw * arm;
    }
    return { w: roundKg(w), m };
  })();

  // Fuel
const MAX_FUEL_KG = 4152; // 830.4 kg × 5 tanks (hard physical cap)
  
  // ---- Hard physical fuel cap (does not change allowance logic; prevents impossible fuel) ----
  if (!s.fuel) s.fuel = { total: 0, tanks: {} };

  // Clamp total (if UI writes to total directly)
  s.fuel.total = Math.min(roundKg(s.fuel.total || 0), MAX_FUEL_KG);

  // Clamp tanks (if UI writes to tanks directly)
  const t = s.fuel.tanks || {};
  const tankKeys = Object.keys(t);
  if (tankKeys.length){
    const sumTanks = tankKeys.reduce((acc,k)=> acc + (Number(t[k])||0), 0);
    if (sumTanks > MAX_FUEL_KG){
      const factor = MAX_FUEL_KG / sumTanks;

      // scale down proportionally
      let scaled = {};
      let newSum = 0;
      for (const k of tankKeys){
        const v = Number(t[k]) || 0;
        const nv = roundKg(v * factor);
        scaled[k] = nv;
        newSum += nv;
      }

      // fix rounding drift to hit cap exactly (adjust last key)
      const drift = newSum - MAX_FUEL_KG;
      if (drift !== 0){
        const last = tankKeys[tankKeys.length - 1];
        scaled[last] = roundKg((scaled[last] || 0) - drift);
      }

      s.fuel.tanks = scaled;
      s.fuel.total = MAX_FUEL_KG;
    }
  }
  // ------------------------------------------------------------------------------------------

  const fuel = computeFuelTotals(s);


  // ✅ OPERATING = everything except fuel
  const opW = roundKg(basicW + rf.w + me.w + st.w + bay.w + cargo.w + zones.w);
  const opM = basicM + rf.m + me.m + st.m + bay.m + cargo.m + zones.m;
  const opCG = roundMm(cgFromMoment(opW, opM) || 0);


  // ✅ AUW = Operating + Fuel
  const auw = roundKg(opW + fuel.w);
  const auwM = opM + fuel.m;
  const auwCG = roundMm(cgFromMoment(auw, auwM) || 0);

  // Envelope checks
  const hardCgOk = (auwCG >= AC.envelope.hardCg.min && auwCG <= AC.envelope.hardCg.max);
  const absCgOk = (auwCG >= AC.envelope.cgAbsolute.min && auwCG <= AC.envelope.cgAbsolute.max);
  const inMain = pointInPoly({w:auw, cg:auwCG}, AC.envelope.envMain);
  const inAlt = (auw <= 16000) && (auw >= 15600) && pointInPoly({w:auw, cg:auwCG}, AC.envelope.envAlt.concat([AC.envelope.envAlt[0]]));
  const envOk = (inMain && absCgOk) || (inAlt && absCgOk);

  // Weight checks (per your notes)
  const overweightAirborne = auw > 16000;
  const altGross = (auw > 15600 && auw <= 16000);

  const band = cgBand(auwCG);

  return {
    basicW, basicCG,
    opW, opCG,
    fuelTotal: roundKg(s.fuel.total || 0),
    fuelTanks: {...s.fuel.tanks},
    cabinTotal: roundKg(bay.w),
        cargoTotal: roundKg(cargo.w),
    zonesTotal: roundKg(zones.w),

    auw, auwCG,
    cgBand: band,
    flags: {
      hardCgOk, absCgOk, envOk, inMain, inAlt,
      overweightAirborne, altGross
    }
  };
}


/* =========================
   ACCEPTANCE INVALIDATION
   ========================= */