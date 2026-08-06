import { t, currentLang } from "@/i18n/ui.js";
let palette = [
  { hex: "#264653", locked: false },
  { hex: "#2A9D8F", locked: false },
  { hex: "#E9C46A", locked: false },
  { hex: "#F4A261", locked: false },
  { hex: "#E76F51", locked: false }
];

const COLOR_NAMES = [
  { name: "Rosso Fuoco", nameEn: "Fire Red", r: 231, g: 76, b: 60 },
  { name: "Rosso Corallo", nameEn: "Coral Red", r: 230, g: 126, b: 34 },
  { name: "Arancio Sole", nameEn: "Sun Orange", r: 243, g: 156, b: 18 },
  { name: "Pesca Calda", nameEn: "Warm Peach", r: 244, g: 162, b: 97 },
  { name: "Rosso Terracotta", nameEn: "Terracotta Red", r: 231, g: 111, b: 81 },
  { name: "Giallo Zafferano", nameEn: "Saffron Yellow", r: 233, g: 196, b: 106 },
  { name: "Giallo Miele", nameEn: "Honey Yellow", r: 241, g: 196, b: 15 },
  { name: "Verde Smeraldo", nameEn: "Emerald Green", r: 46, g: 204, b: 113 },
  { name: "Verde Menta", nameEn: "Mint Green", r: 46, g: 204, b: 113 },
  { name: "Verde Caraibi", nameEn: "Caribbean Green", r: 42, g: 157, b: 143 },
  { name: "Verde Petrolio", nameEn: "Teal Green", r: 38, g: 70, b: 83 },
  { name: "Turchese Vivace", nameEn: "Vivid Turquoise", r: 26, g: 188, b: 156 },
  { name: "Blu Oceano", nameEn: "Ocean Blue", r: 0, g: 63, b: 92 },
  { name: "Blu Oltremare", nameEn: "Ultramarine Blue", r: 41, g: 128, b: 185 },
  { name: "Blu Notte", nameEn: "Midnight Blue", r: 15, g: 23, b: 42 },
  { name: "Viola Ametista", nameEn: "Amethyst Purple", r: 155, g: 89, b: 182 },
  { name: "Malva", nameEn: "Mauve", r: 142, g: 68, b: 173 },
  { name: "Rosa Pastello", nameEn: "Pastel Pink", r: 255, g: 183, b: 178 },
  { name: "Rosa Salmone", nameEn: "Salmon Pink", r: 255, g: 204, b: 188 },
  { name: "Verde Erba Pastello", nameEn: "Pastel Grass Green", r: 181, g: 234, b: 215 },
  { name: "Celeste Polvere", nameEn: "Dusty Sky Blue", r: 199, g: 206, b: 234 },
  { name: "Nero Carbone", nameEn: "Charcoal Black", r: 24, g: 23, b: 23 },
  { name: "Grigio Ardesia", nameEn: "Slate Grey", r: 46, g: 52, b: 64 },
  { name: "Grigio Chiaro", nameEn: "Light Grey", r: 216, g: 222, b: 233 },
  { name: "Bianco Ghiaccio", nameEn: "Ice White", r: 248, g: 249, b: 250 },
  { name: "Lavanda Dolce", nameEn: "Soft Lavender", r: 118, g: 120, b: 237 },
  { name: "Blu Elettrico", nameEn: "Electric Blue", r: 33, g: 118, b: 255 },
  { name: "Giallo Ocra", nameEn: "Ochre Yellow", r: 253, g: 202, b: 64 },
  { name: "Arancio Zucca", nameEn: "Pumpkin Orange", r: 247, g: 152, b: 36 }
];

