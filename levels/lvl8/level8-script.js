document.addEventListener("DOMContentLoaded", () => {
  const loreBlock = document.getElementById("lore-block");
  const coreBlock = document.getElementById("core-block");
  const inputs = Array.from(document.querySelectorAll(".core-char"));
  const submitBtn = document.getElementById("core-submit");
  const feedback = document.getElementById("core-feedback");

  const loreSentences = [
    "You are one layer away from the core.",
    "Every fragment you recovered belonged to the same internal structure.",
    "Coordinates, primes, traces, and relays all converged here.",
    "NULL does not rely on simple locks.",
    "It persists in the way identical data is read differently by different observers.",
    "Recognize the center pattern and the node will open."
  ];

  let loreIndex = 0;
  let isChecking = false;

  function typeSentence(sentence, callback) {
    const line = document.createElement("div");
    line.className = "l8-lore-line";
    loreBlock.appendChild(line);

    let i = 0;
    const interval = setInterval(() => {
      line.textContent = sentence.slice(0, i + 1);
      i++;

      if (i >= sentence.length) {
        clearInterval(interval);
        if (callback) setTimeout(callback, 380);
      }
    }, 28);
  }

  function showNextSentence() {
    if (loreIndex >= loreSentences.length) {
      coreBlock.classList.remove("hidden");
      requestAnimationFrame(() => {
        coreBlock.classList.add("visible");
      });

      setTimeout(() => inputs[0].focus(), 250);
      return;
    }

    typeSentence(loreSentences[loreIndex], () => {
      loreIndex++;
      setTimeout(showNextSentence, 260);
    });
  }

  function getJoinedInput() {
    return inputs.map((inp) => (inp.value || "").toUpperCase()).join("");
  }

  function setInputsDisabled(disabled) {
    inputs.forEach((inp) => {
      inp.disabled = disabled;
    });
    submitBtn.disabled = disabled;
  }

  async function checkCore() {
    if (isChecking) return;

    const chars = inputs.map((inp) => (inp.value || "").toUpperCase());

    if (chars.some((c) => c === "")) {
      feedback.textContent = "all eight letters must be entered.";
      feedback.className = "core-feedback error";
      return;
    }

    const joined = getJoinedInput();
    isChecking = true;
    setInputsDisabled(true);

    feedback.textContent = "validating core sequence...";
    feedback.className = "core-feedback";

    setTimeout(async () => {
      try {
        const res = await fetch("/api/check-level8", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          credentials: "same-origin",
          body: JSON.stringify({ answer: joined })
        });

        const data = await res.json();

        if (res.ok && data.correct) {
          feedback.textContent = "core pattern accepted. transferring...";
          feedback.className = "core-feedback ok";

          setTimeout(() => {
            window.location.href = "/flag.html";
          }, 850);
        } else {
          feedback.textContent = "pattern rejected. this is not NULL's core.";
          feedback.className = "core-feedback error";

          setInputsDisabled(false);
          inputs[0].focus();
        }
      } catch (err) {
        console.error("Level 8 verification failed:", err);
        feedback.textContent = "gateway error";
        feedback.className = "core-feedback error";

        setInputsDisabled(false);
        inputs[0].focus();
      } finally {
        isChecking = false;
      }
    }, 700);
  }

  inputs.forEach((input, idx) => {
    input.addEventListener("input", (e) => {
      let val = e.target.value.toUpperCase().replace(/[^A-Z]/g, "");
      e.target.value = val.slice(0, 1);

      if (e.target.value && idx < inputs.length - 1) {
        inputs[idx + 1].focus();
        inputs[idx + 1].select();
      }
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && !e.target.value && idx > 0) {
        inputs[idx - 1].focus();
      }

      if (e.key === "ArrowLeft" && idx > 0) {
        inputs[idx - 1].focus();
      }

      if (e.key === "ArrowRight" && idx < inputs.length - 1) {
        inputs[idx + 1].focus();
      }

      if (e.key === "Enter") {
        checkCore();
      }
    });

    input.addEventListener("focus", () => input.select());
  });

  submitBtn.addEventListener("click", checkCore);

  showNextSentence();
});
