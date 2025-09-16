// src/components/js/generatore-gradienti.js
export default function initGeneratorGradienti() {
  const previewBox = document.getElementById("previewBox");
  if (!previewBox) return; // safe guard

  const cssCode = document.getElementById("cssCode"),
    colorStops = document.getElementById("colorStops"),
    addColorBtn = document.getElementById("addColor"),
    angleControl = document.querySelector(".angle-control"),
    angleInput = document.getElementById("angle"),
    angleValue = document.getElementById("angleValue");

  let gradientType = "radial";

  const presets = [
    { colors: ["#3b82f6", "#ef4444"], angle: 90 },
    { colors: ["#10b981", "#3b82f6"], angle: 45 },
    { colors: ["#8b5cf6", "#ec4899"], angle: 135 },
    { colors: ["#f59e0b", "#ef4444"], angle: 0 },
    { colors: ["#6366f1", "#8b5cf6"], angle: 180 },
    { colors: ["#14b8a6", "#10b981"], angle: 225 },
  ];

  const presetContainer = document.querySelector(".preset-gradients");

  function attachColorStopListeners(el) {
    el.querySelectorAll("input").forEach(i =>
      i.addEventListener("input", updateGradient)
    );
    const btn = el.querySelector("button");
    if (btn) {
      btn.addEventListener("click", () => {
        if (colorStops.children.length > 2) {
          el.remove();
          updateGradient();
        }
      });
    }
  }

  function updateGradient() {
    const stops = Array.from(colorStops.children).map(e =>
      `${e.querySelector(".color-input").value} ${e.querySelector(".position-input").value}%`
    );

    let css;
    if (gradientType === "linear") {
      css = `linear-gradient(${angleInput.value}deg, ${stops.join(", ")})`;
      angleControl.classList.add("active");
    } else {
      css = `radial-gradient(circle, ${stops.join(", ")})`;
      angleControl.classList.remove("active");
    }

    previewBox.style.background = css;
    if (cssCode) cssCode.textContent = `background: ${css};`;
  }

  function applyPreset(p) {
    while (colorStops.firstChild) colorStops.removeChild(colorStops.firstChild);

    p.colors.forEach((c, idx) => {
      const n = document.createElement("div");
      n.className = "color-stop";
      const pos = idx === 0 ? 0 : idx === p.colors.length - 1 ? 100 : 50;
      n.innerHTML = `
        <input type="color" class="color-input" value="${c}">
        <input type="number" class="position-input" value="${pos}" min="0" max="100"> %
        <button class="button-simple button-outline">×</button>
      `;
      colorStops.appendChild(n);
      attachColorStopListeners(n);
    });

    angleInput.value = p.angle;
    angleValue.textContent = p.angle;
    updateGradient();
  }

  // === Tooltip (la tua versione, invariata) ===
  function showTooltip(el) {
    const t = el.querySelector(".tooltip");
    if (!t) return;
    t.style.visibility = "visible";
    t.style.opacity = "1";
    setTimeout(() => {
      t.style.visibility = "hidden";
      t.style.opacity = "0";
    }, 2000);
  }

  // === Espone la funzione per l'onclick inline ===
  // Con type="module" le funzioni NON sono globali; qui la rendo disponibile.
  window.copyToClipboard = function (btnEl) {
    if (!cssCode) return;
    const text = cssCode.textContent || "";

    // copia (Clipboard API con fallback)
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        // trova la tooltip della colonna preview (è un div separato nel tuo HTML)
        const preview = btnEl.closest(".preview");
        const container = preview?.querySelector(".tooltip-container") || btnEl;
        showTooltip(container);
      });
    } else {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.top = "-1000px";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch {}
      document.body.removeChild(ta);

      const preview = btnEl.closest(".preview");
      const container = preview?.querySelector(".tooltip-container") || btnEl;
      showTooltip(container);
    }
  };

  // ===== init UI =====
  presets.forEach(p => {
    const el = document.createElement("div");
    el.className = "preset";
    el.style.background = `linear-gradient(${p.angle}deg, ${p.colors.join(", ")})`;
    el.addEventListener("click", () => applyPreset(p));
    if (presetContainer) presetContainer.appendChild(el);
  });

  // toggle tipo gradiente
  document.querySelectorAll(".gradient-type button").forEach(b => {
    b.addEventListener("click", () => {
      document
        .querySelectorAll(".gradient-type button")
        .forEach(x => x.classList.add("button-outline"));
      b.classList.remove("button-outline");

      gradientType = b.dataset.type;
      angleControl.classList.toggle("active", gradientType === "linear");
      updateGradient();
    });
  });

  angleInput.addEventListener("input", () => {
    angleValue.textContent = angleInput.value;
    updateGradient();
  });

  addColorBtn.addEventListener("click", () => {
    const n = document.createElement("div");
    n.className = "color-stop";
    n.innerHTML = `
      <input type="color" class="color-input" value="#3b82f6">
      <input type="number" class="position-input" value="50" min="0" max="100"> %
      <button class="button-simple button-outline">×</button>
    `;
    colorStops.appendChild(n);
    attachColorStopListeners(n);
    updateGradient();
  });

  document.querySelectorAll(".color-stop").forEach(attachColorStopListeners);
  updateGradient();
}
