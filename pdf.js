/*
 * pdf.js — CH-149 Cormorant W&B App
 * 615 Wing, DLTP 101C-615
 *
 * Generates a printable / email-ready PDF record of the W&B certification.
 * Uses jsPDF (loaded via CDN in index.html).
 *
 * Entry point: generateWBReport()
 * Called by the "Print / Save PDF" button on the Certify tab.
 *
 * Document sections:
 *   Header      — unit, tail, date, FE, accepted-by
 *   1. Acceptance     — basic weight, basic CG, fuel log
 *   2. Fuel           — total, landing reserve, tank breakdown
 *   3. W&B Summary    — operating weight/CG, AUW/CG, envelope result
 *   4. CG Envelope    — plotted polygon with aircraft burn track
 *   5. Mission Config — preset applied, note re appendix
 *   6. Mission Equip  — equipment by group (SAR/ALSE/Mission/Shelves/Other)
 *   7. Crew & Pax     — seats installed and occupied
 *   8. Load Planning  — bay loads and cargo entries (if any)
 *   9. Certification  — FE signature block, MCDU cross-check values
 *   Appendix A        — Role-Fit Equipment Installed (alphabetical)
 */

/* =========================
   MAIN ENTRY POINT
   ========================= */

function generateWBReport() {
  const tail = STORE.selectedTail;
  const s    = STORE.sessions?.[tail];

  if (!s) {
    alert("No aircraft selected.");
    return;
  }
  if (!s.accepted?.isAccepted) {
    alert("Aircraft must be accepted before generating a report.");
    return;
  }
  if (!s.certify?.certified) {
    alert("W&B must be certified before generating a report.");
    return;
  }

  // Load jsPDF — it must be available on window
  if (typeof window.jspdf === "undefined" && typeof jsPDF === "undefined") {
    alert("PDF library not loaded. Check your internet connection and reload the app.");
    return;
  }

  const { jsPDF } = window.jspdf || window;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "letter" });

  const wb = computeWB(tail);
  const ctx = new PDFContext(doc, tail, s, wb);

  ctx.drawHeader();
  ctx.drawAcceptance();       // 1
  ctx.drawFuel();             // 2
  ctx.drawWBSummary();        // 3
  ctx.drawEnvelopePlot();     // 4
  ctx.drawMissionConfig();    // 5
  ctx.drawMissionEquip();     // 6
  ctx.drawSeats();            // 7
  ctx.drawLoadPlanning();     // 8
  ctx.drawCertification();    // 9
  ctx.drawRoleFitAppendix();  // Appendix A — Role-Fit Installed

  // File name: WB_615_[TAIL]_[YYYYMMDD]_Z[HH:MM].pdf — all UTC (Zulu)
  const now     = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");   // YYYYMMDD UTC
  const zuluHH  = String(now.getUTCHours()).padStart(2, "0");
  const zuluMM  = String(now.getUTCMinutes()).padStart(2, "0");
  const zuluStr = `Z${zuluHH}${zuluMM}`;
  doc.save(`WB_615_${tail}_${dateStr}_${zuluStr}.pdf`);
}


/* =========================
   PDF CONTEXT
   Helper class that tracks cursor position and provides
   drawing primitives. All Y positions are managed here
   so sections don't need to know where the previous one ended.
   ========================= */

class PDFContext {
  constructor(doc, tail, session, wb) {
    this.doc     = doc;
    this.tail    = tail;
    this.s       = session;
    this.wb      = wb;

    // Page geometry (letter: 216 x 279 mm)
    this.pageW   = 216;
    this.pageH   = 279;
    this.marginL = 14;
    this.marginR = 14;
    this.contentW = this.pageW - this.marginL - this.marginR;

    // Cursor
    this.y       = 14;

    // Colours
    this.C_DARK   = [15,  25,  50];   // near-black navy
    this.C_MED    = [60,  80, 120];   // mid navy
    this.C_LIGHT  = [200, 210, 230];  // light blue-grey
    this.C_GOOD   = [30,  160,  90];
    this.C_WARN   = [200, 140,  20];
    this.C_BAD    = [200,  50,  60];
    this.C_WHITE  = [255, 255, 255];
    this.C_PAGE   = [245, 247, 252];  // page background tint
  }

  // ── Primitives ──────────────────────────────────────────────

  newPage() {
    this.doc.addPage();
    this.y = 14;
    this._drawPageBg();
  }

  _drawPageBg() {
    this.doc.setFillColor(...this.C_PAGE);
    this.doc.rect(0, 0, this.pageW, this.pageH, "F");
  }

  checkPageBreak(needed) {
    if (this.y + needed > this.pageH - 16) {
      this.newPage();
    }
  }

  text(str, x, y, opts = {}) {
    this.doc.text(str ?? "", x, y, opts);
  }

  setFont(style = "normal", size = 9) {
    this.doc.setFont("helvetica", style);
    this.doc.setFontSize(size);
  }

  setColor(...rgb) {
    this.doc.setTextColor(...rgb);
  }

  hRule(y, color = this.C_LIGHT) {
    this.doc.setDrawColor(...color);
    this.doc.setLineWidth(0.2);
    this.doc.line(this.marginL, y, this.pageW - this.marginR, y);
  }

  // Section header bar
  sectionHeader(label) {
    this.checkPageBreak(12);
    this.doc.setFillColor(...this.C_DARK);
    this.doc.rect(this.marginL, this.y, this.contentW, 7, "F");
    this.setFont("bold", 9);
    this.setColor(...this.C_WHITE);
    this.text(label.toUpperCase(), this.marginL + 3, this.y + 5);
    this.setColor(0, 0, 0);
    this.y += 10;
  }

