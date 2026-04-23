/* app.js — App state, UI, render functions, boot */
const STORE = {
  tails: [],
  sessions: {},
  selectedTail: null
};


/* =========================
   INIT TAILS / SESSIONS
   ========================= */

function initTails(){
  const active       = AC.tails.active;
  const placeholders = AC.tails.placeholders;
  STORE.tails = [...active, ...placeholders];

  // Expand CASEVAC "ALL" shorthand now that AC.missionEquip is available
  if (AC.presets.CASEVAC.missionOff === "ALL"){
    AC.presets.CASEVAC.missionOff = Object.keys(AC.missionEquip);
  }

  for (const t of STORE.tails){
    STORE.sessions[t] = makeNewSession(t, placeholders.includes(t));
  }
}

function makeNewSession(tail, isPlaceholder){
  // Default role-fit state = "normally installed"
  const roleFitState = {};
  for (const k of Object.keys(AC.roleFit)){
    roleFitState[k] = !!AC.roleFit[k].normally;
  }

  // Enforce EOIR hand controller dependency at baseline (will be computed later too)
  // We'll store as normal but dependency logic will correct on render/compute.

  const missionState = {};
  for (const k of Object.keys(AC.missionEquip)){
    missionState[k] = !!AC.missionEquip[k].on;
  }

  // Seats installed/occupants
  const seatState = {};
  const occupant = {};
  for (const k of [...Object.keys(AC.crewSeats), ...Object.keys(AC.paxSeats)]){
    seatState[k] = false;
    occupant[k] = null; // {type:"crew"|"pax", label:"C108..." or name}
  }

  // Fuel
  const fuel = {
    total: 0,
    landing: 300,
    manualTanks: false,
    tanks: {T1:0,T2:0,T3:0,T4:0,T5:0},
    burnSession: [] // {t:ms, fuel:kg, gs:kt}
  };

  // Cargo entries (Cargo 1-4 like MCDU)
  const cargo = []; // {name,w,arm}

  // Bay loads (tactical)
  const bays = {
    BAY1:0,BAY2:0,BAY3:0,BAY4:0,BAY5:0,BAY55:0,BAY6:0,REAR:0
  };

  return {
    tail,
    isPlaceholder,
    // sign-out lifecycle
    signedOutBy: null,
    signedOutAt: null,
    returnedAt: null,

    accepted: {
      isAccepted:false,
      by:null,
      at:null,
      basicW:null,
      basicCG:null,
      fuelLog:null
    },

    preset: null,

    roleFit: roleFitState,
    mission: missionState,
    seats: seatState,
    occupants: occupant,

    fuel,
    cargo,
    bays,

    certify: {
      certified:false,
      by:null,
      at:null,
      mcdu: {auw:null,cg:null,fuel:null}
    },

    // acceptance invalidation triggers
    acceptanceInvalidated: false,
  };
}

/* =========================
   UI TAB SYSTEM
   ========================= */

/* =========================
   THEME TOGGLE (light / dark)
   Persists choice in localStorage.
   ========================= */

function initThemeToggle() {
  const btn  = document.getElementById("themeToggle");
  const icon = document.getElementById("themeToggleIcon");
  if (!btn || !icon) return;

  const applyTheme = (theme) => {
    if (theme === "light") {
      document.body.classList.add("theme-light");
      icon.textContent = "☾";
      btn.title = "Switch to dark theme";
    } else {
      document.body.classList.remove("theme-light");
      icon.textContent = "☀";
      btn.title = "Switch to light theme";
    }
  };

  // Load saved preference (default: dark)
  let theme = "dark";
  try { theme = localStorage.getItem("wb_theme") || "dark"; } catch (e) {}
  applyTheme(theme);

  btn.onclick = () => {
    theme = (theme === "light") ? "dark" : "light";
    try { localStorage.setItem("wb_theme", theme); } catch (e) {}
    applyTheme(theme);
    // Re-render so canvas-drawn elements (envelope text/grid) pick up new colors
    if (typeof render === "function") render();
  };
}


const TABS = [
  {id:"HOME", label:"Home"},
  {id:"ACCEPT", label:"Accept"},
  {id:"CONFIG", label:"Mission Config"},
  {id:"MISSION", label:"Mission Equip"},
  {id:"SEATS", label:"Crew and Pax Seats"},
  {id:"FUEL", label:"Fuel"},
  {id:"CARGO", label:"Load Planning"},
  {id:"CERTIFY", label:"Certify W&B"},
  {id:"EDITOR", label:"Editor"}
];

let activeTab = "HOME";

function buildTabs(){
  const el = document.getElementById("tabs");
  el.innerHTML = "";
  for (const t of TABS){
    const b = document.createElement("button");
    b.className = "tabbtn";
    b.textContent = t.label;
    b.dataset.tab = t.id;
    b.addEventListener("click", ()=> setTab(t.id));
    el.appendChild(b);
  }
  renderTabs();
}

function setTab(id){
  // require tail selected for non-home tabs
  if (id !== "HOME" && id !== "EDITOR" && !STORE.selectedTail){
    alert("Select a tail first (Home).");
    return;
  }
  activeTab = id;
  render();
}

function renderTabs(){
  const btns = document.querySelectorAll(".tabbtn");
  btns.forEach(b=>{
    b.classList.toggle("active", b.dataset.tab === activeTab);
  });
  // show/hide tab sections
  for (const t of TABS){
    const sec = document.getElementById("tab_"+t.id);
    if (!sec) continue;
    sec.classList.toggle("hide", t.id !== activeTab);
  }
}

function invalidateAcceptance(tail, reason){
  const s = STORE.sessions[tail];
  if (!s.accepted.isAccepted) return;

  // ACCEPT is ONLY about logbook verification.
  // Do NOT invalidate for fuel/load/preset/config/mission changes.
  const invalidatingReasons = [
    "accept_logbook_edit",   // user edited accepted.basicW/basicCG/fuelLog
    "accept_clear",          // user clicked a clear/reset acceptance button
    "tail_change",           // switching to a different aircraft/session
  ];

  // If reason is missing or not explicitly in the list, do nothing.
  if (!invalidatingReasons.includes(reason)) return;

  s.accepted.isAccepted = false;
s.accepted.by = "";
s.accepted.at = null;

s.accepted.by = "";   // binder-backed field for accSvc
s.accepted.at = null; // optional stamp field if used

s.acceptanceInvalidated = true;

// HARD RESET: overwrite accepted object to prevent hidden-key persistence
s.accepted = {
  isAccepted: false,
  by: "",
  at: null,
  accSvc: ""
};




// Clear ACCEPT tab inputs that can visually persist (uncontrolled DOM)
const accSvcEl = document.getElementById("accSvc");
if (accSvcEl) accSvcEl.value = "";

// Not accepted => cannot be certified
s.certify = { certified:false, by:"", at:null, mcdu:null };

if ("certified" in s) s.certified = false;
if ("certifiedBy" in s) s.certifiedBy = "";
if ("certifiedAt" in s) s.certifiedAt = null;

const certMsgEl = document.getElementById("certMsg");
if (certMsgEl) certMsgEl.innerHTML = `<span class="badge">Not certified</span>`;

}

/* =========================
   ACTIONS: HOME lifecycle
   ========================= */

function selectTail(tail){
  const s = STORE.sessions[tail];

// Force Accept pane inputs to reflect state (prevents DOM/binder “rehydrate” persistence)
const accSvcEl = document.getElementById("accSvc");
if (accSvcEl) accSvcEl.value = (s && s.accepted && (s.accepted.by || "")) || "";


  if (s.isPlaceholder){
    alert("Placeholder tail (not selectable yet).");
    return;
  }

  // If tail is signed out and not returned, selecting it triggers forced return.
  if (s.signedOutBy && !s.returnedAt){
    const reason = (document.getElementById("forceReturnReason").value || "").trim();
    if (!reason){
      alert("This tail is signed out. Enter a Force Return reason first.");
      return;
    }
    // forced return + assign
    s.returnedAt = new Date().toISOString();
    // keep audit? For demo we just store returnedAt; could store reason too.
  }

  STORE.selectedTail = tail;
  // Move to ACCEPT tab immediately (Home can "go away" effectively)
  setTab("ACCEPT");
}

function returnToAvailable(tail, reason){
  console.log("[RTA] returnToAvailable CALLED", tail, reason);

  const s = (STORE && STORE.sessions && STORE.sessions[tail]) ? STORE.sessions[tail] : null;
  if (!s) return;

  // DEBUG: show state that drives "Signed out by" + "Certified"
  try {
    console.log("[RTA] BEFORE", {
      signedOutBy: s.signedOutBy,
      returnedAt: s.returnedAt,
      signedOut: !!(s.signedOutBy && !s.returnedAt),
      certify: s.certify
    });
  } catch(e){}


  // -----------------------------
  // 1) HOME / ownership -> AVAILABLE
  // -----------------------------
  s.signedOutBy = "";
  s.signedOutAt = null;
  s.returnedAt = new Date().toISOString();
  s.returnReason = reason || "Return to available";

  // -----------------------------
  // 2) ACCEPT stamp (clear Accepted By + time + flag)
  // -----------------------------
  if (!s.accepted || typeof s.accepted !== "object") s.accepted = {};
  s.accepted.isAccepted = false;
  s.accepted.acceptedBy = "";
  s.accepted.acceptedAt = null;

  if ("acceptedBy" in s) s.acceptedBy = "";
  if ("acceptedAt" in s) s.acceptedAt = null;

  // -----------------------------
  // 3) CERTIFY stamp + CERTIFY editable inputs (HARD clear)
  // -----------------------------
  // HARD reset CERTIFY model (clears certified + ALL certify editable inputs)
s.certify = { certified:false, by:"", at:null, mcdu:null };

// Clear any parallel certify flags (safe if unused)
if ("certified" in s) s.certified = false;
if ("certifiedBy" in s) s.certifiedBy = "";
if ("certifiedAt" in s) s.certifiedAt = null;

// If you have separate certify input containers, clear them too
if ("certifyForm" in s) s.certifyForm = {};
if ("certifyInputs" in s) s.certifyInputs = {};

// -----------------------------
// UI wipe: inputs keep their .value unless we clear them
// -----------------------------
const wipeInput = (id, val="") => {
  const el = document.getElementById(id);
  if (!el) return;
  if ("value" in el) el.value = val;
};

// UI wipe: clear only the known service-number and certify inputs
wipeInput("certSvc", "");
wipeInput("mcduAUW", "");
wipeInput("mcduCG", "");
wipeInput("mcduFuel", "");
wipeInput("accSvc", ""); // ACCEPT service#

const certMsgEl = document.getElementById("certMsg");
if (certMsgEl) certMsgEl.innerHTML = `<span class="badge">Not certified</span>`;

// FINAL HARD FORCE: prevent any lingering "signed out" or "certified" display
s.signedOutBy = "";
s.signedOutAt = null;

// ALSO reset ACCEPT state (service # lives in s.accepted.by)
s.accepted = { isAccepted:false, by:"", at:null, basicW:null, basicCG:null, fuelLog:null };
s.acceptanceInvalidated = true;

s.returnedAt = new Date().toISOString();


s.certify = { certified:false, by:"", at:null, mcdu:null };
if ("certified" in s) s.certified = false;
if ("certifiedBy" in s) s.certifiedBy = "";
if ("certifiedAt" in s) s.certifiedAt = null;


}





/* =========================
   RENDER HELPERS
   ========================= */


function clamp(v, lo, hi){ return Math.min(hi, Math.max(lo, v)); }

function fmtKg(x){ return (x==null ? "—" : `${roundKg(x)} kg`); }
function fmtMm(x){ return (x==null ? "—" : `${roundMm(x)} mm`); }

function renderMcduAuwCgReplica_TEST(){
  return `
    <div class="mcduWrap">
      <div class="mcduTitle">AUW  CG</div>

      <div class="mcduGrid">
        <div>
          <div class="mcduLbl">AUW</div>
          <div class="mcduVal">16170KG</div>
        </div>
        <div class="mcduRight">
          <div class="mcduLbl">CG</div>
          <div class="mcduVal">8582MM</div>
        </div>

        <div>
          <div class="mcduLbl">FUEL</div>
          <div class="mcduVal">&lt; 4245KG</div>
        </div>
        <div class="mcduRight">
          <div class="mcduLbl">CG LOCATION</div>
          <div class="mcduVal">AFT</div>
        </div>

        <div>
          <div class="mcduLbl">CABIN</div>
          <div class="mcduVal">&lt; 225KG</div>
        </div>
        <div class="mcduRight">
          <div class="mcduStatus">OVER AUW</div>
        </div>

        <div>
          <div class="mcduLbl">CARGO</div>
          <div class="mcduVal">&lt; 0KG</div>
        </div>
        <div class="mcduRight">
          <div class="mcduStatus">OUT CG</div>
        </div>
      </div>

      <div class="mcduBracket">
        <div>
          <span class="mcduLbl">WEIGHT OPERATING</span>
          <span class="mcduVal">[11700KG]</span>
        </div>
        <div class="mcduRight">
          <span class="mcduLbl">DIST</span>
          <span class="mcduVal">[8371MM]</span>
        </div>
      </div>

      <div class="mcduRtn">&lt;RTN</div>
    </div>
  `;
}

