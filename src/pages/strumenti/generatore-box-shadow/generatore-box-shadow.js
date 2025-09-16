// src/components/js/generatore-box-shadow.js

let _initializedBoxShadow = false;

export function initBoxShadowGenerator() {
  if (_initializedBoxShadow) return;
  _initializedBoxShadow = true;

  // --- riferimenti UI
  const controls = {
    horizontal: document.getElementById("horizontal"),
    vertical: document.getElementById("vertical"),
    blur: document.getElementById("blur"),
    spread: document.getElementById("spread"),
    color: document.getElementById("color"),
    opacity: document.getElementById("opacity"),
  };
  const preview = document.getElementById("preview-box");
  const cssCode = document.getElementById("css-code");

  const outerContainer = document.getElementById("outer-container");
  const backgroundColorInput = document.getElementById("background-color");
  const objectColorInput = document.getElementById("object-color");
  const backgroundColorPreview = document.getElementById("background-color-preview");
  const objectColorPreview = document.getElementById("object-color-preview");

  // ========== Tooltip: usa la TUA bolla .tooltip dentro .tooltip-container ==========
  function showTooltip(hostEl, msg = "CSS copiato!", duration = 2000) {
    if (!hostEl) return;
    // nel tuo HTML la bolla è <span class="tooltip">...</span>
    const bubble = hostEl.querySelector(".tooltip");
    if (!bubble) return;
    bubble.textContent = msg;
    bubble.style.visibility = "visible";
    bubble.style.opacity = "1";
    // timer per auto-hide
    if (hostEl.__tooltipTimer) clearTimeout(hostEl.__tooltipTimer);
    hostEl.__tooltipTimer = setTimeout(() => hideTooltip(hostEl), duration);
  }
  function hideTooltip(hostEl) {
    if (!hostEl) return;
    const bubble = hostEl.querySelector(".tooltip");
    if (!bubble) return;
    bubble.style.visibility = "hidden";
    bubble.style.opacity = "0";
    if (hostEl.__tooltipTimer) {
      clearTimeout(hostEl.__tooltipTimer);
      hostEl.__tooltipTimer = null;
    }
  }
  // ================================================================================

  // --- helpers
  function hexToRgb(hex) {
    const h = (hex || "").replace("#", "");
    if (h.length !== 6) return null;
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
    };
  }
  function isValidHex(hex) {
    return /^#[0-9A-F]{6}$/i.test(hex || "");
  }

  // --- logica principale
  function updateShadow() {
    if (!preview || !cssCode) return;

    const vals = {
      horizontal: Number(controls.horizontal?.value ?? 0),
      vertical: Number(controls.vertical?.value ?? 0),
      blur: Number(controls.blur?.value ?? 0),
      spread: Number(controls.spread?.value ?? 0),
      color: controls.color?.value ?? "#000000",
      opacity: Number(controls.opacity?.value ?? 20),
    };

    // aggiorna le label se esistono
    Object.entries(vals).forEach(([k, v]) => {
      const label = document.getElementById(`${k}-value`);
      if (!label) return;
      if (k === "color") label.textContent = vals.color;
      else if (k === "opacity") label.textContent = `${vals.opacity}%`;
      else label.textContent = `${v}px`;
    });

    const rgb = hexToRgb(vals.color) ?? { r: 0, g: 0, b: 0 };
    const shadow = `${vals.horizontal}px ${vals.vertical}px ${vals.blur}px ${vals.spread}px rgba(${rgb.r},${rgb.g},${rgb.b},${vals.opacity / 100})`;

    preview.style.boxShadow = shadow;
    cssCode.textContent = `box-shadow: ${shadow};`;
  }

  function copyCssFrom(hostEl) {
    if (!cssCode) return;
    const text = cssCode.textContent || "";
    navigator.clipboard.writeText(text).then(
      () => showTooltip(hostEl, "CSS copiato!", 1200),
      () => showTooltip(hostEl, "Errore copia", 1200),
    );
  }

  // --- BIND eventi controlli
  Object.values(controls).forEach((input) => {
    if (!input) return;
    input.addEventListener("input", updateShadow);
  });

  // --- BIND copia: supporta sia inline onclick="copyToClipboard(this)" sia senza
  // 1) Espone la funzione globale per l'inline handler del tuo HTML
  window.copyToClipboard = function (btn) {
    const host = btn?.closest(".tooltip-container") || btn?.parentElement || cssCode?.parentElement || cssCode;
    copyCssFrom(host);
  };

  // 2) Se preferisci evitare inline in futuro, bind automatico (non obbligatorio)
  const autoCopyBtn = document.querySelector(".tooltip-container .button-simple");
  if (autoCopyBtn && !autoCopyBtn.hasAttribute("data-bound")) {
    autoCopyBtn.setAttribute("data-bound", "true");
    autoCopyBtn.addEventListener("click", (e) => {
      const host = autoCopyBtn.closest(".tooltip-container") || autoCopyBtn.parentElement;
      copyCssFrom(host);
    });
  }

  // --- Colori sfondo/oggetto (opzionali)
  function updateColors() {
    const bg = backgroundColorInput?.value;
    const obj = objectColorInput?.value;
    if (isValidHex(bg)) {
      if (outerContainer) outerContainer.style.backgroundColor = bg;
      if (backgroundColorPreview) backgroundColorPreview.style.backgroundColor = bg;
    }
    if (isValidHex(obj)) {
      if (preview) preview.style.backgroundColor = obj;
      if (objectColorPreview) objectColorPreview.style.backgroundColor = obj;
    }
  }
  backgroundColorInput?.addEventListener("input", updateColors);
  objectColorInput?.addEventListener("input", updateColors);

  // --- bootstrap
  updateShadow();
  updateColors();
}
