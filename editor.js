/*
 * editor.js — CH-149 - 615 W&B App
 *
 * Password-protected config editor for the custodian.
 *
 * Features:
 *   - Login screen (shared password from AC.auth.password)
 *   - Tabbed editor: Mission Equipment / Stowage Locations / Role-Fit
 *   - Full CRUD on each section (add, edit, delete)
 *   - Changes save to localStorage under "ac_config_overrides"
 *   - Mission equipment items pick stowage from dropdown (arm auto-resolves)
 *   - "Export config.js" button — downloads an updated config.js file
 *     for the custodian to publish to the fleet when cloud hosting is ready
 *   - "Reset to factory defaults" button — clears all overrides
 *
 * State:
 *   EDITOR.authed   — true once the custodian has logged in this session
 *   EDITOR.activeSection — "MISSION" | "STOWAGE" | "ROLEFIT"
 *   EDITOR.draft    — working copy of AC data being edited; saved on each commit
 *
 * Called from app.js renderEditor() when the Editor tab is opened.
 */

const EDITOR = {
  authed: false,
  activeSection: "MISSION",
  draft: null
};


/* =========================
   SAVE / LOAD / RESET
   ========================= */

function editorSaveDraft() {
  // Persist current draft to localStorage and mutate AC so the rest
  // of the app immediately sees the changes without a reload.
  try {
    const payload = {
      missionEquip: EDITOR.draft.missionEquip,
      stowage:      EDITOR.draft.stowage,
      roleFit:      EDITOR.draft.roleFit
    };
    localStorage.setItem("ac_config_overrides", JSON.stringify(payload));

    // Mutate live AC so the app sees changes immediately
    AC.missionEquip = EDITOR.draft.missionEquip;
    AC.stowage      = EDITOR.draft.stowage;
    AC.roleFit      = EDITOR.draft.roleFit;
  } catch (e) {
    alert("Failed to save changes: " + e.message);
  }
}

function editorResetDefaults() {
  if (!confirm("Reset ALL mission equipment, stowage, and role-fit data to factory defaults?\n\nThis will discard every change made in the editor.")) return;
  try {
    localStorage.removeItem("ac_config_overrides");
    alert("Reset complete. The page will now reload.");
    location.reload();
  } catch (e) {
    alert("Reset failed: " + e.message);
  }
}

function editorInitDraft() {
  // Deep-clone current AC state into an editable draft.
  EDITOR.draft = {
    missionEquip: JSON.parse(JSON.stringify(AC.missionEquip)),
    stowage:      JSON.parse(JSON.stringify(AC.stowage)),
    roleFit:      JSON.parse(JSON.stringify(AC.roleFit))
  };
}


/* =========================
   ENTRY POINT — called by app.js renderEditor()
   ========================= */

function renderEditor() {
  const host = document.getElementById("editorHost");
  if (!host) return;

  if (!EDITOR.authed) {
    renderEditorLogin(host);
    return;
  }

  if (!EDITOR.draft) editorInitDraft();
  renderEditorMain(host);
}


/* =========================
   LOGIN SCREEN
   ========================= */

function renderEditorLogin(host) {
  host.innerHTML = `
    <div class="card" style="max-width:420px; margin:40px auto;">
      <h2>Custodian Login</h2>
      <div class="callout" style="margin-bottom:14px;">
        The editor allows the designated custodian to manage Mission Equipment,
        Stowage Locations, and Role-Fit items without editing code.
        Changes are saved to this device and take effect immediately.
      </div>

      <div class="lbl">Password</div>
      <input type="password" id="editorPwd" autocomplete="off"
             placeholder="Enter custodian password"
             style="margin-bottom:12px;">

      <div id="editorLoginMsg" class="small" style="margin-bottom:10px; min-height:16px;"></div>

      <button class="btn good" id="editorLoginBtn">Sign In</button>
    </div>
  `;

  const pwd = document.getElementById("editorPwd");
  const msg = document.getElementById("editorLoginMsg");
  const btn = document.getElementById("editorLoginBtn");

  const tryLogin = () => {
    if (pwd.value === AC.auth.password) {
      EDITOR.authed = true;
      editorInitDraft();
      renderEditor();
    } else {
      msg.innerHTML = '<span class="badge bad">Incorrect password</span>';
      pwd.value = "";
      pwd.focus();
    }
  };

  btn.onclick = tryLogin;
  pwd.addEventListener("keydown", (e) => {
    if (e.key === "Enter") tryLogin();
  });
  pwd.focus();
}


