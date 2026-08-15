import { t } from "@/i18n/ui.js";

let initialized = false;

const PRESETS = {
  balanced: { quality: 72, maxWidth: 1600, format: "webp", summaryKey: "tool.summaryBalanced" },
  light: { quality: 82, maxWidth: 2200, format: "webp", summaryKey: "tool.summaryLight" },
  strong: { quality: 58, maxWidth: 1280, format: "webp", summaryKey: "tool.summaryStrong" }
};

const EXTENSIONS = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif"
};

export function initImageCompressor() {
  if (initialized) return;
  initialized = true;

  const ui = readUi();
  if (!ui.fileInput || !ui.uploadArea || !ui.resultsList) {
    console.error("[image-compressor] Required elements are missing.");
    return;
  }

  const state = {
    activePreset: "balanced",
    file: null,
    source: null,
    row: null,
    previewUrl: null,
    timer: null,
    revision: 0
  };

  setupSlider(ui.qualitySlider, ui.qualityFill, ui.qualityValueInput, "%");
  setupSlider(ui.maxWidthSlider, ui.maxWidthFill, ui.maxWidthValueInput, "px");
  applyPreset("balanced", false);
  bindEvents();

  function bindEvents() {
    ui.uploadArea.addEventListener("click", () => ui.fileInput.click());
    ui.uploadArea.addEventListener("dragover", (event) => {
      event.preventDefault();
      ui.uploadArea.classList.add("is-dragover");
    });
    ui.uploadArea.addEventListener("dragleave", () => ui.uploadArea.classList.remove("is-dragover"));
    ui.uploadArea.addEventListener("drop", (event) => {
      event.preventDefault();
      ui.uploadArea.classList.remove("is-dragover");
      const file = event.dataTransfer?.files?.[0];
      if (file) loadFile(file);
    });
    ui.fileInput.addEventListener("change", (event) => {
      const file = event.target.files?.[0];
      if (file) loadFile(file);
    });

    ui.outputFormat.addEventListener("change", () => changeSettings(0));
    ui.qualitySlider.addEventListener("input", () => changeSettings(220));
    ui.maxWidthSlider.addEventListener("input", () => changeSettings(220));
    ui.qualityValueInput.addEventListener("change", () => changeSettings(0));
    ui.maxWidthValueInput.addEventListener("change", () => changeSettings(0));
    ui.presetButtons.forEach((button) => {
      button.addEventListener("click", () => applyPreset(button.dataset.preset, true));
    });
  }

  async function loadFile(file) {
    if (!file.type.startsWith("image/") || !EXTENSIONS[file.type]) {
      setStatus(t("tool.invalidImage"), "error");
      return;
    }

    ui.fileInput.value = "";
    const revision = ++state.revision;
    setStatus(t("tool.decodingImage"), "warning");

    try {
      const source = await createImageBitmap(file, { imageOrientation: "from-image" });
      if (revision !== state.revision) {
        source.close();
        return;
      }

      state.source?.close();
      releasePreview();
      state.file = file;
      state.source = source;
      state.row = createResultRow(file);
      ui.resultsList.replaceChildren(state.row.element);
      ui.resultsContainer.style.display = "flex";

      state.previewUrl = URL.createObjectURL(file);
      state.row.thumbnail.src = state.previewUrl;
      requestCompression(0);
    } catch (error) {
      console.error(error);
      setStatus(t("tool.compressError", { name: file.name, message: error.message }), "error");
    }
  }

  function changeSettings(delay) {
    state.activePreset = "custom";
    updatePresetButtons();
    updateStrategySummary();
    updateQualityAvailability();
    requestCompression(delay);
  }

  function applyPreset(key, recompress) {
    const preset = PRESETS[key];
    if (!preset) return;

    state.activePreset = key;
    ui.outputFormat.value = preset.format;
    ui.qualitySlider.value = String(preset.quality);
    ui.qualityValueInput.value = `${preset.quality}%`;
    ui.maxWidthSlider.value = String(preset.maxWidth);
    ui.maxWidthValueInput.value = `${preset.maxWidth}px`;
    updateSliderFill(ui.qualitySlider, ui.qualityFill);
    updateSliderFill(ui.maxWidthSlider, ui.maxWidthFill);
    updatePresetButtons();
    updateStrategySummary();
    updateQualityAvailability();
    if (recompress) requestCompression(0);
  }

  function requestCompression(delay) {
    if (!state.file || !state.source || !state.row) return;

    window.clearTimeout(state.timer);
    const revision = ++state.revision;
    renderBusy();
    state.timer = window.setTimeout(() => compressCurrent(revision), delay);
  }

  async function compressCurrent(revision) {
    const file = state.file;
    const mimeType = selectedMimeType(file);
    const quality = clamp(Number.parseInt(ui.qualitySlider.value, 10), 35, 95);
    const maxWidth = clamp(Number.parseInt(ui.maxWidthSlider.value, 10), 640, 2560);

    try {
      const output = await encodeImage(state.source, { mimeType, quality, maxWidth });
      if (revision !== state.revision || file !== state.file) return;
      if (output.blob.type !== mimeType) {
        throw new Error(t("tool.outputFormatUnsupported", { format: formatLabel(mimeType) }));
      }

      const outputName = renderOutput(file, output);
      setStatus(t("tool.compressOk", { name: outputName }), "success");
    } catch (error) {
      if (revision !== state.revision || file !== state.file) return;
      console.error(error);
      state.row.middle.innerHTML = `<span class="savings-badge is-error">${t("tool.error")}</span>`;
      setStatus(t("tool.compressError", { name: file.name, message: error.message }), "error");
    }
  }

  function renderBusy() {
    state.row.middle.innerHTML = `
      <i class="fas fa-spinner row-spinner" aria-hidden="true"></i>
      <span class="compressed-size-text">${t("tool.optimizing")}</span>
    `;
    state.row.download.style.display = "none";
  }

  function renderOutput(file, { blob, width, height }) {
    const extension = EXTENSIONS[blob.type];
    const outputName = `${file.name.replace(/\.[^.]+$/, "")}-ottimizzata.${extension}`;
    const sizeDelta = ((blob.size - file.size) / file.size) * 100;
    const percentage = Math.abs(sizeDelta) < 0.5
      ? "0%"
      : `${sizeDelta > 0 ? "+" : ""}${sizeDelta.toFixed(0)}%`;

    state.row.filename.textContent = outputName;
    state.row.middle.replaceChildren();
    const badge = document.createElement("span");
    badge.className = "savings-badge";
    badge.textContent = percentage;
    const details = document.createElement("span");
    details.className = "compressed-size-text";
    details.textContent = `${formatLabel(blob.type)} · ${width}×${height}px · ${formatBytes(blob.size)}`;
    state.row.middle.append(badge, details);

    releasePreview();
    state.previewUrl = URL.createObjectURL(blob);
    state.row.thumbnail.src = state.previewUrl;
    state.row.thumbnail.alt = t("tool.outputPreview", { format: formatLabel(blob.type) });

    state.row.download.style.display = "inline-flex";
    state.row.download.onclick = () => downloadBlob(blob, outputName);
    return outputName;
  }

  function selectedMimeType(file = state.file) {
    return ui.outputFormat.value === "original" ? file?.type || "image/jpeg" : `image/${ui.outputFormat.value}`;
  }

  function updateQualityAvailability() {
    const losslessCanvasOutput = selectedMimeType() === "image/png";
    ui.qualitySlider.disabled = losslessCanvasOutput;
    ui.qualityValueInput.disabled = losslessCanvasOutput;
  }

  function updatePresetButtons() {
    ui.presetButtons.forEach((button) => {
      button.classList.toggle("is-active", button.dataset.preset === state.activePreset);
    });
  }

  function updateStrategySummary() {
    const preset = PRESETS[state.activePreset];
    if (preset) {
      ui.strategySummary.textContent = t(preset.summaryKey);
      return;
    }

    ui.strategySummary.textContent = t("tool.summaryManual", {
      format: formatLabel(selectedMimeType()),
      quality: Number.parseInt(ui.qualitySlider.value, 10),
      maxWidth: Number.parseInt(ui.maxWidthSlider.value, 10)
    });
  }

  function releasePreview() {
    if (state.previewUrl) URL.revokeObjectURL(state.previewUrl);
    state.previewUrl = null;
  }

  function setStatus(message, tone) {
    ui.resultBanner.style.display = "block";
    ui.resultBanner.textContent = message;
    ui.resultBanner.classList.remove("is-success", "is-warning", "is-error");
    ui.resultBanner.classList.add(`is-${tone}`);
  }
}