  // Colored alert banner — level = "good" | "warn" | "bad"
  // Used to draw attention to pass/fail or discrepancy conditions.
  alertBanner(level, title, detail) {
    this.checkPageBreak(14);
    const bgMap = {
      good: [220, 245, 225],   // light green tint
      warn: [255, 245, 215],   // light amber tint
      bad:  [250, 220, 220]    // light red tint
    };
    const textMap = {
      good: this.C_GOOD,
      warn: this.C_WARN,
      bad:  this.C_BAD
    };
    const bg    = bgMap[level]   || bgMap.warn;
    const txtC  = textMap[level] || textMap.warn;
    const h     = detail ? 12 : 8;

    // Bar
    this.doc.setFillColor(...bg);
    this.doc.rect(this.marginL, this.y, this.contentW, h, "F");
    // Left accent stripe
    this.doc.setFillColor(...txtC);
    this.doc.rect(this.marginL, this.y, 2, h, "F");

    this.setFont("bold", 9);
    this.setColor(...txtC);
    this.text(title, this.marginL + 5, this.y + 5.5);

    if (detail) {
      this.setFont("normal", 8);
      this.setColor(...this.C_DARK);
      this.text(detail, this.marginL + 5, this.y + 10);
    }

    this.setColor(0, 0, 0);
    this.y += h + 3;
  }

  // Two-column key/value row
  kvRow(label, value, highlight = null) {
    this.checkPageBreak(7);
    const col1 = this.marginL;
    const col2 = this.marginL + 55;

    this.setFont("normal", 8);
    this.setColor(...this.C_MED);
    this.text(label, col1, this.y);

    this.setFont("bold", 8);
    if (highlight === "good")       this.setColor(...this.C_GOOD);
    else if (highlight === "warn")  this.setColor(...this.C_WARN);
    else if (highlight === "bad")   this.setColor(...this.C_BAD);
    else                            this.setColor(...this.C_DARK);

    this.text(String(value ?? "—"), col2, this.y);
    this.setColor(0, 0, 0);
    this.y += 5.5;
  }

  // Table: headers + rows with word-wrapping cells
  // Row height grows to fit the tallest wrapped cell in that row.
  table(headers, rows, colWidths) {
    const hdrH      = 7;
    const lineH     = 3.4;    // line height within a wrapped cell
    const cellPadY  = 1.6;    // top/bottom padding inside a cell
    const cellPadX  = 2;      // left padding
    const x0        = this.marginL;

    this.checkPageBreak(hdrH + 10);

    // ── Header row ───────────────────────────────────────────
    this.doc.setFillColor(...this.C_MED);
    this.doc.rect(x0, this.y, this.contentW, hdrH, "F");
    this.setFont("bold", 7.5);
    this.setColor(...this.C_WHITE);
    let cx = x0 + cellPadX;
    for (let i = 0; i < headers.length; i++) {
      this.text(headers[i], cx, this.y + 5);
      cx += colWidths[i];
    }
    this.y += hdrH;

    // ── Data rows (word-wrap aware) ──────────────────────────
    this.setFont("normal", 7.5);

    rows.forEach((row, ri) => {
      // Pre-wrap each cell and find the tallest
      const wrapped = row.map((cell, i) => {
        const text = String(cell ?? "");
        const maxWidth = colWidths[i] - (cellPadX * 2);
        return this.doc.splitTextToSize(text, maxWidth);
      });

      const maxLines = Math.max(1, ...wrapped.map(w => w.length));
      const rowH     = (maxLines * lineH) + (cellPadY * 2);

      // Page break if this row would overflow
      this.checkPageBreak(rowH + 2);

      // Zebra background
      if (ri % 2 === 0) {
        this.doc.setFillColor(235, 238, 248);
        this.doc.rect(x0, this.y, this.contentW, rowH, "F");
      }

      // Render each cell's lines
      this.setFont("normal", 7.5);
      this.setColor(...this.C_DARK);
      cx = x0 + cellPadX;
      for (let i = 0; i < row.length; i++) {
        const lines = wrapped[i];
        for (let ln = 0; ln < lines.length; ln++) {
          const yLine = this.y + cellPadY + ((ln + 1) * lineH) - 1;
          this.text(lines[ln], cx, yLine);
        }
        cx += colWidths[i];
      }

      this.y += rowH;
    });

    this.hRule(this.y);
    this.y += 4;
  }

  // Small italic note (wraps to content width)
  note(str) {
    this.setFont("italic", 7.5);
    this.setColor(...this.C_MED);
    const lines = this.doc.splitTextToSize(str, this.contentW);
    for (const ln of lines) {
      this.checkPageBreak(6);
      this.text(ln, this.marginL, this.y);
      this.y += 4;
    }
    this.y += 1;
    this.setColor(0, 0, 0);
  }

  spacer(h = 4) {
    this.y += h;
  }


  // ── Section Renderers ────────────────────────────────────────

  drawHeader() {
    const doc = this.doc;
    const s   = this.s;

    // Page background
    this._drawPageBg();

    // Top banner
    doc.setFillColor(...this.C_DARK);
    doc.rect(0, 0, this.pageW, 28, "F");

    // Title
    this.setFont("bold", 16);
    this.setColor(...this.C_WHITE);
    this.text("WEIGHT & BALANCE RECORD", this.marginL, 12);

    // Subtitle
    this.setFont("normal", 9);
    this.setColor(...this.C_LIGHT);
    this.text("CH-149 - 615 Cormorant", this.marginL, 19);

    // Date/time top-right — local and Zulu
    const now      = new Date();
    const localDate = now.toLocaleDateString("en-CA", { year:"numeric", month:"short", day:"2-digit" });
    const localTime = now.toLocaleTimeString("en-CA", { hour:"2-digit", minute:"2-digit", hour12:false });
    const zuluDate  = now.toLocaleDateString("en-CA", { year:"numeric", month:"short", day:"2-digit", timeZone:"UTC" });
    const zuluHH    = String(now.getUTCHours()).padStart(2, "0");
    const zuluMM    = String(now.getUTCMinutes()).padStart(2, "0");
    const zuluTime  = `${zuluHH}:${zuluMM}`;
    this.setFont("bold", 10);
    this.setColor(...this.C_WHITE);
    this.text(`${localDate}  ${localTime} L`, this.pageW - this.marginR, 11, { align:"right" });
    this.setFont("bold", 10);
    this.setColor(...this.C_LIGHT);
    this.text(`${zuluDate}  ${zuluTime} Z`, this.pageW - this.marginR, 20, { align:"right" });

    this.y = 34;

    // Tombstone data row
    const tombstoneH = 20;
    doc.setFillColor(225, 230, 245);
    doc.rect(this.marginL, this.y, this.contentW, tombstoneH, "F");
    doc.setDrawColor(...this.C_LIGHT);
    doc.setLineWidth(0.3);
    doc.rect(this.marginL, this.y, this.contentW, tombstoneH, "S");

    const fields = [
      { label: "TAIL #",       value: this.tail },
      { label: "PRESET",       value: s.preset ? (AC.presets[s.preset]?.name ?? s.preset) : "Custom" },
      { label: "FE (CERTIFY)", value: s.certify?.by ?? "—" },
      { label: "ACCEPTED BY",  value: s.accepted?.by ?? "—" },
    ];

    const colW  = this.contentW / fields.length;
    fields.forEach((f, i) => {
      const fx = this.marginL + i * colW + 4;
      this.setFont("normal", 7);
      this.setColor(...this.C_MED);
      this.text(f.label, fx, this.y + 6);
      this.setFont("bold", 10);
      this.setColor(...this.C_DARK);
      this.text(String(f.value), fx, this.y + 14);
    });

    this.y += tombstoneH + 6;
    this.hRule(this.y);
    this.y += 5;
  }


