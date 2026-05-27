const MAX_FILE_SIZE = 12 * 1024 * 1024;
const MAX_ANALYSIS_SIDE = 760;
const MAX_BUCKETS = 12000;
const ACCEPTED_IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/bmp",
]);
const D65 = { x: 0.95047, y: 1, z: 1.08883 };

let inited = false;

export function initPaletteExtractor() {
  if (inited) return;
  inited = true;

  const refs = {
    fileInput: document.querySelector("#fileInput"),
    dropzone: document.querySelector("#dropzone"),
    previewFrame: document.querySelector("#previewFrame"),
    cameraBtn: document.querySelector("#cameraBtn"),
    captureBtn: document.querySelector("#captureBtn"),
    closeCameraBtn: document.querySelector("#closeCameraBtn"),
    cameraActions: document.querySelector("#cameraActions"),
    analyzeBtn: document.querySelector("#analyzeBtn"),
    demoBtn: document.querySelector("#demoBtn"),
    resetBtn: document.querySelector("#resetBtn"),
    paletteSize: document.querySelector("#paletteSize"),
    paletteSizeValue: document.querySelector("#paletteSizeValue"),
    paletteGrid: document.querySelector("#paletteGrid"),
    rolesList: document.querySelector("#rolesList"),
    contrastCard: document.querySelector("#contrastCard"),
    imageSize: document.querySelector("#imageSize"),
    averageColor: document.querySelector("#averageColor"),
    pixelCount: document.querySelector("#pixelCount"),
    status: document.querySelector("#status"),
    copyCssBtn: document.querySelector("#copyCssBtn"),
    copyJsonBtn: document.querySelector("#copyJsonBtn"),
    downloadCssBtn: document.querySelector("#downloadCssBtn"),
    downloadJsonBtn: document.querySelector("#downloadJsonBtn"),
    codePreview: document.querySelector("#codePreview"),
  };

  if (!refs.analyzeBtn || !refs.paletteGrid) return;

  let currentSource = null;
  let currentResult = null;
  let cameraStream = null;
  let currentObjectUrl = null;

  resetRoles();

  refs.paletteSize?.addEventListener("input", () => {
    refs.paletteSizeValue.value = refs.paletteSize.value;
  });

  refs.fileInput?.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file || !isValidImageFile(file)) return;
    stopCamera();
    await setSource(URL.createObjectURL(file), { objectUrl: true });
  });

  refs.dropzone?.addEventListener("dragover", (event) => {
    event.preventDefault();
    refs.dropzone.classList.add("is-dragging");
  });

  refs.dropzone?.addEventListener("dragleave", () => {
    refs.dropzone.classList.remove("is-dragging");
  });

  refs.dropzone?.addEventListener("drop", async (event) => {
    event.preventDefault();
    refs.dropzone.classList.remove("is-dragging");
    const file = event.dataTransfer.files?.[0];
    if (!file || !isValidImageFile(file)) return;
    stopCamera();
    await setSource(URL.createObjectURL(file), { objectUrl: true });
  });

  refs.dropzone?.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    refs.fileInput?.click();
  });

  refs.cameraBtn?.addEventListener("click", startCamera);
  refs.captureBtn?.addEventListener("click", captureFromCamera);
  refs.closeCameraBtn?.addEventListener("click", () => {
    stopCamera();
    if (!currentSource) renderEmptyPreview();
    setStatus("Fotocamera chiusa");
  });
  refs.analyzeBtn.addEventListener("click", () => runAnalysis());
  refs.demoBtn?.addEventListener("click", async () => {
    stopCamera();
    await setSource(createDemoImage());
    await runAnalysis();
  });
  refs.resetBtn?.addEventListener("click", resetApp);
  refs.copyCssBtn?.addEventListener("click", () => copyExport("css"));
  refs.copyJsonBtn?.addEventListener("click", () => copyExport("json"));
  refs.downloadCssBtn?.addEventListener("click", () => downloadExport("palette.css", getCss()));
  refs.downloadJsonBtn?.addEventListener("click", () => downloadExport("palette.json", getJson()));

  document.addEventListener("click", async (event) => {
    if (!(event.target instanceof Element)) return;
    const target = event.target.closest("[data-copy]");
    if (!target || !refs.paletteGrid.contains(target) && !refs.rolesList.contains(target)) return;
    const ok = await copyText(target.dataset.copy);
    setStatus(ok ? `${target.dataset.copy.toUpperCase()} copiato` : "Copia non disponibile");
  });

  async function runAnalysis() {
    if (!currentSource) {
      setStatus(cameraStream ? "Scatta prima una foto" : "Carica prima una foto");
      return;
    }

    refs.analyzeBtn.disabled = true;
    setStatus("Analisi in corso");

    try {
      currentResult = await analyzeImage(currentSource, {
        paletteSize: Number(refs.paletteSize.value),
      });
      renderResult(currentResult);
      setStatus("Palette pronta");
    } catch (error) {
      console.error(error);
      setStatus("Errore analisi");
    } finally {
      refs.analyzeBtn.disabled = false;
    }
  }

  function renderResult(result) {
    refs.imageSize.textContent = `${result.meta.naturalWidth} x ${result.meta.naturalHeight}px`;
    refs.pixelCount.textContent = result.meta.pixelCount.toLocaleString("it-IT");
    refs.averageColor.textContent = rgbToHex(result.meta.average).toUpperCase();
    refs.averageColor.style.color = rgbToHex(result.meta.average);
    refs.paletteGrid.innerHTML = result.palette.map(renderSwatch).join("");
    refs.rolesList.innerHTML = renderRoles(result.roles);
    refs.contrastCard.innerHTML = renderContrast(result.roles);
    refs.codePreview.textContent = getCss();
  }

  function renderSwatch(color, index) {
    const textColor = color.text.hex;
    const coverage = Math.round(color.coverage * 1000) / 10;

    return `
      <article class="swatch">
        <button
          class="swatch-chip"
          type="button"
          style="background:${color.hex};color:${textColor}"
          data-copy="${color.hex}"
          aria-label="Copia ${color.hex}"
        >
          <span>${String(index + 1).padStart(2, "0")}</span>
          <strong>${coverage}%</strong>
        </button>
        <div class="swatch-meta">
          <button type="button" class="hex-copy" data-copy="${color.hex}">${color.hex.toUpperCase()}</button>
          <span>rgb(${color.r}, ${color.g}, ${color.b})</span>
          <span>hsl(${color.hsl.h} ${color.hsl.s}% ${color.hsl.l}%)</span>
          <span>Aa ${color.text.ratio.toFixed(1)}:1</span>
        </div>
      </article>
    `;
  }

  function renderRoles(roles) {
    if (!roles) return "";

    return [
      ["Background", roles.background],
      ["Primary", roles.primary],
      ["Accent", roles.accent],
      ["Text", roles.text],
    ]
      .map(([label, color]) => {
        const hex = color.hex.toUpperCase();
        return `
          <button class="role-item" type="button" data-copy="${color.hex}" aria-label="Copia ${label} ${hex}">
            <span class="role-dot" style="background:${color.hex}" aria-hidden="true"></span>
            <span>
              <strong>${label}</strong>
              <small>${hex}</small>
            </span>
          </button>
        `;
      })
      .join("");
  }

  function renderContrast(roles) {
    if (!roles) return "";
    const primaryRatio = contrastRatio(roles.primary, roles.background);
    const accentRatio = contrastRatio(roles.accent, roles.background);
    const textRatio = contrastRatio(roles.text, roles.background);

    return `
      <div class="contrast-preview" style="background:${roles.background.hex};color:${roles.text.hex}">
        <span>Anteprima tema</span>
        <strong>Primary ${primaryRatio.toFixed(1)}:1</strong>
        <button type="button" style="background:${roles.primary.hex};color:${readableTextColor(roles.primary).hex}">
          CTA
        </button>
      </div>
      <div class="contrast-list">
        <span>Text / Background <strong>${textRatio.toFixed(1)}:1</strong></span>
        <span>Primary / Background <strong>${primaryRatio.toFixed(1)}:1</strong></span>
        <span>Accent / Background <strong>${accentRatio.toFixed(1)}:1</strong></span>
      </div>
    `;
  }

  async function setSource(source, options = {}) {
    stopCamera();
    revokeCurrentObjectUrl();
    currentSource = source;
    currentObjectUrl = options.objectUrl ? source : null;
    renderImagePreview(source);
    setStatus("Immagine caricata");
  }

  function isValidImageFile(file) {
    if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
      refs.fileInput.value = "";
      setStatus("Formato immagine non supportato");
      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      refs.fileInput.value = "";
      setStatus("Immagine troppo pesante");
      return false;
    }

    return true;
  }

  function renderImagePreview(source) {
    const image = document.createElement("img");
    image.src = source;
    image.alt = "Anteprima immagine caricata";
    image.decoding = "async";
    refs.previewFrame.replaceChildren(image);
  }

  function revokeCurrentObjectUrl() {
    if (!currentObjectUrl) return;
    URL.revokeObjectURL(currentObjectUrl);
    currentObjectUrl = null;
  }

  async function startCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("Fotocamera non disponibile");
      return;
    }

    stopCamera();
    revokeCurrentObjectUrl();
    refs.cameraBtn.disabled = true;
    setStatus("Apro la fotocamera");

    try {
      const hasCamera = await hasVideoInput();
      if (hasCamera === false) {
        setStatus("Fotocamera non rilevata");
        return;
      }

      cameraStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      currentSource = null;
      const video = document.createElement("video");
      video.className = "camera-preview";
      video.id = "cameraPreview";
      video.autoplay = true;
      video.muted = true;
      video.playsInline = true;
      video.setAttribute("aria-label", "Anteprima fotocamera");
      refs.previewFrame.replaceChildren(video);
      video.srcObject = cameraStream;
      await video.play();
      refs.cameraActions.hidden = false;
      setStatus("Fotocamera attiva");
    } catch (error) {
      console.error(error);
      stopCamera();
      renderEmptyPreview();
      setStatus(cameraErrorMessage(error));
    } finally {
      refs.cameraBtn.disabled = false;
    }
  }

  async function hasVideoInput() {
    if (!navigator.mediaDevices?.enumerateDevices) return null;

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.some((device) => device.kind === "videoinput");
    } catch {
      return null;
    }
  }

  function cameraErrorMessage(error) {
    if (error?.name === "NotFoundError" || error?.name === "OverconstrainedError") {
      return "Fotocamera non rilevata";
    }

    if (error?.name === "NotAllowedError" || error?.name === "SecurityError") {
      return "Permesso fotocamera negato";
    }

    if (error?.name === "NotReadableError") {
      return "Fotocamera gia in uso";
    }

    return "Fotocamera non disponibile";
  }

  function captureFromCamera() {
    const video = document.querySelector("#cameraPreview");
    if (!video || !video.videoWidth || !video.videoHeight) {
      setStatus("Fotocamera non pronta");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const source = canvas.toDataURL("image/jpeg", 0.92);
    stopCamera();
    setSource(source);
    setStatus("Scatto pronto");
  }

  function stopCamera() {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      cameraStream = null;
    }
    refs.cameraActions.hidden = true;
  }

  function createDemoImage() {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
        <rect width="1200" height="800" fill="#111827"/>
        <rect x="0" y="0" width="680" height="800" fill="#0f766e"/>
        <circle cx="770" cy="235" r="190" fill="#f59e0b"/>
        <circle cx="920" cy="520" r="230" fill="#e11d48"/>
        <rect x="170" y="155" width="380" height="490" rx="72" fill="#f8fafc"/>
        <rect x="235" y="220" width="250" height="62" rx="31" fill="#0ea5e9"/>
        <rect x="235" y="336" width="190" height="38" rx="19" fill="#334155"/>
        <rect x="235" y="410" width="255" height="38" rx="19" fill="#94a3b8"/>
      </svg>
    `;

    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }

  function resetApp() {
    stopCamera();
    revokeCurrentObjectUrl();
    currentSource = null;
    currentResult = null;
    refs.fileInput.value = "";
    renderEmptyPreview();
    refs.paletteGrid.innerHTML = `<div class="empty-state">Carica un'immagine o avvia la demo.</div>`;
    refs.imageSize.textContent = "-";
    refs.averageColor.textContent = "-";
    refs.averageColor.style.color = "";
    refs.pixelCount.textContent = "-";
    refs.codePreview.textContent = ":root {\\n  --color-1: ...\\n}";
    resetRoles();
    setStatus("Pronto");
  }

  function renderEmptyPreview() {
    const empty = document.createElement("div");
    empty.className = "empty-preview";
    empty.setAttribute("aria-hidden", "true");
    empty.innerHTML = '<i class="fas fa-image"></i>';
    refs.previewFrame.replaceChildren(empty);
  }

  function resetRoles() {
    refs.rolesList.innerHTML = `
      <div class="role-placeholder"></div>
      <div class="role-placeholder"></div>
      <div class="role-placeholder"></div>
      <div class="role-placeholder"></div>
    `;
    refs.contrastCard.innerHTML = `<div class="empty-state small">I controlli contrasto compariranno dopo l'analisi.</div>`;
  }

  function getCss() {
    if (!currentResult) return "";
    return paletteToCss(currentResult.palette, currentResult.roles);
  }

  function getJson() {
    if (!currentResult) return "";
    return paletteToJson(currentResult.palette, currentResult.roles, currentResult.meta);
  }

  async function copyExport(type) {
    const text = type === "css" ? getCss() : getJson();
    if (!text) {
      setStatus("Genera prima la palette");
      return;
    }

    const ok = await copyText(text);
    setStatus(ok ? `${type.toUpperCase()} copiato` : "Copia non disponibile");
  }

  function downloadExport(filename, text) {
    if (!text) {
      setStatus("Genera prima la palette");
      return;
    }

    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 500);
    setStatus(`${filename} scaricato`);
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      const ok = document.execCommand("copy");
      textarea.remove();
      return ok;
    }
  }

  function setStatus(message) {
    refs.status.textContent = message;
  }
}

