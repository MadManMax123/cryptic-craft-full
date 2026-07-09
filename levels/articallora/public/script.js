/**
 * NULL // OPERATOR TERMINAL — script.js
 * Cinematic intro (main.html only) + all crypto/packet/terminal logic
 */

// ─── State ────────────────────────────────────────────────────────────────────
let ENV = {};
let selectedPacket = null;
let packets = [];
let attempts = 0;
let currentFreq = null;

// ─── Init ─────────────────────────────────────────────────────────────────────
window.addEventListener("DOMContentLoaded", async () => {
  await verifySession();
  await loadEnv();
  runCinematicIntro();
});

// ─── Session verification ─────────────────────────────────────────────────────
async function verifySession() {
  try {
    const res = await fetch("/api/session", {
      credentials: "include",
      headers: { "X-Requested-With": "XMLHttpRequest" }
    });
    if (!res.ok) {
      window.location.href = "/index.html";
      return;
    }
    const data = await res.json();
    document.getElementById("teamBadge").textContent = data.team_id || "TEAM_???";
    attempts = data.attempts || 0;
  } catch {
    window.location.href = "/index.html";
  }
}

// ─── Load env ─────────────────────────────────────────────────────────────────
async function loadEnv() {
  try {
    const res = await fetch("/api/getEnv", {
      credentials: "include",
      headers: { "X-Requested-With": "XMLHttpRequest" }
    });
    if (res.ok) ENV = await res.json();
  } catch { /* graceful fallback */ }
}

