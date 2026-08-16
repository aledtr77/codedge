// The compressor's panel: it reads the controls, keeps an estimate on screen,
// and starts the encoder — once, when the visitor asks for it.
//
// The order matters and used to be the other way round. Every slider move fired
// a full re-encode (an AVIF drag pulled a WASM module in behind it), the row was
// rebuilt from scratch each time, and the file was compressed before anyone had
// touched a setting. Now a change costs arithmetic — compressor-core.js does the
// sizing — and the engine only runs on the Compress button, so the panel stays
// responsive and the numbers on screen say plainly whether they are a guess or
// the finished file.

import { t } from "@/i18n/ui.js";
import {
  EXTENSIONS,
  PRESETS,
  calibrationFor,
  clamp,
  colourCount,
  detailAtWidth,
  detailProfile,
  detailScore,
  estimateEncodedBytes,
  formatBytes,
  formatDelta,
  formatLabel,
  pngColorCount,
  presetFor,
  sizeDeltaPercent,
  targetDimensions
} from "./compressor-core.js";

let initialized = false;

// Kept in step with --slider-thumb-size in the stylesheet: the fill has to stop
// under the middle of the knob, not at the edge of the track.
const THUMB_SIZE = 14;

// The two thumbnails every reading is taken from. Both are small enough to be
// free; the pair is what gives the slope of detail against size, so the maximum
// width slider can move the estimate without touching the pixels again.
const SAMPLE_WIDTHS = [160, 320];

