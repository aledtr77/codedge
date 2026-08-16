import { currentLang, t } from "@/i18n/ui.js";
import {
  contrastRatio,
  DOMINANT_COLOR_COUNT,
  extractPalette,
  paletteToCss,
  paletteToJson,
  pickRoles,
  readableTextColor,
  rgbToHex,
  rgbToHsl,
  rgbToLab,
  wcagLevel,
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
const PROBLEM_STATUSES = new Set([
  "takePhotoFirst",
  "uploadPhotoFirst",
  "analysisError",
  "noColors",
  "unsupportedFormat",
  "imageTooHeavy",
  "cameraUnavailable",
  "cameraNotDetected",
  "cameraNotReady",
  "cameraDenied",
  "cameraInUse",
  "generatePaletteFirst",
  "copyUnavailable",
]);
const DONE_STATUSES = new Set(["paletteReady", "somethingCopied", "downloaded"]);

let inited = false;

function statusTone(key) {
  if (PROBLEM_STATUSES.has(key)) return "problem";
  if (DONE_STATUSES.has(key)) return "done";
  return "neutral";
}

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
    paletteGrid: document.querySelector("#paletteGrid"),
    results: document.querySelector(".results"),
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

  const exportButtons = [
    refs.copyCssBtn,
    refs.copyJsonBtn,
    refs.downloadCssBtn,
    refs.downloadJsonBtn,
  ];

  let currentSource = null;
  let currentResult = null;
  let cameraStream = null;
  let cameraVideo = null;
  let currentObjectUrl = null;
  let analysisToken = 0;
  let cameraToken = 0;

  resetRoles();

  refs.fileInput?.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file || !isValidImageFile(file)) return;
    setSource(URL.createObjectURL(file), { objectUrl: true });
    await runAnalysis();
  });

  refs.dropzone?.addEventListener("dragover", (event) => {
    event.preventDefault();
    refs.dropzone.classList.add("is-dragging");
  });

  refs.dropzone?.addEventListener("dragleave", (event) => {
    if (event.relatedTarget instanceof Node && refs.dropzone.contains(event.relatedTarget)) return;
    refs.dropzone.classList.remove("is-dragging");
  });

  refs.dropzone?.addEventListener("drop", async (event) => {
    event.preventDefault();
    refs.dropzone.classList.remove("is-dragging");
    const file = event.dataTransfer.files?.[0];
    if (!file || !isValidImageFile(file)) return;
    setSource(URL.createObjectURL(file), { objectUrl: true });
    await runAnalysis();
  });

  refs.cameraBtn?.addEventListener("click", startCamera);
  refs.captureBtn?.addEventListener("click", captureFromCamera);
  refs.closeCameraBtn?.addEventListener("click", () => {
    stopCamera();
    if (!currentSource) renderEmptyPreview();
    setStatus("cameraClosed");
    refs.cameraBtn.focus();
  });
  refs.analyzeBtn.addEventListener("click", () => runAnalysis());
  refs.demoBtn?.addEventListener("click", async () => {
    setSource(createDemoImage());
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
    setStatus(ok ? "somethingCopied" : "copyUnavailable", {
      what: target.dataset.copy.toUpperCase(),
    });
  });

  // Everything this tool puts on screen is markup built here, so the language
  // swap in lang-switch.js cannot translate it: the walk compares against the
  // fetched twin, which knows nothing about a rendered palette and stops at
  // that branch. The metrics are worse than untranslated — the twin *does*
  // carry their "-" placeholders, so a swap copies those over a real reading
  // and leaves stale image metrics above the new palette.
  //
  // Re-rendering from the result settles all of it at once: the metrics come
  // back, the swatch and role labels change language, and the contrast card
  // gets rebuilt even though its container is empty in the served markup and
  // the walk never reaches it.
  window.addEventListener("codedge:lang-changed", () => {
    if (currentResult) {
      renderResult(currentResult);
      setStatus("paletteReady");
      return;
    }

    refs.paletteGrid.innerHTML = `<div class="empty-state">${t("tool.emptyPalette")}</div>`;
    resetRoles();
    setStatus("ready");
  });

  async function runAnalysis() {
    if (!currentSource) {
      setStatus(cameraStream ? "takePhotoFirst" : "uploadPhotoFirst");
      return;
    }

    const token = (analysisToken += 1);
    refs.analyzeBtn.disabled = true;
    setExportsEnabled(false);
    refs.analyzeBtn.setAttribute("aria-busy", "true");
    refs.analyzeBtn.querySelector("span").textContent = t("tool.analyzingAction");
    refs.results.setAttribute("aria-busy", "true");
    refs.results.classList.add("is-updating");
    setStatus("analyzing");

    try {
      const result = await analyzeImage(currentSource);
      if (token !== analysisToken) return;

      currentResult = result;
      renderResult(result);
      setExportsEnabled(Boolean(result.palette.length));
      setStatus(result.palette.length ? "paletteReady" : "noColors");
    } catch (error) {
      console.error(error);
      if (token === analysisToken) setStatus("analysisError");
    } finally {
      if (token === analysisToken) {
        refs.analyzeBtn.disabled = false;
        refs.analyzeBtn.removeAttribute("aria-busy");
        refs.analyzeBtn.querySelector("span").textContent = t("tool.extractAction");
        refs.results.removeAttribute("aria-busy");
        refs.results.classList.remove("is-updating");
      }
    }
  }

  function renderResult(result) {
    refs.imageSize.textContent = `${result.meta.naturalWidth} x ${result.meta.naturalHeight}px`;
    // The page language, not a fixed locale: "96.330" reads as ninety-six
    // thousand in Italian and as ninety-six point three in English.
    refs.pixelCount.textContent = result.meta.pixelCount.toLocaleString(
      currentLang() === "it" ? "it-IT" : "en-US"
    );
    const averageHex = rgbToHex(result.meta.average);
    refs.averageColor.textContent = averageHex.toUpperCase();
    refs.averageColor.style.setProperty("--average-color", averageHex);
    refs.averageColor.dataset.hasValue = "true";

    if (!result.palette.length) {
      refs.paletteGrid.innerHTML = `<div class="empty-state">${t("tool.noColorsFound")}</div>`;
      resetRoles();
      refs.codePreview.textContent = EMPTY_CSS_PREVIEW;
      return;
    }

    refs.paletteGrid.innerHTML = result.palette.map(renderSwatch).join("");
    refs.rolesList.innerHTML = renderRoles(result.roles);
    refs.contrastCard.innerHTML = renderContrast(result.roles);
    refs.codePreview.textContent = getCss();
  }

  function renderSwatch(color, index) {
    const textColor = color.text.hex;
    const coverage = Math.round(color.coverage * 1000) / 10;

    return `
      <article class="swatch" aria-label="${t("tool.colorCoverage", {
        n: index + 1,
        hex: color.hex.toUpperCase(),
        coverage,
      })}">
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
          <span class="swatch-ratio">Aa ${ratioMarkup(color.text.ratio)}</span>
        </div>
      </article>
    `;
  }

  function renderRoles(roles) {
    if (!roles) return "";

    return [
      [t("tool.roleBackground"), roles.background],
      [t("tool.rolePrimary"), roles.primary],
      [t("tool.roleAccent"), roles.accent],
      [t("tool.roleText"), roles.text],
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
        <strong>${t("tool.rolePrimary")} ${primaryRatio.toFixed(1)}:1</strong>
        <span class="preview-cta" style="background:${roles.primary.hex};color:${readableTextColor(roles.primary).hex}">
          CTA
        </span>
      </div>
      <div class="contrast-list">
        <span>${t("tool.textBackground")} ${ratioMarkup(textRatio)}</span>
        <span>${t("tool.primaryBackground")} ${ratioMarkup(primaryRatio)}</span>
        <span>${t("tool.accentBackground")} ${ratioMarkup(accentRatio)}</span>
      </div>
      <p class="contrast-note">${t("tool.contrastNote")}</p>
    `;
  }

  function ratioMarkup(ratio) {
    const level = wcagLevel(ratio);
    return `<strong class="ratio">${ratio.toFixed(1)}:1 <span class="wcag" data-level="${level}">${t(
      `tool.wcag.${level}`,
    )}</span></strong>`;
  }

  function setSource(source, options = {}) {
    stopCamera();
    revokeCurrentObjectUrl();
    cancelAnalysis();
    currentSource = source;
    currentObjectUrl = options.objectUrl ? source : null;
    clearResult();
    renderImagePreview(source);
    setStatus("imageLoaded");
  }

  function isValidImageFile(file) {
    const extension = file.name.split(".").pop()?.toLowerCase();
    const acceptedExtension = ["png", "jpg", "jpeg", "webp", "gif", "bmp"].includes(extension);

    if (!ACCEPTED_IMAGE_TYPES.has(file.type) && !(file.type === "" && acceptedExtension)) {
      refs.fileInput.value = "";
      setStatus("unsupportedFormat");
      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      refs.fileInput.value = "";
      setStatus("imageTooHeavy");
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
      setStatus("cameraUnavailable");
      return;
    }

    const requestToken = (cameraToken += 1);
    refs.cameraBtn.disabled = true;
    refs.cameraBtn.setAttribute("aria-busy", "true");
    setStatus("openingCamera");

    try {
      const hasCamera = await hasVideoInput();
      if (requestToken !== cameraToken) return;

      if (hasCamera === false) {
        setStatus("cameraNotDetected");
        return;
      }

      const nextStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      if (requestToken !== cameraToken) {
        nextStream.getTracks().forEach((track) => track.stop());
        return;
      }

      cameraStream = nextStream;
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

      if (requestToken !== cameraToken) {
        video.srcObject = null;
        return;
      }

      cameraVideo = video;
      revokeCurrentObjectUrl();
      cancelAnalysis();
      currentSource = null;
      clearResult();
      refs.cameraActions.hidden = false;
      refs.cameraBtn.hidden = true;
      refs.captureBtn.focus();
      setStatus("cameraActive");
    } catch (error) {
      console.error(error);
      if (requestToken !== cameraToken) return;
      stopCamera();
      if (currentSource) renderImagePreview(currentSource);
      else renderEmptyPreview();
      setStatus(cameraErrorKey(error));
    } finally {
      refs.cameraBtn.disabled = false;
      refs.cameraBtn.removeAttribute("aria-busy");
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

  function cameraErrorKey(error) {
    if (error?.name === "NotFoundError" || error?.name === "OverconstrainedError") {
      return "cameraNotDetected";
    }

    if (error?.name === "NotAllowedError" || error?.name === "SecurityError") {
      return "cameraDenied";
    }

    if (error?.name === "NotReadableError") {
      return "cameraInUse";
    }

    return "cameraUnavailable";
  }

  async function captureFromCamera() {
    if (!cameraVideo?.videoWidth || !cameraVideo.videoHeight) {
      setStatus("cameraNotReady");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = cameraVideo.videoWidth;
    canvas.height = cameraVideo.videoHeight;
    const context = canvas.getContext("2d");
    context.drawImage(cameraVideo, 0, 0, canvas.width, canvas.height);
    const source = canvas.toDataURL("image/jpeg", 0.92);
    setSource(source);
    await runAnalysis();
  }

  function stopCamera() {
    cameraToken += 1;
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      cameraStream = null;
    }
    cameraVideo = null;
    refs.cameraActions.hidden = true;
    refs.cameraBtn.hidden = false;
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
    cancelAnalysis();
    currentSource = null;
    refs.fileInput.value = "";
    renderEmptyPreview();
    clearResult();
    setStatus("ready");
  }

  function cancelAnalysis() {
    analysisToken += 1;
    refs.analyzeBtn.disabled = false;
    refs.analyzeBtn.removeAttribute("aria-busy");
    refs.analyzeBtn.querySelector("span").textContent = t("tool.extractAction");
    refs.results.removeAttribute("aria-busy");
    refs.results.classList.remove("is-updating");
  }

  function clearResult() {
    currentResult = null;
    refs.paletteGrid.innerHTML = `<div class="empty-state">${t("tool.emptyPalette")}</div>`;
    refs.imageSize.textContent = "-";
    refs.averageColor.textContent = "-";
    refs.averageColor.style.removeProperty("--average-color");
    delete refs.averageColor.dataset.hasValue;
    refs.pixelCount.textContent = "-";
    refs.codePreview.textContent = EMPTY_CSS_PREVIEW;
    resetRoles();
    setExportsEnabled(false);
  }

  function setExportsEnabled(enabled) {
    exportButtons.forEach((button) => {
      button.disabled = !enabled;
    });
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
    if (!currentResult?.palette.length) return "";
    return paletteToCss(currentResult.palette, currentResult.roles);
  }

  function getJson() {
    if (!currentResult?.palette.length) return "";
    return paletteToJson(currentResult.palette, currentResult.roles, currentResult.meta);
  }

  async function copyExport(type) {
    const text = type === "css" ? getCss() : getJson();
    if (!text) {
      setStatus("generatePaletteFirst");
      return;
    }

    const ok = await copyText(text);
    setStatus(ok ? "somethingCopied" : "copyUnavailable", { what: type.toUpperCase() });
  }

  function downloadExport(filename, text) {
    if (!text) {
      setStatus("generatePaletteFirst");
      return;
    }

    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 500);
    setStatus("downloaded", { what: filename });
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

  function setStatus(key, variables) {
    refs.status.dataset.statusKey = key;
    refs.status.dataset.statusTone = statusTone(key);
    refs.status.textContent = t(`tool.${key}`, variables);
  }
}

async function analyzeImage(source) {
  const image = await loadImage(source);
  const sample = sampleImage(image);
  const palette = extractPalette(sample.buckets, DOMINANT_COLOR_COUNT);
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
        weight: bucket.count,
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