const PRESETS = [
  { name: "Sogno Pastello", nameEn: "Pastel Dream", colors: ["#FFB7B2", "#FFDAC1", "#E2F0CB", "#B5EAD7", "#C7CEEA"] },
  { name: "Tramonto Caldo", nameEn: "Warm Sunset", colors: ["#264653", "#2A9D8F", "#E9C46A", "#F4A261", "#E76F51"] },
  { name: "Ardesia Nordica", nameEn: "Nordic Slate", colors: ["#2E3440", "#3B4252", "#434C5E", "#4C566A", "#D8DEE9"] },
  { name: "Cyberpunk Neon", nameEn: "Cyberpunk Neon", colors: ["#0B0C10", "#1F2833", "#C5C6C7", "#66FCF1", "#45A29E"] },
  { name: "Brezza Marina", nameEn: "Sea Breeze", colors: ["#003F5C", "#2F5C73", "#587A8C", "#8099A6", "#A8B9C2"] },
  { name: "Sabbie Calde", nameEn: "Warm Sands", colors: ["#EAE2B7", "#FCBF49", "#F77F00", "#D62828", "#003049"] },
  { name: "Foresta Profonda", nameEn: "Deep Forest", colors: ["#14362E", "#335C4E", "#608066", "#8EB295", "#CFE0C3"] },
  { name: "Dolce Lavanda", nameEn: "Sweet Lavender", colors: ["#3D348B", "#7678ED", "#F7B801", "#F18701", "#F35B04"] }
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

  function hexToRgb(hex) {
    const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return r ? {
      r: parseInt(r[1], 16),
      g: parseInt(r[2], 16),
      b: parseInt(r[3], 16)
    } : null;
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

  function getColorName(hex) {
    const rgb = hexToRgb(hex);
    if (!rgb) return t("tool.unknownColor");
    let minDistance = Infinity;
    let closestName = t("tool.genericColor");
    const useEn = currentLang() === "en";
    for (const item of COLOR_NAMES) {
      const d = Math.sqrt(
        Math.pow(rgb.r - item.r, 2) +
        Math.pow(rgb.g - item.g, 2) +
        Math.pow(rgb.b - item.b, 2)
      );
      if (d < minDistance) {
        minDistance = d;
        closestName = useEn ? item.nameEn : item.name;
      }
    }
    return closestName;
  }

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
    generateRandomPalette(true);
  }

  function updateUrl() {
    const colorsString = palette.map(c => c.hex.replace("#", "")).join("-");
    const newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + "?colors=" + colorsString;
    window.history.replaceState({ path: newurl }, "", newurl);
  }

  function generateRandomPalette(forceAll = false) {
    const mode = modeSelect?.value ?? "random";
    const lockedColors = forceAll ? [] : palette.filter(c => c.locked);
    let seedHsl;

    if (lockedColors.length > 0) {
      const randomSeed = lockedColors[Math.floor(Math.random() * lockedColors.length)].hex;
      seedHsl = hexToHsl(randomSeed);
    } else {
      seedHsl = {
        h: Math.floor(Math.random() * 360),
        s: 50 + Math.floor(Math.random() * 30), // 50% - 80%
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
            25 + Math.floor(Math.random() * 15),
            75 + Math.floor(Math.random() * 12)
          );
          break;

        case "neon":
          nextHex = hslToHex(
            Math.floor(Math.random() * 360),
            88 + Math.floor(Math.random() * 12),
            50 + Math.floor(Math.random() * 8)
          );
          break;

        case "monochromatic":
          nextHex = hslToHex(
            seedHsl.h,
            Math.max(10, Math.min(100, seedHsl.s + (index - 2) * 15 + (Math.random() * 10 - 5))),
            Math.max(15, Math.min(85, seedHsl.l + (index - 2) * 12 + (Math.random() * 10 - 5)))
          );
          break;

        case "analogous":
          nextHex = hslToHex(
            (seedHsl.h + (index - 2) * 20 + 360) % 360,
            seedHsl.s,
            seedHsl.l + (Math.random() * 10 - 5)
          );
          break;

        case "complementary": {
          const baseHue = (index % 2 === 0) ? seedHsl.h : (seedHsl.h + 180) % 360;
          nextHex = hslToHex(
            baseHue,
            seedHsl.s - (index * 5),
            Math.max(25, Math.min(75, seedHsl.l + (index - 2) * 10))
          );
          break;
        }

        case "triadic": {
          const triadicHue = (seedHsl.h + (index % 3) * 120) % 360;
          nextHex = hslToHex(
            triadicHue,
            seedHsl.s,
            seedHsl.l + (index - 2) * 8
          );
          break;
        }

        case "random":
        default:
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

  function renderPalette() {
    cardsContainer.innerHTML = "";

    palette.forEach((color) => {
      const isLight = isLightColor(color.hex);
      const card = document.createElement("div");
      card.className = `color-card ${isLight ? "light-color" : ""}`;
      card.style.backgroundColor = color.hex;

      card.innerHTML = `
        <div class="color-card-actions">
          <button class="card-action-btn lock-btn ${color.locked ? "is-locked" : ""}" title="${color.locked ? t("tool.unlockColor") : t("tool.lockColor")}">
            <i class="fas ${color.locked ? "fa-lock" : "fa-lock-open"}" aria-hidden="true"></i>
          </button>
          
          <button class="card-action-btn copy-btn" title="${t("tool.copyHex")}">
            <i class="far fa-copy" aria-hidden="true"></i>
          </button>

          <button class="card-action-btn shades-btn" title="${t("tool.seeShades")}">
            <i class="fas fa-th" aria-hidden="true"></i>
          </button>
          
          <div class="color-picker-wrapper card-action-btn" title="${t("tool.adjustColor")}">
            <i class="fas fa-sliders-h" aria-hidden="true"></i>
            <input type="color" class="color-picker-input" value="${color.hex}">
          </div>
        </div>
        
        <div class="color-card-info">
          <span class="color-card-name">${getColorName(color.hex)}</span>
          <span class="color-card-hex">${color.hex.toUpperCase()}</span>
        </div>

        <!-- Shades Dropdown Panel -->
        <div class="shades-panel">
          <div class="shades-header">
            <span>Sfumature Tonalità</span>
            <button class="close-shades-btn"><i class="fas fa-times" aria-hidden="true"></i></button>
          </div>
          <div class="shades-list"></div>
        </div>
      `;

      const lockBtn = card.querySelector(".lock-btn");
      const copyBtn = card.querySelector(".copy-btn");
      const shadesBtn = card.querySelector(".shades-btn");
      const hexText = card.querySelector(".color-card-hex");
      const pickerInput = card.querySelector(".color-picker-input");
      const shadesPanel = card.querySelector(".shades-panel");
      const closeShadesBtn = card.querySelector(".close-shades-btn");

      lockBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        color.locked = !color.locked;
        const icon = lockBtn.querySelector("i");
        if (color.locked) {
          lockBtn.classList.add("is-locked");
          icon.className = "fas fa-lock";
          lockBtn.title = t("tool.unlockColor");
        } else {
          lockBtn.classList.remove("is-locked");
          icon.className = "fas fa-lock-open";
          lockBtn.title = t("tool.lockColor");
        }
      });

      function copyHexAction(e) {
        e.stopPropagation();
        navigator.clipboard.writeText(color.hex)
          .then(() => showTooltip(card, t("tool.copied"), 1200))
          .catch(err => console.error(err));
      }
      copyBtn.addEventListener("click", copyHexAction);
      hexText.addEventListener("click", copyHexAction);

      pickerInput.addEventListener("input", (e) => {
        color.hex = e.target.value;
        card.style.backgroundColor = color.hex;
        hexText.textContent = color.hex.toUpperCase();
        card.querySelector(".color-card-name").textContent = getColorName(color.hex);
        
        if (isLightColor(color.hex)) {
          card.classList.add("light-color");
        } else {
          card.classList.remove("light-color");
        }
        
        updateUrl();
        updateLiveMockup();
        updateContrastChecker();
      });

      pickerInput.addEventListener("change", () => {
        updateContrastCheckerOptions();
        updateContrastChecker();
      });

      shadesBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const hsl = hexToHsl(color.hex);
        const shadesList = shadesPanel.querySelector(".shades-list");
        shadesList.innerHTML = "";

        for (let i = 1; i <= 9; i++) {
          const l = i * 10;
          const shadeHex = hslToHex(hsl.h, hsl.s, l);
          const bar = document.createElement("div");
          bar.className = "shade-bar";
          bar.style.backgroundColor = shadeHex;
          bar.style.color = l > 45 ? "#1e293b" : "#ffffff";
          bar.innerHTML = `
            <span>${l}%</span>
            <span>${shadeHex.toUpperCase()}</span>
          `;

          bar.addEventListener("click", (e) => {
            e.stopPropagation();
            color.hex = shadeHex;
            shadesPanel.classList.remove("show-shades");
            renderPalette();
            updateUrl();
          });

          shadesList.appendChild(bar);
        }

        shadesPanel.classList.add("show-shades");
      });

      closeShadesBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        shadesPanel.classList.remove("show-shades");
      });

      cardsContainer.appendChild(card);
    });

    updateLiveMockup();
    updateContrastCheckerOptions();
    updateContrastChecker();
  }

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
        <span class="preset-name">${currentLang() === "en" ? preset.nameEn : preset.name}</span>
        <div class="preset-colors-row">
          ${barsHtml}
        </div>
      `;

      presetCard.addEventListener("click", () => {
        preset.colors.forEach((col, idx) => {
          palette[idx].hex = col;
          palette[idx].locked = false;
        });
        renderPalette();
        updateUrl();
      });

      presetsContainer.appendChild(presetCard);
    });
  }

  function updateLiveMockup() {
    const mockupBody = document.getElementById("live-mockup-body");
    const mockupNav = document.getElementById("mockup-nav");
    const heroTitle = document.getElementById("mockup-hero-title");
    const heroText = document.getElementById("mockup-hero-text");
    const heroBtn = document.getElementById("mockup-hero-btn");
    const cardBody = document.getElementById("mockup-card-body");
    const cardBadge = document.getElementById("mockup-card-badge");

    if (!mockupBody || !mockupNav || !heroTitle || !heroBtn || !cardBody) return;

    const c1 = palette[0].hex; // Background navbar
    const c2 = palette[1].hex; // Logos, badge and hero text
    const c3 = palette[2].hex; // CTA Button
    const c4 = palette[3].hex; // Card background
    const c5 = palette[4].hex; // Main body background

    mockupBody.style.backgroundColor = c5;
    mockupBody.style.color = isLightColor(c5) ? "#1e293b" : "#f8fafc";
    heroText.style.color = isLightColor(c5) ? "rgba(30, 41, 59, 0.7)" : "rgba(248, 250, 252, 0.7)";

    mockupNav.style.backgroundColor = c1;
    mockupNav.style.color = isLightColor(c1) ? "#1e293b" : "#ffffff";
    mockupNav.querySelectorAll(".mockup-link").forEach(l => {
      l.style.color = isLightColor(c1) ? "rgba(30, 41, 59, 0.8)" : "rgba(255, 255, 255, 0.8)";
    });

    heroTitle.style.color = c2;

    heroBtn.style.backgroundColor = c3;
    heroBtn.style.color = isLightColor(c3) ? "#1e293b" : "#ffffff";

    cardBody.style.backgroundColor = c4;
    cardBody.style.color = isLightColor(c4) ? "#1e293b" : "#ffffff";
    const cardP = cardBody.querySelector("p");
    if (cardP) {
      cardP.style.color = isLightColor(c4) ? "rgba(30, 41, 59, 0.7)" : "rgba(255, 255, 255, 0.6)";
    }

    cardBadge.style.backgroundColor = c2;
    cardBadge.style.color = isLightColor(c2) ? "#1e293b" : "#ffffff";
  }

  function updateContrastCheckerOptions() {
    if (!bgSelect || !textSelect) return;
    
    const bgVal = bgSelect.value;
    const textVal = textSelect.value;

    bgSelect.innerHTML = "";
    textSelect.innerHTML = "";

    palette.forEach((color, idx) => {
      const optBg = document.createElement("option");
      optBg.value = color.hex;
      optBg.textContent = t("tool.colorN", { n: idx + 1, hex: color.hex.toUpperCase() });
      bgSelect.appendChild(optBg);

      const optText = document.createElement("option");
      optText.value = color.hex;
      optText.textContent = t("tool.colorN", { n: idx + 1, hex: color.hex.toUpperCase() });
      textSelect.appendChild(optText);
    });

    if (palette.some(c => c.hex === bgVal)) bgSelect.value = bgVal;
    else bgSelect.selectedIndex = 0;

    if (palette.some(c => c.hex === textVal)) textSelect.value = textVal;
    else textSelect.selectedIndex = 4;
  }

  function updateContrastChecker() {
    if (!bgSelect || !textSelect || !previewBox || !scoreDetails) return;

    const bgHex = bgSelect.value;
    const textHex = textSelect.value;

    previewBox.style.backgroundColor = bgHex;
    previewBox.style.color = textHex;

    const ratio = calculateContrast(bgHex, textHex);

    const aaNormal = ratio >= 4.5;
    const aaaNormal = ratio >= 7.0;
    const aaLarge = ratio >= 3.0;
    const aaaLarge = ratio >= 4.5;

    const level = (label, grade, passes) => `
        <div class="level-item">
          ${label} (${grade}):
          <span class="${passes ? "level-pass" : "level-fail"}">
            <i class="fas ${passes ? "fa-check-circle" : "fa-times-circle"}" aria-hidden="true"></i> ${passes ? t("tool.contrastPass") : t("tool.contrastFail")}
          </span>
        </div>`;

    const normal = t("tool.contrastNormal");
    const large = t("tool.contrastLarge");

    scoreDetails.innerHTML = `
      <span class="contrast-ratio-badge">${ratio.toFixed(2)}:1</span>
      <div class="contrast-level-badge">
