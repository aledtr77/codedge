// src/components/js/estrattore-palette.js
// Nessuna dipendenza esterna. Wrap dell'IIFE originale in un init modulare.

let _inited = false;

export function initPaletteExtractor() {
  if (_inited) return;
  _inited = true;

  const $ = (id) => document.getElementById(id);

  // --- helpers colore ---
  const toHex = (n) => n.toString(16).padStart(2, "0");
  const rgbToHex = ({ r, g, b }) => "#" + toHex(r) + toHex(g) + toHex(b);

  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) { h = s = 0; }
    else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        default: h = (r - g) / d + 4;
      }
      h /= 6;
    }
    return { h: Math.round(360 * h), s: Math.round(100 * s), l: Math.round(100 * l) };
  }

  function luminance({ r, g, b }) {
    const v = [r, g, b].map((x) => x / 255).map((x) =>
      x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4)
    );
    return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
  }
  function contrastRatio(a, b) {
    const la = luminance(a), lb = luminance(b);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
  }
  function pickTextColor(rgb) {
    const white = { r: 255, g: 255, b: 255 }, black = { r: 0, g: 0, b: 0 };
    const cw = contrastRatio(rgb, white), cb = contrastRatio(rgb, black);
    return cw >= cb ? { hex: "#ffffff", ratio: cw, rgb: white } : { hex: "#000000", ratio: cb, rgb: black };
  }
  function hexToRgb(hex) {
    let h = hex.replace("#", "");
    if (h.length === 3) h = h.split("").map((c) => c + c).join("");
    return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
  }

  // --- refs UI ---
  const file = $("file");
  const drop = $("drop");
  const thumb = $("thumb");
  const analyzeBtn = $("analyze");
  const infoDim = $("info-dim");
  const avgBar = $("avg-bar");
  const avgVal = $("avg-val");
  const palette = $("palette");
  const roles = { bg: $("role-bg"), primary: $("role-primary"), accent: $("role-accent"), text: $("role-text") };
  const grads = $("grads");
  const exportInfo = $("export-info");
  const diag = $("diag");
  const copyCssBtn = $("copy-css");
  const copyJsonBtn = $("copy-json");
  const dlCssBtn = $("dl-css");
  const dlJsonBtn = $("dl-json");
  const demoBtn = $("demo");
  const resetBtn = $("reset");

  // stato
  let colors = []; // [{r,g,b,hex,count}]
  let roleSet = null; // { bg, primary, accent, text }

  // --- UI helpers ---
  function setThumb(src) {
    if (thumb) thumb.innerHTML = `<img alt="Anteprima immagine" src="${src}"/>`;
  }
  function loadImageFile(file) {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result);
      fr.onerror = reject;
      fr.readAsDataURL(file);
    });
  }
  function downloadText(filename, text) {
    const blob = new Blob([text], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  async function safeCopy(text) {
    try {
      if (!navigator.clipboard || !window.isSecureContext) throw new Error("clipboard non disponibile");
      await navigator.clipboard.writeText(text);
      return { ok: true, method: "clipboard" };
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.top = "-9999px";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.focus(); ta.select(); ta.setSelectionRange(0, ta.value.length);
        const ok = document.execCommand("copy");
        document.body.removeChild(ta);
        if (!ok) throw new Error("execCommand fallito");
        return { ok: true, method: "execCommand" };
      } catch (error) {
        return { ok: false, error };
      }
    }
  }

  // --- rendering ---
  function createGrad(label, from, to, title) {
    const pill = document.createElement("div");
    pill.className = "grad-pill";
    pill.setAttribute("role", "button");
    pill.tabIndex = 0;
    pill.innerHTML = `
      <span class="grad-chip" style="background:${from}"></span>
      <span class="label">${label}</span>
      <span class="grad-chip" style="background:${to}"></span>
    `;
    pill.style.background = `linear-gradient(90deg, ${from}, ${to})`;
    pill.style.color = pickTextColor(hexToRgb(from)).hex;
    pill.dataset.from = from;
    pill.dataset.to = to;
    pill.dataset.label = label;
    pill.title = (title || label) + " — " + from + " → " + to + " (clicca per copiare CSS)";
    return pill;
  }

  function cssVariables() {
    if (!colors.length) return "";
    const rows = [":root {"];
    colors.forEach((c, i) => rows.push(`  --color-${i + 1}: ${c.hex};`));
    if (roleSet) {
      rows.push(
        `  --bg: ${roleSet.bg.hex};`,
        `  --primary: ${roleSet.primary.hex};`,
        `  --accent: ${roleSet.accent.hex};`,
        `  --text: ${roleSet.text.hex};`,
      );
    }
    rows.push(
      "}",
      "",
      "/* Esempio d'uso */",
      "body { background: var(--bg); color: var(--text); }",
      ".btn-primary { background: var(--primary); color: var(--text); }",
      ".btn-accent { background: var(--accent); color: var(--text); }",
    );
    return rows.join("\n");
  }

  function asJSON() {
    return JSON.stringify({
      palette: colors.map((c) => ({ hex: c.hex, rgb: { r: c.r, g: c.g, b: c.b } })),
      roles: roleSet
        ? { bg: roleSet.bg.hex, primary: roleSet.primary.hex, accent: roleSet.accent.hex, text: roleSet.text.hex }
        : null,
    }, null, 2);
  }

  // --- analisi ---
  function drawAndSample(imgEl) {
    const canvas = $("canvas");
    const ctx = canvas.getContext("2d");
    const scale = Math.min(1, 500 / Math.max(imgEl.width, imgEl.height));
    const w = Math.max(1, Math.round(imgEl.width * scale));
    const h = Math.max(1, Math.round(imgEl.height * scale));
    canvas.width = w; canvas.height = h;
    ctx.drawImage(imgEl, 0, 0, w, h);
    const { data } = ctx.getImageData(0, 0, w, h);
    const pixels = [];
    const stride = Math.max(1, Math.floor((w * h) / 6000));
    let avgSum = 0, count = 0;
    for (let i = 0; i < data.length; i += 4 * stride) {
      if (data[i + 3] / 255 < 0.5) continue; // ignora trasparenze
      const r = data[i], g = data[i + 1], b = data[i + 2];
      pixels.push({ r, g, b });
      avgSum += (r + g + b) / 3;
      count++;
    }
    return { pixels, w, h, avg: Math.round(avgSum / Math.max(1, count)) };
  }

  function kmeans(pixels, k = 6, iters = 12) {
    if (!pixels.length) return [];
    const centers = [];
    const used = new Set();
    while (centers.length < k) {
      const idx = Math.floor(Math.random() * pixels.length);
      if (!used.has(idx)) { used.add(idx); centers.push({ ...pixels[idx] }); }
    }
    let assign = new Array(pixels.length).fill(0);
    for (let r = 0; r < iters; r++) {
      for (let i = 0; i < pixels.length; i++) {
        const p = pixels[i];
        let best = 0, bestDist = Infinity;
        for (let c = 0; c < centers.length; c++) {
          const cc = centers[c];
          const dist = (p.r - cc.r) ** 2 + (p.g - cc.g) ** 2 + (p.b - cc.b) ** 2;
          if (dist < bestDist) { bestDist = dist; best = c; }
        }
        assign[i] = best;
      }
      const acc = Array.from({ length: k }, () => ({ r: 0, g: 0, b: 0, count: 0 }));
      for (let i = 0; i < pixels.length; i++) {
        const p = pixels[i], a = acc[assign[i]];
        a.r += p.r; a.g += p.g; a.b += p.b; a.count++;
      }
      for (let c = 0; c < k; c++) {
        if (acc[c].count > 0) {
          centers[c] = {
            r: Math.round(acc[c].r / acc[c].count),
            g: Math.round(acc[c].g / acc[c].count),
            b: Math.round(acc[c].b / acc[c].count),
          };
        }
      }
    }
    const buckets = Array.from({ length: k }, (_, i) => ({ color: centers[i], count: 0 }));
    assign.forEach((idx) => buckets[idx].count++);
    return buckets.filter((b) => b.count > 0).sort((a, b) => b.count - a.count);
  }

  function renderPalette(clusters) {
    palette.innerHTML = "";
    colors = clusters.map((c) => ({ ...c.color, hex: rgbToHex(c.color), count: c.count }));
    colors.forEach((col, idx) => {
      const hsl = rgbToHsl(col.r, col.g, col.b);
      const tc = pickTextColor(col);
      const row = document.createElement("div");
      row.className = "swatch";
      row.innerHTML = `
        <div class="chip" style="background:${col.hex}"></div>
        <div class="meta">
          <div class="row">
            <span class="badge">#${String(idx + 1).padStart(2, "0")}</span>
            <span class="badge" style="background:${col.hex};color:${tc.hex}">Aa ${tc.ratio.toFixed(1)}:1</span>
          </div>
          <div class="mt8 mono">
            ${col.hex.toUpperCase()} • rgb(${col.r}, ${col.g}, ${col.b}) • hsl(${hsl.h} ${hsl.s}% ${hsl.l}%)
          </div>
        </div>
      `;
      row.setAttribute("role", "img");
      row.setAttribute("aria-label", `${col.hex.toUpperCase()} — rgb(${col.r}, ${col.g}, ${col.b})`);
      palette.appendChild(row);
    });
  }

  function pickRoles() {
    if (!colors.length) return;
    const getH = (c) => rgbToHsl(c.r, c.g, c.b).h;
    const hueDist = (a, b) => {
      const d = Math.abs(a - b); return Math.min(d, 360 - d);
    };
    const bg = colors[0] || { hex: "#ffffff", r: 255, g: 255, b: 255 };
    const primary = colors[1] || bg;
    const pool = colors.slice(2).length ? colors.slice(2) : colors;

    let candidates = pool.filter((c) => hueDist(getH(c), getH(bg)) >= 25 && hueDist(getH(c), getH(primary)) >= 25);
    if (!candidates.length) candidates = pool;
    candidates.sort((a, b) => Math.abs(contrastRatio(a, bg) - 4) - Math.abs(contrastRatio(b, bg) - 4));
    const accent = candidates[0] || primary;

    // testo: quello con contrasto max vs bg (min 3:1), altrimenti bianco/nero migliore
    let text = bg, best = -1;
    for (const c of colors) {
      const cr = contrastRatio(c, bg);
      if (rgbToHex(c) !== rgbToHex(bg) && cr > best) { best = cr; text = c; }
    }
    if (best < 3) {
      const forced = pickTextColor(bg);
      text = { hex: forced.hex, r: forced.rgb.r, g: forced.rgb.g, b: forced.rgb.b };
    }

    roleSet = { bg, primary, accent, text };
    ["bg", "primary", "accent", "text"].forEach((k) => {
      const el = roles[k];
      el.querySelector(".chip-role").style.background = roleSet[k].hex;
      el.querySelector(".role-hex").textContent = roleSet[k].hex;
      el.querySelector(".chip-role").setAttribute("aria-label", `Colore ${k} ${roleSet[k].hex}`);
    });

    // gradients
    renderGradients();
  }

  function renderGradients() {
    if (!colors.length || !roleSet) { grads.innerHTML = ""; return; }
    // coppia più distante
    let pair = [colors[0], colors[1]], maxd = 0;
    for (let i = 0; i < colors.length; i++) {
      for (let j = i + 1; j < colors.length; j++) {
        const d = Math.sqrt((colors[i].r - colors[j].r) ** 2 + (colors[i].g - colors[j].g) ** 2 + (colors[i].b - colors[j].b) ** 2);
        if (d > maxd) { maxd = d; pair = [colors[i], colors[j]]; }
      }
    }
    grads.innerHTML = "";
    grads.appendChild(createGrad("Contrasto forte", pair[0].hex, pair[1].hex, "I due colori più diversi della foto"));
    grads.appendChild(createGrad("Evidenza → Principale", roleSet.accent.hex, roleSet.primary.hex, "Dal colore di evidenza al principale"));
  }

  // --- eventi UI ---
  file?.addEventListener("change", async (ev) => {
    const f = ev.target.files && ev.target.files[0];
    if (f) setThumb(await loadImageFile(f));
  });

  drop?.addEventListener("dragover", (ev) => { ev.preventDefault(); drop.classList.add("dragover"); });
  drop?.addEventListener("dragleave", () => drop.classList.remove("dragover"));
  drop?.addEventListener("drop", async (ev) => {
    ev.preventDefault(); drop.classList.remove("dragover");
    const f = ev.dataTransfer.files && ev.dataTransfer.files[0];
    if (f) setThumb(await loadImageFile(f));
  });
  drop?.addEventListener("keydown", (ev) => {
    if (ev.key !== "Enter" && ev.key !== " ") return;
    ev.preventDefault(); file?.click();
  });

  analyzeBtn?.addEventListener("click", async () => {
    const img = thumb?.querySelector("img");
    if (!img) { exportInfo.textContent = "Carica prima un'immagine (o usa la demo)."; return; }
    analyzeBtn.disabled = true; exportInfo.textContent = "Analizzo…";
    try {
      const { clusters } = await new Promise((resolve, reject) => {
        const tmp = new Image();
        tmp.crossOrigin = "anonymous";
        tmp.onload = () => {
          infoDim.textContent = `${tmp.naturalWidth}×${tmp.naturalHeight}px`;
          setThumb(img.src);
          const { pixels, avg } = drawAndSample(tmp);
          avgBar.style.width = `${((avg / 255) * 100).toFixed(0)}%`;
          avgVal.textContent = `${avg} / 255`;
          $("avg-bar-outer")?.setAttribute("aria-valuenow", String(avg));
          const clusters = kmeans(pixels, 6, 12);
          resolve({ clusters });
        };
        tmp.onerror = reject;
        tmp.src = img.src;
      });
      renderPalette(clusters);
      pickRoles();
      exportInfo.textContent = "Pronto!";
    } catch (err) {
      console.error(err);
      exportInfo.textContent = "Errore analisi immagine.";
    } finally {
      analyzeBtn.disabled = false;
    }
  });

  copyCssBtn?.addEventListener("click", async () => {
    if (!colors.length) { exportInfo.textContent = "Genera la palette prima."; return; }
    const txt = cssVariables();
    const res = await safeCopy(txt);
    exportInfo.textContent = res.ok ? "CSS copiato ✅" : "Copia bloccata. Download…";
    if (!res.ok) downloadText("palette.css", txt);
  });

  copyJsonBtn?.addEventListener("click", async () => {
    if (!colors.length) { exportInfo.textContent = "Genera la palette prima."; return; }
    const txt = asJSON();
    const res = await safeCopy(txt);
    exportInfo.textContent = res.ok ? "JSON copiato ✅" : "Copia bloccata. Download…";
    if (!res.ok) downloadText("palette.json", txt);
  });

  dlCssBtn?.addEventListener("click", () => { if (colors.length) downloadText("palette.css", cssVariables()); });
  dlJsonBtn?.addEventListener("click", () => { if (colors.length) downloadText("palette.json", asJSON()); });

  grads?.addEventListener("click", async (ev) => {
    const pill = ev.target.closest(".grad-pill");
    if (!pill) return;
    const from = pill.dataset.from, to = pill.dataset.to, label = pill.dataset.label || "Gradiente";
    const css = `background: linear-gradient(90deg, ${from}, ${to});`;
    const res = await safeCopy(css);
    exportInfo.textContent = res.ok ? `Copiato: ${label} (${from} → ${to}) ✅` : "Copia bloccata. Download…";
    if (!res.ok) downloadText("gradient.css", css);
    pill.classList.remove("flash"); pill.offsetWidth; pill.classList.add("flash");
  });

  grads?.addEventListener("keydown", async (ev) => {
    if (ev.key !== "Enter" && ev.key !== " ") return;
    const pill = ev.target.closest(".grad-pill"); if (!pill) return;
    ev.preventDefault();
    const from = pill.dataset.from, to = pill.dataset.to, label = pill.dataset.label || "Gradiente";
    const css = `background: linear-gradient(90deg, ${from}, ${to});`;
    const res = await safeCopy(css);
    exportInfo.textContent = res.ok ? `Copiato: ${label} (${from} → ${to}) ✅` : "Copia bloccata. Download…";
    if (!res.ok) downloadText("gradient.css", css);
    pill.classList.remove("flash"); pill.offsetWidth; pill.classList.add("flash");
  });

  demoBtn?.addEventListener("click", () => {
    const svg = [
      '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500">',
      '<defs><linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">',
      '<stop offset="0%" stop-color="#0ea5e9"/>',
      '<stop offset="50%" stop-color="#22d3ee"/>',
      '<stop offset="100%" stop-color="#a78bfa"/>',
      "</linearGradient></defs>",
      '<rect width="100%" height="100%" fill="url(#g1)"/>',
      '<circle cx="200" cy="180" r="110" fill="#f59e0b"/>',
      '<circle cx="520" cy="320" r="140" fill="#ef4444"/>',
      "</svg>",
    ].join("");
    setThumb("data:image/svg+xml;utf8," + encodeURIComponent(svg));
  });

  resetBtn?.addEventListener("click", () => {
    thumb.innerHTML = '<span class="tiny">anteprima</span>';
    palette.innerHTML = '<div class="hint">Carica un\'immagine e premi “Estrai palette”.</div>';
    infoDim.textContent = "—";
    avgBar.style.width = "0%";
    avgVal.textContent = "—";
    $("avg-bar-outer")?.setAttribute("aria-valuenow", "0");
    grads.innerHTML = "";
    roleSet = null;
    colors = [];
    ["bg", "primary", "accent", "text"].forEach((k) => {
      roles[k].querySelector(".role-hex").textContent = "—";
      roles[k].querySelector(".chip-role").style.background = "";
    });
    exportInfo.textContent = "—";
  });

  // diagnostica
  try {
    console.assert(21 === Math.round(contrastRatio({ r:0,g:0,b:0 }, { r:255,g:255,b:255 })), "CR black/white=21");
    console.assert("#102030" === rgbToHex({ r:16, g:32, b:48 }), "hex ok");
    if (diag) diag.textContent = "Diagnostica: ok";
  } catch (err) {
    if (diag) diag.textContent = "Diagnostica: " + (err && err.message ? err.message : err);
  }
}