// ================================
// CERTIFY MCDU (RFM: 14 rows x 24 chars)
// Drop-in replacement for BOTH helpers
// ================================


 
function renderMcduAuwCgReplica_REAL(wb){
  // 14 rows x 24 chars with safe color tokens

  // token -> span conversion (safe)
  const colorize = (text)=>(
    text
      .replace(/{{L}}/g, `<span class="mcduLabel">`)
      .replace(/{{G}}/g, `<span class="mcduGreen">`)
      .replace(/{{\/}}/g, `</span>`)
  );

  // visible length (ignores tokens)
  const visLen = (s)=>String(s ?? "").replace(/{{L}}|{{G}}|{{\/}}/g, "").length;

  // pad to 24 visible chars (no trimming here; we keep strings short)
  const pad24 = (s)=>{
    s = String(s ?? "");
    const v = visLen(s);
    if (v >= 24) return s; // assume already fits; keep stable
    return s + " ".repeat(24 - v);
  };

  // left/right on a 24-char line (token-aware)
  const lr24 = (left, right)=>{
    left = String(left ?? "");
    right = String(right ?? "");
    const space = Math.max(1, 24 - visLen(left) - visLen(right));
    return pad24(left + " ".repeat(space) + right);
  };

  // centered title in 24 chars (token-aware)
  const center24 = (s)=>{
    s = String(s ?? "");
    const v = visLen(s);
    if (v >= 24) return s;
    const leftPad = Math.floor((24 - v) / 2);
    const rightPad = (24 - v) - leftPad;
    return " ".repeat(leftPad) + s + " ".repeat(rightPad);
  };

  // data
  const auw   = Math.round(roundKg(wb.auw));
  const cg    = Math.round(wb.auwCG);

  const fuel  = Math.round(roundKg(wb.fuelTotal));
  const cabin = Math.round(roundKg(wb.cabinTotal));
  const cargo = Math.round(roundKg(wb.cargoTotal));

  const opW   = Math.round(roundKg(wb.opW));
  const opCG  = Math.round(wb.opCG);

  const cgLoc = (wb.cgBand || "").toUpperCase();

  const overAuw = wb.flags?.overweightAirborne ? "OVER AUW" : "";
  const outCg   = (!wb.flags?.hardCgOk || !wb.flags?.envOk) ? "OUT CG" : "";

  // build 14 lines
  const L = [];

  // Row 1: Title line
  L.push(center24("{{L}}AUW  CG{{/}}"));

  // Pair 1 (Rows 2–3)
  L.push(lr24("{{L}}AUW{{/}}", "{{L}}CG{{/}}"));
   L.push(lr24(`{{G}}${auw}{{/}}KG`, `{{G}}${cg}{{/}}MM`));

  // Pair 2 (Rows 4–5)
  L.push(lr24("{{L}}FUEL{{/}}", "{{L}}CG LOCATION{{/}}"));
    L.push(lr24(`{{G}}< ${fuel}{{/}}KG`, `{{G}}${cgLoc}{{/}}`));


  // Pair 3 (Rows 6–7)
  L.push(pad24("{{L}}CABIN{{/}}"));
    L.push(lr24(`{{G}}< ${cabin}{{/}}KG`, `{{G}}${overAuw}{{/}}`));


  // Pair 4 (Rows 8–9)
  L.push(pad24("{{L}}CARGO{{/}}"));
    L.push(lr24(`{{G}}< ${cargo}{{/}}KG`, `{{G}}${outCg}{{/}}`));


  // Pair 5 (Rows 10–11)
  L.push(lr24("{{L}}WEIGHT OPERATING{{/}}", "{{L}}DIST{{/}}"));
    L.push(lr24(`[{{G}}${opW}{{/}}KG]`, `[{{G}}${opCG}{{/}}MM]`));


    // Row 12: Blank spacer
  L.push(pad24(""));

  // Row 13: <RTN caret
  L.push(pad24("{{G}}&lt;RTN{{/}}"));


  // Row 14: Blank (future scratchpad)
  L.push(pad24(""));


  // hard-enforce 14 rows
  while (L.length < 14) L.push(pad24(""));
  if (L.length > 14) L.length = 14;

return `
  <div class="mcduCert" style="margin:0 auto;">
    <pre class="mcduPre14">${colorize(L.join("\n"))}</pre>
  </div>
`;}





function statusForTail(s){
  // Badge logic for home list
  const wb = computeWB(s.tail);
  const hasHard = !wb.flags.envOk || wb.flags.overweightAirborne || !wb.flags.hardCgOk || !wb.flags.absCgOk;
  if (s.signedOutBy && !s.returnedAt) return {cls:"warn", text:`Signed out · ${s.signedOutBy}`};
  if (!s.accepted.isAccepted) return {cls: hasHard ? "bad" : "bad", text:"Available · Not accepted"};
  if (hasHard) return {cls:"bad", text:"Available · Needs attention"};
  return {cls:"good", text:"Accepted"};
}

function setStatusPill(){
  const tail = STORE.selectedTail;
  const pillTail = document.getElementById("pillTail");
  const pillBadge = document.getElementById("pillBadge");
  const pillPreset = document.getElementById("pillPreset");

  if (!tail){
    pillTail.textContent = "No tail";
    pillBadge.textContent = "Not selected";
    pillBadge.className = "badge";
    pillPreset.textContent = "—";
    return;
  }

  const s = STORE.sessions[tail];
  pillTail.textContent = tail + (tail==="149920" ? " (SIM/IPT)" : "");
  const st = statusForTail(s);
  pillBadge.textContent = st.text;
  pillBadge.className = "badge " + st.cls;

  pillPreset.textContent = s.preset ? AC.presets[s.preset].name : "No preset";
}

/* =========================
   HOME RENDER
   ========================= */

function renderHome(){
  const list = document.getElementById("tailList");
  list.innerHTML = "";

  for (const t of STORE.tails){
    const s = STORE.sessions[t];
    const chip = document.createElement("div");
    chip.className = "chip";
    chip.style.opacity = s.isPlaceholder ? 0.35 : 1.0;

    const isSel = (STORE.selectedTail === t);
    if (isSel){
      chip.style.borderColor = "rgba(98,168,255,.55)";
      chip.style.boxShadow = "0 0 0 3px rgba(98,168,255,.12)";
    }

    const tailLabel = document.createElement("span");
    tailLabel.className = "mono";
    tailLabel.textContent = t + (t==="149920" ? " SIM/IPT" : "");

    const badge = document.createElement("span");
    const st = statusForTail(s);
    badge.className = "badge " + st.cls;
    badge.textContent = st.text;

    chip.appendChild(tailLabel);
    chip.appendChild(badge);

    chip.addEventListener("click", ()=> selectTail(t));
    list.appendChild(chip);
  }

  document.getElementById("btnReturnToAvailableHome").onclick = ()=>{
    if (!STORE.selectedTail){ alert("No selected tail."); return; }
    returnToAvailable(STORE.selectedTail, "Manual return");
    render();
  };

  document.getElementById("btnClearSelection").onclick = ()=>{
    STORE.selectedTail = null;
    setTab("HOME");
  };

  document.getElementById("btnHomeRefresh").onclick = ()=> render();
}

/* =========================
   ACCEPT RENDER + FIX CURSOR ISSUE
   ========================= */

function maybeInvalidateAcceptanceFromAcceptInputs(tail){
  if (!tail) return;
  const s = STORE.sessions[tail];
  if (!s || !s.accepted) return;
  if (!s.accepted.isAccepted) return;

  const snap = s.accepted.snapshot;
  if (!snap) return;

  const now = {
    basicW:  s.accepted.basicW,
    basicCG: s.accepted.basicCG,
    fuelLog: s.accepted.fuelLog
  };

  const changed =
    snap.basicW  !== now.basicW ||
    snap.basicCG !== now.basicCG ||
    snap.fuelLog !== now.fuelLog;

  if (changed){
    s.accepted.isAccepted = false;
    s.accepted.at = null;
    s.accepted.snapshot = null;
    s.acceptanceInvalidated = true;
  }
}

function bindAcceptInputsOnce(){
  // IMPORTANT: we do NOT re-create these inputs during render;
  // we just read their values. This prevents focus loss / cursor drop.
  const ids = ["accBasicW","accBasicCG","accFuel","accSvc"];
  for (const id of ids){
    const el = document.getElementById(id);
    if (el.dataset.bound) continue;
    el.dataset.bound = "1";
    el.addEventListener("input", ()=> {
  const tail = STORE.selectedTail;
  if (!tail) return;
  const s = STORE.sessions[tail];
  if (!s || !s.accepted) return;

  // Write-through: store the logbook fields live as user types
  if (id === "accBasicW")  s.accepted.basicW   = el.value === "" ? null : Number(el.value);
  if (id === "accBasicCG") s.accepted.basicCG  = el.value === "" ? null : Number(el.value);
  if (id === "accFuel")    s.accepted.fuelLog  = el.value === "" ? null : Number(el.value);
  if (id === "accSvc")     s.accepted.by       = el.value;

  // Only these 3 fields can invalidate acceptance
  if (id === "accBasicW" || id === "accBasicCG" || id === "accFuel"){
    maybeInvalidateAcceptanceFromAcceptInputs(tail);
  }

  // no full render on each keystroke; just update small text
  renderAcceptStateText();
});

  }

  document.getElementById("btnAccept").addEventListener("click", ()=>{
    const tail = STORE.selectedTail;
    if (!tail) return;
    const s = STORE.sessions[tail];

    const bw = +document.getElementById("accBasicW").value;
    const bcg = +document.getElementById("accBasicCG").value;
    const fuel = +document.getElementById("accFuel").value;
    const svc = (document.getElementById("accSvc").value || "").trim();

    if (!bw || !bcg || isNaN(bw) || isNaN(bcg)){
      alert("Enter valid Basic Weight and CG.");
      return;
    }
    if (!svc){
      alert("Enter service #.");
      return;
    }

    s.accepted.basicW = roundKg(bw);
    s.accepted.basicCG = roundMm(bcg);
    s.accepted.fuelLog = roundKg(isNaN(fuel) ? 0 : fuel);
    s.accepted.by = svc;
s.accepted.at = new Date().toISOString();

// compatibility: some UI logic uses these names
s.accepted.acceptedBy = svc;
s.accepted.acceptedAt = s.accepted.at;

s.accepted.isAccepted = true;

    s.acceptanceInvalidated = false;
    // Snapshot of the logbook values at the moment of ACCEPT
    s.accepted.snapshot = {
      basicW: s.accepted.basicW,
      basicCG: s.accepted.basicCG,
      fuelLog: s.accepted.fuelLog
    };

    // Also set fuel total baseline from log (applies stage mapping)
    s.fuel.total = roundKg(isNaN(fuel) ? (s.fuel.total||0) : fuel);
    s.fuel.manualTanks = false;

    render();
  });
}

function renderAccept(){ 
  const tail = STORE.selectedTail;
  const s = STORE.sessions[tail];

  bindAcceptInputsOnce();

  // Service # is always whatever is in state (user can type it before ACCEPT)
  const accSvcEl = document.getElementById("accSvc");
  if (accSvcEl && s && s.accepted){
    accSvcEl.value = s.accepted.by || "";
  }


  // Pre-fill fields with stored values, but do not overwrite while user is typing:
  // only update if input not focused
  const f = (id, val)=>{
    const el = document.getElementById(id);
    if (document.activeElement === el) return;
    el.value = (val == null ? "" : val);
  };

  f("accBasicW", s.accepted.basicW);
  f("accBasicCG", s.accepted.basicCG);
  f("accFuel", s.accepted.fuelLog);
  f("accSvc", s.accepted.by);

  renderAcceptStateText();
}

function renderAcceptStateText(){
  const tail = STORE.selectedTail;
  if (!tail) return;
  const s = STORE.sessions[tail];
  if (!s || !s.accepted) return;

  const el = document.getElementById("acceptStateText");
  if (!el) return;

  if (!s.accepted.isAccepted){
    el.textContent = s.acceptanceInvalidated
      ? "Acceptance invalidated (logbook BW/CG/Fuel changed)."
      : "Not accepted.";
    return;
  }

  const who = s.accepted.by || "";
  const at = s.accepted.at ? new Date(s.accepted.at).toLocaleString() : "";
  el.textContent = `Accepted by ${who}${at ? ` · ${at}` : ""}`;
}


/* =========================
   CONFIG RENDER
   ========================= */

function applyPreset(tail, presetKey){
  if (!tail) return;

  const s = STORE.sessions?.[tail];
  const p = AC.presets?.[presetKey];
  if (!s || !p) return;

  // Ensure containers exist so Object.keys() can't crash
  if (!s.seats)   s.seats = {};
  if (!s.roleFit) s.roleFit = {};
  if (!s.mission) s.mission = {};

  s.preset = presetKey;

  // Seats: set installed (destructive)
  for (const k of Object.keys(s.seats)) s.seats[k] = false;
  for (const k of (p.seats?.crew || [])) s.seats[k] = true;
  for (const k of (p.seats?.pax  || [])) s.seats[k] = true;
  // If a seat is not installed, it cannot have an occupant
  for (const k of Object.keys(s.seats)){
    if (!s.seats[k] && s.occupants && s.occupants[k]){
      s.occupants[k] = null;
    }
  }


  // RoleFit: destructive apply (clear then apply)
  for (const k of Object.keys(s.roleFit)) s.roleFit[k] = false;
  for (const k of (p.roleFitOn  || [])) s.roleFit[k] = true;
  for (const k of (p.roleFitOff || [])) s.roleFit[k] = false;

  // Mission baseline: destructive apply (clear then apply)
  for (const k of Object.keys(s.mission)) s.mission[k] = false;
  for (const k of (p.missionOn  || [])) s.mission[k] = true;
  for (const k of (p.missionOff || [])) s.mission[k] = false;

  // Dependency enforcement (hand controller, etc.)
  computeRoleFitTotals(s);
}