/* =========================
   MAIN EDITOR UI
   ========================= */

function renderEditorMain(host) {
  const tabs = [
    { id: "MISSION",  label: "Mission Equipment" },
    { id: "STOWAGE",  label: "Stowage Locations" },
    { id: "ROLEFIT",  label: "Role-Fit Equipment" }
  ];

  host.innerHTML = `
    <div class="card">
      <h2>
        Custodian Editor
        <small>Signed in · changes saved locally to this device</small>
      </h2>

      <div class="tabs" style="margin-bottom:14px; justify-content:flex-start;">
        ${tabs.map(t => `
          <button class="tabbtn ${EDITOR.activeSection === t.id ? "active" : ""}"
                  data-edsec="${t.id}">${t.label}</button>
        `).join("")}
      </div>

      <div id="editorSectionHost"></div>

      <div class="hr"></div>
      <div class="row" style="gap:8px;">
        <button class="btn" id="editorExportBtn">Export config.js</button>
        <button class="btn bad" id="editorResetBtn">Reset to Factory Defaults</button>
        <button class="btn warn" id="editorSignOutBtn" style="margin-left:auto;">Sign Out</button>
      </div>
      <div class="small muted" style="margin-top:6px;">
        Export produces a downloadable config.js with your current changes —
        useful when it is time to publish updates to the rest of the fleet.
      </div>
    </div>
  `;

  // Wire tab buttons
  host.querySelectorAll("[data-edsec]").forEach(b => {
    b.onclick = () => {
      EDITOR.activeSection = b.dataset.edsec;
      renderEditor();
    };
  });

  // Wire footer buttons
  document.getElementById("editorExportBtn").onclick = editorExportConfig;
  document.getElementById("editorResetBtn").onclick  = editorResetDefaults;
  document.getElementById("editorSignOutBtn").onclick = () => {
    EDITOR.authed = false;
    EDITOR.draft = null;
    renderEditor();
  };

  // Render active section
  const secHost = document.getElementById("editorSectionHost");
  if (EDITOR.activeSection === "MISSION")  renderEditorMission(secHost);
  if (EDITOR.activeSection === "STOWAGE")  renderEditorStowage(secHost);
  if (EDITOR.activeSection === "ROLEFIT")  renderEditorRoleFit(secHost);
}


/* =========================
   MISSION EQUIPMENT EDITOR
   ========================= */

