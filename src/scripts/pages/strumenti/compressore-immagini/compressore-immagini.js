import Compressor from "compressorjs";

let initialized = false;

const PRESETS = {
  balanced: {
    label: "Bilanciata",
    quality: 72,
    maxWidth: 1600,
    format: "webp",
    summary: "Converti in WebP con qualita media e larghezza massima da 1600 px."
  },
  light: {
    label: "Leggera",
    quality: 82,
    maxWidth: 2200,
    format: "webp",
    summary: "Mantieni piu dettaglio: WebP, qualita alta e ridimensionamento minimo."
  },
  strong: {
    label: "Spinta",
    quality: 58,
    maxWidth: 1280,
    format: "webp",
    summary: "Punta a ridurre di piu peso e dimensioni, utile per immagini molto pesanti."
  }
};

export function initImageCompressor() {
  if (initialized) return;
  initialized = true;

  const elements = {
    fileInput: document.getElementById("fileInput"),
    uploadArea: document.getElementById("uploadArea"),
    compressBtn: document.getElementById("compressBtn"),
    saveToButton: document.getElementById("saveToButton"),
    outputFormat: document.getElementById("outputFormat"),
    qualitySlider: document.getElementById("quality"),
    maxWidthSlider: document.getElementById("maxWidth"),
    qualityFill: document.getElementById("qualityFill"),
    maxWidthFill: document.getElementById("maxWidthFill"),
    qualityValueInput: document.getElementById("qualityValue"),
    maxWidthValueInput: document.getElementById("maxWidthValue"),
    strategySummary: document.getElementById("strategySummary"),
    resultBanner: document.getElementById("result"),
    originalImageContainer: document.getElementById("originalImageContainer"),
    compressedImageContainer: document.getElementById("compressedImageContainer"),
    originalCaption: document.getElementById("originalCaption"),
    compressedCaption: document.getElementById("compressedCaption"),
    statOriginalSize: document.getElementById("statOriginalSize"),
    statOriginalMeta: document.getElementById("statOriginalMeta"),
    statCompressedSize: document.getElementById("statCompressedSize"),
    statCompressedMeta: document.getElementById("statCompressedMeta"),
    statSavings: document.getElementById("statSavings"),
    statSavingsMeta: document.getElementById("statSavingsMeta"),
    presetButtons: Array.from(document.querySelectorAll("[data-preset]"))
  };

  if (!elements.fileInput || !elements.compressBtn || !elements.resultBanner) {
    console.error("[compressore-immagini] Elementi fondamentali mancanti.");
    return;
  }

  const state = {
    selectedFile: null,
    originalUrl: "",
    compressedUrl: "",
    compressedBlob: null,
    originalMeta: null,
    compressedMeta: null,
    activePreset: "balanced"
  };

  setupInitialState();
  bindEvents();

  function setupInitialState() {
    applyPreset(state.activePreset);
    elements.compressBtn.disabled = true;
    elements.saveToButton.disabled = true;
    updateSliderFill(elements.qualitySlider, elements.qualityFill);
    updateSliderFill(elements.maxWidthSlider, elements.maxWidthFill);
    setStatus("Carica un'immagine per vedere anteprima, pesi e confronto finale.", "neutral");
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

    elements.compressBtn.addEventListener("click", compressCurrentFile);
    elements.saveToButton.addEventListener("click", downloadCompressedImage);

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
        if (state.selectedFile) resetCompressionResult("Preset aggiornato. Premi di nuovo Comprimi immagine per generare un nuovo output.");
      });
    });
  }

  async function handleSelectedFile(file) {
    if (!file.type.startsWith("image/")) {
      setStatus("Seleziona un file immagine valido.", "error");
      return;
    }

    cleanupObjectUrl("originalUrl");
    cleanupObjectUrl("compressedUrl");

    state.selectedFile = file;
    state.compressedBlob = null;
    state.compressedMeta = null;
    state.originalMeta = await loadImageMeta(file);
    state.originalUrl = URL.createObjectURL(file);

    elements.compressBtn.disabled = false;
    elements.saveToButton.disabled = true;

    renderPreview(
      elements.originalImageContainer,
      state.originalUrl,
      buildMetaLines(file, state.originalMeta),
      false
    );
    elements.originalCaption.textContent = `${friendlyFormat(file.type)} · ${formatBytes(file.size)}`;

    elements.statOriginalSize.textContent = formatBytes(file.size);
    elements.statOriginalMeta.textContent = `${state.originalMeta.width} x ${state.originalMeta.height} px · ${friendlyFormat(file.type)}`;

    resetCompressionResult("File caricato. Scegli il preset o regola i controlli, poi avvia la compressione.");
    syncFormatForOriginalFile();
  }

  function syncFormatForOriginalFile() {
    if (!state.selectedFile) return;

    if (elements.outputFormat.value === "original") {
      updateStrategySummary();
      return;
    }

    if (!PRESETS[state.activePreset]) {
      updateStrategySummary();
      return;
    }
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

    if (state.selectedFile) {
      resetCompressionResult("Impostazioni aggiornate. Premi di nuovo Comprimi immagine per confrontare il nuovo risultato.");
    }
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
      `Strategia personalizzata: output ${format}, qualita ${quality}% e larghezza massima ${maxWidth} px.`;
  }

  async function compressCurrentFile() {
    const file = state.selectedFile;
    if (!file) return;

    if (typeof Compressor !== "function") {
      setStatus("CompressorJS non e disponibile. Verifica dipendenze e build.", "error");
      return;
    }

    const quality = clamp(Number.parseInt(elements.qualitySlider.value, 10), 35, 95) / 100;
    const maxWidth = clamp(Number.parseInt(elements.maxWidthSlider.value, 10), 640, 2560);
    const mimeType = resolveOutputMime();

    elements.compressBtn.disabled = true;
    setStatus("Compressione in corso: sto generando l'anteprima finale e il confronto peso/qualita.", "neutral");

    try {
      const blob = await new Promise((resolve, reject) => {
        new Compressor(file, {
          quality,
          maxWidth,
          mimeType,
          convertSize: 0,
          success: resolve,
          error: reject
        });
      });

      cleanupObjectUrl("compressedUrl");
      state.compressedBlob = blob;
      state.compressedMeta = await loadImageMeta(blob);
      state.compressedUrl = URL.createObjectURL(blob);

      renderPreview(
        elements.compressedImageContainer,
        state.compressedUrl,
        buildMetaLines(blob, state.compressedMeta),
        false
      );

      const outputFormat = friendlyFormat(blob.type || mimeType);
      elements.compressedCaption.textContent = `${outputFormat} · ${formatBytes(blob.size)}`;
      elements.statCompressedSize.textContent = formatBytes(blob.size);
      elements.statCompressedMeta.textContent = `${state.compressedMeta.width} x ${state.compressedMeta.height} px · ${outputFormat}`;
      renderSavings(file.size, blob.size);

      elements.saveToButton.disabled = false;
      setStatus(buildCompletionMessage(file, blob), blob.size < file.size ? "success" : "warning");
    } catch (error) {
      state.compressedBlob = null;
      state.compressedMeta = null;
      elements.saveToButton.disabled = true;
      setStatus(`Errore durante la compressione: ${error.message}`, "error");
    } finally {
      elements.compressBtn.disabled = false;
    }
  }

  function buildCompletionMessage(originalFile, compressedBlob) {
    if (compressedBlob.size >= originalFile.size) {
      return "Compressione completata, ma il file finale non e piu leggero dell'originale. Prova un formato diverso o riduci anche la larghezza massima.";
    }

    const savedBytes = originalFile.size - compressedBlob.size;
    const savedPercent = ((savedBytes / originalFile.size) * 100).toFixed(1);
    return `Compressione completata: hai risparmiato ${formatBytes(savedBytes)} (${savedPercent}%).`;
  }

  function renderSavings(originalSize, compressedSize) {
    const savedBytes = originalSize - compressedSize;

    if (savedBytes <= 0) {
      elements.statSavings.textContent = "0%";
      elements.statSavingsMeta.textContent = "Nessun vantaggio netto: prova un preset piu deciso o un altro formato.";
      return;
    }

    const savedPercent = (savedBytes / originalSize) * 100;
    elements.statSavings.textContent = `${savedPercent.toFixed(1)}%`;
    elements.statSavingsMeta.textContent = `${formatBytes(savedBytes)} in meno rispetto all'originale.`;
  }

  function resetCompressionResult(message) {
    cleanupObjectUrl("compressedUrl");
    state.compressedBlob = null;
    state.compressedMeta = null;

    elements.compressedImageContainer.innerHTML = "<p>Dopo la compressione vedrai qui il risultato finale.</p>";
    elements.compressedImageContainer.classList.add("preview-stage--empty");
    elements.compressedCaption.textContent = "Nessuna elaborazione eseguita";
    elements.statCompressedSize.textContent = "-";
    elements.statCompressedMeta.textContent = "Ancora da generare";
    elements.statSavings.textContent = "-";
    elements.statSavingsMeta.textContent = "Valutazione disponibile dopo la compressione";
    elements.saveToButton.disabled = true;
    setStatus(message, "neutral");
  }

  function renderPreview(container, url, metaLines, isEmpty) {
    if (!container) return;

    if (isEmpty) {
      container.classList.add("preview-stage--empty");
      container.innerHTML = "<p>Anteprima non disponibile.</p>";
      return;
    }

    container.classList.remove("preview-stage--empty");
    container.innerHTML = `
      <figure class="preview-figure">
        <img src="${url}" alt="Anteprima immagine elaborata">
        <figcaption class="preview-meta">
          ${metaLines.map((line) => `<span>${line}</span>`).join("")}
        </figcaption>
      </figure>
    `;
  }

  function buildMetaLines(fileOrBlob, meta) {
    return [
      `Formato: ${friendlyFormat(fileOrBlob.type)}`,
      `Peso: ${formatBytes(fileOrBlob.size)}`,
      `Dimensioni: ${meta.width} x ${meta.height} px`
    ];
  }

  async function loadImageMeta(fileOrBlob) {
    const url = URL.createObjectURL(fileOrBlob);
    try {
      return await new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve({ width: image.width, height: image.height });
        image.onerror = () => reject(new Error("Impossibile leggere l'immagine selezionata."));
        image.src = url;
      });
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  function downloadCompressedImage() {
    if (!state.compressedBlob) return;

    const outputExtension = extensionFromMime(state.compressedBlob.type || resolveOutputMime());
    const originalBaseName = (state.selectedFile?.name || "immagine").replace(/\.[^.]+$/, "");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(state.compressedBlob);
    link.download = `${originalBaseName}-ottimizzata.${outputExtension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(link.href), 2000);
  }

  function resolveOutputMime() {
    if (elements.outputFormat.value === "original" && state.selectedFile?.type) {
      return state.selectedFile.type;
    }
    return `image/${elements.outputFormat.value}`;
  }

  function setStatus(message, tone) {
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

  function cleanupObjectUrl(key) {
    if (!state[key]) return;
    URL.revokeObjectURL(state[key]);
    state[key] = "";
  }

  function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  function friendlyFormat(mimeType) {
    if (!mimeType) return "Sconosciuto";
    return mimeType.replace("image/", "").toUpperCase();
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