function renderConfig(){
  const tail = STORE.selectedTail;
  const s = STORE.sessions[tail];

  // preset buttons
  document.getElementById("btnPresetSAR3").onclick = ()=>{ applyPreset(tail,"SAR3"); render(); };
  document.getElementById("btnPresetSAR10").onclick = ()=>{ applyPreset(tail,"SAR10"); render(); };
  document.getElementById("btnPresetCASEVAC").onclick = ()=>{ applyPreset(tail,"CASEVAC"); render(); };
  document.getElementById("btnPresetTRANSPORT").onclick = ()=>{ applyPreset(tail,"TRANSPORT"); render(); };

  // role fit list with toggles (installed/uninstalled)
  const box = document.getElementById("roleFitList");
  box.innerHTML = "";

  const rfKeys = Object.keys(AC.roleFit);
  // a little nicer ordering: normally-installed first, then others alphabetically
  rfKeys.sort((a,b)=>{
    const A = AC.roleFit[a], B = AC.roleFit[b];
    if (A.normally !== B.normally) return (B.normally?1:0) - (A.normally?1:0);
    return A.name.localeCompare(B.name);
  });

  for (const k of rfKeys){
    const it = AC.roleFit[k];
    const on = !!s.roleFit[k];

    const t = document.createElement("div");
    t.className = "toggle";

    const left = document.createElement("div");
    left.className = "left";
    left.innerHTML = `<div class="name">${it.name}</div>
                      <div class="meta mono">${roundKg(it.w)} kg @ ${roundMm(it.arm)} mm · ${k}${it.normally?" · normally installed":""}</div>`;

    const sw = document.createElement("div");
    sw.className = "switch" + (on ? " on" : "");
    sw.title = on ? "Installed" : "Removed";
    sw.addEventListener("click", ()=>{
      // protect dependency: user can toggle, then dependency logic re-applies
      s.roleFit[k] = !s.roleFit[k];
      // If user turns off WS or EOIR, hand controller will auto turn off.
      computeRoleFitTotals(s);

            render();
    });

    t.appendChild(left);
    t.appendChild(sw);
    box.appendChild(t);
  }

  // KPIs
  const wb = computeWB(tail);
  const presetName = s.preset ? AC.presets[s.preset].name : "None";
  const rf = computeRoleFitTotals(s);
  const me = computeMissionTotals(s);
  const st = computeSeatTotals(s);

    document.getElementById("configKpi").innerHTML = `
    <div class="box"><div class="t">Preset</div><div class="v">${presetName}</div><div class="s">Changing preset invalidates acceptance</div></div>
    <div class="box"><div class="t">Role Fit Total</div><div class="v">${fmtKg(rf.w)}</div><div class="s mono">${fmtMm(Math.round(rf.m/(rf.w||1)))}</div></div>
    <div class="box"><div class="t">Mission Equip Total</div><div class="v">${fmtKg(me.w)}</div><div class="s mono">${fmtMm(Math.round(me.m/(me.w||1)))}</div></div>
    <div class="box"><div class="t">Seats + People</div><div class="v">${fmtKg(st.w)}</div><div class="s">structures + occupants</div></div>
    <div class="box"><div class="t">Operating</div><div class="v">${fmtKg(wb.opW)}</div><div class="s mono">${fmtMm(wb.opCG)}</div></div>
    <div class="box"><div class="t">AUW</div><div class="v">${fmtKg(wb.auw)}</div><div class="s mono">${fmtMm(wb.auwCG)} · ${wb.cgBand}</div></div>
  `;

      // Envelope header (CONFIG)
  const wrap = document.getElementById("envWrapConfig");
  const envC = document.getElementById("envCanvasConfig");
  const envN = document.getElementById("envNotesConfig");

  // Draw only when visible (canvas is 0x0 when hidden)
  if (envC && (!wrap || wrap.style.display !== "none")){
    drawEnvelope(envC, envN || null);
  }

  // Collapse/expand (visual only) — redraw on expand
  const btn = document.getElementById("envToggleConfig");
  if (btn && wrap && !btn.dataset.bound){
    btn.dataset.bound = "1";
    btn.onclick = ()=>{
      const willExpand = (wrap.style.display === "none");
      wrap.style.display = willExpand ? "" : "none";
      btn.textContent = willExpand ? "Collapse" : "Expand";
      if (willExpand && envC){
        drawEnvelope(envC, envN || null);
      }
    };
  }
}




/* =========================
   MISSION EQUIPMENT RENDER
   ========================= */

function renderMission(){
  const tail = STORE.selectedTail;
  const s = STORE.sessions[tail];

  // Build grouped list by group heading
  const grouped = {};
  for (const k of Object.keys(AC.missionEquip)){
    const it = getMissionItem(k);
    if (!it) continue;
    const g = it.group || "Mission Equipment";
    if (!grouped[g]) grouped[g] = [];
    grouped[g].push({k, it});
  }
  // stable group order
  const groupOrder = ["SAR Equipment","Medical Equipment","ALSE","Misc / Mission Kits","Stowage","Mission Equipment"];
  const groups = Object.keys(grouped).sort((a,b)=>{
    const ia = groupOrder.indexOf(a); const ib = groupOrder.indexOf(b);
    if (ia !== -1 || ib !== -1){
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    }
    return a.localeCompare(b);
  });

  const list = document.getElementById("missionEquipList");
  list.innerHTML = "";

  const wbBefore = computeWB(tail);

    // Collapsible group cards (persist open/closed per tail)
  s.ui = s.ui || {};
  s.ui.meGroups = s.ui.meGroups || {};

    const defaultOpen = (g)=>false;


  for (const g of groups){

    const items = grouped[g].sort((a,b)=> String(a.it.stow||"").localeCompare(String(b.it.stow||"")));

    // selected count for badge
    let sel = 0;
    for (const {k} of items) if (!!s.mission[k]) sel++;

    // card
    const card = document.createElement("div");
    card.style.border = "1px solid rgba(255,255,255,.12)";
    card.style.borderRadius = "12px";
    card.style.padding = "10px";
    card.style.margin = "10px 0";
    card.style.background = "rgba(0,0,0,.10)";

    // header (click to collapse)
    const head = document.createElement("div");
    head.style.display = "flex";
    head.style.alignItems = "center";
    head.style.justifyContent = "space-between";
    head.style.gap = "10px";
    head.style.cursor = "pointer";
    head.style.userSelect = "none";

    const leftHead = document.createElement("div");
    leftHead.innerHTML = `
      <div style="font-weight:900; letter-spacing:.2px;">${g}</div>
      <div class="small">Toggle items on/off · weights editable later</div>
    `;

    const rightHead = document.createElement("div");
    rightHead.className = "mono";
    rightHead.style.display = "flex";
    rightHead.style.alignItems = "center";
    rightHead.style.gap = "8px";

    const countBadge = document.createElement("span");
    countBadge.className = sel ? "badge good" : "badge";
    countBadge.textContent = sel ? `${sel} ON` : "0 ON";

    const chev = document.createElement("span");
    chev.className = "mono";
    chev.textContent = "▼";

    rightHead.appendChild(countBadge);
    rightHead.appendChild(chev);

    head.appendChild(leftHead);
    head.appendChild(rightHead);

    // body
    const body = document.createElement("div");
    body.style.marginTop = "10px";

    const open = (s.ui.meGroups[g] !== undefined) ? !!s.ui.meGroups[g] : defaultOpen(g);
    body.style.display = open ? "" : "none";
    chev.textContent = open ? "▼" : "▶";

    head.onclick = ()=>{
      const willOpen = (body.style.display === "none");
      body.style.display = willOpen ? "" : "none";
      chev.textContent = willOpen ? "▼" : "▶";
      s.ui.meGroups[g] = willOpen;
    };

    // rows go into body
    for (const {k, it} of items){
      const on = !!s.mission[k];

      const row = document.createElement("div");
      row.className = "toggle";

      // effect on operating/AUW if toggled
      const deltaW = it.w;
      const deltaM = it.w * it.arm;
      const opW = wbBefore.opW;
      const opCG = wbBefore.opCG;

      // approximate effect (toggle only this item):
      const newOpW = on ? (opW - deltaW) : (opW + deltaW);
      const oldOpM = opW * opCG;
      const newOpM = on ? (oldOpM - deltaM) : (oldOpM + deltaM);
      const newOpCG = roundMm(cgFromMoment(newOpW, newOpM) || opCG);

      const left = document.createElement("div");
      left.className = "left";
      left.innerHTML = `
        <div class="name">${it.name}</div>
        <div class="meta mono">${roundKg(it.w)} kg @ ${roundMm(it.arm)} mm · ${it.stow}</div>
        <div class="meta">${on ? "<span class='badge good'>ON</span>" : "<span class='badge'>OFF</span>"} &nbsp;
          <span class="small">If toggled → Operating CG ${fmtMm(newOpCG)} (from ${fmtMm(opCG)})</span>
        </div>
      `;

      const sw = document.createElement("div");
      sw.className = "switch" + (on ? " on" : "");
      sw.addEventListener("click", ()=>{
        s.mission[k] = !s.mission[k];
        render();
      });

      row.appendChild(left);
      row.appendChild(sw);
      body.appendChild(row);
    }

    card.appendChild(head);
    card.appendChild(body);
    list.appendChild(card);
  }


  // Totals by stowage
  const stow = {};
  for (const k of Object.keys(AC.missionEquip)){
    if (!s.mission[k]) continue;
    const it = getMissionItem(k);
    if (!it) continue;
    const key = it.stow || "Unknown";
    if (!stow[key]) stow[key] = {w:0, m:0};
    stow[key].w += it.w;
    stow[key].m += it.w * it.arm;
  }
  const stowKeys = Object.keys(stow).sort();

  const totals = document.getElementById("stowageTotals");
  if (!stowKeys.length){
    totals.innerHTML = `<div class="small muted">No mission equipment selected.</div>`;
  } else {
    let html = `<table class="table">
      <thead><tr><th>Location</th><th class="right">Weight</th><th class="right">Avg Arm</th></tr></thead><tbody>`;
    for (const k of stowKeys){
      const ww = stow[k].w;
      const avg = ww>0 ? (stow[k].m/ww) : 0;
      html += `<tr><td>${k}</td><td class="right">${roundKg(ww)}</td><td class="right mono">${roundMm(avg)}</td></tr>`;
    }
    html += `</tbody></table>`;
    totals.innerHTML = html;
  }

  // KPIs
  const wb = computeWB(tail);
  const me = computeMissionTotals(s);

  document.getElementById("missionKpi").innerHTML = ` 
    <div class="box"><div class="t">Mission Equip Total</div><div class="v">${fmtKg(me.w)}</div><div class="s mono">${fmtMm(Math.round(me.m/(me.w||1)))}</div></div>
    <div class="box"><div class="t">Operating</div><div class="v">${fmtKg(wb.opW)}</div><div class="s mono">${fmtMm(wb.opCG)}</div></div>
    <div class="box"><div class="t">AUW</div><div class="v">${fmtKg(wb.auw)}</div><div class="s mono">${fmtMm(wb.auwCG)} · ${wb.cgBand}</div></div>
  `;

  // Envelope header (MISSION)
  const wrap = document.getElementById("envWrapMission");
  const envC = document.getElementById("envCanvasMission");
  const envN = document.getElementById("envNotesMission");

  // Draw only when visible (canvas is 0x0 when hidden)
  if (envC && (!wrap || wrap.style.display !== "none")){
    drawEnvelope(envC, envN || null);
  }

  // Collapse/expand (visual only) — redraw on expand
  const btn = document.getElementById("envToggleMission");
  if (btn && wrap && !btn.dataset.bound){
    btn.dataset.bound = "1";
    btn.onclick = ()=>{
      const willExpand = (wrap.style.display === "none");
      wrap.style.display = willExpand ? "" : "none";
      btn.textContent = willExpand ? "Collapse" : "Expand";
      if (willExpand && envC){
        drawEnvelope(envC, envN || null);
      }
    };
  }
}


/* =========================
   SEATS RENDER
   ========================= */