function renderEditorMission(host) {
  const items   = EDITOR.draft.missionEquip;
  const stowage = EDITOR.draft.stowage;

  const keys = Object.keys(items).sort();

  // Build stowage dropdown options grouped by stowage group
  const stowByGroup = {};
  for (const [id, loc] of Object.entries(stowage)) {
    const g = loc.group || "Other";
    if (!stowByGroup[g]) stowByGroup[g] = [];
    stowByGroup[g].push({ id, name: loc.name, arm: loc.arm });
  }
  const stowOptionsHtml = (selectedId) => {
    let out = '<option value="">— pick stowage —</option>';
    for (const g of Object.keys(stowByGroup).sort()) {
      out += `<optgroup label="${g}">`;
      for (const s of stowByGroup[g].sort((a,b) => a.name.localeCompare(b.name))) {
        const sel = (s.id === selectedId) ? "selected" : "";
        out += `<option value="${s.id}" ${sel}>${s.name} (${s.arm} mm)</option>`;
      }
      out += "</optgroup>";
    }
    return out;
  };

  // Existing groups from current data (for dropdown)
  const groups = Array.from(new Set(
    Object.values(items).map(it => it.group || "Mission Equipment")
  )).sort();

  host.innerHTML = `
    <div class="small muted" style="margin-bottom:10px;">
      ${keys.length} item${keys.length === 1 ? "" : "s"}. Changes save automatically as you edit.
    </div>

    <div id="missionItemList"></div>

    <div class="hr"></div>
    <div class="row">
      <button class="btn good" id="missionAddBtn">+ Add New Mission Equipment</button>
    </div>
  `;

  const list = document.getElementById("missionItemList");

  for (const k of keys) {
    const it = items[k];
    const row = document.createElement("div");
    row.className = "card";
    row.style.marginBottom = "8px";
    row.style.padding = "12px";

    row.innerHTML = `
      <div class="row" style="align-items:flex-end;">
        <div style="flex: 2 1 260px;">
          <div class="lbl">Name</div>
          <input type="text" data-k="${k}" data-f="name" value="${escHtml(it.name)}">
        </div>
        <div style="flex: 0 0 100px;">
          <div class="lbl">Weight (kg)</div>
          <input type="number" step="0.01" data-k="${k}" data-f="w" value="${it.w}">
        </div>
        <div style="flex: 2 1 240px;">
          <div class="lbl">Stowage</div>
          <select data-k="${k}" data-f="stow">
            ${stowOptionsHtml(it.stow)}
          </select>
        </div>
        <div style="flex: 1 1 160px;">
          <div class="lbl">Group</div>
          <input type="text" data-k="${k}" data-f="group" value="${escHtml(it.group || "")}"
                 list="missionGroupOptions">
        </div>
      </div>
      <div class="row" style="margin-top:10px; align-items:center;">
        <div class="small mono muted" style="flex: 2 1 auto;">Key: ${k}</div>
        <label class="small" style="flex: 0 0 auto; display:flex; align-items:center; gap:6px;">
          <input type="checkbox" data-k="${k}" data-f="on" ${it.on ? "checked" : ""}
                 style="width:auto;"> Default ON (loaded by preset)
        </label>
        <button class="btn bad" data-delk="${k}" style="flex: 0 0 auto;">Delete</button>
      </div>
    `;
    list.appendChild(row);
  }

  // Group name datalist for autocomplete
  const dl = document.createElement("datalist");
  dl.id = "missionGroupOptions";
  dl.innerHTML = groups.map(g => `<option value="${escHtml(g)}">`).join("");
  list.appendChild(dl);

  // Wire field changes
  list.querySelectorAll("[data-k][data-f]").forEach(el => {
    el.addEventListener("change", () => {
      const k = el.dataset.k;
      const f = el.dataset.f;
      const item = EDITOR.draft.missionEquip[k];
      if (!item) return;

      if (f === "w")       item.w = parseFloat(el.value) || 0;
      else if (f === "on") item.on = el.checked;
      else                 item[f] = el.value;

      editorSaveDraft();
      if (typeof render === "function") render();
    });
  });

  // Wire delete buttons
  list.querySelectorAll("[data-delk]").forEach(btn => {
    btn.onclick = () => {
      const k = btn.dataset.delk;
      const it = EDITOR.draft.missionEquip[k];
      if (!confirm(`Delete "${it?.name || k}"?\n\nThis removes it from the library.`)) return;
      delete EDITOR.draft.missionEquip[k];
      editorSaveDraft();
      renderEditor();
      if (typeof render === "function") render();
    };
  });

  // Wire add button
  document.getElementById("missionAddBtn").onclick = () => {
    const newKey = promptNewKey("ME_NEW_ITEM", Object.keys(EDITOR.draft.missionEquip), "mission equipment");
    if (!newKey) return;

    // Pick first stowage as default
    const firstStow = Object.keys(EDITOR.draft.stowage)[0] || "";
    EDITOR.draft.missionEquip[newKey] = {
      name:  "New Equipment Item",
      w:     0,
      stow:  firstStow,
      group: "Mission Equipment",
      on:    false
    };
    editorSaveDraft();
    renderEditor();
    if (typeof render === "function") render();
  };
}


/* =========================
   STOWAGE LOCATIONS EDITOR
   ========================= */