// ─── Cinematic intro ──────────────────────────────────────────────────────────
function runCinematicIntro() {
  const introEl    = document.getElementById("cinematic-intro");
  const termEl     = document.getElementById("terminal");
  const breachEl   = document.getElementById("breach-overlay");
  const triangleEl = document.getElementById("warn-triangle");
  const termPanel  = document.getElementById("terminal-panel");
  const lorePanel  = document.getElementById("lore-panel");
  const loreDisp   = document.getElementById("lore-display");
  const skipBtn    = document.getElementById("skip-btn");
  const mainSite   = document.getElementById("main-site");

  let skipTriggered = false;
  let audioCtx  = null;
  let sirenOsc1 = null;
  let sirenOsc2 = null;
  let sirenGain = null;
  let sirenLfo  = null;

  const wait   = ms => new Promise(r => setTimeout(r, ms));
  const jitter = (min, max) => wait(min + Math.random() * (max - min));

  function revealSite() {
    skipTriggered = true;
    stopSiren();
    introEl.classList.add("fade-out");
    setTimeout(() => {
      introEl.style.display     = "none";
      mainSite.style.visibility = "visible";
      mainSite.style.opacity    = "1";
      // After intro, run the in-page boot sequence directly into freq phase
      setTimeout(runBootSequence, 300);
    }, 1200);
  }

  skipBtn.addEventListener("click", revealSite);

  function scrollTerm() { termEl.scrollTop = termEl.scrollHeight; }

  function addLine(text, cls = "t-normal") {
    const el = document.createElement("div");
    el.className = `t-line ${cls}`;
    el.textContent = typeof text === "function" ? text() : text;
    termEl.appendChild(el);
    scrollTerm();
    return el;
  }

  function addEmpty() {
    const el = document.createElement("div");
    el.className = "t-line t-empty";
    el.textContent = ".";
    termEl.appendChild(el);
    scrollTerm();
  }

  // ── Droning siren ──────────────────────────────────────────────────────────
  function startSiren() {
    try {
      audioCtx  = new (window.AudioContext || window.webkitAudioContext)();
      sirenGain = audioCtx.createGain();
      sirenGain.gain.setValueAtTime(0, audioCtx.currentTime);
      sirenGain.gain.linearRampToValueAtTime(0.14, audioCtx.currentTime + 2.5);
      sirenGain.connect(audioCtx.destination);

      sirenLfo = audioCtx.createOscillator();
      sirenLfo.type = "sine";
      sirenLfo.frequency.value = 0.18;
      const lfoGain = audioCtx.createGain();
      lfoGain.gain.value = 120;
      sirenLfo.connect(lfoGain);
      sirenLfo.start();

      sirenOsc1 = audioCtx.createOscillator();
      sirenOsc1.type = "sawtooth";
      sirenOsc1.frequency.value = 220;
      lfoGain.connect(sirenOsc1.frequency);
      const filter1 = audioCtx.createBiquadFilter();
      filter1.type = "lowpass";
      filter1.frequency.value = 900;
      filter1.Q.value = 2.2;
      sirenOsc1.connect(filter1);
      filter1.connect(sirenGain);
      sirenOsc1.start();

      sirenOsc2 = audioCtx.createOscillator();
      sirenOsc2.type = "sawtooth";
      sirenOsc2.frequency.value = 221.8;
      lfoGain.connect(sirenOsc2.frequency);
      const filter2 = audioCtx.createBiquadFilter();
      filter2.type = "lowpass";
      filter2.frequency.value = 700;
      filter2.Q.value = 1.8;
      sirenOsc2.connect(filter2);
      filter2.connect(sirenGain);
      sirenOsc2.start();
    } catch (e) { /* audio unavailable */ }
  }

  function stopSiren() {
    try {
      if (!audioCtx) return;
      const now = audioCtx.currentTime;
      sirenGain.gain.linearRampToValueAtTime(0, now + 1.2);
      setTimeout(() => {
        try {
          sirenOsc1 && sirenOsc1.stop();
          sirenOsc2 && sirenOsc2.stop();
          sirenLfo  && sirenLfo.stop();
          audioCtx  && audioCtx.close();
        } catch (e) {}
        audioCtx = null;
      }, 1300);
    } catch (e) {}
  }

  // ── ASYNC sequence ─────────────────────────────────────────────────────────
  (async () => {

    // ╔══════════════════════════════════════════════════════════════════╗
    // ║  PHASE 1 — BOOT SEQUENCE  (~30 seconds of dense filler lines)  ║
    // ╚══════════════════════════════════════════════════════════════════╝
    await jitter(200, 380);
    if (skipTriggered) return;

    // — kernel boot —
    addLine("> NULL kernel 5.19.0-null-rf #1 SMP PREEMPT", "t-dim");
    await jitter(180, 290);
    addLine("> Command line: root=/dev/null rw quiet rf_core=1 audit=0", "t-dim");
    await jitter(140, 240);
    addLine("> BIOS-e820: [mem 0x0000000000000000-0x000000000009fbff] usable", "t-dim");
    await jitter(100, 180);
    addLine("> ACPI: RSDP 0x00000000000F05B0 000024 (v02 NULL  )", "t-dim");
    await jitter(120, 200);
    addLine("> ACPI: IRQ0 used by override.", "t-dim");
    await jitter(100, 160);
    addLine("> PCI: Using configuration type 1 for base access", "t-dim");
    await jitter(120, 210);
    addLine("> clocksource: tsc-early — registered", "t-dim");
    await jitter(100, 180);
    addLine("> Kernel/User page tables isolation: enabled", "t-dim");
    await jitter(140, 230);
    addLine("> Booting paravirtualized kernel on bare hardware", "t-dim");
    await jitter(110, 190);
    addLine("> DMAR: Host address width 39", "t-dim");
    await jitter(100, 170);
    addLine("> Initializing cgroup subsys cpuset", "t-dim");
    await jitter(100, 160);
    addLine("> Initializing cgroup subsys cpu", "t-dim");
    await jitter(100, 160);
    addLine("> Linux version 5.19.0-null-rf (null@build) (gcc version 12.2.0)", "t-dim");
    await jitter(130, 210);
    addLine("> Memory: 65536K/131072K available (14322K kernel code, 2048K rwdata)", "t-dim");
    await jitter(110, 190);
    addLine("> SLUB: HWalign=64, Order=0-3, MinObjects=0, CPUs=4, Nodes=1", "t-dim");
    await jitter(100, 160);
    addLine("> rcu: Hierarchical RCU implementation.", "t-dim");
    await jitter(110, 180);
    addLine("> NR_IRQS: 4352, nr_irqs: 2176, preallocated irqs: 16", "t-dim");
    await jitter(100, 165);
    addLine("> Console: colour dummy device 80x25", "t-dim");
    await jitter(120, 200);
    addEmpty();

    // — RF subsystem —
    addLine("> RF subsystem initializing ...", "t-normal");
    await jitter(300, 480);
    addLine("  >> probing SPI bus for LoRa transceiver...", "t-dim");
    await jitter(200, 340);
    addLine("  >> SX1276 detected on SPI0 — chip rev 0x12", "t-good");
    await jitter(160, 280);
    addLine("  >> loading SX1276 firmware blob v3.0.0.4 ...", "t-dim");
    await jitter(200, 350);
    addLine("  >> firmware checksum: OK  [sha256: 9a3f2c...]", "t-good");
    await jitter(160, 260);
    addLine("  >> Frequency synthesizer: LOCKED  [ref: 32 MHz TCXO]", "t-good");
    await jitter(180, 300);
    addLine("  >> PLL settling time: 262 µs", "t-dim");
    await jitter(140, 240);
    addLine("  >> Packet broker: UP  [queue depth: 512]", "t-good");
    await jitter(160, 280);
    addLine("  >> AGC calibration: PASS  [RSSI floor: -139 dBm]", "t-good");
    await jitter(180, 300);
    addLine("  >> TX power output: +20 dBm  [PA_BOOST active]", "t-dim");
    await jitter(160, 260);
    addLine("  >> Spreading factor: SF7–SF12 adaptive", "t-dim");
    await jitter(140, 230);
    addLine("  >> Bandwidth: 125 kHz / 250 kHz selectable", "t-dim");
    await jitter(160, 270);
    addLine("  >> Coding rate: 4/5  [FEC enabled]", "t-dim");
    await jitter(180, 300);
    addLine("  >> CRC verification: enabled", "t-dim");
    await jitter(140, 230);
    addLine("  >> DIO interrupt mapping: DIO0→RxDone DIO1→RxTimeout", "t-dim");
    await jitter(160, 260);
    addLine("  >> Antenna switch: external LNA path engaged", "t-dim");
    await jitter(200, 340);
    addEmpty();

    // — secure store + crypto —
    addLine("> Mounting secure store ... OK", "t-good");
    await jitter(180, 300);
    addLine("  >> mount point: /null/secure  [tmpfs, noexec, nosuid]", "t-dim");
    await jitter(160, 260);
    addLine("  >> encrypted volume decrypted: YES  [TPM2.0 sealed key]", "t-dim");
    await jitter(180, 300);
    addLine("> CRYPTO ENGINE: AES-256-GCM ready", "t-good");
    await jitter(160, 270);
    addLine("  >> HMAC-SHA256: ready", "t-dim");
    await jitter(140, 230);
    addLine("  >> Ed25519 keypair loaded: OK", "t-dim");
    await jitter(160, 260);
    addLine("  >> ECDH key exchange module: standby", "t-dim");
    await jitter(180, 300);
    addLine("  >> RNG entropy pool: 3072 bits  [/dev/urandom seeded]", "t-dim");
    await jitter(160, 260);
    addLine("  >> HSM attestation: PASSED", "t-good");
    await jitter(200, 340);
    addEmpty();

    // — signature + archive —
    addLine(() => `> ${ENV.TRUE_SHA1_AUTH || "cdb0c745bdc0e33d37619fae4b8cee43094168b7"}`, "t-dim");
    await jitter(180, 300);
    addLine("> Verifying digital signature chain ...", "t-normal");
    await jitter(280, 440);
    addLine("  >> root CA fingerprint: OK", "t-good");
    await jitter(160, 270);
    addLine("  >> intermediate CA: OK", "t-good");
    await jitter(140, 240);
    addLine("  >> leaf certificate: OK  [expires: 2026-12-31]", "t-good");
    await jitter(160, 270);
    addLine("  >> certificate pinning: PASS", "t-dim");
    await jitter(200, 340);
    addLine("> archivepull();", "t-dim");
    await jitter(300, 480);
    addLine("  >> archive index: fetching...", "t-dim");
    await jitter(220, 360);
    addLine("  >> 4,891 records indexed  [last updated: 2 days ago]", "t-dim");
    await jitter(180, 300);
    addLine("  >> integrity check: PASS  [Merkle root verified]", "t-dim");
    await jitter(200, 340);
    addEmpty();

    // — network stack —
    addLine("> initializing NULL mesh network stack...", "t-normal");
    await jitter(200, 340);
    addLine("  >> peer discovery: scanning...", "t-dim");
    await jitter(220, 360);
    addLine("  >> nodes visible: 14  [7 authenticated, 7 unknown]", "t-dim");
    await jitter(180, 300);
    addLine("  >> routing table built: 14 entries", "t-dim");
    await jitter(160, 260);
    addLine("  >> MTU negotiated: 242 bytes  [LoRaWAN default]", "t-dim");
    await jitter(180, 300);
    addLine("  >> channel plan: EU868  [8 uplink channels]", "t-dim");
    await jitter(160, 270);
    addLine("  >> join server: reachable  [ping: 34ms]", "t-dim");
    await jitter(180, 300);
    addLine("  >> network server: reachable  [ping: 41ms]", "t-dim");
    await jitter(180, 300);
    addLine("  >> application server: reachable  [ping: 38ms]", "t-dim");
    await jitter(200, 340);
    addEmpty();

    // — anomaly detection —
    addLine("> WARNING: anomalous multi-point transmission detected", "t-warn");
    await jitter(180, 300);
    addLine("  >> signal origin count: 14  [expected: 1]", "t-warn");
    await jitter(160, 270);
    addLine("  >> Spoofed nodes active on band — CAUTION", "t-warn");
    await jitter(180, 300);
    addLine("  >> RSSI delta across nodes: ±22 dB  [high variance — suspicious]", "t-warn");
    await jitter(180, 300);
    addLine("  >> timing jitter: 4.8ms  [threshold: 1.0ms — EXCEEDED]", "t-warn");
    await jitter(200, 340);
    addLine("> NULL node contact ESTABLISHED", "t-normal");
    await jitter(180, 300);
    addLine("  >> devEUI: 70:B3:D5:7E:D0:04:00:01", "t-dim");
    await jitter(160, 260);
    addLine("  >> session keys negotiated: OK", "t-dim");
    await jitter(180, 300);
    addLine("  >> uplink counter: 0x0001", "t-dim");
    await jitter(240, 400);
    addLine("> operator session initializing...", "t-dim");
    await jitter(200, 340);
    addLine("> system ready.", "t-good");
    await jitter(400, 600);
    if (skipTriggered) return;

    // ╔══════════════════════════════════════════════════════════════╗
    // ║  PHASE 2 — BREACH  (lines flash fast, but phase is meaty)  ║
    // ╚══════════════════════════════════════════════════════════════╝
    addEmpty();
    addLine("⚠  NULL SECURITY BREACH DETECTED", "t-breach");
    breachEl.classList.add("active");
    introEl.classList.add("breach-mode");
    triangleEl.classList.add("visible");
    startSiren();

    await jitter(80, 140);
    addLine("   INTRUSION TYPE: EXTERNAL FORCED ENTRY", "t-breach");
    await jitter(60, 110);
    addLine("   VECTOR: UNCLASSIFIED  //  ORIGIN: MASKED", "t-breach");
    await jitter(60, 100);
    addLine("   AFFECTED SECTORS: C, D, TUNNEL GATEWAY", "t-breach");
    await jitter(60, 100);
    addLine("   SEVERITY: CRITICAL  //  CONFIDENCE: 98.7%", "t-breach");
    await jitter(70, 120);
    addLine("> INITIATING TIER-3 DEFENSE PROTOCOLS...", "t-warn");
    await jitter(80, 130);
    addLine("  >> activating firewall layer 1...         [OK]", "t-warn");
    await jitter(60, 100);
    addLine("  >> activating firewall layer 2...         [OK]", "t-warn");
    await jitter(70, 110);
    addLine("  >> activating firewall layer 3...         [PARTIAL]", "t-warn");
    await jitter(60, 100);
    addLine("     layer 3 override — unknown bypass key detected", "t-breach");
    await jitter(60, 100);
    addLine("     bypass signature: 0xDEADBEEF_NULL_OVERRIDE", "t-breach");
    await jitter(70, 115);
    addLine("> isolating affected gateway nodes...", "t-warn");
    await jitter(80, 130);
    addLine("  >> gateway C sealed", "t-warn");
    await jitter(60, 100);
    addLine("  >> gateway D sealed", "t-warn");
    await jitter(60, 100);
    addLine("  >> tunnel gateway: RESISTANT — secondary path still open", "t-breach");
    await jitter(60, 100);
    addLine("  >> secondary path origin: unknown relay node", "t-breach");
    await jitter(70, 115);
    addLine("> deploying counter-intrusion mesh...", "t-warn");
    await jitter(80, 130);
    addLine("  >> mesh coverage: 94%  —  6% exposure remains", "t-warn");
    await jitter(60, 100);
    addLine("  >> exposure point: tunnel relay  [address unknown]", "t-breach");
    await jitter(60, 100);
    addLine("> attempting attacker source trace...", "t-warn");
    await jitter(80, 130);
    addLine("  >> hop 1: 192.168.xx.xx — null route", "t-dim");
    await jitter(60, 100);
    addLine("  >> hop 2: TOR exit node — untraceable", "t-dim");
    await jitter(60, 100);
    addLine("  >> hop 3: DEAD END — route fully encrypted", "t-breach");
    await jitter(60, 100);
    addLine("  >> hop 4: [CLASSIFIED NODE]  — access denied", "t-breach");
    await jitter(70, 115);
    addLine("> TRACE FAILED — source identity unresolvable", "t-breach");
    await jitter(70, 115);
    addLine("> cross-referencing NULL breach archive...", "t-dim");
    await jitter(80, 130);
    addLine("  >> scanning 4,891 historical breach records...", "t-dim");
    await jitter(70, 115);
    addLine("  >> partial signature match found", "t-warn");
    await jitter(60, 100);
    addLine("     confidence: 87.4%  //  ref: ARCHIVE-7 [CLASSIFIED]", "t-warn");
    await jitter(60, 100);
    addLine("  >> this attack pattern has been seen before", "t-dim");
    await jitter(60, 100);
    addLine("  >> last recorded occurrence: [DATE REDACTED]", "t-dim");
    await jitter(60, 100);
    addLine("  >> dormancy period estimated: 4–7 years", "t-dim");
    await jitter(70, 115);
    addLine("> sealing exposed memory register banks...    [OK]", "t-warn");
    await jitter(60, 100);
    addLine("> invalidating injected session tokens...     [OK]", "t-warn");
    await jitter(60, 100);
    addLine("> purging rogue process tree...", "t-warn");
    await jitter(80, 130);
    addLine("  >> 14 rogue processes terminated", "t-warn");
    await jitter(60, 100);
    addLine("  >> 3 orphan threads reaped", "t-warn");
    await jitter(60, 100);
    addLine("> re-encrypting compromised data sectors...", "t-warn");
    await jitter(80, 130);
    addLine("  >> sectors re-keyed: C, D, TUNNEL-GATEWAY", "t-warn");
    await jitter(60, 100);
    addLine("  >> new session keys generated and distributed", "t-warn");
    await jitter(60, 100);
    addLine("> running full perimeter integrity check...", "t-warn");
    await jitter(80, 130);
    addLine("  >> all critical sectors: INTACT", "t-good");
    await jitter(60, 100);
    addLine("  >> no persistent backdoors detected", "t-good");
    await jitter(60, 100);
    addLine("  >> data exfiltration volume: ZERO", "t-good");
    await jitter(60, 100);
    addLine("  >> covert channel analysis: CLEAR", "t-good");
    await jitter(70, 115);
    if (skipTriggered) return;

    // ╔══════════════════════════════════════════════════════════════════╗
    // ║  PHASE 3 — RESOLVED                                             ║
    // ╚══════════════════════════════════════════════════════════════════╝
    stopSiren();
    breachEl.classList.remove("active");
    introEl.classList.remove("breach-mode");
    triangleEl.classList.remove("visible");

    await jitter(200, 360);
    addEmpty();
    addLine("> INTRUSION SUCCESSFULLY NEUTRALISED", "t-good");
    await jitter(180, 300);
    addLine("> PERIMETER INTEGRITY: FULLY RESTORED", "t-good");
    await jitter(180, 300);
    addLine("> threat classification: PERSISTENT EXTERNAL ENTITY", "t-dim");
    await jitter(160, 270);
    addLine("  >> behaviour consistent with long-dormant actor", "t-dim");
    await jitter(160, 270);
    addLine("  >> flagged for inter-node intelligence review", "t-dim");
    await jitter(200, 340);
    addLine("> resuming operator terminal sequence...", "t-dim");
    await jitter(280, 440);
    addLine("> UNLOCKING OPERATOR SESSION...", "t-good");
    await jitter(240, 400);
    addLine("> access granted.", "t-good");
    await jitter(600, 900);
    if (skipTriggered) return;

    // ── TERMINAL FADES ──────────────────────────────────────────────
    termPanel.style.transition = "opacity .8s ease";
    termPanel.style.opacity    = "0";
    await wait(900);
    if (skipTriggered) return;

    // ╔══════════════════════════════════════════════════════════════════╗
    // ║  LORE SEQUENCE  (dramatic, with '...' pauses and shudder)      ║
    // ╚══════════════════════════════════════════════════════════════════╝
    lorePanel.classList.add("visible");

    // loreLines: each entry is { text, holdMs, dramatic (shudder) }
    const loreLines = [
      { text: "Again",            dots: 3, holdMs: 1800, dramatic: false },
      { text: "The same error",   dots: 3, holdMs: 1800, dramatic: false },
      { text: "This is no accident", dots: 2, holdMs: 2000, dramatic: true },
      { text: "Operator — you have reached the transmission layer", dots: 1, holdMs: 2400, dramatic: false },
      { text: "NULL is broadcasting across many long-range RF nodes", dots: 1, holdMs: 2000, dramatic: false },
      { text: "But many have been spoofed",          dots: 2, holdMs: 1800, dramatic: false },
      { text: "They are watching",                   dots: 3, holdMs: 2200, dramatic: true },
      { text: "Listen over many frequencies — receive the RF packages", dots: 1, holdMs: 2000, dramatic: false },
      { text: "Verify the digital signature and AUTH code to find the true transmission", dots: 1, holdMs: 2400, dramatic: false },
      { text: "Your clue has already been given",   dots: 3, holdMs: 2600, dramatic: true },
    ];

    const CHAR_DELAY = 32;
    const FADE_MS    = 700;

    for (let i = 0; i < loreLines.length; i++) {
      if (skipTriggered) break;

      const { text, dots, holdMs, dramatic } = loreLines[i];

      loreDisp.textContent      = "";
      loreDisp.style.opacity    = "1";
      loreDisp.style.transition = "none";
      loreDisp.classList.remove("lore-shudder");

      // Type out the base text
      await new Promise(resolve => {
        let idx = 0;
        function tick() {
          if (skipTriggered) { loreDisp.textContent = text; resolve(); return; }
          loreDisp.textContent = text.slice(0, idx);
          if (idx <= text.length) { idx++; setTimeout(tick, CHAR_DELAY); }
          else resolve();
        }
        tick();
      });

      if (skipTriggered) break;

      // Type the dots one at a time with a pause between each
      for (let d = 0; d < dots; d++) {
        if (skipTriggered) break;
        await wait(320);
        loreDisp.textContent += ".";
      }

      if (skipTriggered) break;

      // Apply shudder to dramatic lines
      if (dramatic) {
        loreDisp.classList.add("lore-shudder");
      }

      await wait(holdMs);
      if (skipTriggered) break;

      loreDisp.classList.remove("lore-shudder");

      if (i < loreLines.length - 1) {
        loreDisp.style.transition = `opacity ${FADE_MS}ms ease`;
        loreDisp.style.opacity    = "0";
        await wait(FADE_MS + 80);
        loreDisp.textContent = "";
      }
    }

    if (!skipTriggered) {
      await wait(600);
      revealSite();
    }
  })();
}

