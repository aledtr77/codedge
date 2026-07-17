let initialized = false;

export default function initGeneratorGradienti() {
  if (initialized) return;
  initialized = true;

  const elements = {
    previewBox: document.getElementById("previewBox"),
    cssCode: document.getElementById("cssCode"),
    timelineTrack: document.getElementById("gradient-timeline-track"),
    handlesContainer: document.getElementById("gradient-handles-container"),
    stopsList: document.getElementById("stops-list"),
    btnAddStop: document.getElementById("btn-add-stop"),
    angleGroupContainer: document.getElementById("angleGroupContainer"),
    angleCompass: document.getElementById("angleCompass"),
    angleCompassHand: document.getElementById("angleCompassHand"),
    angleRange: document.getElementById("angleRange"),
    angleNum: document.getElementById("angleNum"),
    btnLinear: document.getElementById("btn-linear"),
    btnRadial: document.getElementById("btn-radial"),
    btnToggleMockup: document.getElementById("btn-toggle-mockup"),
    btnCopyCode: document.getElementById("btn-copy-code"),
    presetContainer: document.getElementById("preset-gradients-grid")
  };

  if (!elements.previewBox || !elements.timelineTrack || !elements.handlesContainer || !elements.stopsList) {
    console.error("[generatore-gradienti] Elementi fondamentali non trovati.");
    return;
  }

  const presets = [
    { name: "Aurora", type: "linear", angle: 45, stops: [{ color: "#00c6ff", position: 0 }, { color: "#0072ff", position: 100 }] },
    { name: "Sunset", type: "linear", angle: 90, stops: [{ color: "#ff7e5f", position: 0 }, { color: "#feb47b", position: 100 }] },
    { name: "Deep Space", type: "linear", angle: 135, stops: [{ color: "#000000", position: 0 }, { color: "#434343", position: 100 }] },
    { name: "Neon Glow", type: "linear", angle: 90, stops: [{ color: "#00f2fe", position: 0 }, { color: "#4facfe", position: 100 }] },
    { name: "Lime Mint", type: "linear", angle: 60, stops: [{ color: "#11998e", position: 0 }, { color: "#38ef7d", position: 100 }] },
    { name: "Cotton Candy", type: "linear", angle: 45, stops: [{ color: "#ff9a9e", position: 0 }, { color: "#fecfef", position: 99 }, { color: "#fecfef", position: 100 }] },
    { name: "Ocean Breeze", type: "linear", angle: 120, stops: [{ color: "#3a7bd5", position: 0 }, { color: "#3a6073", position: 100 }] },
    { name: "Melon Sunset", type: "linear", angle: 90, stops: [{ color: "#ff4e50", position: 0 }, { color: "#f9d423", position: 100 }] }
  ];

  const state = {
    gradientType: "linear",
    angle: 90,
    activeStopIndex: 0,
    stops: [
      { color: "#00c6ff", position: 0 },
      { color: "#0072ff", position: 100 }
    ],
    exportFormat: "css", // "css" or "tailwind"
    isDraggingCompass: false,
    draggedStopIndex: null,
    showMockup: true
  };

  initUI();
  bindEvents();
  updateUI();

  function initUI() {
    if (elements.presetContainer) {
      elements.presetContainer.innerHTML = "";
      presets.forEach((p) => {
        const el = document.createElement("button");
        el.type = "button";
        el.className = "preset";
        el.style.background = buildGradientCSSString(p.type, p.angle, p.stops);
        el.title = p.name;
        el.addEventListener("click", () => {
          state.gradientType = p.type;
          state.angle = p.angle;
          state.stops = JSON.parse(JSON.stringify(p.stops));
          state.activeStopIndex = 0;
          updateUI();
        });
        elements.presetContainer.appendChild(el);
      });
    }
  }

  function bindEvents() {
    elements.btnLinear.addEventListener("click", () => setGradientType("linear"));
    elements.btnRadial.addEventListener("click", () => setGradientType("radial"));

    elements.angleRange.addEventListener("input", (e) => {
      state.angle = parseInt(e.target.value, 10);
      updateUI();
    });

    elements.angleNum.addEventListener("input", (e) => {
      let val = parseInt(e.target.value, 10);
      if (isNaN(val)) val = 0;
      val = Math.max(0, Math.min(360, val));
      state.angle = val;
      updateUI();
    });

    document.querySelectorAll(".quick-angle-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.angle = parseInt(btn.dataset.angle, 10);
        updateUI();
      });
    });

    elements.angleCompass.addEventListener("mousedown", (e) => {
      e.preventDefault();
      state.isDraggingCompass = true;
      rotateCompassToClientCoords(e.clientX, e.clientY);
    });

    elements.angleCompass.addEventListener("touchstart", (e) => {
      state.isDraggingCompass = true;
      if (e.touches[0]) rotateCompassToClientCoords(e.touches[0].clientX, e.touches[0].clientY);
    });

    elements.timelineTrack.addEventListener("click", (e) => {
      if (e.target.classList.contains("gradient-handle")) return;
      const rect = elements.timelineTrack.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const pct = Math.round((x / rect.width) * 100);
      const clampedPct = Math.max(0, Math.min(100, pct));

      addStopAtPosition(clampedPct);
    });

    elements.btnAddStop.addEventListener("click", () => {
      // Find a free position around 50%
      let position = 50;
      while (state.stops.some(s => s.position === position) && position < 100) {
        position += 5;
      }
      if (position > 100) position = 50;

      addStopAtPosition(position);
    });

    window.addEventListener("mousemove", onGlobalMove);
    window.addEventListener("touchmove", onGlobalMove, { passive: false });
    window.addEventListener("mouseup", onGlobalEnd);
    window.addEventListener("touchend", onGlobalEnd);

    elements.btnToggleMockup.addEventListener("click", () => {
      state.showMockup = !state.showMockup;
      const card = document.querySelector(".mockup-ui-card");
      if (card) {
        card.classList.toggle("is-hidden", !state.showMockup);
      }
    });

    document.querySelectorAll(".export-tab-btn").forEach((tab) => {
      tab.addEventListener("click", () => {
        document.querySelectorAll(".export-tab-btn").forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        state.exportFormat = tab.dataset.format;
        updateCodeOutput();
      });
    });

    elements.btnCopyCode.addEventListener("click", copyOutputToClipboard);
  }

  function setGradientType(type) {
    state.gradientType = type;
    elements.btnLinear.classList.toggle("active", type === "linear");
    elements.btnRadial.classList.toggle("active", type === "radial");
    elements.angleGroupContainer.classList.toggle("active", type === "linear");
    updateUI();
  }

  function addStopAtPosition(pct) {
    const color = getColorAtPercentage(pct);
    const newStop = { color, position: pct };
    state.stops.push(newStop);
    state.stops.sort((a, b) => a.position - b.position);
    state.activeStopIndex = state.stops.indexOf(newStop);
    updateUI();
  }

  function onGlobalMove(e) {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    if (state.draggedStopIndex !== null) {
      if (e.touches) e.preventDefault(); // prevents page scroll while dragging
      const rect = elements.timelineTrack.getBoundingClientRect();
      const x = clientX - rect.left;
      let pct = Math.round((x / rect.width) * 100);
      pct = Math.max(0, Math.min(100, pct));

      state.stops[state.draggedStopIndex].position = pct;

      // Keep stops sorted while preserving the selected stop identity
      const draggedStop = state.stops[state.draggedStopIndex];
      state.stops.sort((a, b) => a.position - b.position);
      state.draggedStopIndex = state.stops.indexOf(draggedStop);
      state.activeStopIndex = state.draggedStopIndex;

      updateUI();
    } else if (state.isDraggingCompass) {
      if (e.touches) e.preventDefault();
      rotateCompassToClientCoords(clientX, clientY);
    }
  }

  function onGlobalEnd() {
    state.draggedStopIndex = null;
    state.isDraggingCompass = false;
  }

  function rotateCompassToClientCoords(clientX, clientY) {
    const rect = elements.angleCompass.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = clientX - centerX;
    const dy = clientY - centerY;

    let angleDeg = Math.round((Math.atan2(dy, dx) * 180) / Math.PI) + 90;
    if (angleDeg < 0) angleDeg += 360;
    
    state.angle = angleDeg;
    updateUI();
  }

  function updateUI() {
    const cssGradient = buildGradientCSSString(state.gradientType, state.angle, state.stops);
    elements.previewBox.style.background = cssGradient;

    // The timeline track is always rendered left-to-right linear, whatever the
    // gradient type
    elements.timelineTrack.style.background = buildGradientCSSString("linear", 90, state.stops);

    renderHandles();

    elements.angleRange.value = state.angle;
    elements.angleNum.value = state.angle;
    elements.angleCompassHand.style.transform = `rotate(${state.angle}deg)`;

    renderStopsList();

    updateCodeOutput();
  }

  function renderHandles() {
    elements.handlesContainer.innerHTML = "";
    state.stops.forEach((stop, index) => {
      const handle = document.createElement("div");
      handle.className = "gradient-handle";
      if (index === state.activeStopIndex) {
        handle.classList.add("is-active");
      }
      handle.style.left = `${stop.position}%`;
      handle.style.backgroundColor = stop.color;

      handle.addEventListener("mousedown", (e) => {
        e.preventDefault();
        e.stopPropagation();
        state.activeStopIndex = index;
        state.draggedStopIndex = index;
        updateUI();
      });

      handle.addEventListener("touchstart", (e) => {
        e.stopPropagation();
        state.activeStopIndex = index;
        state.draggedStopIndex = index;
        updateUI();
      });

      handle.addEventListener("click", (e) => {
        e.stopPropagation();
        state.activeStopIndex = index;
        updateUI();
      });

      elements.handlesContainer.appendChild(handle);
    });
  }

  function renderStopsList() {
    elements.stopsList.innerHTML = "";
    state.stops.forEach((stop, index) => {
      const row = document.createElement("div");
      row.className = `stop-row ${index === state.activeStopIndex ? "is-active" : ""}`;

      row.innerHTML = `
        <div class="stop-row-left">
          <div class="color-picker-wrapper">
            <input type="color" class="row-color-input" value="${stop.color}">
            <span class="row-color-hex">${stop.color.toUpperCase()}</span>
          </div>
        </div>
        <div class="stop-row-middle">
          <input type="range" class="row-position-slider" min="0" max="100" value="${stop.position}">
          <span class="row-position-val">${stop.position}%</span>
        </div>
        <div class="stop-row-right">
          <button type="button" class="btn-delete-row-stop" title="Elimina questo colore">
            <i class="fas fa-trash-alt" aria-hidden="true"></i>
          </button>
        </div>
      `;

      row.addEventListener("click", () => {
        if (state.activeStopIndex !== index) {
          state.activeStopIndex = index;
          updateUI();
        }
      });

      const picker = row.querySelector(".row-color-input");
      picker.addEventListener("input", (e) => {
        state.stops[index].color = e.target.value;
        updateUI();
      });

      const slider = row.querySelector(".row-position-slider");
      slider.addEventListener("input", (e) => {
        const pct = parseInt(e.target.value, 10);
        state.stops[index].position = pct;

        // Re-sort, keeping the same object selected
        const activeStop = state.stops[state.activeStopIndex];
        state.stops.sort((a, b) => a.position - b.position);
        state.activeStopIndex = state.stops.indexOf(activeStop);

        updateUI();
      });

      const delBtn = row.querySelector(".btn-delete-row-stop");
      if (state.stops.length <= 2) {
        delBtn.disabled = true;
      }
      delBtn.addEventListener("click", (e) => {
        e.stopPropagation(); // avoid selecting the deleted row
        state.stops.splice(index, 1);
        state.activeStopIndex = 0;
        updateUI();
      });

      elements.stopsList.appendChild(row);
    });
  }

  function updateCodeOutput() {
    if (state.exportFormat === "css") {
      const cssString = buildGradientCSSString(state.gradientType, state.angle, state.stops);
      elements.cssCode.textContent = `background: ${cssString};`;
    } else {
      // Tailwind arbitrary-value format
      const stopsString = state.stops.map(s => `${s.color}_${s.position}%`).join(",_");
      if (state.gradientType === "linear") {
        elements.cssCode.textContent = `class="bg-[linear-gradient(${state.angle}deg,_${stopsString})]"`;
      } else {
        elements.cssCode.textContent = `class="bg-[radial-gradient(circle,_${stopsString})]"`;
      }
    }
  }

  function buildGradientCSSString(type, angle, stops) {
    const stopsStr = stops.map(s => `${s.color} ${s.position}%`).join(", ");
    if (type === "linear") {
      return `linear-gradient(${angle}deg, ${stopsStr})`;
    }
    return `radial-gradient(circle, ${stopsStr})`;
  }

  function getColorAtPercentage(pct) {
    if (state.stops.length === 0) return "#3b82f6";
    if (pct <= state.stops[0].position) return state.stops[0].color;
    if (pct >= state.stops[state.stops.length - 1].position) return state.stops[state.stops.length - 1].color;

    let leftStop = state.stops[0];
    let rightStop = state.stops[state.stops.length - 1];

    for (let i = 0; i < state.stops.length - 1; i++) {
      if (pct >= state.stops[i].position && pct <= state.stops[i + 1].position) {
        leftStop = state.stops[i];
        rightStop = state.stops[i + 1];
        break;
      }
    }

    const range = rightStop.position - leftStop.position;
    const factor = range === 0 ? 0 : (pct - leftStop.position) / range;

    return interpolateHex(leftStop.color, rightStop.color, factor);
  }

  function interpolateHex(color1, color2, factor) {
    const r1 = parseInt(color1.slice(1, 3), 16);
    const g1 = parseInt(color1.slice(3, 5), 16);
    const b1 = parseInt(color1.slice(5, 7), 16);

    const r2 = parseInt(color2.slice(1, 3), 16);
    const g2 = parseInt(color2.slice(3, 5), 16);
    const b2 = parseInt(color2.slice(5, 7), 16);

    const r = Math.round(r1 + factor * (r2 - r1));
    const g = Math.round(g1 + factor * (g2 - g1));
    const b = Math.round(b1 + factor * (b2 - b1));

    const toHex = c => c.toString(16).padStart(2, "0");
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  function copyOutputToClipboard() {
    const text = elements.cssCode.textContent || "";
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(showCopyTooltip);
    } else {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.top = "-1000px";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        showCopyTooltip();
      } catch (err) {
        console.error("Copia fallita:", err);
      }
      document.body.removeChild(ta);
    }
  }

  function showCopyTooltip() {
    let tooltip = elements.previewBox.querySelector(".tooltip");
    if (!tooltip) {
      const container = document.createElement("div");
      container.className = "tooltip-container";
      tooltip = document.createElement("span");
      tooltip.className = "tooltip";
      tooltip.textContent = "Codice copiato!";
      container.appendChild(tooltip);
      elements.previewBox.appendChild(container);
    }

    tooltip.style.visibility = "visible";
    tooltip.style.opacity = "1";

    setTimeout(() => {
      tooltip.style.visibility = "hidden";
      tooltip.style.opacity = "0";
    }, 2000);
  }
}