function renderSeats(){
  const tail = STORE.selectedTail;
  const s = STORE.sessions[tail];

    const listCrew = document.getElementById("seatListCrew");
  const listPax  = document.getElementById("seatListPax");
  if (listCrew) listCrew.innerHTML = "";
  if (listPax)  listPax.innerHTML = "";


  const personW = 90;

    const addSeatBlock = (key, seat, isCrew, targetEl)=>{

    const installed = !!s.seats[key];
    const occ = s.occupants[key];

    const card = document.createElement("div");
    card.className = "toggle";

    const left = document.createElement("div");
    left.className = "left";

    const occText = occ ? `${occ.label} (${occ.type.toUpperCase()} · 90kg)` : "Empty";
    const occBadge = occ ? "badge good" : "badge";

    left.innerHTML = `
      <div class="name">${key} · ${seat.name}</div>
      <div class="meta mono">${roundKg(seat.wSeat)} kg seat @ ${roundMm(seat.arm)} mm</div>
      <div class="meta"><span class="badge ${installed ? "good" : ""}">${installed ? "Installed" : "Not installed"}</span>
        &nbsp;<span class="${occBadge}">${occText}</span></div>
    `;

    const right = document.createElement("div");
    right.style.display="flex";
    right.style.gap="8px";
    right.style.alignItems="center";
    right.style.flexWrap="wrap";
    right.style.justifyContent="flex-end";

    const btnInstall = document.createElement("button");
    btnInstall.className = "btn";
    btnInstall.textContent = installed ? "Remove seat" : "Install seat";
    btnInstall.onclick = ()=>{
      s.seats[key] = !s.seats[key];
            render();
    };

    const btnOcc = document.createElement("button");
    btnOcc.className = "btn";
    btnOcc.textContent = occ ? "Clear person" : "Assign person";
    if (!s.seats[key]){
      btnOcc.disabled = true;
      btnOcc.style.opacity = "0.35";
      btnOcc.textContent = "Seat not installed";
    }

    btnOcc.onclick = ()=>{
      if (!s.seats[key]) return; // seat not installed => cannot assign/clear

      if (occ){
        s.occupants[key] = null;
      } else {
        const label = "OCCUPIED";
        s.occupants[key] = {type: isCrew ? "crew" : "pax", label: label.trim()};
      }
      // occupant change does NOT invalidate acceptance
      render();
    };

    right.appendChild(btnInstall);
    right.appendChild(btnOcc);

    card.appendChild(left);
    card.appendChild(right);

        if (targetEl) targetEl.appendChild(card);

  };

  // Crew first
  const crewKeys = Object.keys(AC.crewSeats).sort();
  const paxKeys = Object.keys(AC.paxSeats).sort((a,b)=>{
    const na = +a.replace("P",""); const nb = +b.replace("P","");
    return na - nb;
  });

    // Crew blocks -> Crew panel
  for (const k of crewKeys){
    if (!listCrew) break;
        addSeatBlock(k, AC.crewSeats[k], true, listCrew);

  }

  // Pax blocks -> Pax panel
  for (const k of paxKeys){
    if (!listPax) break;
        addSeatBlock(k, AC.paxSeats[k], false, listPax);

  }


  // Envelope header (SEATS)
  const wrap = document.getElementById("envWrapSeats");
  const envC = document.getElementById("envCanvasSeats");
  const envN = document.getElementById("envNotesSeats");

  // Draw only when visible (canvas is 0x0 when hidden)
  if (envC && (!wrap || wrap.style.display !== "none")){
    drawEnvelope(envC, envN || null);
  }

  // Collapse/expand (visual only) — redraw on expand
  const btn = document.getElementById("envToggleSeats");
  if (btn && wrap && !btn.dataset.bound){
    btn.dataset.bound = "1";
    btn.onclick = ()=>{
      const willExpand = (wrap.style.display === "none");
      wrap.style.display = willExpand ? "" : "none";
      btn.textContent = willExpand ? "Collapse" : "Expand";
      if (willExpand && envC){
        drawEnvelope(envC, envN || null);
      }
    };
  }
}


/* =========================
   FUEL RENDER + ENVELOPE
   ========================= */

function bindFuelInputsOnce(){
  const totalEl = document.getElementById("fuelTotalInput");
  const landEl = document.getElementById("landingFuelInput");

  if (!totalEl.dataset.bound){
    totalEl.dataset.bound="1";
    totalEl.addEventListener("change", ()=>{
      const tail = STORE.selectedTail;
      const s = STORE.sessions[tail];
      const MAX_FUEL_KG = AC.maxFuelKg;
      let v = +totalEl.value;
      if (isNaN(v) || v < 0) return;
      // Hard cap at max tank capacity — aircraft physically cannot hold more
      if (v > MAX_FUEL_KG){
        v = MAX_FUEL_KG;
        totalEl.value = MAX_FUEL_KG;
        alert(`Fuel total capped at ${MAX_FUEL_KG} kg (maximum tank capacity).`);
      }
      s.fuel.total = roundKg(v);
      s.fuel.manualTanks = false; // total applies mapping
      render();
    });
  }
  if (!landEl.dataset.bound){
    landEl.dataset.bound="1";
    landEl.addEventListener("change", ()=>{
      const tail = STORE.selectedTail;
      const s = STORE.sessions[tail];
      const v = +landEl.value;
      if (isNaN(v) || v < 0) return;
      s.fuel.landing = roundKg(v);
      render();
    });
  }

  // burn controls
  const btnAdd = document.getElementById("btnAddBurnObs");
  const btnClear = document.getElementById("btnClearBurn");
  if (!btnAdd.dataset.bound){
    btnAdd.dataset.bound="1";
    btnAdd.onclick = () => {
  const fuelKg = document.getElementById("burnFuelObs").value;
  const gsKt = document.getElementById("burnGSObs").value;
  if (!fuelKg) return;

  // Get session object for the selected tail
  const tail = STORE.selectedTail;
  const s = STORE.sessions[tail];

  // Parse numbers (fuel required, GS optional)
  const fuelNum = Number(fuelKg);
  const gsNum = gsKt ? Number(gsKt) : null;
  if (!Number.isFinite(fuelNum) || fuelNum <= 0) { alert("Enter observed fuel total."); return; }

  // Update authoritative fuel total field (drives fuel remaining math)
  const fuelEl = document.getElementById("fuelTotalInput");
  fuelEl.value = fuelKg;
  fuelEl.dispatchEvent(new Event("change", { bubbles: true }));

  // Ensure burnSession exists
  if (!s.fuel.burnSession) s.fuel.burnSession = [];

  // Auto-reset session if fuel increases vs last point (refuel / correction)
  const sess = s.fuel.burnSession;
  const last = sess.length ? sess[sess.length - 1] : null;
  if (last && fuelNum > last.fuel) sess.length = 0;

  // Store observation (GS optional)
  sess.push({
    t: Date.now(),
    fuel: roundKg(fuelNum),
    gs: (Number.isFinite(gsNum) && gsNum > 0) ? gsNum : null
  });

  // Log line (GS optional display)
  const gsText = (Number.isFinite(gsNum) && gsNum > 0) ? `${Math.round(gsNum)} kt` : "—";
  const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  document.getElementById("burnLog").innerHTML += `<div>${timeStr} — Fuel ${roundKg(fuelNum)} kg, GS ${gsText}</div>`;

  // Refresh fuel/burn UI
  renderFuel(); // if your app uses a master render() instead, swap this line to render()
};
  }
  if (!btnClear.dataset.bound){
    btnClear.dataset.bound="1";
    btnClear.onclick = ()=>{document.getElementById("burnLog").innerHTML = "";
document.getElementById("burnKpi").textContent = "";
document.getElementById("burnSmall").textContent = "";
document.getElementById("burnFuelObs").value = "";
document.getElementById("burnGSObs").value = "";
      const tail = STORE.selectedTail;
      STORE.sessions[tail].fuel.burnSession = [];
      render();
    };
  }
}

function renderFuel(){
  bindFuelInputsOnce();
  const tail = STORE.selectedTail;
  if (!tail) return;               // <-- add this line
  const s = STORE.sessions[tail];
    if (!s) return;

  // helper: safely clear fields if they exist (define ONCE at top)
  const clearIfPresent = (k, val) => { if (k in s) s[k] = val; };
                  // <-- add this line (extra safety)
const wb = computeWB(tail);
  // Briefing: fuel you can take (based on Operating Weight)
    console.log("FUEL wb.opW =", wb && wb.opW, wb);


  const LIM_15600 = 15600;
  const LIM_16000 = 16000;
  const MAX_FUEL_KG = AC.maxFuelKg; // hard physical cap

  // Raw weight headroom (how much fuel before hitting the AUW limit)
  const fuelTo15600_raw = Math.max(0, LIM_15600 - wb.opW);
  const fuelTo16000_raw = Math.max(0, LIM_16000 - wb.opW);

  // Apply physical fuel-capacity cap — never suggest more than the tanks hold
  const fuelTo15600 = Math.min(MAX_FUEL_KG, roundKg(fuelTo15600_raw));
  const fuelTo16000 = Math.min(MAX_FUEL_KG, roundKg(fuelTo16000_raw));

  // Which limit is binding? Tank capacity or AUW?
  const limiter15600 = (roundKg(fuelTo15600_raw) >= MAX_FUEL_KG) ? "capacity" : "weight";
  const limiter16000 = (roundKg(fuelTo16000_raw) >= MAX_FUEL_KG) ? "capacity" : "weight";

  const limiterSub = (which, lim) =>
    which === "capacity"
      ? `Max tank capacity (${MAX_FUEL_KG} kg) · AUW headroom would allow more`
      : `${lim.toLocaleString()} − Operating (${roundKg(wb.opW)} kg)`;

  // Briefing boxes: fuel limits based on Operating Weight
  const fuelBriefEl = document.getElementById("fuelBriefKpi");
  if (fuelBriefEl){
    fuelBriefEl.innerHTML = `
      <div class="kpi">
        <div class="box">
          <div class="t">Fuel to 15,600</div>
          <div class="v">${fuelTo15600} kg</div>
          <div class="s mono">${limiterSub(limiter15600, LIM_15600)}</div>
        </div>
        <div class="box">
          <div class="t">Fuel to 16,000</div>
          <div class="v">${fuelTo16000} kg</div>
          <div class="s mono">${limiterSub(limiter16000, LIM_16000)}</div>
        </div>
      </div>
    `;
  }




  // set inputs without breaking focus
  const setIfNotFocused = (id, val)=>{
    const el = document.getElementById(id);
    if (document.activeElement === el) return;
    el.value = (val==null ? "" : val);
  };

  setIfNotFocused("fuelTotalInput", s.fuel.total);
  setIfNotFocused("landingFuelInput", s.fuel.landing);

  // tank table
  const tbl = document.getElementById("tankTable");
  const tanks = s.fuel.tanks;

  let html = `<table class="table">
    <thead><tr><th>Tank</th><th class="right">kg</th><th class="right">Arm</th></tr></thead><tbody>`;
  for (const k of ["T1","T2","T3","T4","T5"]){
    const arm = AC.fuelTankArms[k];
    const v = tanks[k] ?? 0;
    html += `<tr>
      <td class="mono">${k}</td>
      <td class="right"><input data-tank="${k}" class="mono tankEdit" style="text-align:right;" value="${roundKg(v)}"/></td>
      <td class="right mono">${roundMm(arm)}</td>
    </tr>`;
  }
  html += `</tbody></table>`;
  tbl.innerHTML = html;

  // bind tank edits (manual mode)
  const edits = tbl.querySelectorAll(".tankEdit");
  edits.forEach(inp=>{
    if (inp.dataset.bound) return;
    inp.dataset.bound="1";
    inp.addEventListener("change", ()=>{
      const kk = inp.dataset.tank;
      const v = +inp.value;
      if (isNaN(v) || v < 0){ inp.value = roundKg(s.fuel.tanks[kk]||0); return; }
      s.fuel.tanks[kk] = roundKg(v);
      s.fuel.manualTanks = true; // user edited a tank
      render();
    });
  });

  document.getElementById("tankModeText").innerHTML = s.fuel.manualTanks
    ? `<span class="badge warn">Manual Tank Mode</span> Total is sum of tanks.`
    : `<span class="badge good">Stage Mapping Mode</span> Tanks derived from total fuel.`;

  // burn KPIs
  const burnKpi = document.getElementById("burnKpi");
  const burnSmall = document.getElementById("burnSmall");
  const sess = s.fuel.burnSession;

  let burnRate = null; // kg/hr
  let enduranceHr = null;
  let rangeNm = null;
  let rollingRate = null;

  if (sess.length >= 2){
    const first = sess[0];
    const last = sess[sess.length-1];
    const dtHr = (last.t - first.t) / (1000*60*60);
    const df = first.fuel - last.fuel; // consumed
    if (dtHr > 0.01 && df > 0){
      burnRate = df / dtHr;
    }
    // rolling average using last 3 intervals
    if (sess.length >= 3){
      const n = Math.min(4, sess.length); // up to 4 points => 3 intervals
      const recent = sess.slice(-n);
      let sumRate = 0;
      let count = 0;
      for (let i=1;i<recent.length;i++){
        const a=recent[i-1], b=recent[i];
        const dth = (b.t-a.t)/(1000*60*60);
        const dff = (a.fuel - b.fuel);
        if (dth>0.005 && dff>0){
          sumRate += (dff/dth);
          count++;
        }
      }
      if (count>0) rollingRate = sumRate/count;
    }
  }

  const effectiveRate = rollingRate || burnRate;
  const currentFuel = roundKg(s.fuel.total || 0);
  const landFuel = roundKg(s.fuel.landing || 0);
  const usable = Math.max(0, currentFuel - landFuel);
  const lastGS = sess.length ? (sess.slice().reverse().find(p => p.gs)?.gs ?? null) : null;

  if (effectiveRate && effectiveRate>0){
    enduranceHr = usable / effectiveRate;
    rangeNm = enduranceHr * lastGS;
  }

  burnKpi.innerHTML = `
    <div class="box"><div class="t">Fuel Remaining</div><div class="v">${fmtKg(currentFuel)}</div><div class="s">Landing reserve ${fmtKg(landFuel)}</div></div>
    <div class="box"><div class="t">Burn Rate</div><div class="v">${effectiveRate ? roundKg(effectiveRate)+" kg/hr" : "—"}</div><div class="s">Rolling avg preferred</div></div>
    <div class="box"><div class="t">Endurance / Range</div><div class="v">${enduranceHr ? enduranceHr.toFixed(2)+" hr" : "—"}</div><div class="s">${rangeNm ? Math.round(rangeNm)+" nm @ "+lastGS+" kt" : "—"}</div></div>
  `;

  burnSmall.textContent = sess.length ? `Burn session points: ${sess.length} (auto-resets if fuel increases).` : "No burn session data.";

    // envelope canvas (delegated so it can be reused in other tabs later)
  renderEnvelopeHeader();
}

function renderEnvelopeHeader(){
  // Presentational only: prefer the active tab's header canvas if present.
  // Fallback to legacy envCanvas/envNotes.

  // FUEL header support (top-of-tab, collapsible)
  const wrap = document.getElementById("envWrapFuel");
  const btn  = document.getElementById("envToggleFuel");
  const fuelCanvas = document.getElementById("envCanvasFuel");
  const fuelNotes  = document.getElementById("envNotesFuel");

  // Bind toggle once (visual only) — redraw on expand
  if (btn && wrap && !btn.dataset.bound){
    btn.dataset.bound = "1";
    btn.onclick = ()=>{
      const willExpand = (wrap.style.display === "none");
      wrap.style.display = willExpand ? "" : "none";
      btn.textContent = willExpand ? "Collapse" : "Expand";
      if (willExpand && fuelCanvas){
        drawEnvelope(fuelCanvas, fuelNotes || null);
      }
    };
  }

  // Draw only when visible (canvas is 0x0 when hidden)
  if (fuelCanvas){
    if (!wrap || wrap.style.display !== "none"){
      drawEnvelope(fuelCanvas, fuelNotes || null);
    }
    return;
  }

  // Legacy/default envelope canvas
  drawEnvelope();
}





