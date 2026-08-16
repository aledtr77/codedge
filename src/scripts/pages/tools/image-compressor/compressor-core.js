// The compressor's arithmetic: presets, output size, and the estimate the tool
// shows *before* anything is encoded.
//
// It sits outside image-compressor.js because nothing here touches the DOM, the
// canvas or the encoder — numbers in, numbers out. That is what lets the panel
// answer a slider drag in a fraction of a millisecond instead of re-encoding the
// image on every pixel of travel, and what makes the model checkable without a
// browser (tests/compressor-core.test.js).
//
// The constants below were fitted against ~540 real encodes (twelve images, both
// sliders, every format) driven through this same browser pipeline, not taken
// from the usual quoted figures: half the median error came from the shape of
// the quality curve, which is nearly flat below 80 and then runs away.

export const PRESETS = {
  balanced: { quality: 72, maxWidth: 1600, summaryKey: 'tool.summaryBalanced' },
  light: { quality: 82, maxWidth: 2200, summaryKey: 'tool.summaryLight' },
  strong: { quality: 58, maxWidth: 1280, summaryKey: 'tool.summaryStrong' }
};

export const EXTENSIONS = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif'
};

// Which preset the panel is sitting on, worked out from the values themselves.
// Keeping it derived rather than remembered is the whole point: a preset stays
// lit while the output format changes (no preset names a format), and dragging a
// slider back onto its value lights it again instead of leaving the row blank.
export function presetFor(quality, maxWidth) {
  const hit = Object.keys(PRESETS).find(
    (key) => PRESETS[key].quality === quality && PRESETS[key].maxWidth === maxWidth
  );
  return hit || 'custom';
}

// Width caps, never enlarges: asking for 2560px on a 900px photo has to leave it
// at 900, otherwise the estimate promises detail the source does not have.
export function targetDimensions(width, height, maxWidth) {
  const scale = Math.min(1, maxWidth / width);
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
    scale
  };
}

// How much work the encoder will have to do, read off a thumbnail: the mean
// brightness step between neighbouring pixels. Flat artwork lands near 1, an
// ordinary photograph around 4 to 9, dense texture past 15 — and the encoded
// size tracks that far more closely than it tracks the pixel count alone.
export function detailScore({ data, width, height }) {
  if (!width || !height) return 0;

  const luma = new Float32Array(width * height);
  for (let pixel = 0, i = 0; pixel < luma.length; pixel += 1, i += 4) {
    luma[pixel] = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
  }

  let total = 0;
  let pairs = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const pixel = y * width + x;
      if (x + 1 < width) {
        total += Math.abs(luma[pixel] - luma[pixel + 1]);
        pairs += 1;
      }
      if (y + 1 < height) {
        total += Math.abs(luma[pixel] - luma[pixel + width]);
        pairs += 1;
      }
    }
  }

  return pairs ? total / pairs : 0;
}

// Detail is not one number: shrinking an image concentrates its edges into fewer
// pixels, so the same photograph reads busier at 160px than at 1600px. Two
// thumbnails give the slope of that fall, and the slope is what lets the maximum
// width slider move the estimate without going back to the pixels.
const DEFAULT_FALLOFF = -0.44;

export function detailProfile(low, high) {
  const usable = low?.detail > 0 && high?.detail > 0 && high.width > low.width;
  if (!low?.width) return { width: 160, detail: 6, falloff: DEFAULT_FALLOFF };
  if (!usable) return { width: low.width, detail: low.detail, falloff: DEFAULT_FALLOFF };

  return {
    width: low.width,
    detail: low.detail,
    falloff: clamp(Math.log(high.detail / low.detail) / Math.log(high.width / low.width), -0.8, 0.2)
  };
}