function readUi() {
  return {
    fileInput: document.getElementById("fileInput"),
    uploadArea: document.getElementById("uploadArea"),
    outputFormat: document.getElementById("outputFormat"),
    qualitySlider: document.getElementById("quality"),
    maxWidthSlider: document.getElementById("maxWidth"),
    qualityFill: document.getElementById("qualityFill"),
    maxWidthFill: document.getElementById("maxWidthFill"),
    qualityValueInput: document.getElementById("qualityValue"),
    maxWidthValueInput: document.getElementById("maxWidthValue"),
    strategySummary: document.getElementById("strategySummary"),
    resultBanner: document.getElementById("result"),
    resultsContainer: document.getElementById("results-container"),
    resultsList: document.getElementById("results-list"),
    presetButtons: Array.from(document.querySelectorAll("[data-preset]"))
  };
}

function createResultRow(file) {
  const element = document.createElement("div");
  element.className = "result-file-row";
  element.innerHTML = `
    <div class="file-row-left">
      <img class="row-thumbnail" alt="">
      <div class="row-details">
        <span class="row-filename"></span>
        <span class="row-original-size"></span>
      </div>
    </div>
    <div class="file-row-middle"></div>
    <div class="file-row-right">
      <button type="button" class="row-download-btn" style="display: none;">
        <i class="fas fa-download" aria-hidden="true"></i>
        <span></span>
      </button>
    </div>
  `;

  const row = {
    element,
    thumbnail: element.querySelector(".row-thumbnail"),
    filename: element.querySelector(".row-filename"),
    originalSize: element.querySelector(".row-original-size"),
    middle: element.querySelector(".file-row-middle"),
    download: element.querySelector(".row-download-btn")
  };
  row.filename.textContent = file.name;
  row.originalSize.textContent = t("tool.originalSize", { size: formatBytes(file.size) });
  row.thumbnail.alt = t("tool.originalPreview");
  row.download.querySelector("span").textContent = t("tool.download");
  return row;
}