export function initImageCompressor() {
  if (initialized) return;
  initialized = true;

  const ui = readUi();
  if (!ui.fileInput || !ui.uploadArea || !ui.resultsList) {
    console.error("[image-compressor] Required elements are missing.");
    return;
  }

  const state = {
    file: null,
    source: null,
    // How detail falls away with size for this image, and how many colours it
    // holds: both measured once, on load, and never again.
    detail: null,
    colours: 0,
    // What the last real run proved about this image, per output format.
    calibration: {},
    row: null,
    previewUrl: null,
    outputUrl: null,
    // The finished file, plus the settings it was made with: the moment those
    // two disagree the row goes back to showing an estimate.
    result: null,
    runId: 0,
    working: false
  };

  setupSlider(ui.qualitySlider, ui.qualityFill, ui.qualityValueInput, "%");
  setupSlider(ui.maxWidthSlider, ui.maxWidthFill, ui.maxWidthValueInput, "px");
  applyPreset("balanced");
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

    ui.outputFormat.addEventListener("change", settingsChanged);
    ui.qualitySlider.addEventListener("input", settingsChanged);
    ui.maxWidthSlider.addEventListener("input", settingsChanged);
    ui.qualityValueInput.addEventListener("change", settingsChanged);
    ui.maxWidthValueInput.addEventListener("change", settingsChanged);
    ui.presetButtons.forEach((button) => {
      button.addEventListener("click", () => {
        applyPreset(button.dataset.preset);
        settingsChanged();
      });
    });

    // The row is rewritten in place but never rebuilt, so one listener here
    // outlives every file the visitor drops on the tool.
    ui.resultsList.addEventListener("click", (event) => {
      if (!event.target.closest(".row-action-btn")) return;
      if (state.result) downloadResult();
      else compress();
    });
  }

  async function loadFile(file) {
    if (!file.type.startsWith("image/") || !EXTENSIONS[file.type]) {
      setStatus(t("tool.invalidImage"), "error");
      return;
    }

    ui.fileInput.value = "";
    const runId = ++state.runId;
    setStatus(t("tool.decodingImage"), "warning");

    try {
      const source = await createImageBitmap(file, { imageOrientation: "from-image" });
      if (runId !== state.runId) {
        source.close();
        return;
      }

      state.source?.close();
      dropResult();
      releaseUrl("previewUrl");
      state.file = file;
      state.source = source;
      const measured = measureImage(source);
      state.detail = measured.detail;
      state.colours = measured.colours;
      state.calibration = {};
      state.row = createResultRow(file);
      ui.resultsList.replaceChildren(state.row.element);
      ui.resultsContainer.style.display = "flex";

      state.previewUrl = URL.createObjectURL(file);
      state.row.thumbnail.src = state.previewUrl;
      showUploadPreview(file, source);

      renderEstimate();
      setStatus(t("tool.readyToCompress"), "warning");
    } catch (error) {
      console.error(error);
      setStatus(t("tool.compressError", { name: file.name, message: error.message }), "error");
    }
  }

  // Every control lands here, and nothing here is expensive: the chips are
  // re-derived, the summary rewritten and the estimate recomputed, all from
  // numbers already in memory.
  function settingsChanged() {
    syncPresetChips();
    updateStrategySummary();
    if (!state.file || !state.source) return;

    const stale = state.result && !sameSettings(state.result.settings, currentSettings());
    if (stale || state.working) {
      // A run still in flight no longer matches what is on screen; let it
      // finish into nothing rather than show a file made from old settings.
      state.runId += 1;
      state.working = false;
      dropResult();
      setStatus(t("tool.settingsChanged"), "warning");
    } else if (state.result) {
      return;
    }

    renderEstimate();
  }

  function applyPreset(key) {
    const preset = PRESETS[key];
    if (!preset) return;

    ui.qualitySlider.value = String(preset.quality);
    ui.qualityValueInput.value = `${preset.quality}%`;
    ui.maxWidthSlider.value = String(preset.maxWidth);
    ui.maxWidthValueInput.value = `${preset.maxWidth}px`;
    updateSliderFill(ui.qualitySlider, ui.qualityFill);
    updateSliderFill(ui.maxWidthSlider, ui.maxWidthFill);
    syncPresetChips();
    updateStrategySummary();
  }

  function currentSettings() {
    return {
      mimeType:
        ui.outputFormat.value === "original"
          ? state.file?.type || "image/jpeg"
          : `image/${ui.outputFormat.value}`,
      quality: clamp(Number.parseInt(ui.qualitySlider.value, 10), 35, 95),
      maxWidth: clamp(Number.parseInt(ui.maxWidthSlider.value, 10), 640, 2560)
    };
  }

  function renderEstimate() {
    const settings = currentSettings();
    const target = targetDimensions(state.source.width, state.source.height, settings.maxWidth);
    const bytes = estimateEncodedBytes({
      pixels: target.width * target.height,
      mimeType: settings.mimeType,
      quality: settings.quality,
      detail: detailAtWidth(state.detail, target.width),
      colours: state.colours,
      calibration: state.calibration[settings.mimeType] ?? 1
    });

    paintRow({
      delta: sizeDeltaPercent(bytes, state.file.size),
      detail: `${formatLabel(settings.mimeType)} · ${target.width}×${target.height}px · ≈ ${formatBytes(bytes)}`,
      estimate: true
    });
    setAction("compress");
  }

  async function compress() {
    if (!state.file || !state.source || state.working) return;

    const runId = ++state.runId;
    const settings = currentSettings();
    state.working = true;
    setAction("busy");
    setStatus(t("tool.compressing"), "warning");

    try {
      // The encoders below hold the main thread; without this the spinner would
      // only appear once the work it announces is already over.
      await nextFrame();
      const output = await encodeImage(state.source, settings);
      if (runId !== state.runId) return;
      if (output.blob.type !== settings.mimeType) {
        throw new Error(t("tool.outputFormatUnsupported", { format: formatLabel(settings.mimeType) }));
      }

      state.working = false;
      acceptResult(output, settings);
    } catch (error) {
      if (runId !== state.runId) return;
      state.working = false;
      console.error(error);
      paintRow({ error: true });
      setAction("compress");
      setStatus(t("tool.compressError", { name: state.file.name, message: error.message }), "error");
    }
  }

  function acceptResult({ blob, width, height }, settings) {
    const extension = EXTENSIONS[blob.type];
    const name = `${state.file.name.replace(/\.[^.]+$/, "")}-${t("tool.outputSuffix")}.${extension}`;

    // Now that a real size is known, the model can be corrected for this image:
    // the next drag of the quality dial estimates from measurement, not theory.
    const predicted = estimateEncodedBytes({
      pixels: width * height,
      mimeType: settings.mimeType,
      quality: settings.quality,
      detail: detailAtWidth(state.detail, width),
      colours: state.colours
    });
    state.calibration[settings.mimeType] = calibrationFor(blob.size, predicted);

    state.result = { blob, name, settings };
    state.row.filename.textContent = name;
    paintRow({
      delta: sizeDeltaPercent(blob.size, state.file.size),
      detail: `${formatLabel(blob.type)} · ${width}×${height}px · ${formatBytes(blob.size)}`,
      estimate: false
    });
    showOutputPreview(blob);
    setAction("download");
    setStatus(t("tool.compressOk", { name }), "success");
  }

  function dropResult() {
    state.result = null;
    releaseUrl("outputUrl");
    if (state.row && state.previewUrl) {
      state.row.thumbnail.src = state.previewUrl;
      state.row.thumbnail.alt = t("tool.originalPreview");
      state.row.filename.textContent = state.file?.name ?? "";
    }
  }

  // The upload box keeps the source on screen for as long as it is loaded: it is
  // the only confirmation that the drop landed, and the results row below shows
  // the encoder's output rather than the input once there is one.
  function showUploadPreview(file, source) {
    if (!ui.uploadPreview) return;

    ui.uploadPreview.src = state.previewUrl;
    ui.uploadFilename.textContent = file.name;
    ui.uploadMeta.textContent = `${source.width}×${source.height}px · ${formatBytes(file.size)}`;
    ui.uploadEmpty.hidden = true;
    ui.uploadLoaded.hidden = false;
    ui.uploadArea.classList.add("has-image");
  }

  // Worth seeing the encoder's own output rather than the source, but not worth
  // an empty square: a browser that cannot draw the format falls back.
  function showOutputPreview(blob) {
    releaseUrl("outputUrl");
    state.outputUrl = URL.createObjectURL(blob);
    state.row.thumbnail.onerror = () => {
      state.row.thumbnail.onerror = null;
      state.row.thumbnail.src = state.previewUrl;
      state.row.thumbnail.alt = t("tool.originalPreview");
    };
    state.row.thumbnail.src = state.outputUrl;
    state.row.thumbnail.alt = t("tool.outputPreview", { format: formatLabel(blob.type) });
  }

  // One row, written in place. Rebuilding its markup on every change is what
  // made the panel flicker and the layout jump under a slider drag.
  function paintRow({ delta, detail, estimate, error }) {
    const { badge, details } = state.row;
    badge.classList.toggle("is-error", Boolean(error));
    badge.classList.toggle("is-estimate", Boolean(estimate) && !error);
    badge.classList.toggle("is-growth", !error && delta >= 0.5);

    if (error) {
      badge.textContent = t("tool.error");
      badge.removeAttribute("title");
      details.textContent = "";
      return;
    }

    badge.textContent = estimate ? `≈ ${formatDelta(delta)}` : formatDelta(delta);
    if (estimate) badge.title = t("tool.estimateHint");
    else badge.removeAttribute("title");
    details.textContent = detail;
  }

  function setAction(mode) {
    const { action, actionIcon, actionLabel } = state.row;
    action.disabled = mode === "busy";
    action.classList.toggle("is-download", mode === "download");
    state.row.element.classList.toggle("is-working", mode === "busy");

    if (mode === "busy") {
      actionIcon.className = "fas fa-spinner row-spinner";
      actionLabel.textContent = t("tool.optimizing");
      return;
    }
    if (mode === "download") {
      actionIcon.className = "fas fa-download";
      actionLabel.textContent = t("tool.download");
      return;
    }
    actionIcon.className = "fas fa-compress-arrows-alt";
    actionLabel.textContent = t("tool.compress");
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
      <div class="file-row-middle">
        <span class="savings-badge"></span>
        <span class="compressed-size-text"></span>
      </div>
      <div class="file-row-right">
        <button type="button" class="row-action-btn">
          <i class="fas fa-compress-arrows-alt" aria-hidden="true"></i>
          <span></span>
        </button>
      </div>
    `;

    const row = {
      element,
      thumbnail: element.querySelector(".row-thumbnail"),
      filename: element.querySelector(".row-filename"),
      originalSize: element.querySelector(".row-original-size"),
      badge: element.querySelector(".savings-badge"),
      details: element.querySelector(".compressed-size-text"),
      action: element.querySelector(".row-action-btn"),
      actionIcon: element.querySelector(".row-action-btn i"),
      actionLabel: element.querySelector(".row-action-btn span")
    };
    row.filename.textContent = file.name;
    row.originalSize.textContent = t("tool.originalSize", { size: formatBytes(file.size) });
    row.thumbnail.alt = t("tool.originalPreview");
    return row;
  }

  function downloadResult() {
    if (!state.result) return;
    downloadBlob(state.result.blob, state.result.name);
  }

  function syncPresetChips() {
    const active = presetFor(
      Number.parseInt(ui.qualitySlider.value, 10),
      Number.parseInt(ui.maxWidthSlider.value, 10)
    );
    ui.presetButtons.forEach((button) => {
      const on = button.dataset.preset === active;
      button.classList.toggle("is-active", on);
      button.setAttribute("aria-pressed", String(on));
    });
  }

  function updateStrategySummary() {
    const quality = Number.parseInt(ui.qualitySlider.value, 10);
    const maxWidth = Number.parseInt(ui.maxWidthSlider.value, 10);
    const format = formatLabel(currentSettings().mimeType);
    const preset = PRESETS[presetFor(quality, maxWidth)];

    ui.strategySummary.textContent = preset
      ? t(preset.summaryKey, { format })
      : t("tool.summaryManual", { format, quality, maxWidth });
  }

  function releaseUrl(key) {
    if (state[key]) URL.revokeObjectURL(state[key]);
    state[key] = null;
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
    uploadEmpty: document.getElementById("uploadAreaEmpty"),
    uploadLoaded: document.getElementById("uploadAreaLoaded"),
    uploadPreview: document.getElementById("uploadPreview"),
    uploadFilename: document.getElementById("uploadFilename"),
    uploadMeta: document.getElementById("uploadMeta"),
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

// Everything the estimate needs to know about the image, read once on load from
// two thumbnails: how busy it is, how that busyness falls away with size, and
// how many colours it holds. Asking again on every slider move would put pixel
// work back on the path this rewrite exists to clear.
function measureImage(source) {
  const samples = SAMPLE_WIDTHS.map((sampleWidth) => {
    const width = Math.max(1, Math.min(sampleWidth, source.width));
    const height = Math.max(1, Math.round((source.height * width) / source.width));
    const { context } = paintTo(source, width, height, false);
    const pixels = context.getImageData(0, 0, width, height);
    return { width, pixels, detail: detailScore(pixels) };
  });

  return {
    detail: detailProfile(samples[0], samples[1]),
    colours: colourCount(samples[samples.length - 1].pixels)
  };
}

async function encodeImage(source, { mimeType, quality, maxWidth }) {
  const { width, height } = targetDimensions(source.width, source.height, maxWidth);
  const { canvas, context } = scaleDown(source, width, height, mimeType === "image/jpeg");

  let blob;
  if (mimeType === "image/png") {
    await quantizePng(context, width, height, quality);
    blob = await canvasToBlob(canvas, mimeType);
  } else if (mimeType === "image/avif") {
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

// Halve, then halve again, and only then draw the final size. A single
// drawImage from 4000px to 1200px samples too few source pixels and the result
// crawls with aliasing — which then costs bytes, because the encoder has to
// store the noise the resize invented.
function scaleDown(source, width, height, opaque) {
  let from = source;
  let fromWidth = source.width;
  let fromHeight = source.height;

  while (fromWidth > width * 2 && fromHeight > height * 2) {
    fromWidth = Math.max(width, Math.round(fromWidth / 2));
    fromHeight = Math.max(height, Math.round(fromHeight / 2));
    from = paintTo(from, fromWidth, fromHeight, false).canvas;
  }

  return paintTo(from, width, height, opaque);
}

function paintTo(source, width, height, opaque) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d", { alpha: !opaque });
  if (!context) throw new Error(t("tool.canvasUnavailable"));
  if (opaque) {
    context.fillStyle = "#fff";
    context.fillRect(0, 0, width, height);
  }
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(source, 0, 0, width, height);
  return { canvas, context };
}

async function quantizePng(context, width, height, quality) {
  const { applyPaletteSync, buildPaletteSync, utils } = await import("image-q");
  const source = utils.PointContainer.fromImageData(context.getImageData(0, 0, width, height));
  const palette = buildPaletteSync([source], {
    colors: pngColorCount(quality),
    colorDistanceFormula: "euclidean-bt709",
    paletteQuantization: "wuquant"
  });
  const quantized = applyPaletteSync(source, palette, {
    colorDistanceFormula: "euclidean-bt709",
    imageQuantization: "nearest"
  });
  const pixels = new Uint8ClampedArray(quantized.toUint8Array());
  context.putImageData(new ImageData(pixels, width, height), 0, 0);
}

function canvasToBlob(canvas, mimeType, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error(t("tool.outputFormatUnsupported", { format: formatLabel(mimeType) })));
      },
      mimeType,
      quality
    );
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

// The knob travels between half a thumb from each end, so a fill measured as a
// plain percentage of the track runs ahead of it at the bottom and lags at the
// top. Insetting it by the thumb makes the bar mean exactly what it shows.
function updateSliderFill(range, fill) {
  const min = Number.parseInt(range.min, 10);
  const max = Number.parseInt(range.max, 10);
  const value = Number.parseInt(range.value, 10);
  const ratio = max === min ? 0 : (value - min) / (max - min);
  fill.style.width = `calc(${(ratio * 100).toFixed(3)}% + ${(THUMB_SIZE / 2 - ratio * THUMB_SIZE).toFixed(2)}px)`;
}

function sameSettings(a, b) {
  return a.mimeType === b.mimeType && a.quality === b.quality && a.maxWidth === b.maxWidth;
}

function nextFrame() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
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