async function analyzeImage(source, options = {}) {
  const paletteSize = normalizePaletteSize(options.paletteSize);
  const image = await loadImage(source);
  const sample = sampleImage(image);
  const palette = extractPalette(sample.buckets, paletteSize);
  const roles = pickRoles(palette);

  return {
    palette,
    roles,
    meta: {
      naturalWidth: image.naturalWidth,
      naturalHeight: image.naturalHeight,
      width: sample.width,
      height: sample.height,
      pixelCount: sample.pixelCount,
      average: sample.average,
    },
  };
}

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Immagine non leggibile"));
    image.src = source;
  });
}

function sampleImage(image) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });
  const ratio = Math.min(1, MAX_ANALYSIS_SIDE / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * ratio));
  const height = Math.max(1, Math.round(image.naturalHeight * ratio));

  canvas.width = width;
  canvas.height = height;
  context.drawImage(image, 0, 0, width, height);

  const { data } = context.getImageData(0, 0, width, height);
  const stride = Math.max(1, Math.floor((width * height) / 90000));
  const buckets = new Map();
  let pixelCount = 0;
  let rSum = 0;
  let gSum = 0;
  let bSum = 0;

  for (let index = 0; index < data.length; index += 4 * stride) {
    const alpha = data[index + 3] / 255;
    if (alpha < 0.55) continue;

    const r = data[index];
    const g = data[index + 1];
    const b = data[index + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);

    if (max > 248 && min > 248) continue;
    if (max < 6 && min < 6) continue;

    const key = `${r >> 3},${g >> 3},${b >> 3}`;
    const bucket = buckets.get(key);

    if (bucket) {
      bucket.r += r;
      bucket.g += g;
      bucket.b += b;
      bucket.count += 1;
    } else {
      buckets.set(key, { r, g, b, count: 1 });
    }

    pixelCount += 1;
    rSum += r;
    gSum += g;
    bSum += b;
  }

  let prepared = Array.from(buckets.values())
    .map((bucket) => {
      const rgb = {
        r: Math.round(bucket.r / bucket.count),
        g: Math.round(bucket.g / bucket.count),
        b: Math.round(bucket.b / bucket.count),
      };
      const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
      return {
        ...rgb,
        lab: rgbToLab(rgb),
        hsl,
        count: bucket.count,
        weight: bucket.count * (0.76 + hsl.s / 180),
      };
    })
    .sort((a, b) => b.weight - a.weight);

  if (prepared.length > MAX_BUCKETS) prepared = prepared.slice(0, MAX_BUCKETS);

  return {
    width,
    height,
    pixelCount,
    buckets: prepared,
    average: {
      r: Math.round(rSum / Math.max(1, pixelCount)),
      g: Math.round(gSum / Math.max(1, pixelCount)),
      b: Math.round(bSum / Math.max(1, pixelCount)),
    },
  };
}