function renderEditorStowage(host) {
  const stowage = EDITOR.draft.stowage;
  const keys    = Object.keys(stowage).sort();

  // Count how many mission items reference each stowage
  const refCount = {};
  for (const item of Object.values(EDITOR.draft.missionEquip)) {
    refCount[item.stow] = (refCount[item.stow] || 0) + 1;
  }

  const groups = Array.from(new Set(
    Object.values(stowage).map(s => s.group || "Other")
  )).sort();

  host.innerHTML = `
    <div class="small muted" style="margin-bottom:10px;">
      ${keys.length} location${keys.length === 1 ? "" : "s"}.
      Adding or removing stowage locations is rare — they are defined by the airframe.
    </div>

    <div id="stowageItemList"></div>

    <div class="hr"></div>
    <div class="row">
      <button class="btn good" id="stowageAddBtn">+ Add New Stowage Location</button>
    </div>

    <datalist id="stowageGroupOptions">
      ${groups.map(g => `<option value="${escHtml(g)}">`).join("")}
    </datalist>
  `;

  const list = document.getElementById("stowageItemList");

  for (const k of keys) {
    const loc = stowage[k];
    const refs = refCount[k] || 0;
    const row = document.createElement("div");
    row.className = "card";
    row.style.marginBottom = "8px";
    row.style.padding = "12px";

    row.innerHTML = `
      <div class="row" style="align-items:flex-end;">
        <div style="flex: 2 1 240px;">
          <div class="lbl">Display Name</div>
          <input type="text" data-k="${k}" data-f="name" value="${escHtml(loc.name)}">
        </div>
        <div style="flex: 0 0 110px;">
          <div class="lbl">Arm (mm)</div>
          <input type="number" step="1" data-k="${k}" data-f="arm" value="${loc.arm}">
        </div>
        <div style="flex: 1 1 160px;">
          <div class="lbl">Group</div>
          <input type="text" data-k="${k}" data-f="group" value="${escHtml(loc.group || "")}"
                 list="stowageGroupOptions">
        </div>
      </div>
      <div class="row" style="margin-top:10px; align-items:center;">
        <div class="small mono muted" style="flex: 2 1 auto;">
          ID: ${k} · Referenced by ${refs} mission item${refs === 1 ? "" : "s"}
        </div>
        <button class="btn bad" data-delk="${k}" style="flex: 0 0 auto;"
                ${refs > 0 ? "disabled title='Cannot delete — still referenced by mission equipment'" : ""}>
          Delete
        </button>
      </div>
    `;
    list.appendChild(row);
  }

  // Field edits
  list.querySelectorAll("[data-k][data-f]").forEach(el => {
    el.addEventListener("change", () => {
      const k = el.dataset.k;
      const f = el.dataset.f;
      const loc = EDITOR.draft.stowage[k];
      if (!loc) return;
      if (f === "arm") loc.arm = parseInt(el.value, 10) || 0;
      else             loc[f] = el.value;
      editorSaveDraft();
      if (typeof render === "function") render();
    });
  });

  // Delete
  list.querySelectorAll("[data-delk]").forEach(btn => {
    btn.onclick = () => {
      const k = btn.dataset.delk;
      const loc = EDITOR.draft.stowage[k];
      if (!confirm(`Delete stowage location "${loc?.name || k}"?`)) return;
      delete EDITOR.draft.stowage[k];
      editorSaveDraft();
      renderEditor();
      if (typeof render === "function") render();
    };
  });

  // Add
  document.getElementById("stowageAddBtn").onclick = () => {
    const newKey = promptNewKey("NEW_LOCATION", Object.keys(EDITOR.draft.stowage), "stowage location");
    if (!newKey) return;
    EDITOR.draft.stowage[newKey] = {
      name:  "New Stowage Location",
      arm:   0,
      group: "Other"
    };
    editorSaveDraft();
    renderEditor();
    if (typeof render === "function") render();
  };
}


/* =========================
   ROLE-FIT EDITOR
   ========================= */