// ─── In-page boot log sequence (runs after cinematic, feeds directly into freq phase) ──
const LOG_LINES = [
  { text: "[  0.000] NULL kernel 5.19.0-null-rf #1 SMP", cls: "log-dim" },
  { text: "[  0.024] Command line: root=/dev/null rw quiet rf_core=1", cls: "log-dim" },
  { text: "[  0.312] LoRa transceiver: SX1276 detected on SPI0", cls: "log-ok" },
  { text: "[  0.450] Frequency synthesizer: LOCKED", cls: "log-ok" },
  { text: "[  0.512] Packet broker: UP", cls: "log-ok" },
  { text: "[  0.688] Mounting secure store ... OK", cls: "log-ok" },
  { text: "[  0.720] CRYPTO ENGINE: AES-256-GCM ready", cls: "log-ok" },
  { text: () => `[  0.811] ${ENV.TRUE_SHA1_AUTH || "cdb0c745bdc0e33d37619fae4b8cee43094168b7"}`, cls: "log-dim" },
  { text: "[  0.998] WARNING: anomalous multi-point transmission detected", cls: "log-warn" },
  { text: "[  1.101] Spoofed nodes active on band — CAUTION", cls: "log-warn" },
  { text: "[  1.220] NULL node contact ESTABLISHED", cls: "log-cyan" },
];