/* =========================
   CARGO / BAY RENDER
   ========================= */

function renderCargo(){
  const tail = STORE.selectedTail;
  const s = STORE.sessions[tail];
  if (!s) return;

  const safeRender = (typeof render === "function") ? render : function(){};

    // ---------- ensure fixed Cargo 1–4 slots ----------
  if (!Array.isArray(s.cargo)) s.cargo = [];
  while (s.cargo.length < 4) s.cargo.push({ w: 0, arm: 8000 });
  if (s.cargo.length > 4) s.cargo = s.cargo.slice(0, 4);

  // ---------- ensure discrete Load Zones bucket (NOT MCDU Cargo) ----------
  // These loads will be summed into Operating Weight/Moment (therefore affecting AUW CG downstream).
  if (!Array.isArray(s.zones)) s.zones = [];

  // Discrete stowage locations (Role Fit + Mission Equipment)
  // arm: mm; max: kg
  const LOAD_ZONES = [
    // Mission Equipment — Forward shelves (Port FWD, 3 levels)
    { id: "FWD_PORT_BTM", label: "PORT FWD Shelf – BOTTOM", arm: 5331, max: 22 },
    { id: "FWD_PORT_MID", label: "PORT FWD Shelf – MIDDLE", arm: 5331, max: 22 },
    { id: "FWD_PORT_TOP", label: "PORT FWD Shelf – TOP",    arm: 5331, max: 22 },

    // Mission Equipment — Ramp shelves (known)
    { id: "RAMP_PORT_FWD", label: "Ramp Shelf – PORT FWD", arm: 12463, max: 44 },
    { id: "RAMP_PORT_AFT", label: "Ramp Shelf – PORT AFT", arm: 13226, max: 22 },
    { id: "RAMP_STBD_FWD", label: "Ramp Shelf – STBD FWD", arm: 12481, max: 44 },
    { id: "RAMP_STBD_AFT", label: "Ramp Shelf – STBD AFT", arm: 13228, max: 22 },

    // Role Fit (SAR) — SAR Stowage Cabinet zones (all at 6275mm)
    { id: "SAR_A", label: "SAR STOWAGE CABINET – FWD TOP (Zone A)",        arm: 6275, max: 22 },
    { id: "SAR_B", label: "SAR STOWAGE CABINET – FWD BTM (Zone B)",        arm: 6275, max: 60 },
    { id: "SAR_C", label: "SAR STOWAGE CABINET – UPPER (Zone C)",          arm: 6275, max: 35 },
    { id: "SAR_D", label: "SAR STOWAGE CABINET – TOP (Zone D)",            arm: 6275, max: 63 },
    { id: "SAR_E", label: "SAR STOWAGE CABINET – LOCKBOX TOP (Zone E)",    arm: 6275, max: 18.5 },
    { id: "SAR_F", label: "SAR STOWAGE CABINET – LOCKBOX BTM (Zone F)",    arm: 6275, max: 18.5 },
    { id: "SAR_G", label: "SAR STOWAGE CABINET – MIDDLE (Zone G)",         arm: 6275, max: 100 },
    { id: "SAR_H", label: "SAR STOWAGE CABINET – BOTTOM (Zone H)",         arm: 6275, max: 125 }
  ];

  const getZoneDef = (id) => LOAD_ZONES.find(z => z.id === id) || null;


  // ---------- MCDU CARGO mirror (read-only, always visible) ----------
try {
  const mcduCargoEl = document.getElementById("mcduCargoMirror");
  if (mcduCargoEl){
    mcduCargoEl.classList.add("mcdu");

    const padR = (x,w)=>String(x).padEnd(w," ");
    const padL = (x,w)=>String(x).padStart(w," ");

    const lines = [];
    lines.push( (" ".repeat(Math.floor((24 - "CARGO".length)/2)) + "CARGO").padEnd(24, " ").slice(0, 24) );
    lines.push("");



    const cargo = (s && Array.isArray(s.cargo)) ? s.cargo : [];
    for (let i=0; i<4; i++){
      const c = cargo[i] || {w:0, arm:0};
      const w = Math.round((typeof roundKg === "function") ? roundKg(c.w || 0) : (c.w || 0));
      const arm = Math.round((typeof roundMm === "function") ? roundMm(c.arm || 0) : (c.arm || 0));

      // Label row: WEIGHT (left) | CARGO X (center) | DIST (right)
const cargoLabel = "CARGO " + (i+1);
let labelRow = " ".repeat(24);

// WEIGHT left
labelRow = "WEIGHT" + labelRow.slice(6);

// CARGO X centered
const cargoPos = Math.floor((24 - cargoLabel.length) / 2);
labelRow = labelRow.slice(0, cargoPos) + cargoLabel + labelRow.slice(cargoPos + cargoLabel.length);

// DIST right
labelRow = labelRow.slice(0, 24 - 4) + "DIST";

lines.push(labelRow);

// Value row (keep your current numbers unchanged for now)
const leftBox =
  "[[G]][ " + padL(w > 0 ? w : "----", 4)
 + "[[/G]]KG[[G]] ][[/G]]";   // digits + brackets green, KG white

const rightBox =
  "[[G]][ " + padL(arm, 5) + "[[/G]]MM[[G]] ][[/G]]"; // digits + brackets green, MM white

const visLen = (t)=>String(t).replace(/\[\[G\]\]|\[\[\/G\]\]/g, "").length;
const gap = Math.max(0, 24 - visLen(leftBox) - visLen(rightBox));
lines.push( leftBox + " ".repeat(gap) + rightBox );




    }

    // Leave room for footer (2 rows) and clamp to 14 rows total
const ROWS_TOTAL = 14;

// Pad/clamp content to ROWS_TOTAL - 2
while (lines.length < (ROWS_TOTAL - 2)) lines.push("");
if (lines.length > (ROWS_TOTAL - 2)) lines.length = (ROWS_TOTAL - 2);

// Footer actions (green)
lines.push("[[G]]■RESET ALL[[/G]]");
lines.push("[[G]]<RTN[[/G]]");

// Final clamp (belt-and-suspenders)
if (lines.length > ROWS_TOTAL) lines.length = ROWS_TOTAL;

mcduWriteMirror("mcduCargoMirror", lines);

  }
} catch (e) {
  // fail-safe: never block app render
}



    // ---------- Cargo 1–4 edit fields (safe: only if container exists) ----------
  const cargoList = document.getElementById("cargoEditFields");
  if (cargoList){
    cargoList.innerHTML = "";

    s.cargo.forEach((c, idx)=>{
      const wrap = document.createElement("div");
      wrap.className = "card";
      wrap.style.boxShadow = "none";
      wrap.style.background = "rgba(0,0,0,.12)";
      wrap.style.marginBottom = "10px";

      wrap.innerHTML =
        '<div class="row">' +
          '<div style="flex:1 1 140px;">' +
            '<div class="lbl">Weight (kg)</div>' +
            '<input data-cargo="w" data-idx="' + idx + '" inputmode="numeric" value="' + roundKg(c.w||0) + '"/>' +
          '</div>' +
          '<div style="flex:1 1 160px;">' +
            '<div class="lbl">Distance (mm)</div>' +
            '<input data-cargo="arm" data-idx="' + idx + '" inputmode="numeric" value="' + roundMm(c.arm||0) + '"/>' +
          '</div>' +
        '</div>' +
        '<div class="small" data-cargo="hint" data-idx="' + idx + '"></div>';

      cargoList.appendChild(wrap);
    });

    cargoList.querySelectorAll('input[data-cargo]').forEach(inp=>{
      inp.addEventListener("change", ()=>{
        const idx = +inp.dataset.idx;
        const field = inp.dataset.cargo;
        const item = s.cargo[idx];
        if (!item) return;

        const v = +inp.value;
        if (!Number.isFinite(v)) return;

        if (field === "w"){
          item.w = roundKg(Math.min(6000, Math.max(-6000, v)));
        } else if (field === "arm"){
          item.arm = roundMm(Math.min(14400, Math.max(4200, v)));
        }
        safeRender();
      });
    });
  }

  // ---------- Load Zones / Shelves edit fields (separate from MCDU Cargo) ----------
const zoneHost = document.getElementById("zoneEditFields");
if (zoneHost){

  const safeRender = (typeof render === "function") ? render : function(){};

  // Ensure one entry per zone definition (by id)
  const zoneIndex = {};
  (Array.isArray(s.zones) ? s.zones : []).forEach(z => { if (z && z.id) zoneIndex[z.id] = z; });

  // Normalize list in definition order (id + w only)
  s.zones = LOAD_ZONES.map(def => {
    const existing = zoneIndex[def.id];
    return { id: def.id, w: roundKg(existing && Number.isFinite(+existing.w) ? +existing.w : 0) };
  });

  // Base is DISPLAY-ONLY: base items are already counted in mission/config totals
  const computeZoneBaseKg = (s) => {
    const base = {};
    LOAD_ZONES.forEach(def => { base[def.id] = 0; });

    const MISSION_TO_ZONE = {
      ME_SAR_ZONEH:  "SAR_H",
      ME_MED_ZONEG:  "SAR_G",
      ME_ALSE_ZONED: "SAR_D",
      ME_QDIS_X3:    "SAR_C",
      ME_NVGS_X5:    "SAR_E"
    };

    const mission = (s && s.mission) ? s.mission : {};
    for (const key of Object.keys(mission)){
      if (!mission[key]) continue;

      const zoneId = MISSION_TO_ZONE[key];
      if (!zoneId) continue;
      if (base[zoneId] == null) continue;

      const it = (AC.missionEquip) ? AC.missionEquip[key] : null;
      if (!it) continue;

      const ww = +it.w || 0;
      if (!Number.isFinite(ww) || ww <= 0) continue;

      base[zoneId] += ww;
    }

    Object.keys(base).forEach(k => base[k] = roundKg(base[k] || 0));
    return base;
  };

  const baseByZone = computeZoneBaseKg(s);

  // Availability gating
  const isZoneAvailable = (zoneId) => {
    const roleFit = (s && s.roleFit) ? s.roleFit : {};
    const mission = (s && s.mission) ? s.mission : {};

    const hasSarCabinet = !!roleFit["RF_SAR_CABINET"];
    if (String(zoneId).startsWith("SAR_")) return hasSarCabinet;

    const gate = {
      FWD_PORT_TOP: "ME_PORT_FWD_SHELF_TOP",
      FWD_PORT_MID: "ME_PORT_FWD_SHELF_MID",
      FWD_PORT_BTM: "ME_PORT_FWD_SHELF_BOT",
      RAMP_PORT_FWD: "ME_RAMP_SHELF_PORT_FWD",
      RAMP_PORT_AFT: "ME_RAMP_SHELF_PORT_AFT",
      RAMP_STBD_FWD: "ME_RAMP_SHELF_STBD_FWD",
      RAMP_STBD_AFT: "ME_RAMP_SHELF_STBD_AFT"
    };

    const gateKey = gate[zoneId];
    if (gateKey) return !!mission[gateKey];

    return true;
  };

  const paintZoneTotal = (i) => {
    const def = LOAD_ZONES[i];
    const entry = s.zones[i];
    if (!def || !entry) return;

    const totalEl = zoneHost.querySelector('[data-zone="total"][data-i="' + i + '"]');
    if (!totalEl) return;

    const baseW = +baseByZone[def.id] || 0;
    const addW  = +entry.w || 0;
    const totalW = roundKg(baseW + addW);
    const over = totalW > (+def.max || 0);

    totalEl.innerHTML =
      'Base: ' + roundKg(baseW) +
      ' · Add: ' + roundKg(addW) +
      ' · Total: ' + totalW + ' / ' + def.max + ' kg' +
      (over ? ' <span class="badge warn" style="margin-left:6px;">OVER</span>' : '');
totalEl.classList.toggle("over", over);

  };

    zoneHost.innerHTML = "";

  // Collapsible group cards for Load Planning zones
  s.ui = s.ui || {};
  s.ui.lpGroups = s.ui.lpGroups || {};

  const lpGroupFor = (zoneId)=>{
    zoneId = String(zoneId || "");
    if (zoneId.startsWith("FWD_PORT_")) return { title:"PORT FWD Shelves", key:"LP_PORT_FWD" };
    if (zoneId.startsWith("SAR_"))      return { title:"SAR STOWAGE CABINET", key:"LP_SAR_CAB" };
    if (zoneId.startsWith("RAMP_"))     return { title:"RAMP AREA SHELVES", key:"LP_RAMP" };
    return { title:"Load Zones", key:"LP_OTHER" };
  };

  const makeGroupCard = (title, key)=>{
    const outer = document.createElement("div");
    outer.style.border = "1px solid rgba(255,255,255,.12)";
    outer.style.borderRadius = "12px";
    outer.style.padding = "10px";
    outer.style.margin = "10px 0";
    outer.style.background = "rgba(0,0,0,.10)";

    const head = document.createElement("div");
    head.style.display = "flex";
    head.style.alignItems = "center";
    head.style.justifyContent = "space-between";
    head.style.gap = "10px";
    head.style.cursor = "pointer";
    head.style.userSelect = "none";

    const left = document.createElement("div");
    left.innerHTML = `<div style="font-weight:900; letter-spacing:.2px;">${title}</div>
                      <div class="small">Tap to expand/collapse</div>`;

    const chev = document.createElement("span");
    chev.className = "mono";

    const body = document.createElement("div");
    body.style.marginTop = "10px";

    // collapsed by default (unless user has toggled)
    const open = (s.ui.lpGroups[key] !== undefined) ? !!s.ui.lpGroups[key] : false;
    body.style.display = open ? "" : "none";
    chev.textContent = open ? "▼" : "▶";

    head.onclick = ()=>{
      const willOpen = (body.style.display === "none");
      body.style.display = willOpen ? "" : "none";
      chev.textContent = willOpen ? "▼" : "▶";
      s.ui.lpGroups[key] = willOpen;
    };

    head.appendChild(left);
    head.appendChild(chev);
    outer.appendChild(head);
    outer.appendChild(body);

    return { outer, body };
  };

  // Create group containers in desired order
  const groupOrder = ["LP_PORT_FWD","LP_SAR_CAB","LP_RAMP","LP_OTHER"];
  const groups = {};
  const bodies = {};

  // First pass: discover which groups exist
  LOAD_ZONES.forEach(def=>{
    const g = lpGroupFor(def.id);
    groups[g.key] = g.title;
  });

  // Build group cards (only if present)
  groupOrder.forEach(key=>{
    if (!groups[key]) return;
    const gc = makeGroupCard(groups[key], key);
    zoneHost.appendChild(gc.outer);
    bodies[key] = gc.body;
  });

  // Build zone cards inside their group body
   LOAD_ZONES.forEach((def, i) => {
    const entry = s.zones[i];
    const available = isZoneAvailable(def.id);
    if (!available) entry.w = 0;

    const g = lpGroupFor(def.id);
    const host = bodies[g.key] || zoneHost;

    const card = document.createElement("div");
    card.className = "card";
    card.style.boxShadow = "none";
    card.style.background = "rgba(0,0,0,.12)";
    card.style.marginBottom = "10px";
    card.style.opacity = available ? "1" : "0.45";
    card.style.filter = available ? "" : "grayscale(1)";

    card.innerHTML = `
      <div class="row" style="align-items:flex-end; gap:10px;">
        <div style="flex:2 1 260px;">
          <div class="lbl">Zone</div>
          <div class="mono">${def.label}</div>
        </div>

        <div style="flex:0 0 140px;">
          <div class="lbl">Arm (mm)</div>
          <div class="mono">${def.arm}</div>
        </div>

        <div style="flex:1 1 140px;">
          <div class="lbl">Add (kg) <span class="small">(max ${def.max})</span></div>
          <input ${available ? "" : "disabled "} data-zone="w" data-i="${i}" inputmode="numeric" value="${roundKg(entry.w||0)}"/>
        </div>
      </div>

      <div class="small mono" data-zone="total" data-i="${i}"></div>
      <div class="small mono" data-zone="status" data-i="${i}">
        ${available ? "" : "NOT INSTALLED — enable in Role Fit / Mission Equip"}
      </div>
      <div class="small" data-zone="hint" data-i="${i}"></div>
    `;

    host.appendChild(card);
    paintZoneTotal(i);
  });

  // Attach ZONE listeners (re-added — required for shelf math + Operating/AUW updates)
    zoneHost.querySelectorAll('input[data-zone="w"]').forEach(inp => {

        // Live typing: update model + shelf totals ONLY (do not full-render or cursor will reset)
    const onInput = ()=>{
      const i = +inp.dataset.i;
      const entry = s.zones[i];
      if (!entry) return;

      const v = +inp.value;
      if (!Number.isFinite(v)) return;

      entry.w = Math.max(0, v); // temporary (unrounded) while typing
      paintZoneTotal(i);
    };


    // Commit: normalize + round once user finishes editing
    const onChange = ()=>{
      const i = +inp.dataset.i;
      const entry = s.zones[i];
      if (!entry) return;

      const v = +inp.value;
      if (!Number.isFinite(v)) return;

      entry.w = roundKg(Math.max(0, v));
      inp.value = entry.w; // OK to reset caret now

      paintZoneTotal(i);

      if (typeof render === "function") render();
      else safeRender();
    };

    inp.addEventListener("input", onInput);
    inp.addEventListener("change", onChange);
  });

  // ---------- CABIN state + mirror + cabin bay edit fields (always attempt) ----------
  ensureBaysExist(s);
  renderCabinMirror(s);
  renderCabinBayEditFields(s);

    // ---------- ramp warnings (only if ramp AND cargo edit list exist) ----------
  const ramp = (AC.ramp) ? AC.ramp : null;
  if (ramp && cargoList){
    s.cargo.forEach((c, idx)=>{
      const hint = cargoList.querySelector('[data-cargo="hint"][data-idx="' + idx + '"]');
      if (!hint) return;

      const arm = +c.arm || 0;
      const w = +c.w || 0;

      const msgs = [];
      if (arm >= ramp.hinge && arm <= ramp.end){
        msgs.push('Ramp zone: ' + ramp.hinge + '–' + ramp.end + ' mm. Ramp closed max ~' + ramp.maxClosed + ' kg.');
        if (w > ramp.maxClosed){
          msgs.push('Warning: ramp closed load exceeds ' + ramp.maxClosed + ' kg.');
        }
        const leverM = ((arm - ramp.hinge)/1000) * w;
        if (leverM > ramp.hingeMomentMax){
          msgs.push('Warning: hinge moment proxy ' + leverM.toFixed(0) + ' kg·m > ' + ramp.hingeMomentMax + ' kg·m.');
        }
      }

      hint.innerHTML = msgs.length
        ? msgs.map(m=>'<div class="badge warn" style="margin-right:6px;">' + m + '</div>').join("")
        : "";
    });
  }

  // Envelope header (LOAD PLANNING / CARGO)
  const wrapEnv = document.getElementById("envWrapCargo");
  const envC = document.getElementById("envCanvasCargo");
  const envN = document.getElementById("envNotesCargo");

  // Draw only when visible (canvas is 0x0 when hidden)
  if (envC && (!wrapEnv || wrapEnv.style.display !== "none")){
    drawEnvelope(envC, envN || null);
  }

  // Collapse/expand (visual only) — redraw on expand
  const btnEnv = document.getElementById("envToggleCargo");
  if (btnEnv && wrapEnv && !btnEnv.dataset.bound){
    btnEnv.dataset.bound = "1";
    btnEnv.onclick = ()=>{
      const willExpand = (wrapEnv.style.display === "none");
      wrapEnv.style.display = willExpand ? "" : "none";
      btnEnv.textContent = willExpand ? "Collapse" : "Expand";
      if (willExpand && envC){
        drawEnvelope(envC, envN || null);
      }
    };
  }
}
} // end renderCargo