function extractPalette(buckets, size) {
  if (!buckets.length) return [];

  const k = Math.min(size + 2, buckets.length);
  const centers = seedCenters(buckets, k);

  for (let iteration = 0; iteration < 18; iteration += 1) {
    const groups = centers.map(() => ({ r: 0, g: 0, b: 0, count: 0, weight: 0, members: 0 }));

    for (const bucket of buckets) {
      const index = nearestCenter(bucket, centers);
      const group = groups[index];
      group.r += bucket.r * bucket.weight;
      group.g += bucket.g * bucket.weight;
      group.b += bucket.b * bucket.weight;
      group.count += bucket.count;
      group.weight += bucket.weight;
      group.members += 1;
    }

    groups.forEach((group, index) => {
      if (!group.weight) return;
      const rgb = {
        r: Math.round(group.r / group.weight),
        g: Math.round(group.g / group.weight),
        b: Math.round(group.b / group.weight),
      };
      centers[index] = {
        ...rgb,
        lab: rgbToLab(rgb),
        hsl: rgbToHsl(rgb.r, rgb.g, rgb.b),
        count: group.count,
        weight: group.weight,
        members: group.members,
      };
    });
  }

  const totalPixelCount = buckets.reduce((sum, bucket) => sum + bucket.count, 0);
  const merged = mergeNearbyColors(centers)
    .map((color) => decorateColor(color, totalPixelCount))
    .filter((color) => color.coverage >= 0.005)
    .sort((a, b) => b.score - a.score);

  return merged.slice(0, size);
}