function runBootSequence() {
  const stream = document.getElementById("logStream");
  let delay = 0;

  LOG_LINES.forEach(({ text, cls }, i) => {
    const ms = delay + Math.random() * 50 + 25;
    delay = ms;

    setTimeout(() => {
      const resolved = typeof text === "function" ? text() : text;
      const span = document.createElement("span");
      span.className = cls;
      span.style.display = "block";
      span.textContent = resolved;
      stream.appendChild(span);
      stream.scrollTop = stream.scrollHeight;

      if (i === LOG_LINES.length - 1) {
        // Show mission banner then freq phase — no lore block
        setTimeout(() => {
          const banner = document.getElementById("missionBanner");
          if (banner) {
            banner.style.display = "block";
            banner.style.opacity = "0";
            banner.style.transition = "opacity 0.6s ease";
            requestAnimationFrame(() => {
              requestAnimationFrame(() => { banner.style.opacity = "1"; });
            });
          }
          setTimeout(showFreqPhase, 700);
        }, 400);
      }
    }, ms);
  });
}

function showFreqPhase() {
  const ph = document.getElementById("freqPhase");
  ph.classList.add("active");
  ph.style.opacity = "0";
  ph.style.transition = "opacity 0.5s";
  requestAnimationFrame(() => { ph.style.opacity = "1"; });
  document.getElementById("freqInput").focus();
}

