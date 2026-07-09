let HINTS = [];
let hintIndex = 0;

// Load hints from server
fetch("/api/get-level1-hints")
  .then(r => r.json())
  .then(data => {
    if (Array.isArray(data.hints)) HINTS = data.hints;
  })
  .catch(() => {});

window.hint = function () {
  if (hintIndex >= HINTS.length) {
    console.log("%cNo further hints.", "color:#ff8a9a");
    return;
  }

  console.log(
    "%cHINT " + (hintIndex + 1) + ": " + HINTS[hintIndex],
    "color:#5ff0ff; font-family: monospace;"
  );

  hintIndex++;
};

console.log("%c[system] unknown callable detected", "color:#64748b");

document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("ghostCanvas");
  const ctx = canvas.getContext("2d");

  const hint = document.getElementById("bottom-hint");
  const input = document.getElementById("answer-input");
  const submitBtn = document.getElementById("submit-answer");
  const feedback = document.getElementById("answer-feedback");

  function setupCanvas() {
    const w = Math.min(window.innerWidth * 0.95, 1400);
    const h = 260;
    canvas.width = w;
    canvas.height = h;
  }

  setupCanvas();

  window.addEventListener("resize", () => {
    setupCanvas();
    if (window._morseString) drawMorse(window._morseString);
  });

  function drawMorse(morseSequence) {
    ctx.fillStyle = "#020617";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#0b1120";

    const dotWidth = 8;
    const dashWidth = 24;
    const symbolHeight = 6;
    const symbolGap = 8;
    const letterGap = 18;
    const lineGap = 26;

    const marginX = 32;
    const marginY = 40;
    const maxWidth = canvas.width - marginX * 2;

    let x = marginX;
    let y = marginY;

    const drawDot = () => {
      ctx.fillRect(x, y, dotWidth, symbolHeight);
      x += dotWidth + symbolGap;
    };

    const drawDash = () => {
      ctx.fillRect(x, y, dashWidth, symbolHeight);
      x += dashWidth + symbolGap;
    };

    const newLetter = () => {
      x += letterGap;
      if (x > maxWidth) {
        x = marginX;
        y += lineGap;
      }
    };

    morseSequence.trim().split(/\s+/).forEach(code => {
      for (const symbol of code) {
        if (symbol === ".") drawDot();
        else if (symbol === "-") drawDash();
      }
      newLetter();
    });
  }

  async function loadMorse() {
    try {
      const res = await fetch("./text.json");
      const data = await res.json();

      const morseSequence = (data.morse || "").trim();
      window._morseString = morseSequence;

      drawMorse(morseSequence);
    } catch (err) {
      console.error("Failed to load text.json:", err);
    }
  }

  async function checkAnswer() {
    const user = input.value.trim();

    if (!user) {
      feedback.textContent = "input cannot be empty";
      feedback.className = "error";
      return;
    }

    try {
      const res = await fetch("/api/check-level1", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer: user })
      });

      const data = await res.json();

      if (res.ok && data.correct) {
        feedback.textContent = "access granted";
        feedback.className = "ok";

        setTimeout(() => {
          window.location.href = "/flag.html";
        }, 800);
      } else {
        feedback.textContent = "access denied";
        feedback.className = "error";
      }
    } catch (err) {
      console.error(err);
      feedback.textContent = "server error";
      feedback.className = "error";
    }
  }

  submitBtn.addEventListener("click", checkAnswer);
  input.addEventListener("keydown", e => {
    if (e.key === "Enter") checkAnswer();
  });

  // Show hint function - displays tiny text
  window.showHint = function() {
    let hintElement = document.getElementById("tiny-hint");
    if (!hintElement) {
      hintElement = document.createElement("div");
      hintElement.id = "tiny-hint";
      hintElement.textContent = "hint();";
      hintElement.style.cssText = "position: fixed; bottom: 10px; right: 10px; font-size: 8px; color: rgba(95, 240, 255, 0.3); font-family: monospace; pointer-events: none;";
      document.body.appendChild(hintElement);
    }
  };

  setTimeout(() => {
    setInterval(showHint, 15000);
    showHint(); // Show immediately after 1 minute
  }, 60000);

  // disable right click
  document.addEventListener("contextmenu", e => e.preventDefault());

  loadMorse();
});


// ===============================
// 🔒 EXTRA CONTROLS (NEW)
// ===============================

// Prevent text selection
document.addEventListener("selectstart", e => e.preventDefault());

// Prevent copy, paste, cut, save, view-source
document.addEventListener("keydown", (e) => {
  const key = e.key.toLowerCase();

  // Allow DevTools shortcuts:
  if (e.key === "F12") return;
  if (e.ctrlKey && e.shiftKey && ["i", "j", "c"].includes(key)) return;

  // Block dangerous combos
  if (
    e.ctrlKey &&
    ["c", "v", "u", "s", "p", "x"].includes(key)
  ) {
    e.preventDefault();
  }
});