function normalizePaletteSize(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 8;
  return Math.max(4, Math.min(10, Math.round(parsed)));
}

function seedCenters(buckets, size) {
  const centers = [buckets[0]];

  while (centers.length < size) {
    let best = null;
    let bestScore = -Infinity;

    for (const bucket of buckets) {
      const minDistance = Math.min(...centers.map((center) => labDistance(bucket.lab, center.lab)));
      const score = Math.sqrt(bucket.weight) * minDistance;
      if (score > bestScore) {
        best = bucket;
        bestScore = score;
      }
    }

    centers.push(best);
  }

  return centers.map((center) => ({ ...center }));
}

function nearestCenter(bucket, centers) {
  let bestIndex = 0;
  let bestDistance = Infinity;

  centers.forEach((center, index) => {
    const distance = labDistance(bucket.lab, center.lab);
    if (distance < bestDistance) {
      bestIndex = index;
      bestDistance = distance;
    }
  });

  return bestIndex;
}

function mergeNearbyColors(colors) {
  const sorted = [...colors].sort((a, b) => b.weight - a.weight);
  const merged = [];

  for (const color of sorted) {
    const similar = merged.find((item) => labDistance(item.lab, color.lab) < 8);

    if (!similar) {
      merged.push({ ...color });
      continue;
    }

    const totalWeight = similar.weight + color.weight;
    const rgb = {
      r: Math.round((similar.r * similar.weight + color.r * color.weight) / totalWeight),
      g: Math.round((similar.g * similar.weight + color.g * color.weight) / totalWeight),
      b: Math.round((similar.b * similar.weight + color.b * color.weight) / totalWeight),
    };

    Object.assign(similar, {
      ...rgb,
      lab: rgbToLab(rgb),
      hsl: rgbToHsl(rgb.r, rgb.g, rgb.b),
      count: similar.count + color.count,
      weight: totalWeight,
    });
  }

  return merged;
}