  drawAcceptance() {
    const s = this.s;
    this.sectionHeader("1 · Acceptance (Logbook Entry)");

    const _accD = s.accepted.at ? new Date(s.accepted.at) : null;
    const atLocal = _accD
      ? _accD.toLocaleString("en-CA", { dateStyle:"medium", timeStyle:"short" }) + " L"
      : "—";
    const atZulu = _accD
      ? (() => {
          const d = _accD.toLocaleDateString("en-CA", { year:"numeric", month:"short", day:"2-digit", timeZone:"UTC" });
          const hh = String(_accD.getUTCHours()).padStart(2, "0");
          const mm = String(_accD.getUTCMinutes()).padStart(2, "0");
          return `${d}  ${hh}:${mm} Z`;
        })()
      : "—";

    this.kvRow("Basic Weight",     `${s.accepted.basicW ?? "—"} kg`);
    this.kvRow("Basic CG",         `${s.accepted.basicCG ?? "—"} mm`);
    this.kvRow("Fuel (log entry)", `${s.accepted.fuelLog ?? "—"} kg`);
    this.kvRow("Accepted by",      s.accepted.by ?? "—");
    this.kvRow("Accepted at (L)",  atLocal);
    this.kvRow("Accepted at (Z)",  atZulu);
    this.spacer();
  }


  drawMissionConfig() {
    const s = this.s;
    this.sectionHeader("5 · Mission Configuration");

    const presetName = s.preset ? (AC.presets[s.preset]?.name ?? s.preset) : "Custom (no preset)";
    const notes      = s.preset ? (AC.presets[s.preset]?.notes ?? "") : "";

    this.kvRow("Preset applied", presetName);
    if (notes) this.note(`Note: ${notes}`);
    this.spacer(2);

    // Count installed role-fit items for the reference note
    const rfOnCount = Object.keys(AC.roleFit).filter(k => s.roleFit[k]).length;
    this.note(`Role-fit installed equipment (${rfOnCount} items) is listed in Appendix A at the end of this document.`);
    this.spacer();
  }


  drawMissionEquip() {
    const s = this.s;
    this.sectionHeader("6 · Mission Equipment");

    const items = Object.keys(AC.missionEquip)
      .filter(k => s.mission[k])
      .map(k => getMissionItem(k))
      .filter(it => it)
      // Exclude zero-weight stowage presence markers (group "Stowage"):
      // they are LOCATIONS, not loadable equipment. Their contents are
      // reported in the Stowage Summary below.
      .filter(it => !((it.group || "") === "Stowage" && (+it.w || 0) === 0));

    const hasItems = items.length > 0;
    if (!hasItems) {
      this.note("No loadable mission equipment.");
    }
    // Group order — items whose group doesn't match any bucket go into Other
    const GROUP_ORDER = [
      { label: "SAR Equipment",       match: (g) => /sar/i.test(g) },
      { label: "ALSE Equipment",      match: (g) => /alse/i.test(g) },
      { label: "Medical Equipment",   match: (g) => /med/i.test(g) },
      { label: "Personal Equipment",  match: (g) => /personal/i.test(g) },
      { label: "Mission Equipment",   match: (g) => /mission/i.test(g) },
      { label: "Port Forward Shelves",match: (g) => /port.*fwd|port.*forward|fwd.*port|forward.*port/i.test(g) },
      { label: "Ramp Shelves",        match: (g) => /ramp/i.test(g) },
      { label: "Other",               match: () => true },  // catch-all
    ];

    // Assign each item to the first matching bucket
    const buckets = GROUP_ORDER.map(b => ({ label: b.label, rows: [] }));
    for (const it of items) {
      const g = it.group || "";
      let placed = false;
      for (let i = 0; i < GROUP_ORDER.length - 1; i++) {
        if (GROUP_ORDER[i].match(g)) {
          buckets[i].rows.push(it);
          placed = true;
          break;
        }
      }
      if (!placed) buckets[buckets.length - 1].rows.push(it); // Other
    }

    const headers   = ["Item", "Weight", "Arm", "Stowage"];
    const colWidths = [92, 18, 20, 58];

    for (const bucket of buckets) {
      if (bucket.rows.length === 0) continue;
      this.checkPageBreak(12);
      this.setFont("bold", 8);
      this.setColor(...this.C_MED);
      this.text(bucket.label.toUpperCase(), this.marginL, this.y);
      this.y += 5;
      this.table(
        headers,
        bucket.rows.map(it => [it.name, `${it.w} kg`, `${it.arm} mm`, it.stow]),
        colWidths
      );
    }

    // ----- Stowage Summary: load held in each stowage location -----
    // Sum the weight of ON mission items by their stow ID, then report
    // each load-planning location with its loaded weight, max, and status.
    const occupied = {};
    for (const k of Object.keys(AC.missionEquip)){
      if (!s.mission[k]) continue;
      const it = AC.missionEquip[k];
      const sid = it.stow;
      if (!sid || sid === "CUSTOM") continue;
      const w = +it.w || 0;
      if (w <= 0) continue;
      occupied[sid] = (occupied[sid] || 0) + w;
    }
    // Add any manual Load-Planning weight entered against a stow location
    for (const z of (s.zones || [])){
      if (!z || !z.id) continue;
      const zw = +z.w || 0;
      if (zw <= 0) continue;
      occupied[z.id] = (occupied[z.id] || 0) + zw;
    }

    const stowDefs = (typeof getLoadStowages === "function") ? getLoadStowages() : [];
    const stowRows = stowDefs
      .map(def => {
        const loaded = Math.round(occupied[def.id] || 0);
        const over = loaded > (+def.max || 0);
        return { def, loaded, over };
      })
      .filter(r => r.loaded > 0)   // only show locations that hold something
      .map(r => [
        r.def.label,
        `${r.loaded} kg`,
        `${r.def.max} kg`,
        r.over ? "OVER" : "OK"
      ]);

    if (stowRows.length){
      this.checkPageBreak(16);
      this.setFont("bold", 8);
      this.setColor(...this.C_MED);
      this.text("STOWAGE LIMIT CHECK (BY LOCATION)", this.marginL, this.y);
      this.y += 4;
      this.note("Verification only — these weights are already included in the mission equipment totals above and are NOT added again. This table confirms each stowage location is within its capacity limit.");
      this.table(
        ["Stowage Location", "Stowed", "Limit", "Status"],
        stowRows,
        [92, 22, 22, 30]
      );
    }

    this.spacer();
  }


