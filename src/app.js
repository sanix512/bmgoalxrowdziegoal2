    let last = { current: 0, max: 1, label: "" };
    let originalGoalText = "";
    let firstRun = true;
    let goalCompletedShown = false;
    let confettiTimer = null;

    async function fetchData() {
      try {
        const res = await fetch("https://docs.google.com/spreadsheets/d/13tn2xPrZXoen_4Mi05njiMuwjRQVbMrFm5ul-EWzTfg/export?format=csv&gid=0&cb=" + Date.now());
        const raw = await res.text();

        const lines = raw.trim().split("\n");
        const [currentStr, maxStr, goalLabel, toggleVal] = lines[1].split(",");

        // 🔹 Hide/Show container depending on D2
        const container = document.querySelector(".progress-container");
        if (toggleVal && toggleVal.trim().toLowerCase() === "off") {
          container.style.visibility = "hidden";
        } else {
          container.style.visibility = "visible";
        }

        const current = parseFloat(currentStr) || 0;
        const max = Math.max(1, parseFloat(maxStr) || 1);
        const trimmedLabel = goalLabel.trim();
        const labelChanged = trimmedLabel !== last.label;

        if (firstRun) {
          document.getElementById("goal-text").textContent = trimmedLabel;
          document.getElementById("end-number").textContent = `${current} / ${max}`;
          updateProgress(current, max);
          last = { current, max, label: trimmedLabel };
          originalGoalText = trimmedLabel;
          firstRun = false;
          return;
        }

        // If goal is complete
        if (current >= max) {
          if (!goalCompletedShown) {
            goalCompletedShown = true;
            showCompletion();
          }
          // freeze UI while complete, ignore number updates
          last = { current, max, label: trimmedLabel };
          return;
        }

        // Not complete anymore → exit completion if was active
        if (goalCompletedShown) {
          exitCompletion(trimmedLabel, current, max);
        }

        normalUpdates(current, max, trimmedLabel);
        last = { current, max, label: trimmedLabel };

      } catch (e) {
        console.error("Error reading Google Sheet CSV", e);
      }
    }

    function normalUpdates(current, max, trimmedLabel) {
      if (trimmedLabel !== last.label) {
        originalGoalText = trimmedLabel;
        document.getElementById("goal-text").textContent = trimmedLabel;
        updateProgress(current, max);
      } else if (current > last.current) {
        const goalTextEl = document.getElementById("goal-text");
        const oldWidth = goalTextEl.offsetWidth;
        goalTextEl.style.minWidth = oldWidth + "px";
        showThankYou(originalGoalText, () => {
          goalTextEl.style.minWidth = "";
        });
        updateProgress(current, max);
      } else {
        updateProgress(current, max);
      }
    }

    function exitCompletion(label, current, max) {
      goalCompletedShown = false;
      clearConfetti();
      const goalTextEl = document.getElementById("goal-text");
      const endEl = document.getElementById("end-number");
      goalTextEl.textContent = label;
      endEl.textContent = `${current} / ${max}`;
      updateProgress(current, max);
    }

    function animateNumber(from, to, duration, cb) {
      const start = performance.now();
      function step(now) {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        const val = from + (to - from) * eased;
        cb(val);
        if (t < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    function updateProgress(current, max) {
      const percent = Math.min(100, (current / max) * 100);
      document.getElementById("fill-bar").style.width = percent + "%";

      const prevCurrent = last.current;
      animateNumber(prevCurrent, current, 600, v => {
        document.getElementById("end-number").textContent =
          `${Math.round(v)} / ${max}`;
      });
    }

    function typeText(element, text, speed, callback) {
      element.textContent = "";
      let i = 0;
      function typeChar() {
        if (i <= text.length) {
          element.textContent = text.substring(0, i);
          i++;
          setTimeout(typeChar, speed);
        } else if (callback) callback();
      }
      typeChar();
    }

    function showThankYou(goalLabel, onDone) {
      const goalTextEl = document.getElementById("goal-text");
      typeText(goalTextEl, "Thank You!", 80, () => {
        setTimeout(() => {
          typeText(goalTextEl, goalLabel, 80, () => {
            if (onDone) onDone();
          });
        }, 1500);
      });
    }

    function showCompletion() {
      const container = document.querySelector(".progress-container");
      const goalTextEl = document.getElementById("goal-text");

      document.getElementById("fill-bar").style.width = "100%";
      document.getElementById("end-number").textContent = "";

      typeText(goalTextEl, "Thank You for The Support!", 80);

      clearConfetti();

      const canvas = document.createElement("canvas");
      canvas.className = "confetti";
      canvas.style.position = "absolute";
      canvas.style.top = "0";
      canvas.style.left = "0";
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      canvas.style.pointerEvents = "none";
      canvas.style.zIndex = "0";
      canvas.width = container.offsetWidth;
      canvas.height = container.offsetHeight;

      container.insertBefore(canvas, container.children[1]);

      const ctx = canvas.getContext("2d");
      const colors = ["#FF4B4B", "#FFD93D", "#4BFF88", "#4BD8FF", "#D14BFF", "#FF9A4B"];
      const confetti = [];

      for (let i = 0; i < 40; i++) {
        confetti.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          r: Math.random() * 4 + 2,
          dx: (Math.random() - 0.5) * 1.5,
          dy: (Math.random() - 0.5) * 1.5,
          color: colors[Math.floor(Math.random() * colors.length)]
        });
      }

      function drawConfetti() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        confetti.forEach(c => {
          ctx.beginPath();
          ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
          ctx.fillStyle = c.color;
          ctx.fill();
        });
      }

      function updateConfetti() {
        confetti.forEach(c => {
          c.x += c.dx;
          c.y += c.dy;
          if (c.x - c.r < 0) { c.x = c.r; c.dx *= -1; }
          if (c.x + c.r > canvas.width) { c.x = canvas.width - c.r; c.dx *= -1; }
          if (c.y - c.r < 0) { c.y = c.r; c.dy *= -1; }
          if (c.y + c.r > canvas.height) { c.y = canvas.height - c.r; c.dy *= -1; }
        });
      }

      confettiTimer = setInterval(() => {
        drawConfetti();
        updateConfetti();
      }, 33);
    }

    function clearConfetti() {
      if (confettiTimer) {
        clearInterval(confettiTimer);
        confettiTimer = null;
      }
      const container = document.querySelector(".progress-container");
      const oldCanvas = container.querySelector("canvas.confetti");
      if (oldCanvas) oldCanvas.remove();
    }

    fetchData();
    setInterval(fetchData, 10000);