function decorateColor(color, total) {
  const hsl = rgbToHsl(color.r, color.g, color.b);
  const hex = rgbToHex(color);
  const text = readableTextColor(color);
  const chromaBoost = 0.68 + hsl.s / 145;
  const lightnessPenalty = hsl.l < 8 || hsl.l > 94 ? 0.72 : 1;

  return {
    r: color.r,
    g: color.g,
    b: color.b,
    hsl,
    lab: color.lab,
    hex,
    text,
    count: color.count,
    coverage: color.count / Math.max(1, total),
    score: color.count * chromaBoost * lightnessPenalty,
  };
}

function pickRoles(palette) {
  if (!palette.length) return null;

  const darkCandidates = palette.filter((color) => color.hsl.l <= 46);
  const background =
    darkCandidates.sort((a, b) => {
      const aScore = a.coverage * 1.8 + (100 - a.hsl.s) / 150 + (50 - a.hsl.l) / 120;
      const bScore = b.coverage * 1.8 + (100 - b.hsl.s) / 150 + (50 - b.hsl.l) / 120;
      return bScore - aScore;
    })[0] ?? palette[0];

  const primary =
    palette
      .filter((color) => color.hex !== background.hex)
      .sort((a, b) => roleColorScore(b, background) - roleColorScore(a, background))[0] ?? palette[0];

  const accent =
    palette
      .filter((color) => color.hex !== background.hex && color.hex !== primary.hex)
      .sort((a, b) => {
        const aScore =
          roleColorScore(a, background) +
          hueDistance(a.hsl.h, primary.hsl.h) / 120 +
          Math.abs(a.hsl.l - primary.hsl.l) / 80;
        const bScore =
          roleColorScore(b, background) +
          hueDistance(b.hsl.h, primary.hsl.h) / 120 +
          Math.abs(b.hsl.l - primary.hsl.l) / 80;
        return bScore - aScore;
      })[0] ?? primary;

  return {
    background,
    primary,
    accent,
    text: readableTextColor(background),
  };
}