  drawSeats() {
    const s = this.s;
    this.sectionHeader("7 · Crew & Passenger Seats");

    // Occupant standard weights (per RFM): crew 90.7 kg, pax 90.00 kg
    const crewW = 90.7;
    const paxW  = 90.0;

    const kg = (n) => `${Math.round(n)} kg`;

    // Crew
    const crewRows = Object.entries(AC.crewSeats)
      .filter(([k]) => s.seats[k])
      .map(([k, it]) => {
        const occupied = !!s.occupants?.[k];
        return [
          it.name,
          `${it.arm} mm`,
          kg(it.wSeat),
          occupied ? kg(crewW) : "vacant",
          occupied ? kg(it.wSeat + crewW) : kg(it.wSeat)
        ];
      });

    // Pax
    const paxRows = Object.entries(AC.paxSeats)
      .filter(([k]) => s.seats[k])
      .map(([k, it]) => {
        const occupied = !!s.occupants?.[k];
        return [
          it.name,
          `${it.arm} mm`,
          kg(it.wSeat),
          occupied ? kg(paxW) : "vacant",
          occupied ? kg(it.wSeat + paxW) : kg(it.wSeat)
        ];
      });

    const headers  = ["Seat", "Arm", "Seat Wt", "Occupant", "Total"];
    const colWidths = [68, 25, 22, 24, 22];

    if (crewRows.length) {
      this.setFont("bold", 8);
      this.setColor(...this.C_DARK);
      this.text("Crew:", this.marginL, this.y);
      this.y += 5;
      this.table(headers, crewRows, colWidths);
    }

    if (paxRows.length) {
      this.setFont("bold", 8);
      this.setColor(...this.C_DARK);
      this.text("Passengers:", this.marginL, this.y);
      this.y += 5;
      this.table(headers, paxRows, colWidths);
    }

    if (!crewRows.length && !paxRows.length) {
      this.note("No seats installed.");
    }
    this.spacer();
  }


  drawFuel() {
    const s  = this.s;
    const wb = this.wb;
    this.sectionHeader("2 · Fuel");

    this.kvRow("Total fuel (departure)", `${wb.fuelTotal} kg`);
    this.kvRow("Landing reserve",        `${s.fuel?.landing ?? 300} kg`);
    this.kvRow("Burn (est.)",            `${Math.max(0, wb.fuelTotal - (s.fuel?.landing ?? 300))} kg`);
    this.spacer(2);

    // Tank breakdown
    const tanks = wb.fuelTanks || {};
    const tankRows = Object.entries(AC.fuelTankArms).map(([k, arm]) => [
      k,
      `${arm} mm`,
      `${tanks[k] ?? 0} kg`
    ]);

    this.setFont("bold", 8);
    this.setColor(...this.C_DARK);
    this.text("Tank Distribution:", this.marginL, this.y);
    this.y += 5;
    this.table(["Tank", "Arm", "Contents"], tankRows, [40, 40, 40]);
    this.spacer();
  }


  drawLoadPlanning() {
    const s = this.s;
    this.sectionHeader("8 · Load Planning");

    // Bay loads
    const bays    = s.bays || {};
    const bayRows = Object.entries(AC.bayArms)
      .filter(([k]) => (bays[k] ?? 0) > 0)
      .map(([k, arm]) => [k, `${arm} mm`, `${bays[k]} kg`]);

    // MCDU Cargo entries
    const cargoRows = (s.cargo || [])
      .map((c, i) => [`Cargo ${i+1}`, `${c.arm ?? 0} mm`, `${c.w ?? 0} kg`])
      .filter(r => parseFloat(r[2]) > 0);

    // Stowage loads — resolve label + arm from Section 7 (getLoadStowages)
    const _stowDefs = (typeof getLoadStowages === "function") ? getLoadStowages() : [];
    const zoneRows = (s.zones || [])
      .filter(z => (z?.w ?? 0) > 0)
      .map(z => {
        const def = _stowDefs.find(d => d.id === z.id) || null;
        const label = def ? def.label : (z.id || "—");
        const arm   = def ? def.arm   : 0;
        return [label, `${arm} mm`, `${z.w} kg`];
      });

    if (!bayRows.length && !cargoRows.length && !zoneRows.length) {
      this.note("No additional loads entered in Load Planning.");
    } else {
      const headers  = ["Location", "Arm", "Weight"];
      const colWidths = [100, 40, 48];

      if (bayRows.length) {
        this.setFont("bold", 8);
        this.setColor(...this.C_DARK);
        this.text("Bay Loads:", this.marginL, this.y);
        this.y += 5;
        this.table(headers, bayRows, colWidths);
      }
      if (cargoRows.length) {
        this.setFont("bold", 8);
        this.setColor(...this.C_DARK);
        this.text("MCDU Cargo:", this.marginL, this.y);
        this.y += 5;
        this.table(headers, cargoRows, colWidths);
      }
      if (zoneRows.length) {
        this.setFont("bold", 8);
        this.setColor(...this.C_DARK);
        this.text("Stowage Loads (Load Planning):", this.marginL, this.y);
        this.y += 5;
        this.table(headers, zoneRows, colWidths);
      }
    }
    this.spacer();
  }