// How many colours the thumbnail holds, counted at five bits a channel. The
// gradient reading cannot tell a soft logo from a page of black text — one is
// expensive in PNG and the other is nearly free — and PNG pays for colours.
// One pass over the same thumbnail, a couple of milliseconds.
export function colourCount({ data, width, height }) {
  if (!width || !height) return 0;

  const bins = new Uint8Array(32768);
  let distinct = 0;
  for (let i = 0; i < data.length; i += 4) {
    const bin = ((data[i] >> 3) << 10) | ((data[i + 1] >> 3) << 5) | (data[i + 2] >> 3);
    if (!bins[bin]) {
      bins[bin] = 1;
      distinct += 1;
    }
  }
  return distinct;
}

export function detailAtWidth(profile, width) {
  // Never below the thumbnail the reading was taken from: past that the curve
  // has no data behind it and rises without limit.
  const scaled = profile.detail * (Math.max(profile.width, width) / profile.width) ** profile.falloff;
  return clamp(scaled, 0.5, 40);
}

// Bits per pixel each encoder spends on a reference image — detail 10, quality
// 75 — and the two exponents that move it. `quality` is the exponent on
// 25/(100-q): the dial's last ten points cost more than its first forty.
//
// The ordering is not the one the marketing implies. At the *same number on the
// dial* these encoders produce roughly comparable files, and AVIF overtakes WebP
// near the top, because a quality number means something different to each of
// them. The estimate reports what will actually come out.
const FORMAT_MODEL = {
  'image/jpeg': { bpp: 1.46, quality: 0.5, detail: 0.7, overhead: 800 },
  'image/webp': { bpp: 0.95, quality: 0.5, detail: 0.7, overhead: 300 },
  'image/avif': { bpp: 1.16, quality: 0.7, detail: 1, overhead: 400 },
  // PNG has no quality knob — the dial picks the palette instead — and it is
  // the one format whose size is driven by the number of colours as much as by
  // the detail. Without that term a flat gradient came out twenty times over.
  'image/png': { bpp: 5.22, palette: 0.9, detail: 0.6, colours: 0.6, overhead: 1200 }
};

const REFERENCE_COLOURS = 300;

export function estimateEncodedBytes({
  pixels,
  mimeType,
  quality,
  detail = 6,
  colours = REFERENCE_COLOURS,
  calibration = 1
}) {
  const model = FORMAT_MODEL[mimeType] || FORMAT_MODEL['image/jpeg'];
  const texture = clamp(detail / 10, 0.05, 4) ** model.detail;
  const dial = model.palette
    ? (paletteBits(quality) / paletteBits(75)) ** model.palette
    : (25 / (100 - clamp(quality, 1, 99))) ** model.quality;
  const palette = model.colours
    ? clamp(colours / REFERENCE_COLOURS, 0.02, 8) ** model.colours
    : 1;

  const bytes = (pixels * model.bpp * dial * texture * palette) / 8 + model.overhead;
  return Math.round(bytes * calibration);
}

// What the last real run says the model got wrong for this image and format.
// Applied to every later estimate of the same pair, so the second guess is
// nearly exact — the guard keeps one freak result from poisoning the rest.
export function calibrationFor(actualBytes, predictedBytes) {
  if (!(actualBytes > 0) || !(predictedBytes > 0)) return 1;
  return clamp(actualBytes / predictedBytes, 0.2, 5);
}

// 35 % of the dial is 32 colours, 95 % is 256: a doubling every fifth of travel.
export function pngColorCount(quality) {
  const normalized = (clamp(quality, 35, 95) - 35) / 60;
  return Math.round(32 * 2 ** (normalized * 3));
}

const paletteBits = (quality) => Math.log2(pngColorCount(quality));

// Signed, and rounded the way the badge shows it: negative is weight saved.
export function sizeDeltaPercent(outputBytes, originalBytes) {
  if (!originalBytes) return 0;
  return ((outputBytes - originalBytes) / originalBytes) * 100;
}

export function formatDelta(percent) {
  if (Math.abs(percent) < 0.5) return '0%';
  return `${percent > 0 ? '+' : ''}${percent.toFixed(0)}%`;
}

export function formatLabel(mimeType) {
  return String(mimeType).replace('image/', '').replace('jpeg', 'jpg').toUpperCase();
}

export function formatBytes(bytes) {
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
