import { currentLang, t } from "@/i18n/ui.js";
import {
  contrastRatio,
  extractPalette,
  normalizePaletteSize,
  paletteToCss,
  paletteToJson,
  pickRoles,
  readableTextColor,
  rgbToHex,
  rgbToHsl,
  rgbToLab,
} from "./palette-core.js";
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
// Kept identical to the <pre id="codePreview"> in the page markup, so a reset
// puts back exactly what the panel showed on load.
const EMPTY_CSS_PREVIEW = ":root {\n  --color-1: ...\n}";

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
    setStatus(t("tool.cameraClosed"));
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
    setStatus(ok ? t("tool.somethingCopied", { what: target.dataset.copy.toUpperCase() }) : t("tool.copyUnavailable"));
  });

  // Everything this tool puts on screen is markup built here, so the language
  // swap in lang-switch.js cannot translate it: the walk compares against the
  // fetched twin, which knows nothing about a rendered palette and stops at
  // that branch. The metrics are worse than untranslated — the twin *does*
  // carry their "-" placeholders, so a swap copies those over a real reading
  // and leaves "Pixels read: -" above eight swatches.
  //
  // Re-rendering from the result settles all of it at once: the metrics come
  // back, the swatch and role labels change language, and the contrast card
  // gets rebuilt even though its container is empty in the served markup and
  // the walk never reaches it.
  window.addEventListener("codedge:lang-changed", () => {
    if (currentResult) {
      renderResult(currentResult);
      setStatus(t("tool.paletteReady"));
      return;
    }

    refs.paletteGrid.innerHTML = `<div class="empty-state">${t("tool.emptyPalette")}</div>`;
    resetRoles();
    setStatus(t("tool.ready"));
  });

  async function runAnalysis() {
    if (!currentSource) {
      setStatus(cameraStream ? t("tool.takePhotoFirst") : t("tool.uploadPhotoFirst"));
      return;
    }

    refs.analyzeBtn.disabled = true;
    setStatus(t("tool.analyzing"));

    try {
      currentResult = await analyzeImage(currentSource, {
        paletteSize: Number(refs.paletteSize.value),
      });
      renderResult(currentResult);
      setStatus(t("tool.paletteReady"));
    } catch (error) {
      console.error(error);
      setStatus(t("tool.analysisError"));
    } finally {
      refs.analyzeBtn.disabled = false;
    }
  }

  function renderResult(result) {
    refs.imageSize.textContent = `${result.meta.naturalWidth} x ${result.meta.naturalHeight}px`;
    // The page language, not a fixed locale: "96.330" reads as ninety-six
    // thousand in Italian and as ninety-six point three in English.
    refs.pixelCount.textContent = result.meta.pixelCount.toLocaleString(
      currentLang() === "it" ? "it-IT" : "en-US"
    );
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
          aria-label="${t("tool.copyValue", { value: color.hex })}"
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
          <button class="role-item" type="button" data-copy="${color.hex}" aria-label="${t("tool.copyLabelled", { label, hex })}">
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
        <span>${t("tool.themePreview")}</span>
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
    setStatus(t("tool.imageLoaded"));
  }

  function isValidImageFile(file) {
    if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
      refs.fileInput.value = "";
      setStatus(t("tool.unsupportedFormat"));
      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      refs.fileInput.value = "";
      setStatus(t("tool.imageTooHeavy"));
      return false;
    }

    return true;
  }

  function renderImagePreview(source) {
    const image = document.createElement("img");
    image.src = source;
    image.alt = t("tool.imagePreviewLoaded");
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
      setStatus(t("tool.cameraUnavailable"));
      return;
    }

    stopCamera();
    revokeCurrentObjectUrl();
    refs.cameraBtn.disabled = true;
    setStatus(t("tool.openingCamera"));

    try {
      const hasCamera = await hasVideoInput();
      if (hasCamera === false) {
        setStatus(t("tool.cameraNotDetected"));
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
      video.setAttribute("aria-label", t("tool.cameraPreview"));
      refs.previewFrame.replaceChildren(video);
      video.srcObject = cameraStream;
      await video.play();
      refs.cameraActions.hidden = false;
      setStatus(t("tool.cameraActive"));
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
      return t("tool.cameraNotDetected");
    }

    if (error?.name === "NotAllowedError" || error?.name === "SecurityError") {
      return t("tool.cameraDenied");
    }

    if (error?.name === "NotReadableError") {
      return t("tool.cameraInUse");
    }

    return t("tool.cameraUnavailable");
  }

  function captureFromCamera() {
    const video = document.querySelector("#cameraPreview");
    if (!video || !video.videoWidth || !video.videoHeight) {
      setStatus(t("tool.cameraNotReady"));
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
    setStatus(t("tool.shotReady"));
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
    refs.paletteGrid.innerHTML = `<div class="empty-state">${t("tool.emptyPalette")}</div>`;
    refs.imageSize.textContent = "-";
    refs.averageColor.textContent = "-";
    refs.averageColor.style.color = "";
    refs.pixelCount.textContent = "-";
    refs.codePreview.textContent = EMPTY_CSS_PREVIEW;
    resetRoles();
    setStatus(t("tool.ready"));
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
    refs.contrastCard.innerHTML = `<div class="empty-state small">${t("tool.contrastEmpty")}</div>`;
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
      setStatus(t("tool.generatePaletteFirst"));
      return;
    }

    const ok = await copyText(text);
    setStatus(ok ? t("tool.somethingCopied", { what: type.toUpperCase() }) : t("tool.copyUnavailable"));
  }

  function downloadExport(filename, text) {
    if (!text) {
      setStatus(t("tool.generatePaletteFirst"));
      return;
    }

    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 500);
    setStatus(t("tool.downloaded", { what: filename }));
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
    image.onerror = () => reject(new Error("Image could not be read"));
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