  drawWBSummary() {
    const wb  = this.wb;
    const s   = this.s;
    this.sectionHeader("3 · Weight & Balance Summary");

    // ── Calculated vs MCDU discrepancy check ────────────────────
    // Tolerances match the certify-gate thresholds in app.js.
    const TOL = { auw: 100, cg: 20, fuel: 100 };
    const mcdu = s.certify?.mcdu || null;

    const discrepancy = mcdu ? {
      auw:  { calc: wb.auw,       mcdu: +mcdu.auw,  tol: TOL.auw,  unit: "kg" },
      cg:   { calc: wb.auwCG,     mcdu: +mcdu.cg,   tol: TOL.cg,   unit: "mm" },
      fuel: { calc: wb.fuelTotal, mcdu: +mcdu.fuel, tol: TOL.fuel, unit: "kg" }
    } : null;

    const statusForRow = (row) => {
      const diff = Math.abs(row.calc - row.mcdu);
      if (diff === 0)       return { level: "good", word: "MATCH" };
      if (diff <= row.tol)  return { level: "warn", word: "WITHIN TOL" };
      return                       { level: "bad",  word: "EXCEEDS TOL" };
    };

    if (discrepancy) {
      const auwS  = statusForRow(discrepancy.auw);
      const cgS   = statusForRow(discrepancy.cg);
      const fuelS = statusForRow(discrepancy.fuel);

      // Roll up to a single worst-case level for the banner
      const worst =
        (auwS.level === "bad" || cgS.level === "bad" || fuelS.level === "bad")    ? "bad"  :
        (auwS.level === "warn"|| cgS.level === "warn"|| fuelS.level === "warn")   ? "warn" :
                                                                                    "good";

      if (worst === "good") {
        this.alertBanner("good", "MCDU cross-check: all values match calculated", null);
      } else if (worst === "warn") {
        this.alertBanner(
          "warn",
          "MCDU cross-check: minor discrepancies within tolerance",
          `Tolerances — AUW ±${TOL.auw} kg · CG ±${TOL.cg} mm · Fuel ±${TOL.fuel} kg. Review table below.`
        );
      } else {
        this.alertBanner(
          "bad",
          "MCDU CROSS-CHECK: DISCREPANCY EXCEEDS TOLERANCE",
          `One or more values differ beyond the certification tolerance. Review table below.`
        );
      }
      this.spacer(1);
    }

    const envStatus  = wb.flags.envOk ? "WITHIN ENVELOPE" : "OUT OF ENVELOPE";
    const envHl      = wb.flags.envOk ? "good" : "bad";
    const cgStatus   = wb.flags.hardCgOk ? "PASS" : "FAIL";
    const cgHl       = wb.flags.hardCgOk ? "good" : "bad";
    const auwStatus  = wb.flags.overweightAirborne ? "OVERWEIGHT" : "OK";
    const auwHl      = wb.flags.overweightAirborne ? "bad" : "good";

    this.kvRow("Basic Weight",         `${s.accepted.basicW ?? "—"} kg`);
    this.kvRow("Basic CG",             `${s.accepted.basicCG ?? "—"} mm`);
    this.spacer(1);
    this.kvRow("Operating Weight",     `${wb.opW} kg`);
    this.kvRow("Operating CG",         `${wb.opCG} mm`);
    this.spacer(1);
    // Tactical payload — layered on top of OW (not part of Operating Weight).
    // Always shown (even at 0 kg) so the chain OW + Bays + Cargo + Fuel = AUW
    // visibly reconciles on every record.
    this.kvRow("Bay Loads",            `${wb.bayTotal ?? 0} kg`);
    this.kvRow("Cargo",                `${wb.cargoTotal ?? 0} kg`);
    this.kvRow("Fuel (departure)",     `${wb.fuelTotal} kg`);
    this.spacer(1);
    this.kvRow("AUW",                  `${wb.auw} kg`,   auwHl);
    this.kvRow("AUW CG",               `${wb.auwCG} mm`);
    this.kvRow("CG Band",              wb.cgBand);
    this.spacer(1);
    this.kvRow("CG Hard Limits",       cgStatus,         cgHl);
    this.kvRow("Envelope",             envStatus,        envHl);
    // Alt envelope: highlight both rows yellow — aircraft is legal but in expanded limits
    const inAlt      = wb.flags.inAlt;
    const inMain     = wb.flags.inMain;
    const mainHl     = inAlt ? "warn" : null;          // yellow NO when alt is active
    const altHl      = inAlt ? "warn" : null;           // yellow YES when alt is active
    this.kvRow("In Main Envelope",  inMain ? "YES" : "NO",  mainHl);
    this.kvRow("In Alt Envelope",   inAlt  ? "YES" : "NO",  altHl);
    this.kvRow("AUW Check",            auwStatus,        auwHl);

    // ── Landing condition + burn track check ──
    if (typeof computeBurnTrack === "function") {
      const track = computeBurnTrack(this.tail);
      if (track.length) {
        const land = track[track.length - 1];

        const inPoly = (pt, poly) => {
          let inside = false;
          for (let i=0, j=poly.length-1; i<poly.length; j=i++){
            const xi = poly[i].cg, yi = poly[i].w;
            const xj = poly[j].cg, yj = poly[j].w;
            const hit = ((yi > pt.w) !== (yj > pt.w)) &&
              (pt.cg < (xj-xi)*(pt.w-yi)/((yj-yi) || 1e-9) + xi);
            if (hit) inside = !inside;
          }
          return inside;
        };
        const inEnv = (pt) => inPoly(pt, AC.envelope.envMain) || inPoly(pt, AC.envelope.envAlt);

        const landOk  = inEnv(land);
        const trackOk = track.every(p => inEnv(p));

        this.spacer(2);
        this.setFont("bold", 8);
        this.setColor(...this.C_DARK);
        this.text("Landing Condition:", this.marginL, this.y);
        this.y += 5;
        this.kvRow("Fuel at landing",   `${land.fuel} kg`);
        this.kvRow("Landing AUW",       `${land.w} kg`);
        this.kvRow("Landing CG",        `${land.cg} mm`);
        this.kvRow("Landing Envelope",
                   landOk ? "WITHIN" : "OUT",
                   landOk ? "good" : "bad");
        this.kvRow("Burn Track",
                   trackOk ? "ALL IN ENVELOPE" : "EXCEEDS ENVELOPE",
                   trackOk ? "good" : "bad");
      }
    }

    if (discrepancy) {
      this.spacer(2);
      this.setFont("bold", 8);
      this.setColor(...this.C_DARK);
      this.text("Calculated vs MCDU Cross-Check:", this.marginL, this.y);
      this.y += 5;

      const rows = [
        { label: "AUW",  ...discrepancy.auw,  status: statusForRow(discrepancy.auw)  },
        { label: "CG",   ...discrepancy.cg,   status: statusForRow(discrepancy.cg)   },
        { label: "Fuel", ...discrepancy.fuel, status: statusForRow(discrepancy.fuel) }
      ];

      // Column layout (4 cols: Parameter | Calculated | MCDU | Difference | Status)
      const x0    = this.marginL;
      const hdrH  = 7;
      const rowH  = 6.5;
      const cols  = [
        { key: "label",   w: 28 },
        { key: "calc",    w: 38, align: "right", unit: true },
        { key: "mcdu",    w: 38, align: "right", unit: true },
        { key: "diff",    w: 38, align: "right" },
        { key: "status",  w: 46 }
      ];

      // Header
      this.checkPageBreak(hdrH + rowH * 3 + 4);
      this.doc.setFillColor(...this.C_MED);
      this.doc.rect(x0, this.y, this.contentW, hdrH, "F");
      this.setFont("bold", 7.5);
      this.setColor(...this.C_WHITE);
      const headers = ["Parameter", "Calculated", "MCDU", "Difference", "Status"];
      let cx = x0;
      headers.forEach((h, i) => {
        const col = cols[i];
        const tx  = col.align === "right" ? cx + col.w - 2 : cx + 2;
        this.text(h, tx, this.y + 5, col.align === "right" ? { align: "right" } : {});
        cx += col.w;
      });
      this.y += hdrH;

      // Data rows — each colored by its own status
      rows.forEach(r => {
        const tintMap = {
          good: [235, 248, 238],
          warn: [254, 246, 220],
          bad:  [250, 228, 228]
        };
        const txtMap = {
          good: this.C_GOOD,
          warn: this.C_WARN,
          bad:  this.C_BAD
        };

        const diff     = r.calc - r.mcdu;          // signed
        const diffStr  = (diff > 0 ? "+" : "") + diff + " " + r.unit;
        const calcStr  = r.calc + " " + r.unit;
        const mcduStr  = r.mcdu + " " + r.unit;

        // Row background
        this.doc.setFillColor(...tintMap[r.status.level]);
        this.doc.rect(x0, this.y, this.contentW, rowH, "F");

        // Left accent stripe
        this.doc.setFillColor(...txtMap[r.status.level]);
        this.doc.rect(x0, this.y, 1.5, rowH, "F");

        // Row text
        this.setFont("bold", 7.5);
        this.setColor(...this.C_DARK);
        this.text(r.label, x0 + 3, this.y + 4.5);

        this.setFont("normal", 7.5);
        this.text(calcStr, x0 + cols[0].w + cols[1].w - 2, this.y + 4.5, { align: "right" });
        this.text(mcduStr, x0 + cols[0].w + cols[1].w + cols[2].w - 2, this.y + 4.5, { align: "right" });

        // Difference in status color + bold if exceeds tol
        this.setFont(r.status.level === "bad" ? "bold" : "normal", 7.5);
        this.setColor(...txtMap[r.status.level]);
        this.text(diffStr, x0 + cols[0].w + cols[1].w + cols[2].w + cols[3].w - 2, this.y + 4.5, { align: "right" });

        // Status label
        this.setFont("bold", 7.5);
        this.setColor(...txtMap[r.status.level]);
        this.text(r.status.word, x0 + cols[0].w + cols[1].w + cols[2].w + cols[3].w + 2, this.y + 4.5);

        this.setColor(0, 0, 0);
        this.y += rowH;
      });

      this.hRule(this.y);
      this.y += 4;

      this.setFont("italic", 7);
      this.setColor(...this.C_MED);
      this.text(
        `Tolerances: AUW ±${TOL.auw} kg · CG ±${TOL.cg} mm · Fuel ±${TOL.fuel} kg`,
        this.marginL, this.y
      );
      this.setColor(0, 0, 0);
      this.y += 5;
    }
    this.spacer();
  }