/* =========================
   CABIN MIRROR (paged, click to toggle)
   ========================= */

function renderCabinMirror(s){
  const el = document.getElementById("mcduCabinMirror");
  if (el) el.classList.add("mcduScreen");

  const bays = s.bays || {};
  const bayArms = (AC.bayArms) ? AC.bayArms : {};
  const allKeys = Object.keys(bayArms);

  // 14 total rows including title
  const ROWS_TOTAL = 14;

  const kg = (v) => Number.isFinite(+v) ? +v : 0;
  const padR = (x,w)=>String(x).padEnd(w," ");
  const padL = (x,w)=>String(x).padStart(w," ");

  const norm = (k) => String(k).toLowerCase().replace(/[^a-z0-9]/g, "");
  const findKey = (token) => {
    const t = norm(token);
    let hit = allKeys.find(k => norm(k) === t);
    if (hit) return hit;
    hit = allKeys.find(k => norm(k).includes(t));
    return hit || null;
  };

  const page = (s && (s.cabinPage == 2)) ? 2 : 1;

  // Page content order (as per your rule)
  const page1 = [
    { label: "BAY 1", token: "bay1" },
    { label: "BAY 2", token: "bay2" },
    { label: "BAY 3", token: "bay3" },
    { label: "BAY 4", token: "bay4" },
    { label: "BAY 5", token: "bay5" }
  ];

  const page2 = [
    { label: "BAY 5.5", token: "bay55" },
    { label: "BAY 6",   token: "bay6"  },
    { label: "REAR",    token: "rear"  } // will still match "ramp" via contains in many cases
  ];

  const spec = (page === 1) ? page1 : page2;

  const lines = []; 
// Row 1 (title row)

// helper — DEFINE it first
const center = (txt, w)=>{
  txt = String(txt ?? "");
  if (txt.length >= w) return txt.slice(0,w);
  const left = Math.floor((w - txt.length)/2);
  const right = w - txt.length - left;
  return " ".repeat(left) + txt + " ".repeat(right);
};

// USE it second
const pg = (page===1 ? "01/02" : "02/02");
const cabin = "CABIN";

// Center CABIN across the full 24-character row (same grid BAY labels use),
// while still keeping the page indicator in the last 5 characters.
const left = Math.floor((24 - cabin.length) / 2);     // start column for CABIN
const midEnd = left + cabin.length;                    // column after CABIN
const gap = Math.max(0, 19 - midEnd);                  // space before page block (page starts at col 19)

lines.push(" ".repeat(left) + cabin + " ".repeat(gap) + pg);



  // If no bay data, show a clean message but still force 12 rows
  if (!allKeys.length){
    lines.push(""); // row 2
    lines.push("NO BAY DATA"); // row 3
    while (lines.length < ROWS_TOTAL) lines.push("");
    mcduWriteMirror("mcduCabinMirror", lines);
    el.onclick = () => {
      s.cabinPage = (s.cabinPage == 2) ? 1 : 2;
      renderCabinMirror(s);
    };
    return;
  }

  // Row 2 blank spacer (keeps structure consistent)
  lines.push("");

  // Content rows
  // Format target: "BAY X     1234KG  [ADD DELTA]"
  // We keep label field fixed width so weights align.
  for (const d of spec){
  const key = findKey(d.token);
  const val = key ? kg(bays[key]) : 0;
  const w = Math.round(val);

  // Line A: "WEIGHT" + bay label on the right side
  // Example: "WEIGHT            BAY1"
 const bay = d.label;     // keep "BAY 1", "BAY 5.5", "REAR" exactly as shown

// Build a 24-char row:
// - "WEIGHT" hard left
// - bay token truly centered (so it stays under CABIN)
let lineA = " ".repeat(24);

// Put WEIGHT at the left (overwrite the first 6 chars)
lineA = "WEIGHT" + lineA.slice(6);

// Put BAY at the true center (overwrite at center position)
const pos = Math.floor((24 - bay.length) / 2);
lineA = lineA.slice(0, pos) + bay + lineA.slice(pos + bay.length);

lines.push(lineA);



  // Line B: "[   45KG ]   [ADD DELTA]" (fits 24; writer pads/truncs safely)
  const cabVal = (w > 0 ? String(w) : "----");
const wBox =
  "[[G]][ " + padL(cabVal, 4) + "[[/G]]KG[[G]] ][[/G]]";

const rowB = padR(wBox, 12) + "[[G]][ADD DELTA][[/G]]";


lines.push(rowB);

}

if (page === 2){
  lines.push("[[G]]■RESET ALL[[/G]]");
  lines.push("[[G]]<RTN[[/G]]");
} else {
  lines.push("[[G]]<RTN[[/G]]");
}




  // Pad out to exactly 14 rows
  while (lines.length < ROWS_TOTAL) lines.push("");
  if (lines.length > ROWS_TOTAL) lines.length = ROWS_TOTAL;

  mcduWriteMirror("mcduCabinMirror", lines);

  // Tap/click anywhere to toggle pages (touch-friendly)
  el.onclick = () => {
    s.cabinPage = (s.cabinPage == 2) ? 1 : 2;
    renderCabinMirror(s);
  };
}



/* =========================
   BAY STATE SHAPING
   ========================= */

function ensureBaysExist(s){
  if (!s) return;
  if (!s.bays || typeof s.bays !== "object") s.bays = {};

  const bayArms = (AC.bayArms) ? AC.bayArms : {};
  for (const k of Object.keys(bayArms)){
    if (s.bays[k] == null || !Number.isFinite(+s.bays[k])) s.bays[k] = 0;
  }
}


/* =========================
   CABIN BAY EDIT FIELDS (RFM limits + delta)
   ========================= */

