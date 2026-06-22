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