  drawEnvelopePlot() {
    this.checkPageBreak(100);
    this.sectionHeader("4 · CG Envelope Plot");

    const wb      = this.wb;
    const plotX   = this.marginL;
    const plotY   = this.y;
    const plotW   = this.contentW;
    const plotH   = 85;
    const doc     = this.doc;

    // Background
    doc.setFillColor(245, 247, 252);
    doc.rect(plotX, plotY, plotW, plotH, "F");
    doc.setDrawColor(...this.C_LIGHT);
    doc.setLineWidth(0.3);
    doc.rect(plotX, plotY, plotW, plotH, "S");

    // Envelope data
    const envMain = AC.envelope.envMain;
    const envAlt  = AC.envelope.envAlt;

    // Determine axis bounds with padding
    const allPts  = [...envMain, ...envAlt];
    const cgMin   = Math.min(...allPts.map(p => p.cg)) - 50;
    const cgMax   = Math.max(...allPts.map(p => p.cg)) + 50;
    const wMin    = Math.min(...allPts.map(p => p.w))  - 300;
    const wMax    = Math.max(...allPts.map(p => p.w))  + 300;

    const pad = { l: 18, r: 8, t: 8, b: 14 };
    const innerW = plotW - pad.l - pad.r;
    const innerH = plotH - pad.t - pad.b;

    const toX = (cg) => plotX + pad.l + ((cg - cgMin) / (cgMax - cgMin)) * innerW;
    const toY = (w)  => plotY + pad.t + innerH - ((w - wMin)  / (wMax  - wMin))  * innerH;

    // Grid lines (light)
    doc.setDrawColor(210, 215, 230);
    doc.setLineWidth(0.15);

    // Vertical grid (CG)
    const cgStep = 100;
    for (let cg = Math.ceil(cgMin/cgStep)*cgStep; cg <= cgMax; cg += cgStep) {
      const x = toX(cg);
      doc.line(x, plotY + pad.t, x, plotY + pad.t + innerH);
      this.setFont("normal", 6);
      this.setColor(130, 140, 160);
      doc.text(String(cg), x, plotY + plotH - 2, { align: "center" });
    }

    // Horizontal grid (weight)
    const wStep = 1000;
    for (let w = Math.ceil(wMin/wStep)*wStep; w <= wMax; w += wStep) {
      const y = toY(w);
      doc.line(plotX + pad.l, y, plotX + pad.l + innerW, y);
      this.setFont("normal", 6);
      this.setColor(130, 140, 160);
      doc.text(String(w), plotX + pad.l - 1, y + 1.5, { align: "right" });
    }

    // Draw main envelope polygon
    doc.setDrawColor(60, 120, 200);
    doc.setLineWidth(0.6);
    doc.setFillColor(60, 120, 200, 0.08);

    const mainPts = envMain.map(p => [toX(p.cg), toY(p.w)]);
    doc.setFillColor(180, 200, 235);

    // Fill
    doc.moveTo(mainPts[0][0], mainPts[0][1]);
    mainPts.slice(1).forEach(([x, y]) => doc.lineTo(x, y));
    doc.close();
    doc.fill();

    // Stroke
    doc.setDrawColor(60, 120, 200);
    doc.setLineWidth(0.6);
    doc.moveTo(mainPts[0][0], mainPts[0][1]);
    mainPts.slice(1).forEach(([x, y]) => doc.lineTo(x, y));
    doc.close();
    doc.stroke();

    // Draw alt envelope polygon
    if (envAlt && envAlt.length) {
      const altPts = envAlt.map(p => [toX(p.cg), toY(p.w)]);
      doc.setFillColor(200, 220, 250);
      doc.setDrawColor(80, 140, 210);
      doc.setLineWidth(0.4);
      doc.moveTo(altPts[0][0], altPts[0][1]);
      altPts.slice(1).forEach(([x, y]) => doc.lineTo(x, y));
      doc.close();
      doc.fillStroke();
    }

    // ── Burn track (departure → landing) ──────────────────────
    // Uses computeBurnTrack() so the curve reflects actual tank
    // distribution at each fuel level, not a straight line.
    const track = (typeof computeBurnTrack === "function")
      ? computeBurnTrack(this.tail)
      : [];

    // Point-in-polygon helper for envelope check
    const inPoly = (pt, poly) => {
      let inside = false;
      for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const xi = poly[i].cg, yi = poly[i].w;
        const xj = poly[j].cg, yj = poly[j].w;
        const intersect = ((yi > pt.w) !== (yj > pt.w)) &&
          (pt.cg < (xj - xi) * (pt.w - yi) / ((yj - yi) || 1e-9) + xi);
        if (intersect) inside = !inside;
      }
      return inside;
    };