function renderEditorRoleFit(host) {
  const roleFit = EDITOR.draft.roleFit;
  const keys    = Object.keys(roleFit).sort();

  host.innerHTML = `
    <div class="small muted" style="margin-bottom:10px;">
      ${keys.length} role-fit item${keys.length === 1 ? "" : "s"}.
      "Normally installed" items are present at Basic Weight unless removed by a preset.
    </div>

    <div id="roleFitItemList"></div>

    <div class="hr"></div>
    <div class="row">
      <button class="btn good" id="roleFitAddBtn">+ Add New Role-Fit Item</button>
    </div>
  `;

  const list = document.getElementById("roleFitItemList");

  for (const k of keys) {
    const it = roleFit[k];
    const row = document.createElement("div");
    row.className = "card";
    row.style.marginBottom = "8px";
    row.style.padding = "12px";

    row.innerHTML = `
      <div class="row" style="align-items:flex-end;">
        <div style="flex: 3 1 300px;">
          <div class="lbl">Name</div>
          <input type="text" data-k="${k}" data-f="name" value="${escHtml(it.name)}">
        </div>
        <div style="flex: 0 0 100px;">
          <div class="lbl">Weight (kg)</div>
          <input type="number" step="0.01" data-k="${k}" data-f="w" value="${it.w}">
        </div>
        <div style="flex: 0 0 110px;">
          <div class="lbl">Arm (mm)</div>
          <input type="number" step="1" data-k="${k}" data-f="arm" value="${it.arm}">
        </div>
      </div>
      <div class="row" style="margin-top:10px; align-items:center;">
        <div class="small mono muted" style="flex: 2 1 auto;">Key: ${k}</div>
        <label class="small" style="flex: 0 0 auto; display:flex; align-items:center; gap:6px;">
          <input type="checkbox" data-k="${k}" data-f="normally" ${it.normally ? "checked" : ""}
                 style="width:auto;"> Normally installed (counted at BW)
        </label>
        <button class="btn bad" data-delk="${k}" style="flex: 0 0 auto;">Delete</button>
      </div>
    `;
    list.appendChild(row);
  }

  // Field edits
  list.querySelectorAll("[data-k][data-f]").forEach(el => {
    el.addEventListener("change", () => {
      const k = el.dataset.k;
      const f = el.dataset.f;
      const it = EDITOR.draft.roleFit[k];
      if (!it) return;
      if (f === "w")             it.w = parseFloat(el.value) || 0;
      else if (f === "arm")      it.arm = parseInt(el.value, 10) || 0;
      else if (f === "normally") it.normally = el.checked;
      else                       it[f] = el.value;
      editorSaveDraft();
      if (typeof render === "function") render();
    });
  });

  // Delete
  list.querySelectorAll("[data-delk]").forEach(btn => {
    btn.onclick = () => {
      const k = btn.dataset.delk;
      const it = EDITOR.draft.roleFit[k];
      if (!confirm(`Delete "${it?.name || k}"?`)) return;
      delete EDITOR.draft.roleFit[k];
      editorSaveDraft();
      renderEditor();
      if (typeof render === "function") render();
    };
  });

  // Add
  document.getElementById("roleFitAddBtn").onclick = () => {
    const newKey = promptNewKey("RF_NEW_ITEM", Object.keys(EDITOR.draft.roleFit), "role-fit item");
    if (!newKey) return;
    EDITOR.draft.roleFit[newKey] = {
      name:     "New Role-Fit Item",
      w:        0,
      arm:      0,
      normally: false
    };
    editorSaveDraft();
    renderEditor();
    if (typeof render === "function") render();
  };
}


/* =========================
   EXPORT CONFIG.JS
   ========================= */
// Generates a new config.js file as plain text for download.
// The custodian can then replace config.js in the app folder to
// publish changes to the fleet (until cloud hosting is ready).