async function encodeImage(source, { mimeType, quality, maxWidth }) {
  const scale = Math.min(1, maxWidth / source.width);
  const width = Math.max(1, Math.round(source.width * scale));
  const height = Math.max(1, Math.round(source.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d", { alpha: mimeType !== "image/jpeg" });
  if (!context) throw new Error(t("tool.canvasUnavailable"));
  if (mimeType === "image/jpeg") {
    context.fillStyle = "#fff";
    context.fillRect(0, 0, width, height);
  }
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(source, 0, 0, width, height);

  let blob;
  if (mimeType === "image/avif") {
    const { default: encodeAvif } = await import("@jsquash/avif/encode.js");
    const buffer = await encodeAvif(context.getImageData(0, 0, width, height), {
      quality,
      qualityAlpha: quality
    });
    blob = new Blob([buffer], { type: mimeType });
  } else {
    blob = await canvasToBlob(canvas, mimeType, quality / 100);
  }

  return { blob, width, height };
}

function canvasToBlob(canvas, mimeType, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error(t("tool.outputFormatUnsupported", { format: formatLabel(mimeType) })));
    }, mimeType, quality);
  });
}

function setupSlider(range, fill, valueInput, suffix) {
  const sync = (rawValue) => {
    const parsed = Number.parseInt(String(rawValue).replace(/[^\d.-]/g, ""), 10);
    const value = clamp(
      Number.isNaN(parsed) ? Number.parseInt(range.value, 10) : parsed,
      Number.parseInt(range.min, 10),
      Number.parseInt(range.max, 10)
    );
    range.value = String(value);
    valueInput.value = `${value}${suffix}`;
    updateSliderFill(range, fill);
  };

  range.addEventListener("input", () => sync(range.value));
  valueInput.addEventListener("change", () => sync(valueInput.value));
  sync(range.value);
}

function updateSliderFill(range, fill) {
  const min = Number.parseInt(range.min, 10);
  const max = Number.parseInt(range.max, 10);
  const value = Number.parseInt(range.value, 10);
  fill.style.width = `${((value - min) / (max - min)) * 100}%`;
}

function downloadBlob(blob, filename) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(link.href), 2000);
}

function formatLabel(mimeType) {
  return mimeType.replace("image/", "").replace("jpeg", "jpg").toUpperCase();
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