// ─── RF Scan animation ────────────────────────────────────────────────────────
function buildSpectrum() {
  const el = document.getElementById("scanSpectrum");
  el.innerHTML = "";
  for (let i = 0; i < 60; i++) {
    const bar = document.createElement("div");
    bar.className = "spec-bar";
    const h = Math.random() * 85 + 5;
    bar.style.height = h + "%";
    bar.style.background = h > 60
      ? "rgba(95,240,255,0.6)"
      : "rgba(120,160,255,0.35)";
    el.appendChild(bar);
  }
}

function animateSpectrum() {
  const bars = document.querySelectorAll(".spec-bar");
  bars.forEach(b => {
    const h = Math.random() * 85 + 5;
    b.style.height = h + "%";
  });
}

// ─── Crypto helpers ───────────────────────────────────────────────────────────
const B32_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Encode(str) {
  const bytes = new TextEncoder().encode(str);
  let bits = 0, value = 0, out = "";
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += B32_CHARS[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += B32_CHARS[(value << (5 - bits)) & 31];
  while (out.length % 8) out += "=";
  return out;
}

function harmonicMean(a, b) { return (2 * a * b) / (a + b); }

function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return Math.abs(s) / 0xffffffff;
  };
}

function randAlnum(len, rng) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let s = "";
  for (let i = 0; i < len; i++) s += chars[Math.floor(rng() * chars.length)];
  return s;
}

