// src/scripts/pages/strumenti/generatore-colori/generatore-colori.js

let palette = [
  { hex: "#264653", locked: false },
  { hex: "#2A9D8F", locked: false },
  { hex: "#E9C46A", locked: false },
  { hex: "#F4A261", locked: false },
  { hex: "#E76F51", locked: false }
];

const PRESETS = [
  { name: "Sogno Pastello", colors: ["#FFB7B2", "#FFDAC1", "#E2F0CB", "#B5EAD7", "#C7CEEA"] },
  { name: "Tramonto Caldo", colors: ["#264653", "#2A9D8F", "#E9C46A", "#F4A261", "#E76F51"] },
  { name: "Ardesia Nordica", colors: ["#2E3440", "#3B4252", "#434C5E", "#4C566A", "#D8DEE9"] },
  { name: "Cyberpunk Neon", colors: ["#0B0C10", "#1F2833", "#C5C6C7", "#66FCF1", "#45A29E"] },
  { name: "Brezza Marina", colors: ["#003F5C", "#2F5C73", "#587A8C", "#8099A6", "#A8B9C2"] },
  { name: "Sabbie Calde", colors: ["#EAE2B7", "#FCBF49", "#F77F00", "#D62828", "#003049"] },
  { name: "Foresta Profonda", colors: ["#14362E", "#335C4E", "#608066", "#8EB295", "#CFE0C3"] },
  { name: "Dolce Lavanda", colors: ["#3D348B", "#7678ED", "#F7B801", "#F18701", "#F35B04"] }
];

let _initialized = false;

