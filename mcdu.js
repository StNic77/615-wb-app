/* mcdu.js — MCDU Mirror utilities */
/* =========================
   SAFE MCDU MIRROR WRITER (global)
   ========================= */

const MCDU_MIRROR = {
  ENABLED: true,
  ROWS: 14,
  COLS: 24,
  CLASS_SCREEN: "mcduScreen",
  CLASS_PRE: "mcduText mcdu-pre"
};

function mcduSafeGetEl(id){
  try { return id ? document.getElementById(id) : null; }
  catch (e){ return null; }
}

function mcduNormalizeLines(input){
  try {
    let lines = [];
    if (Array.isArray(input)) lines = input.map(x => (x == null ? "" : String(x)));
    else if (typeof input === "string") lines = input.split("\n").map(x => (x == null ? "" : String(x)));
    else lines = [""];

    while (lines.length < MCDU_MIRROR.ROWS) lines.push("");
    if (lines.length > MCDU_MIRROR.ROWS) lines.length = MCDU_MIRROR.ROWS;

    const out = [];
    for (let i = 0; i < MCDU_MIRROR.ROWS; i++){
  const raw = lines[i] == null ? "" : String(lines[i]);

  // Enforce width by VISIBLE characters only (treat [[G]] and [[/G]] as zero-width),
  // and never truncate in the middle of a marker. Also auto-close any open green span.
  let vis = 0;
  let j = 0;
  let outLine = "";
  let greenDepth = 0;

  while (j < raw.length && vis < MCDU_MIRROR.COLS){
    // Marker handling (zero-width)
    if (raw.startsWith("[[G]]", j)){
      outLine += "[[G]]";
      greenDepth++;
      j += 5;
      continue;
    }
    if (raw.startsWith("[[/G]]", j)){
      outLine += "[[/G]]";
      greenDepth = Math.max(0, greenDepth - 1);
      j += 6;
      continue;
    }

    // Normal visible character
    outLine += raw[j];
    vis++;
    j++;
  }

  // Pad visible width with spaces (spaces are visible)
  while (vis < MCDU_MIRROR.COLS){
    outLine += " ";
    vis++;
  }

  // Close any still-open green spans so coloring never “leaks” to later lines
  while (greenDepth > 0){
    outLine += "[[/G]]";
    greenDepth--;
  }

  out.push(outLine);
}


    return out;
  } catch (e){
    const out = [];
    for (let i=0; i<MCDU_MIRROR.ROWS; i++) out.push("".padEnd(MCDU_MIRROR.COLS, " "));
    return out;
  }
}

function mcduWriteMirror(id, linesOrString){
  try {
    if (!MCDU_MIRROR.ENABLED) return false;

    const el = mcduSafeGetEl(id);
    if (!el) return false;

    try { el.classList.add(MCDU_MIRROR.CLASS_SCREEN); } catch(e){}

    const lines = mcduNormalizeLines(linesOrString);
    const text = lines.join("\n");

    let pre = null;
    try { pre = el.querySelector("pre"); } catch(e){ pre = null; }

    if (!pre){
      el.innerHTML = `<pre class="${MCDU_MIRROR.CLASS_PRE}"></pre>`;
      pre = el.querySelector("pre");
    }

    if (pre) {
  // allow safe inline spans for color (mcduGreen)
  pre.innerHTML = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\[\[G\]\]/g, '<span class="mcduGreen">')
    .replace(/\[\[\/G\]\]/g, '</span>');
} else {
  el.textContent = text;
}


    return true;
  } catch (e){
    return false;
  }
}

// Debug helper: run in console -> mcduSelfTest()
function mcduSelfTest(){
  try{
    const demo = [];
    demo.push("123456789012345678901234"); // exactly 24
    demo.push("SHORT");
    for (let i=3;i<=14;i++) demo.push("ROW " + i);
    mcduWriteMirror("mcduCabinMirror", demo);
    mcduWriteMirror("mcduCargoMirror", demo);
    return "ok";
  } catch(e){
    return "fail";
  }
}

/* =========================
   STORE / CONSTANTS
   ========================= */