function renderCabinBayEditFields(s){
  const host = document.getElementById("cabinBayEditFields");
  if (!host) return;

  const safeRender = (typeof render === "function") ? render : function(){};

  ensureBaysExist(s);

  const bayArms = (AC.bayArms) ? AC.bayArms : {};
  const allKeys = Object.keys(bayArms);

  const norm = (k) => String(k).toLowerCase().replace(/[^a-z0-9]/g, "");
  const findKey = (token) => {
    const t = norm(token);
    let hit = allKeys.find(k => norm(k) === t);
    if (hit) return hit;
    hit = allKeys.find(k => norm(k).includes(t));
    return hit || null;
  };

  // RFM constraints:
  // Bays 1–6: 0..3000, delta ±6000
  // Bay 5.5: 0..1500, delta ±3000
  // Ramp:    0..450,  delta ±900
  const rows = [
    { label: "BAY 1",   key: findKey("bay1"),  max: 3000, deltaMax: 6000 },
    { label: "BAY 2",   key: findKey("bay2"),  max: 3000, deltaMax: 6000 },
    { label: "BAY 3",   key: findKey("bay3"),  max: 3000, deltaMax: 6000 },
    { label: "BAY 4",   key: findKey("bay4"),  max: 3000, deltaMax: 6000 },
    { label: "BAY 5",   key: findKey("bay5"),  max: 3000, deltaMax: 6000 },
    { label: "BAY 5.5", key: findKey("bay55"), max: 1500, deltaMax: 3000 },
    { label: "BAY 6",   key: findKey("bay6"),  max: 3000, deltaMax: 6000 },
    { label: "RAMP",    key: findKey("rear") || findKey("ramp"), max: 450, deltaMax: 900 }
  ];

  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const toNum = (x) => {
    const v = +String(x).trim();
    return Number.isFinite(v) ? v : NaN;
  };

  host.innerHTML = "";

  rows.forEach((r, i) => {
    const disabled = !r.key;
    const current = disabled ? 0 : (+s.bays[r.key] || 0);

    const card = document.createElement("div");
    card.className = "card";
    card.style.boxShadow = "none";
    card.style.background = "rgba(0,0,0,.12)";
    card.style.marginBottom = "10px";

    card.innerHTML =
      '<div class="row" style="align-items:flex-end; gap:10px;">' +
        '<div style="flex:0 0 90px;">' +
          '<div class="lbl">' + r.label + '</div>' +
        '</div>' +

        '<div style="flex:1 1 140px;">' +
          '<div class="lbl">SET (kg) <span class="small">(0–' + r.max + ')</span></div>' +
          '<input ' + (disabled ? "disabled" : "") + ' data-bay="set" data-i="' + i + '" inputmode="numeric" value="' + roundKg(current) + '"/>' +
        '</div>' +

        '<div style="flex:1 1 140px;">' +
          '<div class="lbl">DELTA (kg) <span class="small">(±' + r.deltaMax + ')</span></div>' +
          '<input ' + (disabled ? "disabled" : "") + ' data-bay="delta" data-i="' + i + '" inputmode="numeric" value="0"/>' +
        '</div>' +

        '<div style="flex:0 0 110px;">' +
          '<button ' + (disabled ? "disabled" : "") + ' type="button" data-bay="apply" data-i="' + i + '">Apply Δ</button>' +
        '</div>' +
      '</div>' +
      '<div class="small" data-bay="note" data-i="' + i + '"></div>';

    host.appendChild(card);
  });

  // SET handlers
  host.querySelectorAll('input[data-bay="set"]').forEach(inp => {
    inp.addEventListener("change", () => {
      const i = +inp.dataset.i;
      const r = rows[i];
      if (!r || !r.key) return;

      const v = toNum(inp.value);
      if (!Number.isFinite(v)) return;

      const newW = roundKg(clamp(v, 0, r.max));
      s.bays[r.key] = newW;
      inp.value = newW;

      safeRender();
    });
  });

  // APPLY DELTA handlers
  host.querySelectorAll('button[data-bay="apply"]').forEach(btn => {
    btn.addEventListener("click", () => {
      const i = +btn.dataset.i;
      const r = rows[i];
      if (!r || !r.key) return;

      const deltaInp = host.querySelector('input[data-bay="delta"][data-i="' + i + '"]');
      if (!deltaInp) return;

      const d = toNum(deltaInp.value);
      if (!Number.isFinite(d)) return;

      const delta = roundKg(clamp(d, -r.deltaMax, r.deltaMax));
      const cur = +s.bays[r.key] || 0;
      const next = roundKg(clamp(cur + delta, 0, r.max));

      s.bays[r.key] = next;
      deltaInp.value = "0";

      safeRender();
    });
  });
}



/* =========================
   CERTIFY RENDER
   ========================= */

/* =========================
   CERTIFY CROSS-CHECK TABLE
   Renders the live comparison between app-calculated values
   (expected) and MCDU readback values as the FE types.
   ========================= */

const CERTIFY_TOL = { auw: 100, cg: 20, fuel: 100 };

function renderMcduInputsExpected(){
  // Step 1: what the FE types INTO the MCDU (OpW and Distance/CG).
  // Big, clearly labeled so there's no confusion about where these go.
  const host = document.getElementById("mcduInputsExpected");
  if (!host) return;
  const tail = STORE.selectedTail;
  if (!tail) { host.innerHTML = ""; return; }
  const wb = computeWB(tail);

  host.innerHTML = `
    <div class="xcheck-inputs">
      <div class="xcheck-input-card">
        <div class="xcheck-input-lbl">Operating Weight</div>
        <div class="xcheck-input-val mono">${wb.opW} <span class="xcheck-input-unit">kg</span></div>
      </div>
      <div class="xcheck-input-card">
        <div class="xcheck-input-lbl">Distance (CG)</div>
        <div class="xcheck-input-val mono">${wb.opCG} <span class="xcheck-input-unit">mm</span></div>
      </div>
    </div>
    <div class="small muted" style="margin-top:8px;">
      ⓘ Enter these two values into the MCDU. The MCDU will then compute
      AUW and CG — read those back in Step 2.
    </div>
  `;
}


function renderCertifyCrossCheck(){
  const host = document.getElementById("certifyCrossCheck");
  if (!host) return;

  const tail = STORE.selectedTail;
  if (!tail) { host.innerHTML = ""; return; }

  const wb = computeWB(tail);

  const expected = {
    auw:  wb.auw,
    cg:   wb.auwCG,
    fuel: wb.fuelTotal
  };

  // Read live values from the Step 2 inputs (not from saved state).
  // This way the table updates as the FE types.
  const readNum = (id) => {
    const el = document.getElementById(id);
    if (!el) return null;
    const v = el.value.trim();
    if (v === "") return null;
    const n = +v;
    return Number.isFinite(n) ? n : null;
  };
  const mcdu = {
    auw:  readNum("mcduAUW"),
    cg:   readNum("mcduCG"),
    fuel: readNum("mcduFuel")
  };

  // If nothing entered yet, show a friendly placeholder
  if (mcdu.auw === null && mcdu.cg === null && mcdu.fuel === null){
    host.innerHTML = `
      <div class="xcheck-empty">
        Enter the MCDU readback values in Step 2 to see the cross-check.
      </div>
    `;
    return;
  }

  const statusFor = (calc, real, tol) => {
    if (real === null) return { level: null, word: "—" };
    const d = Math.abs(calc - real);
    if (d === 0)  return { level: "good", word: "MATCH" };
    if (d <= tol) return { level: "warn", word: "WITHIN TOL" };
    return              { level: "bad",  word: "EXCEEDS TOL" };
  };

  const rows = [
    { label: "AUW",  unit: "kg", calc: expected.auw,  mcdu: mcdu.auw,  tol: CERTIFY_TOL.auw  },
    { label: "CG",   unit: "mm", calc: expected.cg,   mcdu: mcdu.cg,   tol: CERTIFY_TOL.cg   },
    { label: "Fuel", unit: "kg", calc: expected.fuel, mcdu: mcdu.fuel, tol: CERTIFY_TOL.fuel }
  ];

  let worst = null;
  let anyEntered = false;
  const bodyHtml = rows.map(r => {
    const s = statusFor(r.calc, r.mcdu, r.tol);
    if (r.mcdu !== null) anyEntered = true;
    if (s.level === "bad")                            worst = "bad";
    else if (s.level === "warn" && worst !== "bad")   worst = "warn";
    else if (s.level === "good" && worst === null)    worst = "good";

    const diffStr = (r.mcdu === null)
      ? "—"
      : (((r.calc - r.mcdu) > 0 ? "+" : "") + (r.calc - r.mcdu) + " " + r.unit);

    const mcduStr = (r.mcdu === null) ? "—" : (r.mcdu + " " + r.unit);
    const cls     = s.level ? `row-${s.level}` : "";

    return `
      <tr class="${cls}">
        <td><b>${r.label}</b></td>
        <td class="num">${r.calc} ${r.unit}</td>
        <td class="num">${mcduStr}</td>
        <td class="num">${diffStr}</td>
        <td><b>${s.word}</b></td>
      </tr>
    `;
  }).join("");

  let bannerHtml = "";
  if (anyEntered) {
    if (worst === "good") {
      bannerHtml = `<div class="xcheck-banner good">✓ All values match — ready to certify.</div>`;
    } else if (worst === "warn") {
      bannerHtml = `<div class="xcheck-banner warn">Minor discrepancies within tolerance — review before signing.</div>`;
    } else {
      bannerHtml = `<div class="xcheck-banner bad">Discrepancy exceeds tolerance — do not certify.</div>`;
    }
  }

  host.innerHTML = `
    <table class="xcheck-table">
      <thead>
        <tr>
          <th>Parameter</th>
          <th class="num" style="text-align:right;">Expected (App)</th>
          <th class="num" style="text-align:right;">MCDU</th>
          <th class="num" style="text-align:right;">Difference</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>${bodyHtml}</tbody>
    </table>
    ${bannerHtml}
  `;
}


function renderCertify(){
  const tail = STORE.selectedTail;
  const s = STORE.sessions[tail];

  // HARD RULE: Not accepted => cannot be certified; clear certify inputs/state.
  if (s && (!s.accepted || !s.accepted.isAccepted)){
    // primary certify model used by this app
    s.certify = { certified:false, by:"", at:null, mcdu:null };

    // optional parallel containers (safe if unused)
    if ("certifyForm" in s) s.certifyForm = {};
    if ("certifyInputs" in s) s.certifyInputs = {};
    if ("certified" in s) s.certified = false;
    if ("certifiedBy" in s) s.certifiedBy = "";
    if ("certifiedAt" in s) s.certifiedAt = null;

    // also clear sign-out marker if present so UI can't imply ownership
    if ("signedOutBy" in s) s.signedOutBy = "";
    if ("signedOutAt" in s) s.signedOutAt = null;
    if ("returnedAt" in s) s.returnedAt = new Date().toISOString();
  }

  const wb = computeWB(tail);

  const mcduEl = document.getElementById("mcduAuwCgReplica");
  if (mcduEl) mcduEl.innerHTML = renderMcduAuwCgReplica_REAL(wb);

  // KPI summary
  const hardOk = wb.flags.envOk && !wb.flags.overweightAirborne;
  const accOk = s.accepted.isAccepted;
  const signedOut = !!(s.signedOutBy && !s.returnedAt);

// Always sync the certify message block from state (prevents stale "Certified / Signed out by")
const certMsgEl = document.getElementById("certMsg");
if (certMsgEl){
  const isCert = !!(s.certify && s.certify.certified);
  if (isCert && signedOut){
    const who = (s.certify && s.certify.by) ? s.certify.by : s.signedOutBy;
    certMsgEl.innerHTML = `<span class="badge good">Certified</span> Signed out by ${who}.`;
  } else {
    certMsgEl.innerHTML = `<span class="badge">Not certified</span>`;
  }
}


  const status = hardOk ? "OK" : "Check";
  const statusCls = hardOk ? "good" : "bad";

  document.getElementById("certKpi").innerHTML = `
    <div class="box"><div class="t">Operating (App)</div><div class="v">${fmtKg(wb.opW)}</div><div class="s mono">${fmtMm(wb.opCG)}</div></div>
    <div class="box"><div class="t">AUW (App)</div><div class="v">${fmtKg(wb.auw)}</div><div class="s mono">${fmtMm(wb.auwCG)} · ${wb.cgBand}</div></div>
    <div class="box"><div class="t">Envelope</div><div class="v"><span class="badge ${statusCls}">${status}</span></div><div class="s">Main:${wb.flags.inMain?"Y":"N"} Alt:${wb.flags.inAlt?"Y":"N"} · CG:${wb.flags.hardCgOk?"Y":"N"}</div></div>
  `;

  // breakdown block (demo)
  const b = document.getElementById("mcduBreakdown");
  b.innerHTML = `
    <div><b>OPERATING WEIGHT</b>: <span class="mono">${wb.opW}</span> kg</div>
    <div><b>OPERATING CG</b>: <span class="mono">${wb.opCG}</span> mm</div>
    <div class="hr"></div>
    <div><b>FUEL</b>: <span class="mono">${wb.fuelTotal}</span> kg</div>
    <div><b>CABIN (Bay total)</b>: <span class="mono">${wb.cabinTotal}</span> kg</div>
    <div><b>CARGO (total)</b>: <span class="mono">${wb.cargoTotal}</span> kg</div>
    <div class="hr"></div>
    <div><b>AUW</b>: <span class="mono">${wb.auw}</span> kg</div>
    <div><b>CG</b>: <span class="mono">${wb.auwCG}</span> mm <span class="badge">${wb.cgBand}</span></div>
  `;

  // Return to available button
  document.getElementById("btnReturnToAvailableCert").onclick = ()=>{
    if (!tail) return;
    returnToAvailable(tail, "Return from certify");
    render();
  };

  // certify button
  document.getElementById("btnCertify").onclick = ()=>{
    const mcduAUW = +document.getElementById("mcduAUW").value;
    const mcduCG  = +document.getElementById("mcduCG").value;
    const mcduFuel= +document.getElementById("mcduFuel").value;
    const svc = (document.getElementById("certSvc").value || "").trim();

    if (!svc){ alert("Enter service # to sign."); return; }

    const msg = [];
    const tolW = 100;
    const tolCG = 20;
    const tolFuel = 100;

    // must have accepted
    if (!s.accepted.isAccepted){
      msg.push("Not accepted (verify log set first).");
    }

    // envelope
    if (!wb.flags.envOk || wb.flags.overweightAirborne){
      msg.push("Hard limits not satisfied (envelope / overweight).");
    }

    // compare to MCDU values if entered
    let within = true;
    if (!isNaN(mcduAUW) && mcduAUW>0){
      const dW = Math.abs(mcduAUW - wb.auw);
      if (dW > tolW){ within=false; msg.push(`AUW mismatch: Δ${dW} kg > ${tolW}`); }
    } else {
      within=false; msg.push("Enter MCDU AUW for comparison (demo requirement).");
    }

    if (!isNaN(mcduCG) && mcduCG>0){
      const dC = Math.abs(mcduCG - wb.auwCG);
      if (dC > tolCG){ within=false; msg.push(`CG mismatch: Δ${dC} mm > ${tolCG}`); }
    } else {
      within=false; msg.push("Enter MCDU CG for comparison (demo requirement).");
    }

    if (!isNaN(mcduFuel) && mcduFuel>=0){
      const dF = Math.abs(mcduFuel - wb.fuelTotal);
      if (dF > tolFuel){ within=false; msg.push(`Fuel mismatch: Δ${dF} kg > ${tolFuel}`); }
    } else {
      within=false; msg.push("Enter MCDU fuel total for comparison (demo requirement).");
    }

    if (!within){
      document.getElementById("certMsg").innerHTML = `<span class="badge bad">Cannot certify</span> ${msg.join(" · ")}`;
      return;
    }

    // Set signed out + certified
    s.signedOutBy = svc;
    s.signedOutAt = new Date().toISOString();
    s.returnedAt = null;

    s.certify.certified = true;
    s.certify.by = svc;
    s.certify.at = new Date().toISOString();
    s.certify.mcdu = {auw:mcduAUW, cg:mcduCG, fuel:mcduFuel};

    document.getElementById("certMsg").innerHTML = `<span class="badge good">Certified</span> Signed out by ${svc}.`;

        render();
  };

  // Envelope header (CERTIFY)
  const wrapEnv = document.getElementById("envWrapCertify");
  const envC = document.getElementById("envCanvasCertify");
  const envN = document.getElementById("envNotesCertify");

  // Draw only when visible (canvas is 0x0 when hidden)
  if (envC && (!wrapEnv || wrapEnv.style.display !== "none")){
    drawEnvelope(envC, envN || null);
  }

  // Collapse/expand (visual only) — redraw on expand
  const btnEnv = document.getElementById("envToggleCertify");
  if (btnEnv && wrapEnv && !btnEnv.dataset.bound){
    btnEnv.dataset.bound = "1";
    btnEnv.onclick = ()=>{
      const willExpand = (wrapEnv.style.display === "none");
      wrapEnv.style.display = willExpand ? "" : "none";
      btnEnv.textContent = willExpand ? "Collapse" : "Expand";
      if (willExpand && envC){
        drawEnvelope(envC, envN || null);
      }
    };
  }

  // Render Step 1 "enter these into the MCDU" display
  renderMcduInputsExpected();

  // Render Step 3 cross-check table and wire live updates as the FE types
  renderCertifyCrossCheck();
  ["mcduAUW", "mcduCG", "mcduFuel"].forEach(id => {
    const el = document.getElementById(id);
    if (el && !el.dataset.xcheckBound){
      el.dataset.xcheckBound = "1";
      el.addEventListener("input", renderCertifyCrossCheck);
    }
  });
}


