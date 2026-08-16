import { t, currentLang } from "@/i18n/ui.js";
import { readableTextColor, contrastRatio } from "@/scripts/pages/tools/palette-extractor/palette-core.js";
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
  { name: "Verde Menta", nameEn: "Mint Green", r: 62, g: 180, b: 137 },
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

  // Which text this swatch can carry, decided by measuring rather than by a
  // threshold. `calculateLuminance(hex) > 0.45` was the old answer and it put
  // unreadable text on 36.7% of the colour space: a luminance cut-off says
  // which side of the middle a colour is on, not whether the text on it clears
  // 4.5:1. Asking the site's own readableTextColor — the one the palette
  // extractor exports and the contract tests pin — brings that to 0.00% across
  // 636,056 colours, because it falls back to pure black on the handful where
  // its softer black does not make it.
  //
  // It matters more here than anywhere else on the site: this is the tool that
  // tells people what contrast is.
  const WHITE_INK = { hex: "#ffffff", r: 255, g: 255, b: 255 };
  const BLACK_INK = { hex: "#000000", r: 0, g: 0, b: 0 };
  // Half a point of margin over the 4.5 line. readableTextColor accepts its
  // softer black the moment it clears 4.5, and on a handful of colours that
  // lands at 4.55 — which measures as 4.49 once the browser has rounded the
  // background it actually painted. A tool about contrast should not ship
  // results that sit on the threshold, so anything under 5 falls back to the
  // best of pure white and pure black.
  function inkFor(hex) {
    const rgb = hexToRgb(hex);
    if (!rgb) return { ...WHITE_INK, ratio: 21 };
    const ink = readableTextColor(rgb);
    if (ink.ratio >= 5) return ink;
    const onWhite = contrastRatio(rgb, WHITE_INK);
    const onBlack = contrastRatio(rgb, BLACK_INK);
    return onWhite >= onBlack
      ? { ...WHITE_INK, ratio: onWhite }
      : { ...BLACK_INK, ratio: onBlack };
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

  // A shared link is user input like any other. Six hex digits per colour, one
  // per swatch, or the link is ignored and the tool opens on something it can
  // actually paint — `?colors=zzzzzz-...` used to reach the cards and render
  // them transparent, labelled #ZZZZZZ.
  function loadPaletteFromUrl() {
    const colorsParam = new URLSearchParams(window.location.search).get("colors");
    const parsed = (colorsParam || "").split("-");

    if (parsed.length === palette.length && parsed.every(c => /^[0-9a-f]{6}$/i.test(c))) {
      parsed.forEach((hex, index) => {
        palette[index].hex = `#${hex.toLowerCase()}`;
        palette[index].locked = false;
      });
      return true;
    }

    generateRandomPalette(true, { render: false });
    return false;
  }

  function paletteUrl() {
    const colorsString = palette.map(c => c.hex.replace("#", "")).join("-");
    return `${window.location.protocol}//${window.location.host}${window.location.pathname}?colors=${colorsString}`;
  }

  // Dragging a colour picker fires input continuously, and each one used to
  // write the address bar: sixty writes for one drag of the hand. Safari stops
  // answering after a hundred replaceState calls in thirty seconds and throws
  // instead, so a long drag there breaks the tool. Discrete actions write
  // straight away; a drag settles first.
  let urlTimer = null;
  function updateUrl() {
    window.clearTimeout(urlTimer);
    urlTimer = null;
    window.history.replaceState({ path: paletteUrl() }, "", paletteUrl());
  }

  function scheduleUrlUpdate() {
    window.clearTimeout(urlTimer);
    urlTimer = window.setTimeout(updateUrl, 250);
  }

  function generateRandomPalette(forceAll = false, { render = true } = {}) {
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

    if (render) {
      paintPalette();
      // Coalesced: one held-down Space key generates a palette per frame, and
      // writing the address bar costs 6.6ms of frame time every time it runs.
      scheduleUrlUpdate();
    }
  }

  // The five cards are built once and repainted afterwards.
  //
  // Rebuilding the container from innerHTML on every generate cost 7.7ms and
  // dropped the page to 25fps when the key was held down — and it threw away
  // the DOM under any native colour picker that happened to be open. Nothing
  // about a new palette changes the structure: five cards, same controls, new
  // colours.
  const cards = [];

  function buildCards() {
    cardsContainer.replaceChildren();
    cards.length = 0;

    palette.forEach((color, index) => {
      const card = document.createElement("div");
      card.className = "color-card";
      card.innerHTML = `
        <div class="color-card-actions">
          <button class="card-action-btn lock-btn" type="button" aria-pressed="false">
            <i class="fas fa-lock-open" aria-hidden="true"></i>
          </button>

          <button class="card-action-btn copy-btn" type="button">
            <i class="far fa-copy" aria-hidden="true"></i>
          </button>

          <button class="card-action-btn shades-btn" type="button" aria-expanded="false">
            <i class="fas fa-th" aria-hidden="true"></i>
          </button>

          <div class="color-picker-wrapper card-action-btn">
            <i class="fas fa-sliders-h" aria-hidden="true"></i>
            <input type="color" class="color-picker-input">
          </div>
        </div>

        <div class="color-card-info">
          <span class="color-card-name"></span>
          <span class="color-card-hex"></span>
        </div>

        <!-- Shades Dropdown Panel -->
        <div class="shades-panel">
          <div class="shades-header">
            <span class="shades-title"></span>
            <button class="close-shades-btn" type="button"><i class="fas fa-times" aria-hidden="true"></i></button>
          </div>
          <div class="shades-list"></div>
        </div>
      `;

      const parts = {
        element: card,
        lockBtn: card.querySelector(".lock-btn"),
        lockIcon: card.querySelector(".lock-btn i"),
        copyBtn: card.querySelector(".copy-btn"),
        shadesBtn: card.querySelector(".shades-btn"),
        pickerWrapper: card.querySelector(".color-picker-wrapper"),
        picker: card.querySelector(".color-picker-input"),
        name: card.querySelector(".color-card-name"),
        hex: card.querySelector(".color-card-hex"),
        shadesPanel: card.querySelector(".shades-panel"),
        shadesTitle: card.querySelector(".shades-title"),
        shadesList: card.querySelector(".shades-list"),
        closeShadesBtn: card.querySelector(".close-shades-btn")
      };

      // Bound once, for the life of the page: they read the slot by index, so a
      // new palette needs no rebinding.
      parts.lockBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        palette[index].locked = !palette[index].locked;
        paintLock(index);
      });

      const copyHexAction = (e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(palette[index].hex)
          .then(() => showTooltip(card, t("tool.copied"), 1200))
          .catch(err => console.error(err));
      };
      parts.copyBtn.addEventListener("click", copyHexAction);
      parts.hex.addEventListener("click", copyHexAction);

      parts.picker.addEventListener("input", (e) => {
        palette[index].hex = e.target.value;
        paintCard(index);
        // The checker is pointed at a swatch, not at a colour: it has to follow
        // this one while it changes rather than go on reporting the colour that
        // used to be there until the picker is closed.
        syncCheckerOption(index);
        updateContrastChecker();
        updateLiveMockup();
        scheduleUrlUpdate();
      });

      parts.picker.addEventListener("change", scheduleUrlUpdate);

      parts.shadesBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        openShades(index);
      });

      parts.closeShadesBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        closeShades(index);
      });

      cards.push(parts);
      cardsContainer.appendChild(card);
    });
  }

  function paintLock(index) {
    const { locked } = palette[index];
    const card = cards[index];
    card.lockBtn.classList.toggle("is-locked", locked);
    card.lockBtn.setAttribute("aria-pressed", String(locked));
    card.lockBtn.title = locked ? t("tool.unlockColor") : t("tool.lockColor");
    card.lockBtn.setAttribute("aria-label", card.lockBtn.title);
    card.lockIcon.className = `fas ${locked ? "fa-lock" : "fa-lock-open"}`;
  }

  function paintCard(index) {
    const color = palette[index];
    const card = cards[index];
    const ink = inkFor(color.hex);

    card.element.style.backgroundColor = color.hex;
    card.element.style.setProperty("--card-ink", ink.hex);
    card.element.classList.toggle("light-color", ink.r + ink.g + ink.b < 384);
    card.name.textContent = getColorName(color.hex);
    card.hex.textContent = color.hex.toUpperCase();
    // Never while the visitor is inside the native picker: assigning the value
    // it already holds is what makes a colour input jump under the pointer.
    if (card.picker.value !== color.hex) card.picker.value = color.hex;

    card.copyBtn.title = t("tool.copyHex");
    card.copyBtn.setAttribute("aria-label", t("tool.copyHex"));
    card.shadesBtn.title = t("tool.seeShades");
    card.shadesBtn.setAttribute("aria-label", t("tool.seeShades"));
    card.pickerWrapper.title = t("tool.adjustColor");
    card.picker.setAttribute("aria-label", t("tool.adjustColor"));
    card.shadesTitle.textContent = t("tool.shades");
    card.closeShadesBtn.setAttribute("aria-label", t("tool.closeShades"));
    paintLock(index);
  }

  function paintPalette() {
    if (!cards.length) buildCards();
    palette.forEach((_, index) => paintCard(index));
    updateLiveMockup();
    updateContrastCheckerOptions();
    updateContrastChecker();
  }

  function openShades(index) {
    const card = cards[index];
    const hsl = hexToHsl(palette[index].hex);
    const bars = [];

    for (let i = 1; i <= 9; i++) {
      const l = i * 10;
      const shadeHex = hslToHex(hsl.h, hsl.s, l);
      const bar = document.createElement("div");
      bar.className = "shade-bar";
      bar.style.backgroundColor = shadeHex;
      // Measured, not guessed. `l > 45 ? dark : white` is the luminance
      // threshold this file already replaced everywhere else, and it survived
      // here because the panel is shut when anything audits the page: on a pure
      // blue at 50% lightness it put 1.70:1 text on the bar.
      bar.style.color = inkFor(shadeHex).hex;

      const level = document.createElement("span");
      level.textContent = `${l}%`;
      const value = document.createElement("span");
      value.textContent = shadeHex.toUpperCase();
      bar.append(level, value);

      bar.addEventListener("click", (e) => {
        e.stopPropagation();
        palette[index].hex = shadeHex;
        closeShades(index);
        paintCard(index);
        syncCheckerOption(index);
        updateContrastChecker();
        updateLiveMockup();
        scheduleUrlUpdate();
      });

      bars.push(bar);
    }

    card.shadesList.replaceChildren(...bars);
    card.shadesPanel.classList.add("show-shades");
    card.shadesBtn.setAttribute("aria-expanded", "true");
  }

  function closeShades(index) {
    cards[index].shadesPanel.classList.remove("show-shades");
    cards[index].shadesBtn.setAttribute("aria-expanded", "false");
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
        paintPalette();
        scheduleUrlUpdate();
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

    // The mockup is the tool showing what the palette looks like in use, so the
    // text it puts on each colour is the tool's own choice and has to clear
    // 4.5:1 like the swatches do. It went through the same luminance threshold
    // and failed on the same colours — nav labels at 3.46:1 among them.
    const inkBody = inkFor(c5);
    const inkNav = inkFor(c1);
    const inkBtn = inkFor(c3);
    const inkCard = inkFor(c4);

    mockupBody.style.backgroundColor = c5;
    mockupBody.style.color = inkBody.hex;
    heroText.style.color = inkBody.hex;

    mockupNav.style.backgroundColor = c1;
    mockupNav.style.color = inkNav.hex;
    mockupNav.querySelectorAll(".mockup-link").forEach(l => {
      l.style.color = inkNav.hex;
    });

    heroTitle.style.color = c2;

    heroBtn.style.backgroundColor = c3;
    heroBtn.style.color = inkBtn.hex;

    cardBody.style.backgroundColor = c4;
    cardBody.style.color = inkCard.hex;
    const cardP = cardBody.querySelector("p");
    if (cardP) {
      cardP.style.color = inkCard.hex;
    }

    cardBadge.style.backgroundColor = c2;
    cardBadge.style.color = inkFor(c2).hex;
  }

  // A visitor points the checker at *swatches* — "the third against the fifth"
  // — not at hex values. Restoring the selection by value meant every generate
  // changed the pair under them, because none of the old hexes existed any
  // more: picking 3 against 5 and hitting generate silently became 1 against 5.
  function updateContrastCheckerOptions() {
    if (!bgSelect || !textSelect) return;

    const chosen = {
      bg: bgSelect.options.length ? bgSelect.selectedIndex : 0,
      text: textSelect.options.length ? textSelect.selectedIndex : palette.length - 1
    };

    // Rewritten in place, not rebuilt. Replacing the options means two native
    // select widgets are torn down and reassembled on every generate, which is
    // most of what the browser was doing: holding the key down ran at 27fps
    // with five swatches on screen.
    for (const select of [bgSelect, textSelect]) {
      if (select.options.length !== palette.length) {
        select.replaceChildren(...palette.map(() => document.createElement("option")));
      }
      palette.forEach((color, idx) => {
        const option = select.options[idx];
        const label = t("tool.colorN", { n: idx + 1, hex: color.hex.toUpperCase() });
        if (option.value !== color.hex) option.value = color.hex;
        if (option.textContent !== label) option.textContent = label;
      });
    }

    bgSelect.selectedIndex = clampIndex(chosen.bg);
    textSelect.selectedIndex = clampIndex(chosen.text);
  }

  function clampIndex(index) {
    return Math.min(Math.max(index, 0), palette.length - 1);
  }

  // One slot changed, so one option in each list is rewritten: rebuilding both
  // lists on every event of a picker drag would close a native select the
  // moment it was opened, and lose the selection with it.
  function syncCheckerOption(index) {
    if (!bgSelect || !textSelect) return;
    const label = t("tool.colorN", { n: index + 1, hex: palette[index].hex.toUpperCase() });
    for (const select of [bgSelect, textSelect]) {
      const option = select.options[index];
      if (!option) continue;
      option.value = palette[index].hex;
      option.textContent = label;
    }
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
    // The write is coalesced, so the address bar may still be a moment behind
    // the palette on screen. Flush it before reading, or the link that gets
    // shared is the previous palette's.
    updateUrl();
    copyTextToClipboard(window.location.href, btnCopyLink, t("tool.linkCopied"));
  });

  // Space generates — unless something is focused that Space already means
  // something to. It used to check the tag name only, which left every button
  // on the page broken for anyone using a keyboard: focusing a lock and
  // pressing Space regenerated the palette instead of locking the colour, so
  // the one swatch the visitor was trying to keep was the first one thrown
  // away. Copy CSS, Share, the shade panels and the presets went the same way.
  document.addEventListener("keydown", (e) => {
    if (e.code !== "Space" && e.keyCode !== 32) return;
    if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;
    if (e.target.closest("button, input, select, textarea, a[href], [contenteditable], [role='button']")) return;

    e.preventDefault();
    generateRandomPalette();
  });

  // Swatch names, action tooltips and preset names all come from t(), so the
  // language switch has no markup to copy them from. Both renderers work off
  // state the swap does not touch, so running them again relabels everything
  // without disturbing the palette on screen.
  window.addEventListener("codedge:lang-changed", () => {
    paintPalette();
    renderPresets();
  });

  // loadPaletteFromUrl only decides what the palette is; painting it is this
  // line's job. It used to generate *and* paint, and then the page painted a
  // second time here — five cards built twice on every plain arrival.
  // A rejected link leaves its own text in the address bar, which would then be
  // shared again and rejected again; the tool writes back what it actually
  // painted.
  const cameFromUrl = loadPaletteFromUrl();
  paintPalette();
  if (!cameFromUrl) updateUrl();
  renderPresets();
}