    const ptInEnvelope = (pt) =>
      inPoly(pt, AC.envelope.envMain) || inPoly(pt, AC.envelope.envAlt);

    if (track.length > 1) {
      doc.setLineWidth(0.8);
      for (let i = 1; i < track.length; i++) {
        const a = track[i - 1];
        const b = track[i];
        const ok = ptInEnvelope(a) && ptInEnvelope(b);
        const col = ok ? this.C_GOOD : this.C_BAD;
        doc.setDrawColor(...col);
        doc.line(toX(a.cg), toY(a.w), toX(b.cg), toY(b.w));
      }
    }

    // ── Landing point ──
    const landPt = track.length ? track[track.length - 1] : null;
    if (landPt) {
      const lx = toX(landPt.cg);
      const ly = toY(landPt.w);
      const landOk = ptInEnvelope(landPt);
      const landColor = landOk ? [80, 140, 220] : this.C_BAD;

      doc.setFillColor(...landColor);
      doc.setDrawColor(...landColor);
      doc.circle(lx, ly, 2, "F");

      this.setFont("bold", 6.5);
      this.setColor(...landColor);
      doc.text("LANDING", lx + 3, ly - 1);
      doc.text(`${landPt.w} kg / ${landPt.cg} mm`, lx + 3, ly + 3);
    }

    // Plot the aircraft point (DEPARTURE)
    const ptX = toX(wb.auwCG);
    const ptY = toY(wb.auw);
    const ptColor = wb.flags.envOk ? this.C_GOOD : this.C_BAD;

    doc.setFillColor(...ptColor);
    doc.setDrawColor(...ptColor);
    doc.circle(ptX, ptY, 2.5, "F");

    // Crosshairs
    doc.setLineWidth(0.3);
    doc.setDrawColor(...ptColor);
    doc.line(ptX - 5, ptY, ptX + 5, ptY);
    doc.line(ptX, ptY - 5, ptX, ptY + 5);

    // Departure label
    this.setFont("bold", 7);
    this.setColor(...ptColor);
    doc.text("DEPARTURE", ptX + 3, ptY - 2);
    this.setFont("normal", 6.5);
    doc.text(`${wb.auw} kg / ${wb.auwCG} mm`, ptX + 3, ptY + 3);

    // ── Burn track legend (bottom-left of plot) ──
    const legX = plotX + pad.l + 2;
    const legY = plotY + plotH - 6;
    this.setFont("normal", 6);
    this.setColor(...this.C_MED);
    doc.setDrawColor(...this.C_GOOD);
    doc.setLineWidth(0.8);
    doc.line(legX, legY, legX + 6, legY);
    doc.text("Burn track (green = in envelope, red = out)", legX + 8, legY + 1.5);