${level(normal, "AA", aaNormal)}
${level(normal, "AAA", aaaNormal)}
${level(large, "AA", aaLarge)}
${level(large, "AAA", aaaLarge)}
      </div>
    `;
  }

  function copyTextToClipboard(text, button, successMsg) {
    navigator.clipboard.writeText(text)
      .then(() => {
        showTooltip(button, successMsg, 1500);
      })
      .catch(err => {
        console.error(err);
        showTooltip(button, t("tool.copyError"), 1500);
      });
  }

  btnGenerate.addEventListener("click", () => generateRandomPalette());

  bgSelect.addEventListener("change", updateContrastChecker);
  textSelect.addEventListener("change", updateContrastChecker);

  btnCopyCss.addEventListener("click", () => {
    const cssVars = palette.map((col, idx) => `  --color-${idx + 1}: ${col.hex};`).join("\n");
    const output = `:root {\n${cssVars}\n}`;
    copyTextToClipboard(output, btnCopyCss, t("tool.cssCopied"));
  });

  btnCopyJson.addEventListener("click", () => {
    const jsonOutput = JSON.stringify(palette.map(c => c.hex), null, 2);
    copyTextToClipboard(jsonOutput, btnCopyJson, t("tool.jsonCopied"));
  });

  btnCopyLink.addEventListener("click", () => {
    copyTextToClipboard(window.location.href, btnCopyLink, t("tool.linkCopied"));
  });

  document.addEventListener("keydown", (e) => {
    const targetTag = e.target.tagName.toLowerCase();
    if (targetTag === "input" || targetTag === "select" || targetTag === "textarea") {
      return;
    }

    if (e.code === "Space" || e.keyCode === 32) {
      e.preventDefault();
      generateRandomPalette();
    }
  });

  // Swatch names, action tooltips and preset names all come from t(), so the
  // language switch has no markup to copy them from. Both renderers work off
  // state the swap does not touch, so running them again relabels everything
  // without disturbing the palette on screen.
  window.addEventListener("codedge:lang-changed", () => {
    renderPalette();
    renderPresets();
  });

  loadPaletteFromUrl();
  renderPalette();
  renderPresets();
}
