/* persist.js — CH-149-615 W&B App
 * Session persistence + app versioning.
 *
 * Goal: the app survives being swiped closed on the EFB iPad. All sessions,
 * the selected tail, and the active tab are written to localStorage on every
 * render and restored on boot. State stays valid until the operator explicitly
 * ends the session ("End Session" on Home), or until a version bump invalidates
 * an incompatible older save.
 *
 * Keys used here (namespaced, no collision with wb_theme / ac_config_overrides):
 *   wb615_session   → the persisted STORE snapshot
 *
 * Load order: this file must load AFTER config.js/compute.js and BEFORE app.js,
 * because app.js calls into restoreSession()/persistSession() during boot/render.
 */

/* =========================
   APP VERSION
   Bump APP_VERSION on any release. STATE_SCHEMA gates saved-state
   compatibility: if a stored snapshot was written under a different
   STATE_SCHEMA, the old snapshot is discarded rather than loaded into a shape
   the new code doesn't expect. Increment STATE_SCHEMA whenever the session
   object shape in makeNewSession() changes.
   ========================= */
const APP_VERSION  = "0.1.0";   // human-facing release version (shown in UI / PDF)
const STATE_SCHEMA = 1;         // increment ONLY when the session object shape changes

const SESSION_KEY = "wb615_session";

/* =========================
   SAVE
   Called from render() in app.js after every state change. Cheap: a single
   JSON.stringify of STORE plus a version stamp. Wrapped so a storage failure
   (private mode, quota) never breaks the app.
   ========================= */
function persistSession(){
  try {
    if (typeof STORE === "undefined" || !STORE) return;
    const snapshot = {
      appVersion:   APP_VERSION,
      schema:       STATE_SCHEMA,
      savedAt:      new Date().toISOString(),
      selectedTail: STORE.selectedTail,
      activeTab:    (typeof activeTab !== "undefined") ? activeTab : "HOME",
      sessions:     STORE.sessions
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(snapshot));
  } catch (e) {
    // Non-fatal: app continues in-memory only.
    console.warn("[persist] save failed:", e);
  }
}

/* =========================
   RESTORE
   Called from boot in app.js AFTER initTails() has built fresh default
   sessions. If a compatible snapshot exists, it overwrites the defaults.
   Returns true if a snapshot was restored, false otherwise.
   ========================= */
function restoreSession(){
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return false;

    const snap = JSON.parse(raw);

    // Schema gate: discard saves written by an incompatible session shape.
    if (!snap || snap.schema !== STATE_SCHEMA){
      console.warn("[persist] saved state schema mismatch (saved="
        + (snap && snap.schema) + ", expected=" + STATE_SCHEMA + ") — discarding.");
      localStorage.removeItem(SESSION_KEY);
      return false;
    }

    if (!snap.sessions || typeof snap.sessions !== "object") return false;

    // Only restore sessions for tails that still exist in the current config.
    // (Protects against a config.js change removing a tail out from under a save.)
    for (const tail of Object.keys(snap.sessions)){
      if (STORE.sessions[tail]){
        STORE.sessions[tail] = snap.sessions[tail];
      }
    }

    if (snap.selectedTail && STORE.sessions[snap.selectedTail]){
      STORE.selectedTail = snap.selectedTail;
    }
    if (snap.activeTab && typeof activeTab !== "undefined"){
      activeTab = snap.activeTab;
    }

    console.log("[persist] restored session from " + snap.savedAt
      + " (app " + snap.appVersion + ")");
    return true;
  } catch (e) {
    console.warn("[persist] restore failed:", e);
    return false;
  }
}

/* =========================
   END SESSION
   Explicit operator action. Clears the persisted snapshot and resets all
   sessions to defaults. This is the ONLY thing (besides a version bump) that
   invalidates saved state — swiping the app closed does not.
   ========================= */
function endPersistedSession(){
  try { localStorage.removeItem(SESSION_KEY); } catch (e) {}
  try { localStorage.removeItem(SPLASH_ACK_KEY); } catch (e) {}  // re-show opening screen
  if (typeof initTails === "function"){
    STORE.sessions = {};
    STORE.selectedTail = null;
    initTails();
  }
  if (typeof activeTab !== "undefined") activeTab = "HOME";
}

/* When the snapshot was last written (for UI display). */
function lastPersistInfo(){
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const snap = JSON.parse(raw);
    return { savedAt: snap.savedAt, appVersion: snap.appVersion };
  } catch (e) { return null; }
}

/* =========================
   OPENING SCREEN / DISCLAIMER GATE
   Shows on a genuinely new session (no prior acknowledgement), and again
   whenever the config data version differs from the last acknowledged one.
   "Just dismiss" — no logging, no PDF entry.

   Acknowledgement is keyed to the config version so a custodian data update
   forces operators to re-acknowledge and notice the version moved. A plain
   swipe-close/reopen with an unchanged config does NOT re-show it.
   ========================= */
const SPLASH_ACK_KEY = "wb615_splash_ack";

function currentConfigVersion(){
  if (typeof AC !== "undefined" && AC.meta && Number.isFinite(AC.meta.configVersion)){
    return AC.meta.configVersion;
  }
  return null;
}

/* Returns true if the splash should be shown right now. */
function splashShouldShow(){
  try {
    const acked = localStorage.getItem(SPLASH_ACK_KEY);
    if (acked == null) return true;                 // never acknowledged → new session
    const ackedV = Number(acked);
    const curV   = currentConfigVersion();
    if (curV == null) return false;                 // no version info → don't nag
    return ackedV !== curV;                          // config changed since last ack
  } catch (e) {
    return true; // storage unavailable → show (fail safe toward informing)
  }
}

/* Record acknowledgement of the current config version. */
function splashAcknowledge(){
  try {
    const curV = currentConfigVersion();
    localStorage.setItem(SPLASH_ACK_KEY, String(curV == null ? "" : curV));
  } catch (e) { /* non-fatal */ }
}

/* Wire up and conditionally display the opening screen. Call once at boot,
   after AC and the DOM are available. */
function maybeShowSplash(){
  const overlay = document.getElementById("splashOverlay");
  if (!overlay) return;

  // Populate version numbers + note every time (cheap, keeps them current).
  const appEl = document.getElementById("splashAppVer");
  const cfgEl = document.getElementById("splashCfgVer");
  const noteEl = document.getElementById("splashCfgNote");

  if (appEl) appEl.textContent =
    (typeof APP_VERSION !== "undefined") ? ("v" + APP_VERSION) : "—";

  const curV = currentConfigVersion();
  if (cfgEl) cfgEl.textContent = (curV != null) ? ("v" + curV) : "—";

  if (noteEl && typeof AC !== "undefined" && AC.meta){
    const log = Array.isArray(AC.meta.changelog) ? AC.meta.changelog : [];
    const latest = log[0];
    let txt = "";
    if (AC.meta.configReleasedAt){
      txt += "Configuration released " +
        new Date(AC.meta.configReleasedAt).toLocaleString() + ". ";
    }
    if (latest && latest.note && latest.note !== "(no note provided)"){
      txt += "Latest change: " + latest.note;
    }
    noteEl.textContent = txt.trim();
  }

  // Wire the dismiss button once.
  const btn = document.getElementById("splashAck");
  if (btn && !btn._wired){
    btn._wired = true;
    btn.onclick = () => {
      splashAcknowledge();
      overlay.hidden = true;
    };
  }

  // Show or hide based on the gate.
  overlay.hidden = !splashShouldShow();
}