/* =========================
   ENVELOPE DRAW (FULL WIDTH)
   ========================= */

function drawEnvelope(canvasEl, notesEl){
  const canvas = canvasEl || document.getElementById("envCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  // Optional notes target (defaults to existing envNotes)
  const notesTarget = notesEl || document.getElementById("envNotes");

  // Theme-aware colors (light theme uses darker text, darker grid)
  const isLight = document.body.classList.contains("theme-light");
  const C = {
    axisTitle: isLight ? "rgba(20,30,50,.90)"  : "rgba(232,238,252,.85)",
    tick:      isLight ? "rgba(60,70,95,.85)"   : "rgba(232,238,252,.70)",
    grid:      isLight ? "rgba(30,40,70,.10)"   : "rgba(255,255,255,.06)",
    pointLbl:  isLight ? "rgba(20,30,50,.95)"  : "rgba(232,238,252,.92)",
    landLbl:   isLight ? "rgba(20,30,50,.90)"  : "rgba(232,238,252,.85)"
  };

  // handle device pixel ratio for crisp lines
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.floor(rect.width * dpr);
  canvas.height = Math.floor(rect.height * dpr);
  ctx.setTransform(dpr,0,0,dpr,0,0);

  const tail = STORE.selectedTail;
  const s = STORE.sessions[tail];
  const wb = computeWB(tail);

    // domain: you requested stretched horizontally; use 7800-8600
  const xMin = 7800;
  const xMax = 8600;

  // weight bounds: STATIC from envelope data only (do not scale with current weight)
  const env = AC.envelope.envMain;
  const envAlt = AC.envelope.envAlt || [];

  const allEnvW = envAlt.length
    ? env.map(p=>p.w).concat(envAlt.map(p=>p.w))
    : env.map(p=>p.w);

  const wMin = Math.min(...allEnvW) - 300;
  const wMax = Math.max(...allEnvW) + 300;


  const pad = {l:52,r:18,t:18,b:34};
  const W = rect.width, H = rect.height;
  const plotW = W - pad.l - pad.r;
  const plotH = H - pad.t - pad.b;

  const x = (cg)=> pad.l + ((cg - xMin)/(xMax - xMin)) * plotW;
  const y = (w)=> pad.t + (1 - (w - wMin)/(wMax - wMin)) * plotH;

  // background grid
  ctx.clearRect(0,0,W,H);
  ctx.lineWidth = 1;
  ctx.strokeStyle = C.grid;
  for (let i=0;i<=6;i++){
    const gx = pad.l + (i/6)*plotW;
    ctx.beginPath(); ctx.moveTo(gx, pad.t); ctx.lineTo(gx, pad.t+plotH); ctx.stroke();
  }
  for (let i=0;i<=6;i++){
    const gy = pad.t + (i/6)*plotH;
    ctx.beginPath(); ctx.moveTo(pad.l, gy); ctx.lineTo(pad.l+plotW, gy); ctx.stroke();
  }

    // axes labels + reference values (tick labels)
  ctx.fillStyle = C.axisTitle;
  ctx.font = "12px " + getComputedStyle(document.body).fontFamily;

  // axis titles
  ctx.fillText("CG (mm)", pad.l + plotW/2 - 20, H - 10);
  ctx.save();
  ctx.translate(14, pad.t + plotH/2 + 25);
  ctx.rotate(-Math.PI/2);
  ctx.fillText("Weight (kg)", 0, 0);
  ctx.restore();

  // tick labels (match the 0..6 grid)
  ctx.fillStyle = C.tick;
  ctx.font = "11px " + getComputedStyle(document.body).fontFamily;

  // X ticks: 7800..8600
  for (let i=0;i<=6;i++){
    const cgVal = Math.round(xMin + (i/6)*(xMax - xMin));
    const gx = pad.l + (i/6)*plotW;
    const txt = String(cgVal);
    ctx.fillText(txt, gx - (ctx.measureText(txt).width/2), H - 22);
  }

  // Y ticks: wMin..wMax (draw on left, aligned to grid lines)
  for (let i=0;i<=6;i++){
    const wVal = Math.round(wMax - (i/6)*(wMax - wMin));
    const gy = pad.t + (i/6)*plotH;
    const txt = String(wVal);
    ctx.fillText(txt, pad.l - 10 - ctx.measureText(txt).width, gy + 4);
  }


  // envelope main
  ctx.strokeStyle = "rgba(98,168,255,.9)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  env.forEach((p,i)=>{
    const X = x(p.cg), Y = y(p.w);
    if (i===0) ctx.moveTo(X,Y); else ctx.lineTo(X,Y);
  });
  ctx.closePath();
  ctx.stroke();

  // envelope alt segment
  ctx.strokeStyle = "rgba(255,191,60,.85)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  AC.envelope.envAlt.forEach((p,i)=>{
    const X = x(p.cg), Y = y(p.w);
    if (i===0) ctx.moveTo(X,Y); else ctx.lineTo(X,Y);
  });
  ctx.stroke();

  // predicted CG path: step fuel down to landing fuel and re-solve distribution at each step
  const steps = 24;
  const startFuel = roundKg(s.fuel.total || 0);
  const landFuel = Math.max(0, roundKg(s.fuel.landing || 0));
  const pathPts = [];

  const baseSnapshot = JSON.parse(JSON.stringify(s.fuel)); // safe-ish
  const stepFuel = (startFuel - landFuel) / steps;

  // We simulate by setting total fuel (stage mapping) each step (manual mode gets ignored for path)
  const prevManual = s.fuel.manualTanks;
  for (let i=0;i<=steps;i++){
    const f = roundKg(startFuel - i*stepFuel);
    const temp = Math.max(landFuel, f);
    // temporarily enforce mapping
    s.fuel.total = temp;
    s.fuel.manualTanks = false;
    computeFuelTotals(s); // updates tanks
    const wbStep = computeWB(tail);
    pathPts.push({cg: wbStep.auwCG, w: wbStep.auw});
  }
  // restore fuel state
  s.fuel = baseSnapshot;
  s.fuel.manualTanks = prevManual;


    // draw path (turn RED when outside envelope) — self-contained
  const pointInPolyLocal = (pt, poly) => {
    // ray-casting algorithm
    let inside = false;
    for (let i=0, j=poly.length-1; i<poly.length; j=i++){
      const xi = poly[i].cg, yi = poly[i].w;
      const xj = poly[j].cg, yj = poly[j].w;
      const intersect = ((yi > pt.w) !== (yj > pt.w)) &&
        (pt.cg < (xj - xi) * (pt.w - yi) / ((yj - yi) || 1e-9) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  };

    const envMainPoly = AC.envelope.envMain || [];
  const envAltPoly = AC.envelope.envAlt || [];

  const envOkForPt = (pt) =>
    (envMainPoly.length && pointInPolyLocal(pt, envMainPoly)) ||
    (envAltPoly.length && pointInPolyLocal(pt, envAltPoly));


  ctx.lineWidth = 2;

  for (let i=1; i<pathPts.length; i++){
    const a = pathPts[i-1];
    const b = pathPts[i];

    const aOk = envOkForPt(a);
    const bOk = envOkForPt(b);

    // If either end of the segment is outside, color it red
    ctx.strokeStyle = (aOk && bOk)
      ? "rgba(53,208,127,.9)"
      : "rgba(255,90,115,.95)";

    ctx.beginPath();
    ctx.moveTo(x(a.cg), y(a.w));
    ctx.lineTo(x(b.cg), y(b.w));
    ctx.stroke();
  }



  // ---- estimated landing marker (last path point) ----
  const pointInPoly = (pt, poly) => {
    // ray-casting algorithm
    let inside = false;
    for (let i=0, j=poly.length-1; i<poly.length; j=i++){
      const xi = poly[i].cg, yi = poly[i].w;
      const xj = poly[j].cg, yj = poly[j].w;
      const intersect = ((yi > pt.w) !== (yj > pt.w)) &&
        (pt.cg < (xj - xi) * (pt.w - yi) / ((yj - yi) || 1e-9) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  };

  const landPt = pathPts.length ? pathPts[pathPts.length-1] : null;
  const landOk = landPt
    ? (pointInPoly(landPt, AC.envelope.envMain) || pointInPoly(landPt, AC.envelope.envAlt))
    : false;

  if (landPt){
    const lx = x(landPt.cg), ly = y(landPt.w);
    ctx.fillStyle = landOk ? "rgba(80,160,255,.95)" : "rgba(255,90,115,.95)";
    ctx.beginPath(); ctx.arc(lx, ly, 5, 0, Math.PI*2); ctx.fill();

    // small label
    ctx.fillStyle = C.landLbl;
    ctx.font = "11px " + getComputedStyle(document.body).fontFamily;
    ctx.fillText("LAND", lx + 8, ly + 4);
  }


  // current point
  const cx = x(wb.auwCG), cy = y(wb.auw);
  ctx.fillStyle = wb.flags.envOk ? "rgba(53,208,127,.95)" : "rgba(255,90,115,.95)";
  ctx.beginPath(); ctx.arc(cx,cy,5,0,Math.PI*2); ctx.fill();

  // annotate
  ctx.fillStyle = C.pointLbl;
  ctx.font = "12px " + getComputedStyle(document.body).fontFamily;
  ctx.fillText(`${wb.auw} kg @ ${wb.auwCG} mm (${wb.cgBand})`, cx+10, cy-10);

      // notes
  if (notesTarget){
    const warn = [];
    if (!wb.flags.envOk) warn.push("Outside envelope.");
    if (wb.flags.altGross) warn.push("Alternate gross weight range (15600–16000).");
    if (wb.flags.overweightAirborne) warn.push("OVERWEIGHT > 16000 (airborne limit).");
    notesTarget.innerHTML = warn.length
      ? `<span class="badge bad">${warn.join(" · ")}</span>`
      : `<span class="badge good">TAKEOFF CG Within limits</span>`;
  }
}




/* =========================
   GLOBAL RENDER
   ========================= */

function render(){
  // If no tail selected, lock to HOME (except EDITOR which works without a tail)
  if (!STORE.selectedTail && activeTab !== "EDITOR"){
    activeTab = "HOME";
  }

  setStatusPill();
  renderTabs();

  // render per tab
  if (activeTab === "HOME") renderHome();
  if (activeTab === "ACCEPT") renderAccept();
  if (activeTab === "CONFIG") renderConfig();
  if (activeTab === "MISSION") renderMission();
  if (activeTab === "SEATS") renderSeats();
  if (activeTab === "FUEL") renderFuel();
  if (activeTab === "CARGO") renderCargo();
  if (activeTab === "CERTIFY") renderCertify();
  if (activeTab === "EDITOR")  { if (typeof renderEditor === "function") renderEditor(); }

  // Enable/disable Home feel: If a tail is selected, Home is still available as a tab
  // (You said either way is fine; this keeps it available while defaulting you to ACCEPT on selection.)
}

/* =========================
   BOOT
   ========================= */

initTails();
buildTabs();
initThemeToggle();
render();

// keep envelope responsive
window.addEventListener("resize", ()=>{
  if (activeTab === "FUEL") drawEnvelope();
});