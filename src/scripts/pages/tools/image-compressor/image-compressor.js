import Compressor from "compressorjs";
import { t } from "@/i18n/ui.js";

let initialized = false;

const PRESETS = {
  balanced: {
    get label() { return t("tool.presetBalanced"); },
    quality: 72,
    maxWidth: 1600,
    format: "webp",
    get summary() { return t("tool.summaryBalanced"); }
  },
  light: {
    get label() { return t("tool.presetLight"); },
    quality: 82,
    maxWidth: 2200,
    format: "webp",
    get summary() { return t("tool.summaryLight"); }
  },
  strong: {
    get label() { return t("tool.presetStrong"); },
    quality: 58,
    maxWidth: 1280,
    format: "webp",
    get summary() { return t("tool.summaryStrong"); }
  }
};

export function initImageCompressor() {
  if (initialized) return;
  initialized = true;

  const elements = {
    fileInput: document.getElementById("fileInput"),
    uploadArea: document.getElementById("uploadArea"),
    advancedSettingsPanel: document.getElementById("advanced-settings-panel"),
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

  if (!elements.fileInput || !elements.uploadArea || !elements.resultsList) {
    console.error("[compressore-immagini] Elementi fondamentali mancanti.");
    return;
  }

  const state = {
    activePreset: "balanced"
  };

  setupInitialState();
  bindEvents();

  function setupInitialState() {
    applyPreset(state.activePreset);
    updateSliderFill(elements.qualitySlider, elements.qualityFill);
    updateSliderFill(elements.maxWidthSlider, elements.maxWidthFill);
  }

  function bindEvents() {
    elements.uploadArea.addEventListener("click", () => elements.fileInput.click());
    
    elements.uploadArea.addEventListener("dragover", (event) => {
      event.preventDefault();
      elements.uploadArea.classList.add("is-dragover");
    });
    
    elements.uploadArea.addEventListener("dragleave", () => {
      elements.uploadArea.classList.remove("is-dragover");
    });
    
    elements.uploadArea.addEventListener("drop", async (event) => {
      event.preventDefault();
      elements.uploadArea.classList.remove("is-dragover");
      const file = event.dataTransfer?.files?.[0];
      if (file) await handleSelectedFile(file);
    });

    elements.fileInput.addEventListener("change", async (event) => {
      const file = event.target.files?.[0];
      if (file) await handleSelectedFile(file);
    });

    setupSlider(elements.qualitySlider, elements.qualityFill, elements.qualityValueInput, "%");
    setupSlider(elements.maxWidthSlider, elements.maxWidthFill, elements.maxWidthValueInput, "px");

    elements.outputFormat.addEventListener("change", onAdvancedControlChange);
    elements.qualityValueInput.addEventListener("change", onAdvancedControlChange);
    elements.maxWidthValueInput.addEventListener("change", onAdvancedControlChange);
    elements.qualitySlider.addEventListener("input", onAdvancedControlChange);
    elements.maxWidthSlider.addEventListener("input", onAdvancedControlChange);

    elements.presetButtons.forEach((button) => {
      button.addEventListener("click", () => {
        applyPreset(button.dataset.preset);
      });
    });
  }

  function applyPreset(presetKey) {
    const preset = PRESETS[presetKey];
    if (!preset) return;

    state.activePreset = presetKey;
    elements.outputFormat.value = preset.format;
    elements.qualitySlider.value = String(preset.quality);
    elements.qualityValueInput.value = `${preset.quality}%`;
    elements.maxWidthSlider.value = String(preset.maxWidth);
    elements.maxWidthValueInput.value = `${preset.maxWidth}px`;

    updateSliderFill(elements.qualitySlider, elements.qualityFill);
    updateSliderFill(elements.maxWidthSlider, elements.maxWidthFill);
    updatePresetButtons();
    updateStrategySummary();
  }

  function updatePresetButtons() {
    elements.presetButtons.forEach((button) => {
      button.classList.toggle("is-active", button.dataset.preset === state.activePreset);
    });
  }

  function onAdvancedControlChange() {
    state.activePreset = "custom";
    updatePresetButtons();
    updateStrategySummary();
  }

  function updateStrategySummary() {
    const quality = Number.parseInt(elements.qualitySlider.value, 10);
    const maxWidth = Number.parseInt(elements.maxWidthSlider.value, 10);
    const format = resolveOutputMime().replace("image/", "").toUpperCase();

    if (PRESETS[state.activePreset]) {
      elements.strategySummary.textContent = PRESETS[state.activePreset].summary;
      return;
    }

    elements.strategySummary.textContent =
      t("tool.summaryManual", { format, quality, maxWidth });
  }

  async function handleSelectedFile(file) {
    if (!file.type.startsWith("image/")) {
      setStatus(t("tool.invalidImage"), "error");
      return;
    }

    // Reset the input so the same file can be re-uploaded
    elements.fileInput.value = "";
    elements.resultsContainer.style.display = "flex";

    const rowId = `row-${Date.now()}`;
    const rowEl = document.createElement("div");
    rowEl.className = "result-file-row";
    rowEl.id = rowId;

    const originalUrl = URL.createObjectURL(file);

    rowEl.innerHTML = `
      <div class="file-row-left">
        <img class="row-thumbnail" src="${originalUrl}" alt="Thumbnail">
        <div class="row-details">
          <span class="row-filename">${file.name}</span>
          <span class="row-original-size">Originale: ${formatBytes(file.size)}</span>
        </div>
      </div>
      <div class="file-row-middle">
        <i class="fas fa-spinner row-spinner" aria-hidden="true"></i>
        <span class="compressed-size-text">Ottimizzazione...</span>
      </div>
      <div class="file-row-right">
        <button type="button" class="row-download-btn" style="display: none;">
          <i class="fas fa-download" aria-hidden="true"></i> Scarica
        </button>
      </div>
    `;

    elements.resultsList.insertBefore(rowEl, elements.resultsList.firstChild);

    setTimeout(async () => {
      try {
        const quality = clamp(Number.parseInt(elements.qualitySlider.value, 10), 35, 95) / 100;
        const maxWidth = clamp(Number.parseInt(elements.maxWidthSlider.value, 10), 640, 2560);
        const mimeType = resolveOutputMime(file);

        const compressedBlob = await new Promise((resolve, reject) => {
          new Compressor(file, {
            quality,
            maxWidth,
            mimeType,
            convertSize: 0,
            success: resolve,
            error: reject
          });
        });

        const savedPercent = ((file.size - compressedBlob.size) / file.size) * 100;
        const savedText = savedPercent > 0 ? `-${savedPercent.toFixed(0)}%` : "0%";

        const middleEl = rowEl.querySelector(".file-row-middle");
        middleEl.innerHTML = `
          <span class="savings-badge">${savedText}</span>
          <span class="compressed-size-text">Peso: ${formatBytes(compressedBlob.size)}</span>
        `;

        const downloadBtn = rowEl.querySelector(".row-download-btn");
        downloadBtn.style.display = "inline-flex";
        
        downloadBtn.addEventListener("click", () => {
          const link = document.createElement("a");
          const ext = extensionFromMime(compressedBlob.type || mimeType);
          const baseName = file.name.replace(/\.[^.]+$/, "");
          link.href = URL.createObjectURL(compressedBlob);
          link.download = `${baseName}-ottimizzata.${ext}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => URL.revokeObjectURL(link.href), 2000);
        });

        setStatus(t("tool.compressOk", { name: file.name }), "success");
      } catch (err) {
        console.error(err);
        const middleEl = rowEl.querySelector(".file-row-middle");
        middleEl.innerHTML = `<span class="savings-badge" style="background: rgba(239,68,68,0.1); border-color: rgba(239,68,68,0.3); color: #ef4444;">${t("tool.error")}</span>`;
        setStatus(t("tool.compressError", { name: file.name, message: err.message }), "error");
      }
    }, 200);
  }

  function resolveOutputMime(file) {
    if (elements.outputFormat.value === "original") {
      return file ? file.type : "image/jpeg";
    }
    return `image/${elements.outputFormat.value}`;
  }

  function setStatus(message, tone) {
    elements.resultBanner.style.display = "block";
    elements.resultBanner.textContent = message;
    elements.resultBanner.classList.remove("is-success", "is-warning", "is-error");
    if (tone === "success") elements.resultBanner.classList.add("is-success");
    if (tone === "warning") elements.resultBanner.classList.add("is-warning");
    if (tone === "error") elements.resultBanner.classList.add("is-error");
  }

  function setupSlider(rangeEl, fillEl, inputEl, suffix) {
    const updateValue = (rawValue) => {
      const numericValue = Number.parseInt(String(rawValue).replace(/[^\d.-]/g, ""), 10);
      const fallback = Number.parseInt(rangeEl.value, 10);
      const clampedValue = clamp(
        Number.isNaN(numericValue) ? fallback : numericValue,
        Number.parseInt(rangeEl.min, 10),
        Number.parseInt(rangeEl.max, 10)
      );

      rangeEl.value = String(clampedValue);
      inputEl.value = `${clampedValue}${suffix}`;
      updateSliderFill(rangeEl, fillEl);
    };

    rangeEl.addEventListener("input", () => updateValue(rangeEl.value));
    inputEl.addEventListener("change", () => updateValue(inputEl.value));
    updateValue(rangeEl.value);
  }

  function updateSliderFill(rangeEl, fillEl) {
    const min = Number.parseInt(rangeEl.min, 10);
    const max = Number.parseInt(rangeEl.max, 10);
    const value = Number.parseInt(rangeEl.value, 10);
    const percentage = ((value - min) / (max - min)) * 100;
    fillEl.style.width = `${percentage}%`;
  }

  function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  function extensionFromMime(mimeType) {
    const map = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/avif": "avif"
    };
    return map[mimeType] || "img";
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }
}