function editorExportConfig() {
  // Read the current config.js from disk is not possible in-browser;
  // we rebuild the file content from AC values.
  const lines = [];
  const push  = (s) => lines.push(s);

  push("/**");
  push(" * config.js — CH-149 - 615 W&B App");
  push(" * Exported by the Custodian Editor on " + new Date().toISOString());
  push(" *");
  push(" * This file was generated from the editor. It contains the full");
  push(" * current state of all aircraft data. Replace your existing");
  push(" * config.js with this file to publish changes.");
  push(" */");
  push("");
  push("// SECTION 1 — TAIL NUMBERS");
  push("const AC_TAILS = " + stringifyPretty(AC.tails) + ";");
  push("");
  push("// SECTION 1A — AUTH");
  push("const AC_AUTH = " + stringifyPretty(AC.auth) + ";");
  push("");
  push("// SECTION 2 — CG ENVELOPE");
  push("const AC_ENVELOPE = " + stringifyPretty(AC.envelope) + ";");
  push("");
  push("// SECTION 3 — BAY ARMS");
  push("const AC_BAY_ARMS = " + stringifyPretty(AC.bayArms) + ";");
  push("");
  push("// SECTION 4 — RAMP LIMITS");
  push("const AC_RAMP = " + stringifyPretty(AC.ramp) + ";");
  push("");
  push("// SECTION 5 — FUEL TANKS");
  push("const AC_FUEL_TANK_ARMS = " + stringifyPretty(AC.fuelTankArms) + ";");
  push("const AC_FUEL_STAGES = "    + stringifyPretty(AC.fuelStages)    + ";");
  push("");
  push("// SECTION 6 — SEATS");
  push("const AC_CREW_SEATS = " + stringifyPretty(AC.crewSeats) + ";");
  push("const AC_PAX_SEATS = "  + stringifyPretty(AC.paxSeats)  + ";");
  push("");
  push("// SECTION 7 — STOWAGE LOCATIONS");
  push("const AC_STOWAGE = " + stringifyPretty(EDITOR.draft.stowage) + ";");
  push("");
  push("// SECTION 8 — ROLE-FIT EQUIPMENT");
  push("const AC_ROLE_FIT = " + stringifyPretty(EDITOR.draft.roleFit) + ";");
  push("");
  push("// SECTION 9 — MISSION EQUIPMENT");
  push("const AC_MISSION_EQUIP = " + stringifyPretty(EDITOR.draft.missionEquip) + ";");
  push("");
  push("// SECTION 10 — MISSION PRESETS");
  push("const AC_PRESETS = " + stringifyPretty(AC.presets) + ";");
  push("");
  push("// EXPORT");
  push("const AC = {");
  push("  auth:          AC_AUTH,");
  push("  tails:         AC_TAILS,");
  push("  envelope:      AC_ENVELOPE,");
  push("  bayArms:       AC_BAY_ARMS,");
  push("  ramp:          AC_RAMP,");
  push("  fuelTankArms:  AC_FUEL_TANK_ARMS,");
  push("  fuelStages:    AC_FUEL_STAGES,");
  push("  crewSeats:     AC_CREW_SEATS,");
  push("  paxSeats:      AC_PAX_SEATS,");
  push("  stowage:       AC_STOWAGE,");
  push("  roleFit:       AC_ROLE_FIT,");
  push("  missionEquip:  AC_MISSION_EQUIP,");
  push("  presets:       AC_PRESETS");
  push("};");
  push("");
  push("// Apply localStorage overrides");
  push("try {");
  push("  const saved = localStorage.getItem('ac_config_overrides');");
  push("  if (saved) {");
  push("    const ov = JSON.parse(saved);");
  push("    if (ov.missionEquip) AC.missionEquip = ov.missionEquip;");
  push("    if (ov.stowage)      AC.stowage      = ov.stowage;");
  push("    if (ov.roleFit)      AC.roleFit      = ov.roleFit;");
  push("  }");
  push("} catch (e) { console.warn('Could not load config overrides:', e); }");

  const content = lines.join("\n");
  const blob    = new Blob([content], { type: "text/javascript" });
  const url     = URL.createObjectURL(blob);
  const a       = document.createElement("a");
  a.href        = url;
  a.download    = "config.js";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}


/* =========================
   HELPERS
   ========================= */

function escHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function promptNewKey(defaultKey, existingKeys, label) {
  let key = prompt(
    `Enter unique key/ID for the new ${label}.\n` +
    `Use UPPERCASE letters, numbers, and underscores only.\n` +
    `Example: ME_NEW_RADIO`,
    defaultKey
  );
  if (!key) return null;
  key = key.trim().toUpperCase().replace(/[^A-Z0-9_]/g, "_");
  if (!key) { alert("Invalid key."); return null; }
  if (existingKeys.includes(key)) {
    alert(`Key "${key}" is already in use. Please choose another.`);
    return null;
  }
  return key;
}

function stringifyPretty(obj) {
  return JSON.stringify(obj, null, 2);
}