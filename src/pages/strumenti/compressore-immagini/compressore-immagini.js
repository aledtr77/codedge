// src/components/js/compressore-immagini.js
// Se usi CDN per compressorjs, commenta la riga sotto.
import Compressor from "compressorjs";

let _init = false;
let compressedImageBlob = null;

export function initImageCompressor() {
  if (_init) return;
  _init = true;

  // ---- refs UI
  const fileInput = document.getElementById("fileInput");
  const uploadArea = document.getElementById("uploadArea");
  const compressBtn = document.getElementById("compressBtn");
  const result = document.getElementById("result");
  const originalImageContainer = document.getElementById("originalImageContainer");
  const compressedImageContainer = document.getElementById("compressedImageContainer");
  const outputFormat = document.getElementById("outputFormat");
  const qualitySlider = document.getElementById("quality");
  const maxWidthSlider = document.getElementById("maxWidth");
  const qualityFill = document.getElementById("qualityFill");
  const maxWidthFill = document.getElementById("maxWidthFill");
  const qualityValueInput = document.getElementById("qualityValue");
  const maxWidthValueInput = document.getElementById("maxWidthValue");
  const saveToButton = document.getElementById("saveToButton");

  // guard minimi: senza questi non ha senso iniziare
  if (!fileInput || !compressBtn || !result) {
    console.error("[compressore-immagini] Elementi fondamentali mancanti.");
    return;
  }

  // stato iniziale
  compressedImageBlob = null;
  if (compressBtn) compressBtn.disabled = true;
  if (saveToButton) saveToButton.disabled = true;

  // ---- helpers
  const kb = (bytes) => (bytes / 1024).toFixed(2);

  function handleFiles(fileList) {
    if (!fileList || !fileList.length) return;
    const file = fileList[0];
    if (!file.type.startsWith("image/")) {
      result.textContent = "Per favore seleziona un'immagine valida.";
      return;
    }
    compressBtn.disabled = false;
    displayOriginalImage(file);
    // reset stato precedente
    compressedImageBlob = null;
    if (saveToButton) saveToButton.disabled = true;
    compressedImageContainer && (compressedImageContainer.innerHTML = "");
    result.textContent = "";
  }

  function displayOriginalImage(file) {
    const fr = new FileReader();
    fr.onload = (ev) => {
      const img = new Image();
      img.onload = function () {
        const ext = file.type.split("/")[1]?.toUpperCase() || "IMG";
        originalImageContainer &&
          (originalImageContainer.innerHTML = `
            <img src="${ev.target.result}" alt="Immagine originale">
            <p>Originale (${ext}): ${kb(file.size)} KB</p>
            <p>Risoluzione: ${this.width} x ${this.height} px</p>
          `);
      };
      img.src = ev.target.result;
    };
    fr.readAsDataURL(file);
  }

  function displayCompressedImage(blob) {
    const fr = new FileReader();
    fr.onload = (ev) => {
      const img = new Image();
      img.onload = function () {
        compressedImageContainer &&
          (compressedImageContainer.innerHTML = `
            <img src="${ev.target.result}" alt="Immagine compressa">
            <p>Compressa (${(outputFormat?.value || "").toUpperCase()}): ${kb(blob.size)} KB</p>
            <p>Risoluzione: ${this.width} x ${this.height} px</p>
          `);
      };
      img.src = ev.target.result;
    };
    fr.readAsDataURL(blob);
  }

  async function compressAndConvertImage() {
    const file = fileInput.files?.[0];
    if (!file) return;

    try {
      result.textContent = "Compressione e conversione in corso...";
      const quality = Math.max(0, Math.min(1, parseFloat(qualitySlider?.value ?? "80") / 100));
      const maxWidth = parseInt(maxWidthSlider?.value ?? "1200", 10);
      const formatRaw = (outputFormat?.value || "jpeg").toLowerCase();
      const format = formatRaw === "jpg" ? "jpeg" : formatRaw;
      const mime = `image/${format}`;

      if (typeof Compressor !== "function") {
        throw new Error("CompressorJS non trovato. Installa 'compressorjs' o includi il CDN.");
      }

      // usa CompressorJS
      new Compressor(file, {
        quality,
        maxWidth,
        mimeType: mime,
        success(blob) {
          if (blob.size < file.size) {
            compressedImageBlob = blob;
            displayCompressedImage(blob);
            result.textContent = `Operazione completata! Dimensione ridotta da ${kb(file.size)} KB a ${kb(blob.size)} KB`;
          } else {
            // non conviene: tieni l'originale
            compressedImageBlob = file;
            displayCompressedImage(file);
            result.textContent = `Qualità/larghezza invariati: mantengo l'originale. Dimensione: ${kb(file.size)} KB`;
          }
          if (saveToButton) saveToButton.disabled = false;
        },
        error(err) {
          result.textContent = "Errore durante l'elaborazione: " + err.message;
          if (saveToButton) saveToButton.disabled = true;
        },
      });
    } catch (err) {
      result.textContent = "Errore durante l'elaborazione: " + err.message;
      if (saveToButton) saveToButton.disabled = true;
    }
  }

  function saveCompressedImage() {
    if (!compressedImageBlob) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(compressedImageBlob);
    a.download = `compressed_image.${(outputFormat?.value || "jpeg").toLowerCase()}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // opzionale: revoke più tardi
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  function updateSliderFill(rangeEl, fillEl) {
    if (!rangeEl || !fillEl) return;
    const pct = ((rangeEl.value - rangeEl.min) / (rangeEl.max - rangeEl.min)) * 100;
    fillEl.style.width = `${pct}%`;
  }

  function setupSlider(rangeEl, fillEl, inputEl, suffix) {
    if (!rangeEl) return;
    const updateValue = (val) => {
      const num = parseFloat(val);
      const clamped = isNaN(num)
        ? parseFloat(rangeEl.value)
        : Math.min(Math.max(num, parseFloat(rangeEl.min)), parseFloat(rangeEl.max));
      rangeEl.value = clamped;
      if (inputEl) inputEl.value = `${clamped}${suffix}`;
      updateSliderFill(rangeEl, fillEl);
    };
    rangeEl.addEventListener("input", () => updateValue(rangeEl.value));
    inputEl?.addEventListener("change", function () {
      updateValue(this.value);
    });
    updateValue(rangeEl.value);
  }

  // ---- bind eventi
  uploadArea?.addEventListener("click", () => fileInput.click());
  uploadArea?.addEventListener("dragover", (e) => {
    e.preventDefault();
    uploadArea.style.backgroundColor = "#2a2a2a";
  });
  uploadArea?.addEventListener("dragleave", () => {
    uploadArea.style.backgroundColor = "";
  });
  uploadArea?.addEventListener("drop", (e) => {
    e.preventDefault();
    uploadArea.style.backgroundColor = "";
    handleFiles(e.dataTransfer.files);
  });

  fileInput.addEventListener("change", (e) => handleFiles(e.target.files));
  compressBtn.addEventListener("click", compressAndConvertImage);
  saveToButton?.addEventListener("click", saveCompressedImage);

  setupSlider(qualitySlider, qualityFill, qualityValueInput, "%");
  setupSlider(maxWidthSlider, maxWidthFill, maxWidthValueInput, "px");
}