function roleColorScore(color, background) {
  const contrast = contrastRatio(color, background);
  const contrastScore = contrast >= 3 ? 1.3 : contrast / 3;
  return color.coverage * 1.2 + color.hsl.s / 62 + contrastScore + color.hsl.l / 180;
}

function paletteToCss(palette, roles) {
  const lines = [":root {"];
  palette.forEach((color, index) => {
    lines.push(`  --color-${index + 1}: ${color.hex};`);
  });

  if (roles) {
    lines.push(
      `  --bg: ${roles.background.hex};`,
      `  --primary: ${roles.primary.hex};`,
      `  --accent: ${roles.accent.hex};`,
      `  --text: ${roles.text.hex};`,
    );
  }

  lines.push("}");
  return lines.join("\n");
}

function paletteToJson(palette, roles, meta) {
  return JSON.stringify(
    {
      image: meta,
      palette: palette.map((color) => ({
        hex: color.hex,
        rgb: { r: color.r, g: color.g, b: color.b },
        hsl: color.hsl,
        coverage: Number(color.coverage.toFixed(4)),
      })),
      roles: roles
        ? {
            background: roles.background.hex,
            primary: roles.primary.hex,
            accent: roles.accent.hex,
            text: roles.text.hex,
          }
        : null,
    },
    null,
    2,
  );
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function toHex(value) {
  return clamp(Math.round(value), 0, 255).toString(16).padStart(2, "0");
}

function rgbToHex(color) {
  return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;
}

function rgbToHsl(r, g, b) {
  const nr = r / 255;
  const ng = g / 255;
  const nb = b / 255;
  const max = Math.max(nr, ng, nb);
  const min = Math.min(nr, ng, nb);
  const lightness = (max + min) / 2;

  if (max === min) {
    return { h: 0, s: 0, l: Math.round(lightness * 100) };
  }

  const delta = max - min;
  const saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);

  let hue;
  if (max === nr) hue = (ng - nb) / delta + (ng < nb ? 6 : 0);
  else if (max === ng) hue = (nb - nr) / delta + 2;
  else hue = (nr - ng) / delta + 4;

  return {
    h: Math.round((hue / 6) * 360),
    s: Math.round(saturation * 100),
    l: Math.round(lightness * 100),
  };
}

function relativeLuminance({ r, g, b }) {
  const [rs, gs, bs] = [r, g, b].map((value) => {
    const channel = value / 255;
    return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(first, second) {
  const l1 = relativeLuminance(first);
  const l2 = relativeLuminance(second);
  const light = Math.max(l1, l2);
  const dark = Math.min(l1, l2);
  return (light + 0.05) / (dark + 0.05);
}

function readableTextColor(background) {
  const white = { r: 255, g: 255, b: 255 };
  const black = { r: 10, g: 12, b: 16 };
  const whiteRatio = contrastRatio(white, background);
  const blackRatio = contrastRatio(black, background);
  const rgb = whiteRatio >= blackRatio ? white : black;

  return {
    ...rgb,
    hex: rgbToHex(rgb),
    ratio: Math.max(whiteRatio, blackRatio),
  };
}

function rgbToLab({ r, g, b }) {
  const [lr, lg, lb] = [r, g, b].map((value) => {
    const channel = value / 255;
    return channel <= 0.04045 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
  });

  const x = lr * 0.4124564 + lg * 0.3575761 + lb * 0.1804375;
  const y = lr * 0.2126729 + lg * 0.7151522 + lb * 0.072175;
  const z = lr * 0.0193339 + lg * 0.119192 + lb * 0.9503041;

  const fx = xyzToLabPivot(x / D65.x);
  const fy = xyzToLabPivot(y / D65.y);
  const fz = xyzToLabPivot(z / D65.z);

  return {
    l: 116 * fy - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz),
  };
}

function xyzToLabPivot(value) {
  return value > 0.008856 ? Math.cbrt(value) : 7.787 * value + 16 / 116;
}

function labDistance(first, second) {
  return Math.sqrt((first.l - second.l) ** 2 + (first.a - second.a) ** 2 + (first.b - second.b) ** 2);
}

function hueDistance(first, second) {
  const distance = Math.abs(first - second);
  return Math.min(distance, 360 - distance);
}