function randEuropeCoords(rng) {
  const lat = 35 + rng() * (71 - 35);
  const lon = -10 + rng() * (40 - (-10));
  return { lat: lat.toFixed(6), lon: lon.toFixed(6) };
}

// ─── Packet generation ────────────────────────────────────────────────────────
const TRUE_FREQ   = 868.5;
const TRUE_AUTH   = "A86TFG";
const TRUE_SIG    = "HSGYS7N";
const TRUE_LAT    = "50.082553";
const TRUE_LON    = "14.428998";
const TRUE_COORDS = `${TRUE_LAT},${TRUE_LON}`;

function generatePackets(userFreq) {
  const freqFloat = parseFloat(userFreq);
  const seed = Math.floor(freqFloat * 1000);
  const rng = seededRandom(seed);

  const isCorrectFreq = Math.abs(freqFloat - TRUE_FREQ) < 0.001;
  const hm = harmonicMean(freqFloat, TRUE_FREQ);
  const authMatchesByHarmonic = Math.abs(hm % 3) < 0.001 || Math.abs((hm % 3) - 3) < 0.001;

  const pkts = [];

  if (isCorrectFreq) {
    const truePos = Math.floor(rng() * 3);
    for (let i = 0; i < 3; i++) {
      const ir = seededRandom(seed + i * 13);
      if (i === truePos) {
        pkts.push({
          id:   `PKT_${String(i + 1).padStart(3, "0")}`,
          freq: userFreq,
          data: base32Encode(TRUE_COORDS),
          auth: TRUE_AUTH,
          sig:  TRUE_SIG,
          rssi: -(40 + Math.floor(rng() * 30)) + " dBm",
          snr:  (rng() * 6 + 4).toFixed(1) + " dB",
        });
      } else {
        const { lat, lon } = randEuropeCoords(ir);
        pkts.push({
          id:   `PKT_${String(i + 1).padStart(3, "0")}`,
          freq: userFreq,
          data: base32Encode(`${lat},${lon}`),
          auth: authMatchesByHarmonic ? TRUE_AUTH : randAlnum(6, ir),
          sig:  randAlnum(7, ir),
          rssi: -(50 + Math.floor(ir() * 40)) + " dBm",
          snr:  (ir() * 4 - 2).toFixed(1) + " dB",
        });
      }
    }
  } else {
    for (let i = 0; i < 3; i++) {
      const ir = seededRandom(seed + i * 7);
      const { lat, lon } = randEuropeCoords(ir);
      pkts.push({
        id:   `PKT_${String(i + 1).padStart(3, "0")}`,
        freq: userFreq,
        data: base32Encode(`${lat},${lon}`),
        auth: authMatchesByHarmonic ? TRUE_AUTH : randAlnum(6, ir),
        sig:  randAlnum(7, ir),
        rssi: -(55 + Math.floor(ir() * 45)) + " dBm",
        snr:  (ir() * 5 - 3).toFixed(1) + " dB",
      });
    }
  }

  return pkts;
}