    // Axis labels
    this.setFont("bold", 7);
    this.setColor(...this.C_MED);
    doc.text("CG (mm)", plotX + pad.l + innerW / 2, plotY + plotH, { align: "center" });
    doc.text("AUW (kg)", plotX + 4, plotY + pad.t + innerH / 2, { angle: 90, align: "center" });

    // Envelope result badge
    const badgeColor = wb.flags.envOk ? this.C_GOOD : this.C_BAD;
    const badgeText  = wb.flags.envOk ? "WITHIN ENVELOPE" : "OUT OF ENVELOPE";
    doc.setFillColor(...badgeColor);
    doc.roundedRect(plotX + plotW - 52, plotY + 4, 48, 8, 2, 2, "F");
    this.setFont("bold", 7.5);
    this.setColor(...this.C_WHITE);
    doc.text(badgeText, plotX + plotW - 28, plotY + 9.5, { align: "center" });

    this.y = plotY + plotH + 6;
    this.spacer();
  }


  drawRoleFitAppendix() {
    const s = this.s;
    this.newPage();
    this.sectionHeader("Appendix A · Role-Fit Equipment Installed");

    const rfRows = Object.entries(AC.roleFit)
      .filter(([k]) => s.roleFit[k])
      .map(([, it]) => [it.name, `${it.w} kg`, `${it.arm} mm`])
      .sort((a, b) => a[0].localeCompare(b[0]));  // alphabetical by name

    if (rfRows.length === 0) {
      this.note("No role-fit equipment installed.");
    } else {
      this.table(
        ["Item", "Weight", "Arm"],
        rfRows,
        [130, 25, 33]
      );
    }

    // Also list what is NOT installed for completeness
    const rfOff = Object.entries(AC.roleFit)
      .filter(([k]) => !s.roleFit[k])
      .map(([, it]) => it.name)
      .sort((a, b) => a.localeCompare(b));

    if (rfOff.length) {
      this.spacer(2);
      this.note(`Not installed: ${rfOff.join(", ")}`);
    }
    this.spacer();
  }


  drawCertification() {
    const s  = this.s;
    this.checkPageBreak(45);
    this.sectionHeader("9 · Certification");

    const _cerD = s.certify?.at ? new Date(s.certify.at) : null;
    const certAtLocal = _cerD
      ? _cerD.toLocaleString("en-CA", { dateStyle:"medium", timeStyle:"short" }) + " L"
      : "—";
    const certAtZulu = _cerD
      ? (() => {
          const d = _cerD.toLocaleDateString("en-CA", { year:"numeric", month:"short", day:"2-digit", timeZone:"UTC" });
          const hh = String(_cerD.getUTCHours()).padStart(2, "0");
          const mm = String(_cerD.getUTCMinutes()).padStart(2, "0");
          return `${d}  ${hh}:${mm} Z`;
        })()
      : "—";

    this.kvRow("Certified by (FE Svc #)", s.certify?.by ?? "—");
    this.kvRow("Certified at (L)",        certAtLocal);
    this.kvRow("Certified at (Z)",        certAtZulu);
    this.spacer(3);

    // Signature block
    const sigY  = this.y;
    const sigH  = 22;
    const col1W = 90;
    const col2W = this.contentW - col1W - 6;

    // FE signature box
    this.doc.setDrawColor(...this.C_LIGHT);
    this.doc.setLineWidth(0.3);
    this.doc.rect(this.marginL, sigY, col1W, sigH, "S");

    this.setFont("normal", 7);
    this.setColor(...this.C_MED);
    this.text("Flight Engineer Signature", this.marginL + 3, sigY + 5);
    this.text("Svc #: " + (s.certify?.by ?? ""), this.marginL + 3, sigY + 10);
    this.text("L: " + certAtLocal, this.marginL + 3, sigY + 13);
    this.text("Z: " + certAtZulu,  this.marginL + 3, sigY + 18);

    // Ops copy box
    this.doc.rect(this.marginL + col1W + 6, sigY, col2W, sigH, "S");
    this.setFont("normal", 7);
    this.setColor(...this.C_MED);
    this.text("FOR OPS USE", this.marginL + col1W + 9, sigY + 5);
    this.text("Received by:", this.marginL + col1W + 9, sigY + 11);
    this.text("Date / Time:", this.marginL + col1W + 9, sigY + 17);

    this.y = sigY + sigH + 6;

    // Footer
    this.hRule(this.y);
    this.y += 5;
    const footNow  = new Date();
    const footDate = footNow.toISOString().slice(0, 10);
    const footHH   = String(footNow.getUTCHours()).padStart(2, "0");
    const footMM   = String(footNow.getUTCMinutes()).padStart(2, "0");
    // Line 1: document identity — bold
    this.setFont("bold", 8);
    this.setColor(...this.C_DARK);
    this.text(
      `CH-149 - 615 · Tail ${this.tail} · Generated ${footDate} ${footHH}:${footMM}Z`,
      this.pageW / 2, this.y, { align: "center" }
    );
    this.y += 4.5;
    // Line 2: version provenance — ties this sortie record to the exact data
    // version it was computed against (config) and the app build (code).
    {
      const cfgV = (typeof AC !== "undefined" && AC.meta && Number.isFinite(AC.meta.configVersion))
        ? AC.meta.configVersion : "?";
      const cfgRel = (typeof AC !== "undefined" && AC.meta && AC.meta.configReleasedAt)
        ? new Date(AC.meta.configReleasedAt).toISOString().slice(0, 10) : "—";
      const appV = (typeof APP_VERSION !== "undefined") ? APP_VERSION : "?";
      this.setFont("normal", 7);
      this.setColor(...this.C_MED);
      this.text(
        `Config data v${cfgV} (released ${cfgRel}) · App v${appV} · Data source: DLTP 101C-615`,
        this.pageW / 2, this.y, { align: "center" }
      );
    }
    this.y += 5;
    // Line 3: disclaimer — italic, muted
    this.setFont("italic", 7.5);
    this.setColor(...this.C_MED);
    this.text(
      "This document is a planning tool and does not replace certified aircraft documentation.",
      this.pageW / 2, this.y, { align: "center" }
    );
  }
}