document.addEventListener("DOMContentLoaded", () => {
  const decryptBtn = document.getElementById("decrypt-btn");
  const logBox = document.getElementById("log-box");
  const statusP = document.getElementById("status-p");
  const statusQ = document.getElementById("status-q");
  const primeQ = document.getElementById("prime-q");

  const productInput = document.getElementById("product-input");
  const productSubmit = document.getElementById("product-submit");
  const productFeedback = document.getElementById("product-feedback");
  const flagPanel = document.getElementById("flag-panel");
  const flagBox = document.getElementById("flag-box");

  let decryptStarted = false;
  let isChecking = false;

  function appendLog(line, type = "info") {
    const el = document.createElement("div");
    el.className = "log-line log-" + type;
    el.textContent = line;
    logBox.appendChild(el);
    logBox.scrollTop = logBox.scrollHeight;
  }

  function unlockProductInput() {
    productInput.disabled = false;
    productSubmit.disabled = false;
    productInput.placeholder = "enter decimal product...";
    productInput.focus();
  }

  function runDecryptSequence() {
    if (decryptStarted) return;
    decryptStarted = true;
    decryptBtn.disabled = true;

    appendLog("[INIT] starting prime decryption sequence...");
    setTimeout(() => {
      appendLog("[INFO] loading prime register p...");
    }, 500);

    setTimeout(() => {
      appendLog("[INFO] loading prime register q...");
    }, 1200);

    setTimeout(() => {
      appendLog("[VERIFY] validating recovered prime set...");
    }, 1900);

    setTimeout(() => {
      appendLog("[WARN] integrity mismatch detected for q.", "warn");
      primeQ.classList.add("glitching");
    }, 2600);

    setTimeout(() => {
      appendLog("[ERROR] entropy overflow. prime q marked as corrupted.", "error");
      statusP.textContent = "[ OK ]";
      statusP.classList.add("status-ok");
      statusQ.textContent = "[ CORRUPTED ]";
      statusQ.classList.add("status-bad");
    }, 3400);

    setTimeout(() => {
      appendLog("[RECOVERY] searching backup nodes for intact q...", "recovery");
    }, 4100);

    setTimeout(() => {
      appendLog("[RECOVERY] relay pointer: https://mcsrvr.vercel.app/", "recovery");
    }, 4900);

    setTimeout(() => {
      appendLog("[READY] product verification interface unlocked.", "ok");
      unlockProductInput();
    }, 5700);
  }

  async function fetchFlag() {
    try {
      const res = await fetch("/api/get-level4-flag", {
        method: "GET",
        credentials: "same-origin"
      });

      const data = await res.json();

      if (res.ok && data.flag) {
        flagBox.textContent = data.flag;
        return true;
      }

      flagBox.textContent = "access token invalid";
      return false;
    } catch (err) {
      console.error("Failed to fetch flag:", err);
      flagBox.textContent = "failed to retrieve flag";
      return false;
    }
  }

  async function checkProduct() {
    if (isChecking) return;

    const raw = productInput.value.trim();

    if (!raw) {
      productFeedback.textContent = "input cannot be empty.";
      productFeedback.className = "product-feedback error";
      return;
    }

    if (!/^[0-9]+$/.test(raw)) {
      productFeedback.textContent = "only decimal digits are allowed.";
      productFeedback.className = "product-feedback error";
      return;
    }

    isChecking = true;
    productInput.disabled = true;
    productSubmit.disabled = true;
    productFeedback.textContent = "verifying product...";
    productFeedback.className = "product-feedback";

    try {
      const res = await fetch("/api/check-level4", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "same-origin",
        body: JSON.stringify({ product: raw })
      });

      const data = await res.json();

      if (res.ok && data.correct) {
        productFeedback.textContent = "correct product. access granted.";
        productFeedback.className = "product-feedback ok";

        flagPanel.classList.remove("hidden");
        flagPanel.classList.add("visible");

        const gotFlag = await fetchFlag();

        if (gotFlag) {
          appendLog("[ACCESS] product verified. gateway unlocked.", "ok");
        } else {
          appendLog("[ACCESS] verification succeeded, but flag retrieval failed.", "warn");
        }
      } else {
        productFeedback.textContent =
          "incorrect product. this node rejects unstable keys.";
        productFeedback.className = "product-feedback error";

        appendLog("[REJECT] submitted product failed verification.", "error");

        productInput.disabled = false;
        productSubmit.disabled = false;
        productInput.focus();
      }
    } catch (err) {
      console.error("Check failed:", err);
      productFeedback.textContent = "gateway error";
      productFeedback.className = "product-feedback error";

      appendLog("[ERROR] verification request failed.", "error");

      productInput.disabled = false;
      productSubmit.disabled = false;
      productInput.focus();
    } finally {
      isChecking = false;
    }
  }

  // --- Auth gate ---
  async function handleDecryptClick() {
    const code = prompt("enter initialization code to begin decryption:");

    if (code === null) return; // user cancelled

    decryptBtn.disabled = true;

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        runDecryptSequence();
      } else {
        appendLog("[AUTH] invalid initialization code. access denied.", "error");
        decryptBtn.disabled = false;
      }
    } catch (err) {
      console.error("Auth request failed:", err);
      appendLog("[AUTH] authentication request failed.", "error");
      decryptBtn.disabled = false;
    }
  }

  decryptBtn.addEventListener("click", handleDecryptClick);
  productSubmit.addEventListener("click", checkProduct);

  productInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") checkProduct();
  });
});