// ─── Scan handler ─────────────────────────────────────────────────────────────
async function startScan() {
  const raw = document.getElementById("freqInput").value.trim();
  const freq = parseFloat(raw);

  if (!raw || isNaN(freq) || freq < 100 || freq > 1100) {
    const fb = document.getElementById("freqFeedback");
    fb.textContent = "⚠  Invalid frequency. Range: 100 – 1100 MHz";
    fb.style.color = "var(--danger)";
    return;
  }

  const btn = document.getElementById("scanBtn");
  btn.disabled = true;
  const fb = document.getElementById("freqFeedback");
  fb.textContent = "";

  const anim = document.getElementById("scanAnim");
  anim.style.display = "block";
  buildSpectrum();
  const specInterval = setInterval(animateSpectrum, 120);

  appendLog(`\n[scan] Tuning to ${freq.toFixed(3)} MHz ...`, "log-cyan");
  await sleep(400);
  appendLog(`[scan] Sweeping band ...`, "");
  await sleep(600);
  appendLog(`[scan] Packet acquisition ...`, "");
  await sleep(700);

  clearInterval(specInterval);
  anim.style.display = "none";

  currentFreq = freq;
  packets = generatePackets(freq);

  appendLog(`[scan] ${packets.length} packets intercepted on ${freq.toFixed(3)} MHz`, "log-ok");
  appendLog(`[scan] Awaiting analyst identification...`, "");

  renderPackets(packets);
  btn.disabled = false;
}

// ─── Render packets ───────────────────────────────────────────────────────────
function renderPackets(pkts) {
  const grid = document.getElementById("packetGrid");
  grid.innerHTML = "";
  selectedPacket = null;

  pkts.forEach((pkt, idx) => {
    const card = document.createElement("div");
    card.className = "packet-card";
    card.dataset.idx = idx;
    card.innerHTML = `
      <div class="pkt-select-indicator">✓</div>
      <div class="pkt-header">
        <span class="pkt-id">${pkt.id}</span>
        <span class="pkt-rssi">RSSI ${pkt.rssi} · SNR ${pkt.snr}</span>
      </div>
      <div class="pkt-field">
        <span class="pkt-key">FREQ</span>
        <span class="pkt-val">${pkt.freq} MHz</span>
      </div>
      <div class="pkt-field">
        <span class="pkt-key">DATA</span>
        <span class="pkt-val" style="font-size:0.68rem;opacity:0.85;">${pkt.data}</span>
      </div>
      <div class="pkt-field">
        <span class="pkt-key">AUTH</span>
        <span class="pkt-val">${pkt.auth}</span>
      </div>
      <div class="pkt-field">
        <span class="pkt-key">SIG</span>
        <span class="pkt-val">${pkt.sig}</span>
      </div>
    `;
    card.addEventListener("click", () => selectPacket(card, idx));
    grid.appendChild(card);
  });

  const sec = document.getElementById("packetsSection");
  sec.style.display = "block";
  sec.style.opacity = "0";
  sec.style.transition = "opacity 0.4s";
  requestAnimationFrame(() => { sec.style.opacity = "1"; });

  document.getElementById("citySection").style.display = "block";
  renderAttempts();
}

function selectPacket(card, idx) {
  document.querySelectorAll(".packet-card").forEach(c => c.classList.remove("selected"));
  card.classList.add("selected");
  selectedPacket = idx;
}

// ─── City submission ──────────────────────────────────────────────────────────
async function submitCity() {
  const city = document.getElementById("cityInput").value.trim();
  if (!city) return;

  const btn = document.getElementById("cityBtn");
  const fb  = document.getElementById("cityFeedback");
  btn.disabled = true;
  fb.textContent = "Verifying...";
  fb.style.color = "var(--muted)";

  try {
    const res = await fetch("/api/submitCity", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest"
      },
      credentials: "include",
      body: JSON.stringify({ city })
    });

    const data = await res.json();

    if (data.correct) {
      fb.textContent = "✓ Correct.";
      fb.style.color = "var(--good)";
      appendLog(`\n[AUTH] City verified: ${city}`, "log-ok");
      appendLog(`[SIG]  Packet authenticated. Flag decrypted.`, "log-ok");
      setTimeout(() => showFlag(data.flag), 900);
    } else {
      attempts++;
      renderAttempts();
      fb.textContent = `✗ Incorrect city. ${data.error || ""}`;
      fb.style.color = "var(--danger)";
      appendLog(`[AUTH] City mismatch: "${city}" — attempt ${attempts}`, "log-warn");

      if (data.locked) {
        fb.textContent = "🔒 Account locked. Try again in 6 hours.";
        btn.disabled = true;
        return;
      }
      btn.disabled = false;
    }
  } catch {
    fb.textContent = "Network error — retry";
    fb.style.color = "var(--danger)";
    btn.disabled = false;
  }
}