export function initColorGenerator() {
  if (_initialized) return;
  _initialized = true;

  const cardsContainer = document.getElementById("palette-cards-container");
  const btnGenerate = document.getElementById("btn-generate");
  const modeSelect = document.getElementById("generation-mode");
  const btnCopyCss = document.getElementById("btn-copy-css");
  const btnCopyJson = document.getElementById("btn-copy-json");
  const btnCopyLink = document.getElementById("btn-copy-link");
  const presetsContainer = document.getElementById("presets-container");
  const bgSelect = document.getElementById("contrast-bg-select");
  const textSelect = document.getElementById("contrast-text-select");
  const previewBox = document.getElementById("contrast-preview-box");
  const scoreDetails = document.getElementById("contrast-score-details");

  if (!cardsContainer || !btnGenerate) {
    console.error("Elementi necessari del generatore non trovati in pagina.");
    return;
  }

  // ============ Tooltip Helper ============
  function showTooltip(el, msg, duration = 1500) {
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
      tip.style.visibility = "hidden";
      tip.style.opacity = "0";
    }, duration);
  }

  // ============ Color Converter Helpers ============
  function hexToRgb(hex) {
    const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return r ? {
      r: parseInt(r[1], 16),
      g: parseInt(r[2], 16),
      b: parseInt(r[3], 16)
    } : null;
  }

  function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  function hexToHsl(hex) {
    const rgb = hexToRgb(hex);
    if (!rgb) return { h: 0, s: 0, l: 0 };
    let r = rgb.r / 255;
    let g = rgb.g / 255;
    let b = rgb.b / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0; // achromatic
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  }

  function hslToHex(h, s, l) {
    s /= 100;
    l /= 100;
    const k = n => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = n => {
      const r = l - a * Math.max(Math.min(k(n) - 3, 9 - k(n), 1), -1);
      return Math.round(255 * r).toString(16).padStart(2, "0");
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  }

  function calculateLuminance(hex) {
    const rgb = hexToRgb(hex);
    if (!rgb) return 0;
    const a = [rgb.r, rgb.g, rgb.b].map(v => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
  }

  function calculateContrast(hex1, hex2) {
    const lum1 = calculateLuminance(hex1);
    const lum2 = calculateLuminance(hex2);
    return (Math.max(lum1, lum2) + 0.05) / (Math.min(lum1, lum2) + 0.05);
  }

  function isLightColor(hex) {
    return calculateLuminance(hex) > 0.45;
  }

  // ============ Core Logic ============

  // Carica i colori dall'URL se presenti, altrimenti genera a caso
  function loadPaletteFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const colorsParam = urlParams.get("colors");
    if (colorsParam) {
      const parsedColors = colorsParam.split("-").map(c => "#" + c);
      if (parsedColors.length === 5) {
        palette = parsedColors.map(hex => ({ hex, locked: false }));
        return;
      }
    }
    // Se non ci sono colori nell'URL, generiamo una palette di partenza casuale ma bilanciata
    generateRandomPalette(true);
  }

  function updateUrl() {
    const colorsString = palette.map(c => c.hex.replace("#", "")).join("-");
    const newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + "?colors=" + colorsString;
    window.history.replaceState({ path: newurl }, "", newurl);
  }

  // Genera palette in base alle impostazioni
  function generateRandomPalette(forceAll = false) {
    const mode = modeSelect?.value ?? "random";
    
    // Trova i colori bloccati per mantenere armonia (se presenti)
    const lockedColors = forceAll ? [] : palette.filter(c => c.locked);
    let seedHsl;

    if (lockedColors.length > 0) {
      // Usa uno dei colori bloccati a caso come seme di partenza
      const randomSeed = lockedColors[Math.floor(Math.random() * lockedColors.length)].hex;
      seedHsl = hexToHsl(randomSeed);
    } else {
      // Crea un seme casuale ma con saturazione e luminosità bilanciate per un look professionale
      seedHsl = {
        h: Math.floor(Math.random() * 360),
        s: 55 + Math.floor(Math.random() * 25), // 55% - 80%
        l: 45 + Math.floor(Math.random() * 15)  // 45% - 60%
      };
    }

    palette.forEach((color, index) => {
      if (color.locked && !forceAll) return;

      let nextHex;

      switch (mode) {
        case "pastel":
          nextHex = hslToHex(
            Math.floor(Math.random() * 360),
            25 + Math.floor(Math.random() * 15), // 25% - 40%
            78 + Math.floor(Math.random() * 12)  // 78% - 90%
          );
          break;

        case "neon":
          nextHex = hslToHex(
            Math.floor(Math.random() * 360),
            88 + Math.floor(Math.random() * 12), // 88% - 100%
            50 + Math.floor(Math.random() * 10)  // 50% - 60%
          );
          break;

        case "monochromatic":
          // Stesso hue, variazione di saturazione e luminosità
          nextHex = hslToHex(
            seedHsl.h,
            Math.max(10, Math.min(100, seedHsl.s + (index - 2) * 15 + (Math.random() * 10 - 5))),
            Math.max(15, Math.min(85, seedHsl.l + (index - 2) * 12 + (Math.random() * 10 - 5)))
          );
          break;

        case "analogous":
          // Hue sfalsati di 15-30 gradi
          nextHex = hslToHex(
            (seedHsl.h + (index - 2) * 20 + 360) % 360,
            seedHsl.s,
            seedHsl.l + (Math.random() * 10 - 5)
          );
          break;

        case "complementary":
          // Alternanza tra il seme e il suo complementare (+180 deg)
          const baseHue = (index % 2 === 0) ? seedHsl.h : (seedHsl.h + 180) % 360;
          nextHex = hslToHex(
            baseHue,
            seedHsl.s - (index * 5),
            Math.max(20, Math.min(80, seedHsl.l + (index - 2) * 10))
          );
          break;

        case "triadic":
          // Colori posizionati a 120 gradi l'uno dall'altro
          const triadicHue = (seedHsl.h + (index % 3) * 120) % 360;
          nextHex = hslToHex(
            triadicHue,
            seedHsl.s,
            seedHsl.l + (index - 2) * 8
          );
          break;

        case "random":
        default:
          // Generazione bilanciata ma casuale: manteniamo la saturazione/luminosità simile al seme per coerenza
          nextHex = hslToHex(
            Math.floor(Math.random() * 360),
            seedHsl.s + (Math.random() * 12 - 6),
            seedHsl.l + (Math.random() * 12 - 6)
          );
          break;
      }

      color.hex = nextHex;
    });

    renderPalette();
    updateUrl();
  }

  // Disegna le schede colore
  function renderPalette() {
    cardsContainer.innerHTML = "";

    palette.forEach((color, index) => {
      const isLight = isLightColor(color.hex);
      const card = document.createElement("div");
      card.className = `color-card ${isLight ? "light-color" : ""}`;
      card.style.backgroundColor = color.hex;

      // HTML della scheda colore con i bottoni azioni (Lock, Copy, Adjust)
      card.innerHTML = `
        <div class="color-card-actions">
          <button class="card-action-btn lock-btn ${color.locked ? "is-locked" : ""}" title="${color.locked ? "Sblocca colore" : "Blocca colore"}">
            <i class="fas ${color.locked ? "fa-lock" : "fa-lock-open"}" aria-hidden="true"></i>
          </button>
          
          <button class="card-action-btn copy-btn" title="Copia HEX">
            <i class="far fa-copy" aria-hidden="true"></i>
          </button>
          
          <div class="color-picker-wrapper card-action-btn" title="Regola colore">
            <i class="fas fa-sliders-h" aria-hidden="true"></i>
            <input type="color" class="color-picker-input" value="${color.hex}">
          </div>
        </div>
        <span class="color-card-hex">${color.hex.toUpperCase()}</span>
      `;

      // Event Listeners sui bottoni interni
      const lockBtn = card.querySelector(".lock-btn");
      const copyBtn = card.querySelector(".copy-btn");
      const hexText = card.querySelector(".color-card-hex");
      const pickerInput = card.querySelector(".color-picker-input");

      lockBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        color.locked = !color.locked;
        const icon = lockBtn.querySelector("i");
        if (color.locked) {
          lockBtn.classList.add("is-locked");
          icon.className = "fas fa-lock";
          lockBtn.title = "Sblocca colore";
        } else {
          lockBtn.classList.remove("is-locked");
          icon.className = "fas fa-lock-open";
          lockBtn.title = "Blocca colore";
        }
      });

      function copyHexAction(e) {
        e.stopPropagation();
        navigator.clipboard.writeText(color.hex)
          .then(() => {
            showTooltip(card, "Copiato!", 1200);
          })
          .catch(err => {
            console.error("Copia fallita", err);
          });
      }

      copyBtn.addEventListener("click", copyHexAction);
      hexText.addEventListener("click", copyHexAction);

      // Picker manuale di regolazione
      pickerInput.addEventListener("input", (e) => {
        color.hex = e.target.value;
        card.style.backgroundColor = color.hex;
        hexText.textContent = color.hex.toUpperCase();
        
        // Regola la classe light/dark della card al volo
        if (isLightColor(color.hex)) {
          card.classList.add("light-color");
        } else {
          card.classList.remove("light-color");
        }
        
        updateUrl();
        updateContrastChecker();
      });

      pickerInput.addEventListener("change", () => {
        updateContrastCheckerOptions();
        updateContrastChecker();
      });

      cardsContainer.appendChild(card);
    });

    updateContrastCheckerOptions();
    updateContrastChecker();
  }

  // ============ recommended Presets ============
  function renderPresets() {
    if (!presetsContainer) return;
    presetsContainer.innerHTML = "";

    PRESETS.forEach(preset => {
      const presetCard = document.createElement("div");
      presetCard.className = "preset-card";
      
      const barsHtml = preset.colors.map(col => `
        <div class="preset-color-bar" style="background-color: ${col};"></div>
      `).join("");

      presetCard.innerHTML = `
        <span class="preset-name">${preset.name}</span>
        <div class="preset-colors-row">
          ${barsHtml}
        </div>
      `;

      presetCard.addEventListener("click", () => {
        // Applica i colori escludendo i lock temporaneamente (un preset ha priorità)
        preset.colors.forEach((col, idx) => {
          palette[idx].hex = col;
          palette[idx].locked = false; // reset lock
        });
        renderPalette();
        updateUrl();
      });

      presetsContainer.appendChild(presetCard);
    });
  }

  // ============ Contrast Checker Section ============
  function updateContrastCheckerOptions() {
    if (!bgSelect || !textSelect) return;
    
    const bgVal = bgSelect.value;
    const textVal = textSelect.value;

    bgSelect.innerHTML = "";
    textSelect.innerHTML = "";

    palette.forEach((color, idx) => {
      const optBg = document.createElement("option");
      optBg.value = color.hex;
      optBg.textContent = `Colore ${idx + 1} (${color.hex.toUpperCase()})`;
      bgSelect.appendChild(optBg);

      const optText = document.createElement("option");
      optText.value = color.hex;
      optText.textContent = `Colore ${idx + 1} (${color.hex.toUpperCase()})`;
      textSelect.appendChild(optText);
    });

    // Mantieni le selezioni precedenti se ancora valide
    if (palette.some(c => c.hex === bgVal)) bgSelect.value = bgVal;
    else bgSelect.selectedIndex = 0; // Colore 1 di default

    if (palette.some(c => c.hex === textVal)) textSelect.value = textVal;
    else textSelect.selectedIndex = 4; // Colore 5 di default
  }

  function updateContrastChecker() {
    if (!bgSelect || !textSelect || !previewBox || !scoreDetails) return;

    const bgHex = bgSelect.value;
    const textHex = textSelect.value;

    previewBox.style.backgroundColor = bgHex;
    previewBox.style.color = textHex;

    const ratio = calculateContrast(bgHex, textHex);

    // WCAG 2.1 Pass/Fail checks
    // Normal Text: AA >= 4.5, AAA >= 7.0
    // Large Text: AA >= 3.0, AAA >= 4.5
    const aaNormal = ratio >= 4.5;
    const aaaNormal = ratio >= 7.0;
    const aaLarge = ratio >= 3.0;
    const aaaLarge = ratio >= 4.5;

    scoreDetails.innerHTML = `
      <span class="contrast-ratio-badge">${ratio.toFixed(2)}:1</span>
      <div class="contrast-level-badge">
        <div class="level-item">
          Testo Normale (AA): 
          <span class="${aaNormal ? "level-pass" : "level-fail"}">
            <i class="fas ${aaNormal ? "fa-check-circle" : "fa-times-circle"}"></i> ${aaNormal ? "Passa" : "Fallisce"}
          </span>
        </div>
        <div class="level-item">
          Testo Normale (AAA): 
          <span class="${aaaNormal ? "level-pass" : "level-fail"}">
            <i class="fas ${aaaNormal ? "fa-check-circle" : "fa-times-circle"}"></i> ${aaaNormal ? "Passa" : "Fallisce"}
          </span>
        </div>
        <div class="level-item">
          Testo Grande (AA): 
          <span class="${aaLarge ? "level-pass" : "level-fail"}">
            <i class="fas ${aaLarge ? "fa-check-circle" : "fa-times-circle"}"></i> ${aaLarge ? "Passa" : "Fallisce"}
          </span>
        </div>
        <div class="level-item">
          Testo Grande (AAA): 
          <span class="${aaaLarge ? "level-pass" : "level-fail"}">
            <i class="fas ${aaaLarge ? "fa-check-circle" : "fa-times-circle"}"></i> ${aaaLarge ? "Passa" : "Fallisce"}
          </span>
        </div>
      </div>
    `;
  }

  // ============ Export Helpers ============
  function copyTextToClipboard(text, button, successMsg) {
    navigator.clipboard.writeText(text)
      .then(() => {
        showTooltip(button, successMsg, 1500);
      })
      .catch(err => {
        console.error("Copia fallita", err);
        showTooltip(button, "Errore!", 1500);
      });
  }

  // Bind Events
  btnGenerate.addEventListener("click", () => generateRandomPalette());

  bgSelect.addEventListener("change", updateContrastChecker);
  textSelect.addEventListener("change", updateContrastChecker);

  // Esporta come variabili CSS
  btnCopyCss.addEventListener("click", () => {
    const cssVars = palette.map((col, idx) => `  --color-${idx + 1}: ${col.hex};`).join("\n");
    const output = `:root {\n${cssVars}\n}`;
    copyTextToClipboard(output, btnCopyCss, "CSS Copiato!");
  });

  // Esporta come array JSON
  btnCopyJson.addEventListener("click", () => {
    const jsonOutput = JSON.stringify(palette.map(c => c.hex), null, 2);
    copyTextToClipboard(jsonOutput, btnCopyJson, "JSON Copiato!");
  });

  // Condividi link
  btnCopyLink.addEventListener("click", () => {
    copyTextToClipboard(window.location.href, btnCopyLink, "Link Copiato!");
  });

  // Tasto Spazio per generare al volo
  document.addEventListener("keydown", (e) => {
    // Genera solo se l'utente non sta digitando in un input o select
    const targetTag = e.target.tagName.toLowerCase();
    if (targetTag === "input" || targetTag === "select" || targetTag === "textarea") {
      return;
    }

    if (e.code === "Space" || e.keyCode === 32) {
      e.preventDefault(); // evita lo scroll della pagina
      generateRandomPalette();
    }
  });

  // Bootstrapping
  loadPaletteFromUrl();
  renderPalette();
  renderPresets();
}
