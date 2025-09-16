// src/components/js/generatore-colori.js
import iro from "@jaames/iro"; // <-- se usi il CDN, commenta questa riga

let colorPicker;
let lastCopiedColor = "";
let _initialized = false;

export function initColorGenerator() {
  if (_initialized) return; // anti-doppia init
  _initialized = true;

  // --- guard minimo: serve #picker in pagina
  if (!document.getElementById("picker")) {
    console.error("Elemento #picker non trovato: inizializzazione abortita.");
    return;
  }

  // ============ Tooltip minimal (integrato) ============
  function showTooltip(el, msg, duration = 2000) {
    if (!el) return;
    let tip = el.querySelector(".tooltiptext");
    if (!tip) {
      tip = document.createElement("span");
      tip.className = "tooltiptext";
      el.appendChild(tip);
      el.classList.add("tooltip");
    }
    tip.textContent = msg;
    tip.style.visibility = "visible";
    tip.style.opacity = "1";
    if (el.__tooltipTimer) clearTimeout(el.__tooltipTimer);
    el.__tooltipTimer = setTimeout(() => {
      hideTooltip(el);
    }, duration);
  }
  function hideTooltip(el) {
    if (!el) return;
    const tip = el.querySelector(".tooltiptext");
    if (!tip) return;
    tip.style.visibility = "hidden";
    tip.style.opacity = "0";
    if (el.__tooltipTimer) {
      clearTimeout(el.__tooltipTimer);
      el.__tooltipTimer = null;
    }
  }
  // =====================================================

  // -------- helpers UI --------
  function initializeSliders() {
    const t = document.getElementById("lightenDarken");
    const o = document.getElementById("saturate");
    if (!t || !o) return;
    t.value = 0;
    o.value = 50;
  }

  function manipulateColor(hex) {
    const t = parseInt(document.getElementById("lightenDarken")?.value ?? "0");
    const o = parseInt(document.getElementById("saturate")?.value ?? "50");
    const n = hexToRgb(hex);
    if (!n) return;
    let r = rgbToHsl(n.r, n.g, n.b);
    r.l = 100 - (t + 100) / 2;
    r.s = o;

    const l = hslToHex(r.h, r.s, r.l);
    const a = hexToRgb(l);
    const c = document.getElementById("manipulatedColor");
    const i = document.getElementById("manipulatedColorText");
    if (c) c.style.backgroundColor = l;
    if (i && a) {
      i.innerHTML = `
        Colore manipolato:<br>
        HEX: ${l}<br>
        RGB: ${a.r}, ${a.g}, ${a.b}<br>
        HSL: ${Math.round(r.h)}°, ${Math.round(r.s)}%, ${Math.round(r.l)}%
      `;
    }
  }

  function setupManipulatedColorCopy() {
    const e = document.getElementById("manipulatedColor");
    if (!e) return;
    e.style.cursor = "pointer";
    e.addEventListener("mouseover", () => { e.style.opacity = "0.8"; });
    e.addEventListener("mouseout", () => { e.style.opacity = "1"; });
    e.addEventListener("click", () => {
      const bg = e.style.backgroundColor;
      const asHex = rgbToHex(bg);
      navigator.clipboard.writeText(asHex)
        .then(() => {
          lastCopiedColor = asHex;
          showTooltip(e, "Copiato!", 1500);
        })
        .catch((err) => {
          console.error("Errore nel copiare il colore:", err);
          showTooltip(e, "Errore!", 1500);
        });
    });
  }

  function generatePalette(hex) {
    const t = document.getElementById("harmonies")?.value ?? "monochromatic";
    const o = document.getElementById("paletteContainer");
    if (!o) return;

    let n;
    o.innerHTML = "";
    switch (t) {
      case "monochromatic": n = generateMonochromaticPalette(hex); break;
      case "analogous": n = generateAnalogousPalette(hex); break;
      case "complementary": n = generateComplementaryPalette(hex); break;
      case "triadic": n = generateTriadicPalette(hex); break;
      case "tetradic": n = generateTetradicPalette(hex); break;
      default: n = [hex];
    }
    n.forEach((c) => o.appendChild(createColorSwatch(c)));
  }

  function createColorSwatch(col) {
    const t = document.createElement("div");
    t.className = "color-swatch";
    t.style.backgroundColor = col;

    const o = col.startsWith("#") ? col : rgbToHex(col);
    const n = document.createElement("span");
    n.className = "hex-value";
    n.textContent = o.toUpperCase();

    t.appendChild(n);
    t.addEventListener("click", () => {
      navigator.clipboard.writeText(o)
        .then(() => { lastCopiedColor = o; showTooltip(t, "Copiato!", 1200); })
        .catch((err) => { console.error("Errore nel copiare il testo: ", err); showTooltip(t, "Errore!", 1200); });
    });
    return t;
  }

  function analyzeColor(hex) {
    updateColorInfo(hex);
  }

  function updateColorInfo(hex) {
    const t = document.getElementById("colorPreview");
    const o = document.getElementById("colorDetails");
    if (!t || !o) return;

    t.style.backgroundColor = hex;
    const n = hexToRgb(hex);
    if (!n) return;
    const r = rgbToHsl(n.r, n.g, n.b);
    const l = calculateLuminance(n);
    const a = getDominantShade(n);
    o.innerHTML = `
      HEX: ${hex}<br>
      RGB: ${n.r}, ${n.g}, ${n.b}<br>
      HSL: ${r.h}°, ${r.s}%, ${r.l}%<br>
      Luminosità: ${l.toFixed(2)}<br>
      Tinta dominante: ${a}
    `;
  }

  function checkContrast(fg, bg) {
    const o = calculateContrast(fg, (bg = parseColor(bg) || "#FFFFFF"));
    const n = document.getElementById("contrastResult");
    if (!n) return;
    const r = getWCAGLevel(o);
    n.innerHTML = `
      <div class="contrast-preview" style="background-color: ${fg}; color: ${getContrastingTextColor(fg)};">
        Testo di esempio
      </div>
      Rapporto di contrasto: ${o.toFixed(2)}:1<br>
      WCAG 2.1: ${r}
    `;
  }

  // -------- helpers colore --------
  function parseColor(val) {
    if (!val) return null;
    if (val.startsWith("#")) {
      if (val.length === 4) return "#" + val[1] + val[1] + val[2] + val[2] + val[3] + val[3];
      if (val.length === 7) return val;
    }
    const t = val.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
    if (t) return rgbToHex(`rgb(${t[1]}, ${t[2]}, ${t[3]})`);
    const probe = document.createElement("div");
    probe.style.color = val;
    document.body.appendChild(probe);
    const n = getComputedStyle(probe).color;
    document.body.removeChild(probe);
    return n !== val ? rgbToHex(n) : null;
  }

  function getContrastingTextColor(hex) {
    const t = parseColor(hex) || "#FFFFFF";
    return calculateContrast(t, "#000000") >= calculateContrast(t, "#FFFFFF") ? "#000000" : "#FFFFFF";
  }

  function generateMonochromaticPalette(hex) {
    const t = rgbToHsl(...Object.values(hexToRgb(hex)));
    return [
      hex,
      hslToHex(t.h, t.s, Math.max(0, t.l - 20)),
      hslToHex(t.h, t.s, Math.min(100, t.l + 20)),
      hslToHex(t.h, Math.max(0, t.s - 20), t.l),
      hslToHex(t.h, Math.min(100, t.s + 20), t.l),
    ];
  }
  function generateAnalogousPalette(hex) {
    const t = rgbToHsl(...Object.values(hexToRgb(hex)));
    return [
      hex,
      hslToHex((t.h + 30) % 360, t.s, t.l),
      hslToHex((t.h + 60) % 360, t.s, t.l),
      hslToHex((t.h - 30 + 360) % 360, t.s, t.l),
      hslToHex((t.h - 60 + 360) % 360, t.s, t.l),
    ];
  }
  function generateComplementaryPalette(hex) {
    const t = rgbToHsl(...Object.values(hexToRgb(hex)));
    const o = (t.h + 180) % 360;
    return [
      hex,
      hslToHex(o, t.s, t.l),
      hslToHex(t.h, Math.max(0, t.s - 20), t.l),
      hslToHex(t.h, Math.min(100, t.s + 20), t.l),
      hslToHex(o, Math.min(100, t.s + 20), t.l),
    ];
  }
  function generateTriadicPalette(hex) {
    const t = rgbToHsl(...Object.values(hexToRgb(hex)));
    return [
      hex,
      hslToHex((t.h + 120) % 360, t.s, t.l),
      hslToHex((t.h + 240) % 360, t.s, t.l),
      hslToHex(t.h, Math.max(0, t.s - 20), t.l),
      hslToHex(t.h, Math.min(100, t.s + 20), t.l),
    ];
  }
  function generateTetradicPalette(hex) {
    const t = rgbToHsl(...Object.values(hexToRgb(hex)));
    return [
      hex,
      hslToHex((t.h + 90) % 360, t.s, t.l),
      hslToHex((t.h + 180) % 360, t.s, t.l),
      hslToHex((t.h + 270) % 360, t.s, t.l),
      hslToHex(t.h, Math.min(100, t.s + 20), t.l),
    ];
  }

  function rgbToHex(val) {
    if (typeof val === "string") {
      const m = val.match(/\d+/g);
      if (!m) return val;
      const [t, o, n] = m;
      return (
        "#" +
        ((1 << 24) + (+t << 16) + (+o << 8) + +n)
          .toString(16)
          .slice(1)
      );
    }
    return val;
  }

  function hexToRgb(hex) {
    const t = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return t ? { r: parseInt(t[1], 16), g: parseInt(t[2], 16), b: parseInt(t[3], 16) } : null;
  }

  function rgbToHsl(e, t, o) {
    e /= 255; t /= 255; o /= 255;
    const n = Math.max(e, t, o);
    const r = Math.min(e, t, o);
    let l, a, c = (n + r) / 2;
    if (n === r) { l = a = 0; }
    else {
      const i = n - r;
      a = c > 0.5 ? i / (2 - n - r) : i / (n + r);
      switch (n) {
        case e: l = (t - o) / i + (t < o ? 6 : 0); break;
        case t: l = (o - e) / i + 2; break;
        case o: l = (e - t) / i + 4; break;
      }
      l /= 6;
    }
    return { h: Math.round(360 * l), s: Math.round(100 * a), l: Math.round(100 * c) };
  }

  function hslToHex(h, s, l) {
    l /= 100;
    const n = (s * Math.min(l, 1 - l)) / 100;
    const f = (t) => {
      const r = (t + h / 30) % 12;
      const v = l - n * Math.max(Math.min(r - 3, 9 - r, 1), -1);
      return Math.round(255 * v).toString(16).padStart(2, "0");
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  }

  function calculateLuminance(e) {
    const t = [e.r, e.g, e.b].map((v) =>
      (v /= 255) <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
    );
    return 0.2126 * t[0] + 0.7152 * t[1] + 0.0722 * t[2];
  }

  function calculateContrast(aHex, bHex) {
    const o = calculateLuminance(hexToRgb(aHex));
    const n = calculateLuminance(hexToRgb(bHex));
    return (Math.max(o, n) + 0.05) / (Math.min(o, n) + 0.05);
  }

  function getWCAGLevel(ratio) {
    return ratio >= 7 ? "AAA" : ratio >= 4.5 ? "AA" : ratio >= 3 ? "AA (Large Text)" : "Fail";
  }

  function getDominantShade(rgb) {
    const t = Math.max(rgb.r, rgb.g, rgb.b);
    return rgb.r === t ? "Rosso" : rgb.g === t ? "Verde" : rgb.b === t ? "Blu" : "Neutro";
  }

  // -------- bootstrap --------
  const e = document.getElementById("selectedColorValue");
  const t = document.getElementById("contrastColorInput");
  const o = document.getElementById("colorPreviewReal");
  const n = document.getElementById("colorPreview");
  const r = document.getElementById("manipulatedColor");
  const l = document.getElementById("colorPreviewContainer");

  try {
    colorPicker = new iro.ColorPicker("#picker", { width: 200, color: "#007bff" });
    console.log("Color picker inizializzato");
  } catch (err) {
    console.error("Errore nell'inizializzazione del color picker:", err);
    return;
  }

  function updateHexValue(col) {
    const hex = col.hexString || col;
    if (e) e.textContent = hex;
    colorPicker.color.set(hex);
    if (o) o.style.backgroundColor = hex;
    if (n) n.style.backgroundColor = hex;
    if (r) r.style.backgroundColor = hex;
    analyzeColor(hex);
    if (t) checkContrast(hex, t.value);
  }

  colorPicker.on("color:change", (c) => {
    updateHexValue(c);
    manipulateColor(c.hexString);
  });

  t?.addEventListener("input", (ev) => {
    const parsed = parseColor(ev.target.value);
    if (parsed) {
      t.style.backgroundColor = parsed;
      t.style.color = getContrastingTextColor(parsed);
      checkContrast(colorPicker.color.hexString, parsed);
    }
  });

  l?.addEventListener("click", () => {
    const hex = colorPicker.color.hexString;
    navigator.clipboard.writeText(hex)
      .then(() => { lastCopiedColor = hex; showTooltip(l, "Copiato!", 1200); })
      .catch((err) => { console.error("Errore nel copiare il testo: ", err); showTooltip(l, "Errore!", 1200); });
  });

  document.getElementById("generatePalette")?.addEventListener("click", () =>
    generatePalette(colorPicker.color.hexString)
  );
  document.getElementById("lightenDarken")?.addEventListener("input", () =>
    manipulateColor(colorPicker.color.hexString)
  );
  document.getElementById("saturate")?.addEventListener("input", () =>
    manipulateColor(colorPicker.color.hexString)
  );

  document.querySelectorAll(".color-note").forEach((note, idx) => {
    const pv = note.querySelector(".color-preview");
    const hv = note.querySelector(".color-hex");
    const pin = note.querySelector(".pin-color");
    if (!pv || !hv || !pin) return;

    function updateColorNote(hex) {
      pv.style.backgroundColor = hex;
      hv.textContent = hex.toUpperCase();
      pin.textContent = "Cambia";
      localStorage.setItem(`pinnedColor${idx}`, hex);
    }

    pin.addEventListener("click", () => {
      updateColorNote(lastCopiedColor || colorPicker.color.hexString);
      showTooltip(pv, "Colore appuntato!", 1200);
    });

    pv.addEventListener("click", () => {
      const hex = hv.textContent;
      navigator.clipboard.writeText(hex)
        .then(() => { lastCopiedColor = hex; showTooltip(pv, "Copiato!", 1200); })
        .catch((err) => { console.error("Errore nel copiare il colore:", err); showTooltip(pv, "Errore!", 1200); });
    });

    const saved = localStorage.getItem(`pinnedColor${idx}`);
    if (saved) updateColorNote(saved);
  });

  initializeSliders();
  updateHexValue(colorPicker.color);
  manipulateColor(colorPicker.color.hexString);
  setupManipulatedColorCopy();
  document.getElementById("manualColorInput")?.addEventListener("input", (ev) => {
    const parsed = parseColor(ev.target.value);
    if (parsed) {
      colorPicker.color.set(parsed);
      updateHexValue(colorPicker.color);
    }
  });
}
