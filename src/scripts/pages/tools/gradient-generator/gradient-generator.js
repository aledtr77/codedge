import { t } from "@/i18n/ui.js";
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

  // Every stop carries an id, and the array is never re-sorted.
  //
  // Sorting it on each move is what made a stop change places with its
  // neighbour mid-drag: the row under the pointer began controlling a different
  // colour. Order is a rendering question — the CSS is emitted sorted, and the
  // list shows the rows in position order through flexbox — so the identity a
  // drag holds on to stays put.
  let nextStopId = 1;
  const makeStop = (color, position) => ({ id: nextStopId++, color, position });

  const state = {
    gradientType: "linear",
    angle: 90,
    activeStopId: null,
    stops: [makeStop("#00c6ff", 0), makeStop("#0072ff", 100)],
    exportFormat: "css", // "css" or "tailwind"
    isDraggingCompass: false,
    draggedStopId: null,
    showMockup: true
  };
  state.activeStopId = state.stops[0].id;

  const sortedStops = () => [...state.stops].sort((a, b) => a.position - b.position);
  const stopById = (id) => state.stops.find((stop) => stop.id === id) || null;

  // The nodes standing in for each stop, kept by id. Handles and rows are
  // created when a stop appears and removed when it goes; everything in between
  // is a value written to a node that stays where it is.
  //
  // Both lists used to be rebuilt from innerHTML on every pointer move, which
  // destroyed the control under the pointer: dragging a position slider moved
  // it one step and then died, because the slider being dragged no longer
  // existed. The same rebuild ran on every frame of a handle drag, which is why
  // the tool's main interaction ran at 17fps.
  const handles = new Map();
  const rows = new Map();

  // A mouse reports more often than the screen redraws — 125Hz hardware sends
  // two moves per frame — and each one used to run a full update. Pointer input
  // asks for a frame instead, so the work happens once per frame at most.
  let updateScheduled = false;
  function requestUpdate() {
    if (updateScheduled) return;
    updateScheduled = true;
    requestAnimationFrame(() => {
      updateScheduled = false;
      updateUI();
    });
  }

  const isDragging = () => state.draggedStopId !== null || state.isDraggingCompass;

  // Declared with the rest of the state it belongs to: updateUI() runs during
  // init, and anything it reaches has to exist by then.
  let codeTimer = null;

  // What was last written to each surface, kept in JavaScript rather than in a
  // data- attribute: caching the value on the node means writing a long string
  // into the DOM on every frame of a drag, which is the cost the cache exists
  // to avoid.
  let paintedPreview = "";
  let paintedTrack = "";

  initUI();
  bindEvents();
  updateUI();

  // The stop list is labelled from t(), and the code box holds a value this
  // tool computes — which the language switch overwrites with the placeholder
  // the page was served with, because both sides look like plain text to it.
  // Redrawing from state puts the reader's own gradient back, in the new
  // language.
  window.addEventListener("codedge:lang-changed", updateUI);

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
          state.stops = p.stops.map((stop) => makeStop(stop.color, stop.position));
          state.activeStopId = state.stops[0].id;
          setGradientType(p.type);
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
      requestUpdate();
    });

    elements.angleRange.addEventListener("change", updateUI);

    // An empty field is a field being typed into, not an angle of zero: forcing
    // the value back on every keystroke meant a backspace became "0" before the
    // next digit arrived, and the field could never be cleared and retyped.
    elements.angleNum.addEventListener("input", (e) => {
      if (e.target.value.trim() === "") return;
      const parsed = parseInt(e.target.value, 10);
      if (Number.isNaN(parsed)) return;
      state.angle = Math.max(0, Math.min(360, parsed));
      updateUI();
    });

    elements.angleNum.addEventListener("blur", () => {
      elements.angleNum.value = state.angle;
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
      if (card) card.classList.toggle("is-hidden", !state.showMockup);
      // A toggle that never reports its state reads as a button that did
      // nothing to anyone not looking at the card.
      elements.btnToggleMockup.setAttribute("aria-pressed", String(state.showMockup));
    });
    elements.btnToggleMockup.setAttribute("aria-pressed", String(state.showMockup));

    document.querySelectorAll(".export-tab-btn").forEach((tab) => {
      tab.setAttribute("aria-pressed", String(tab.dataset.format === state.exportFormat));
      tab.addEventListener("click", () => {
        state.exportFormat = tab.dataset.format;
        document.querySelectorAll(".export-tab-btn").forEach((other) => {
          const on = other.dataset.format === state.exportFormat;
          other.classList.toggle("active", on);
          other.setAttribute("aria-pressed", String(on));
        });
        updateCodeOutput();
      });
    });

    elements.btnCopyCode.addEventListener("click", copyOutputToClipboard);
  }

  function setGradientType(type) {
    state.gradientType = type;
    elements.btnLinear.classList.toggle("active", type === "linear");
    elements.btnRadial.classList.toggle("active", type === "radial");
    elements.btnLinear.setAttribute("aria-pressed", String(type === "linear"));
    elements.btnRadial.setAttribute("aria-pressed", String(type === "radial"));
    elements.angleGroupContainer.classList.toggle("active", type === "linear");
    updateUI();
  }

  function addStopAtPosition(pct) {
    const stop = makeStop(getColorAtPercentage(pct), pct);
    state.stops.push(stop);
    state.activeStopId = stop.id;
    updateUI();
  }

  function onGlobalMove(e) {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    if (state.draggedStopId !== null) {
      if (e.touches) e.preventDefault(); // prevents page scroll while dragging
      const stop = stopById(state.draggedStopId);
      if (!stop) return;

      const rect = elements.timelineTrack.getBoundingClientRect();
      const pct = Math.round(((clientX - rect.left) / rect.width) * 100);
      const next = Math.max(0, Math.min(100, pct));
      if (next === stop.position) return;   // the pointer moved, the value did not

      stop.position = next;
      state.activeStopId = stop.id;
      requestUpdate();
    } else if (state.isDraggingCompass) {
      if (e.touches) e.preventDefault();
      rotateCompassToClientCoords(clientX, clientY);
    }
  }

  function onGlobalEnd() {
    const wasDragging = isDragging();
    state.draggedStopId = null;
    state.isDraggingCompass = false;
    // Whatever was held back for the drag lands now.
    if (wasDragging) updateUI();
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
    requestUpdate();
  }

  function updateUI() {
    const cssGradient = buildGradientCSSString(state.gradientType, state.angle, state.stops);
    if (paintedPreview !== cssGradient) {
      elements.previewBox.style.background = cssGradient;
      paintedPreview = cssGradient;
    }

    // The timeline track is always rendered left-to-right linear, whatever the
    // gradient type — so it only changes when a colour or a position does, not
    // when the angle does.
    const trackGradient = buildGradientCSSString("linear", 90, state.stops);
    if (paintedTrack !== trackGradient) {
      elements.timelineTrack.style.background = trackGradient;
      paintedTrack = trackGradient;
    }

    syncHandles();

    // Never while it is being typed into or dragged: writing the value back on
    // every keystroke is what stopped the field being cleared — a backspace
    // became "0" before the next digit could be typed.
    if (document.activeElement !== elements.angleRange) elements.angleRange.value = state.angle;
    if (document.activeElement !== elements.angleNum) elements.angleNum.value = state.angle;
    elements.angleCompassHand.style.transform = `rotate(${state.angle}deg)`;

    syncStopRows();
    scheduleCodeOutput();
  }

  // Rewriting the export block costs 9ms of frame time on top of the two
  // gradients a drag already repaints — measured — and nobody reads the code
  // box while dragging a handle. It catches up on a pause, and always before
  // anything reads it.
  function scheduleCodeOutput() {
    if (!isDragging()) {
      flushCodeOutput();
      return;
    }
    if (codeTimer) return;
    codeTimer = window.setTimeout(() => {
      codeTimer = null;
      updateCodeOutput();
    }, 120);
  }

  function flushCodeOutput() {
    window.clearTimeout(codeTimer);
    codeTimer = null;
    updateCodeOutput();
  }

  function syncHandles() {
    for (const [id, handle] of handles) {
      if (!stopById(id)) {
        handle.remove();
        handles.delete(id);
      }
    }

    for (const stop of state.stops) {
      let handle = handles.get(stop.id);
      if (!handle) {
        handle = document.createElement("div");
        handle.className = "gradient-handle";

        const grab = (e) => {
          e.stopPropagation();
          if (e.type === "mousedown") e.preventDefault();
          state.activeStopId = stop.id;
          state.draggedStopId = stop.id;
          updateUI();
        };
        handle.addEventListener("mousedown", grab);
        handle.addEventListener("touchstart", grab, { passive: true });
        handle.addEventListener("click", (e) => {
          e.stopPropagation();
          state.activeStopId = stop.id;
          updateUI();
        });

        handles.set(stop.id, handle);
        elements.handlesContainer.appendChild(handle);
      }

      // Written only when it changed. A drag runs these sixty times a second,
      // and an assignment that says nothing new still costs the engine a look.
      const left = `${stop.position}%`;
      if (handle.style.left !== left) handle.style.left = left;
      if (handle.painted !== stop.color) {
        handle.style.backgroundColor = stop.color;
        handle.painted = stop.color;
      }
      handle.classList.toggle("is-active", stop.id === state.activeStopId);
    }
  }

  function syncStopRows() {
    for (const [id, row] of rows) {
      if (!stopById(id)) {
        row.element.remove();
        rows.delete(id);
      }
    }

    const order = new Map(sortedStops().map((stop, index) => [stop.id, index]));

    for (const stop of state.stops) {
      let row = rows.get(stop.id);
      if (!row) {
        row = buildStopRow(stop);
        rows.set(stop.id, row);
        elements.stopsList.appendChild(row.element);
      }

      // Position order is shown through flexbox rather than by moving nodes,
      // so a stop dragged past its neighbour never pulls its own row out from
      // under the pointer.
      const rank = String(order.get(stop.id));
      if (row.element.style.order !== rank) row.element.style.order = rank;
      row.element.classList.toggle("is-active", stop.id === state.activeStopId);

      if (row.picker.value !== stop.color) row.picker.value = stop.color;
      const hex = stop.color.toUpperCase();
      if (row.hex.textContent !== hex) row.hex.textContent = hex;
      const position = String(stop.position);
      if (document.activeElement !== row.slider && row.slider.value !== position) row.slider.value = position;
      const label = `${stop.position}%`;
      if (row.positionLabel.textContent !== label) row.positionLabel.textContent = label;
      const locked = state.stops.length <= 2;
      if (row.deleteBtn.disabled !== locked) row.deleteBtn.disabled = locked;

      // The labels carry the stop's rank and the page language, so they change
      // when a stop moves past another or the language does — not on every
      // frame of a drag.
      const colourLabel = t("tool.stopColor", { n: order.get(stop.id) + 1 });
      const positionLabel = t("tool.stopPosition", { n: order.get(stop.id) + 1 });
      const deleteLabel = t("tool.deleteColor");
      if (row.picker.getAttribute("aria-label") !== colourLabel) row.picker.setAttribute("aria-label", colourLabel);
      if (row.slider.getAttribute("aria-label") !== positionLabel) row.slider.setAttribute("aria-label", positionLabel);
      if (row.deleteBtn.getAttribute("aria-label") !== deleteLabel) {
        row.deleteBtn.title = deleteLabel;
        row.deleteBtn.setAttribute("aria-label", deleteLabel);
      }
    }
  }

  function buildStopRow(stop) {
    const element = document.createElement("div");
    element.className = "stop-row";
    element.innerHTML = `
      <div class="stop-row-left">
        <div class="color-picker-wrapper">
          <input type="color" class="row-color-input">
          <span class="row-color-hex"></span>
        </div>
      </div>
      <div class="stop-row-middle">
        <input type="range" class="row-position-slider" min="0" max="100">
        <span class="row-position-val"></span>
      </div>
      <div class="stop-row-right">
        <button type="button" class="btn-delete-row-stop">
          <i class="fas fa-trash-alt" aria-hidden="true"></i>
        </button>
      </div>
    `;

    const row = {
      element,
      picker: element.querySelector(".row-color-input"),
      hex: element.querySelector(".row-color-hex"),
      slider: element.querySelector(".row-position-slider"),
      positionLabel: element.querySelector(".row-position-val"),
      deleteBtn: element.querySelector(".btn-delete-row-stop")
    };

    element.addEventListener("click", () => {
      if (state.activeStopId === stop.id) return;
      state.activeStopId = stop.id;
      updateUI();
    });

    row.picker.addEventListener("input", (e) => {
      stop.color = e.target.value;
      state.activeStopId = stop.id;
      requestUpdate();
    });

    row.picker.addEventListener("change", updateUI);

    row.slider.addEventListener("input", (e) => {
      stop.position = Math.max(0, Math.min(100, parseInt(e.target.value, 10) || 0));
      state.activeStopId = stop.id;
      requestUpdate();
    });

    row.slider.addEventListener("change", updateUI);

    row.deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation(); // avoid selecting the deleted row
      if (state.stops.length <= 2) return;
      state.stops = state.stops.filter((candidate) => candidate.id !== stop.id);
      if (state.activeStopId === stop.id) state.activeStopId = state.stops[0].id;
      updateUI();
    });

    return row;
  }

  function updateCodeOutput() {
    const write = (text) => {
      if (elements.cssCode.textContent !== text) elements.cssCode.textContent = text;
    };
    if (state.exportFormat === "css") {
      const cssString = buildGradientCSSString(state.gradientType, state.angle, state.stops);
      write(`background: ${cssString};`);
    } else {
      // Tailwind arbitrary-value format
      const stopsString = sortedStops().map(s => `${s.color}_${s.position}%`).join(",_");
      if (state.gradientType === "linear") {
        write(`class="bg-[linear-gradient(${state.angle}deg,_${stopsString})]"`);
      } else {
        write(`class="bg-[radial-gradient(circle,_${stopsString})]"`);
      }
    }
  }

  // Sorted here, and only here: a gradient whose stops run backwards is not the
  // same gradient — CSS clamps each stop to the one before it — so the output
  // is ordered even though the state that produced it is not.
  function buildGradientCSSString(type, angle, stops) {
    const ordered = [...stops].sort((a, b) => a.position - b.position);
    const stopsStr = ordered.map(s => `${s.color} ${s.position}%`).join(", ");
    if (type === "linear") {
      return `linear-gradient(${angle}deg, ${stopsStr})`;
    }
    return `radial-gradient(circle, ${stopsStr})`;
  }

  function getColorAtPercentage(pct) {
    const stops = sortedStops();
    if (stops.length === 0) return "#3b82f6";
    if (pct <= stops[0].position) return stops[0].color;
    if (pct >= stops[stops.length - 1].position) return stops[stops.length - 1].color;

    let leftStop = stops[0];
    let rightStop = stops[stops.length - 1];

    for (let i = 0; i < stops.length - 1; i++) {
      if (pct >= stops[i].position && pct <= stops[i + 1].position) {
        leftStop = stops[i];
        rightStop = stops[i + 1];
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
    flushCodeOutput();
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
      tooltip.textContent = t("tool.codeCopied");
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