function renderAttempts() {
  const el = document.getElementById("attemptDisplay");
  el.innerHTML = "";
  for (let i = 0; i < 3; i++) {
    const d = document.createElement("div");
    d.className = "att-dot" + (i < attempts ? " used" : "");
    el.appendChild(d);
  }
}

// ─── Flag reveal + 10s countdown popup ───────────────────────────────────────
function showFlag(flag) {
  const sec = document.getElementById("flagSection");
  document.getElementById("flagValue").textContent = flag || "FLAG{ARTICAL_LORAWAN_PKG_RCVD}";
  sec.style.display = "block";
  sec.scrollIntoView({ behavior: "smooth" });

  // Start the 10s countdown popup
  startCountdownPopup();
}

function startCountdownPopup() {
  const popup   = document.getElementById("countdown-popup");
  const bar     = document.getElementById("popupTimerBar");
  const numEl   = document.getElementById("popupTimerNum");

  popup.style.display = "block";

  const TOTAL = 10;
  let remaining = TOTAL;

  // Instantly set bar to full
  bar.style.transition = "none";
  bar.style.width = "100%";

  // Let a frame pass then start the animated shrink
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      bar.style.transition = `width ${TOTAL}s linear`;
      bar.style.width = "0%";
    });
  });

  const tick = setInterval(() => {
    remaining--;
    numEl.textContent = remaining;
    if (remaining <= 0) {
      clearInterval(tick);
      doSessionClearAndRedirect();
    }
  }, 1000);
}

async function doSessionClearAndRedirect() {
  // 1. Attempt to clear server-side session
  try {
    await fetch("/api/logout", {
      method: "POST",
      credentials: "include",
      headers: { "X-Requested-With": "XMLHttpRequest" }
    });
  } catch { /* best-effort */ }

  // 2. Clear all client-side storage
  try { localStorage.clear(); } catch { /* ignore */ }
  try { sessionStorage.clear(); } catch { /* ignore */ }

  // 3. Delete all cookies for this origin
  document.cookie.split(";").forEach(c => {
    const eqPos = c.indexOf("=");
    const name = eqPos > -1 ? c.substr(0, eqPos).trim() : c.trim();
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    // Also try subdomain and root path variants
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${location.hostname}`;
  });

  // 4. Try to purge cache via Cache API
  if ("caches" in window) {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    } catch { /* ignore */ }
  }

  // 5. Unregister any service workers
  if ("serviceWorker" in navigator) {
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(r => r.unregister()));
    } catch { /* ignore */ }
  }

  // 6. Redirect to index — force reload from server, no cache
  window.location.replace("/index.html");
}

function copyFlag() {
  const flag = document.getElementById("flagValue").textContent;
  navigator.clipboard.writeText(flag).then(() => {
    const fb = document.getElementById("flagCopyFb");
    fb.textContent = "Copied to clipboard.";
    fb.className = "copy-feedback ok";
    setTimeout(() => { fb.textContent = ""; fb.className = "copy-feedback"; }, 2000);
  });
}

// ─── Log helper ───────────────────────────────────────────────────────────────
function appendLog(text, cls) {
  const stream = document.getElementById("logStream");
  const span = document.createElement("span");
  span.className = cls || "";
  span.style.display = "block";
  span.textContent = text;
  stream.appendChild(span);
  stream.scrollTop = stream.scrollHeight;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ─── HIDDEN COMMAND: archivepull() ────────────────────────────────────────────
window.archivepull = async function () {
  console.log("%c[NULL] archivepull(); — fetching archive...", "color:#5ff0ff;font-family:monospace");
  try {
    const res = await fetch("/api/archivepull", {
      credentials: "include",
      headers: { "X-Requested-With": "XMLHttpRequest" }
    });
    if (!res.ok) {
      console.error("[NULL] Access denied — valid session required");
      return;
    }
    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const win  = window.open(url, "_blank");
    if (!win) {
      const a = document.createElement("a");
      a.href = url;
      a.download = "doc.pdf";
      a.click();
    }
    console.log("%c[NULL] Archive delivered.", "color:#6df5b8;font-family:monospace");
  } catch (e) {
    console.error("[NULL] archivepull failed:", e.message);
  }
};

console.log(
  "%cNULL // OPERATOR TERMINAL\n%cSession authenticated. Awaiting commands.",
  "color:#5ff0ff;font-size:14px;font-family:monospace;font-weight:bold",
  "color:#8090b8;font-family:monospace",
  "color:rgba(128,144,184,0.3);font-size:10px;font-family:monospace"
);
