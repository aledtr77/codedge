// The compressor's sizing model. It is checked for the properties the panel
// depends on — the preset lights up on its own values, the estimate moves the
// way the encoders do, and no setting can make a bigger file look smaller —
// rather than against the bytes it happens to predict today, which would only
// record the constants back to themselves.

import { describe, expect, it } from 'vitest';
import {
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
  targetDimensions,
} from '@/scripts/pages/tools/image-compressor/compressor-core.js';

/** An ImageData-shaped object built from rows of [r, g, b] triplets. */
function image(rows) {
  const height = rows.length;
  const width = rows[0].length;
  const data = new Uint8ClampedArray(width * height * 4);
  rows.flat().forEach(([r, g, b], pixel) => {
    data.set([r, g, b, 255], pixel * 4);
  });
  return { data, width, height };
}

const BLACK = [0, 0, 0];
const WHITE = [255, 255, 255];

describe('presetFor', () => {
  it('names the preset sitting on those exact values', () => {
    for (const [key, preset] of Object.entries(PRESETS)) {
      expect(presetFor(preset.quality, preset.maxWidth)).toBe(key);
    }
  });

  it('calls anything else custom', () => {
    expect(presetFor(PRESETS.balanced.quality + 1, PRESETS.balanced.maxWidth)).toBe('custom');
    expect(presetFor(PRESETS.balanced.quality, PRESETS.balanced.maxWidth - 20)).toBe('custom');
  });

  // The bug this replaces: the panel remembered which chip had been clicked, so
  // picking a different output format — which no preset even names — put out
  // the light, and sliding back onto the preset's values never lit it again.
  it('answers from the values alone, so it survives a round trip', () => {
    const { quality, maxWidth } = PRESETS.strong;
    expect(presetFor(quality, maxWidth)).toBe('strong');
    expect(presetFor(40, 800)).toBe('custom');
    expect(presetFor(quality, maxWidth)).toBe('strong');
  });

  it('keeps every preset on a step the slider can actually stop on', () => {
    for (const preset of Object.values(PRESETS)) {
      expect(preset.quality % 1).toBe(0);
      expect((preset.maxWidth - 640) % 20).toBe(0);
    }
  });
});

describe('targetDimensions', () => {
  it('scales down to the cap and keeps the aspect ratio', () => {
    expect(targetDimensions(4000, 3000, 1600)).toEqual({ width: 1600, height: 1200, scale: 0.4 });
  });

  it('never enlarges an image that is already narrower than the cap', () => {
    expect(targetDimensions(900, 600, 2560)).toEqual({ width: 900, height: 600, scale: 1 });
  });

  it('leaves at least one pixel of a very wide, very short image', () => {
    expect(targetDimensions(8000, 3, 640).height).toBe(1);
  });
});

describe('detailScore', () => {
  it('reads zero off a flat image, which has no neighbouring step at all', () => {
    expect(detailScore(image([[WHITE, WHITE], [WHITE, WHITE]]))).toBe(0);
  });

  it('reads the full range off a checkerboard', () => {
    expect(detailScore(image([[BLACK, WHITE], [WHITE, BLACK]]))).toBe(255);
  });

  it('averages over the pairs, not the pixels', () => {
    // Three pixels in a row: one step of 255, one of 0.
    expect(detailScore(image([[BLACK, WHITE, WHITE]]))).toBeCloseTo(127.5, 5);
  });

  it('has nothing to say about an empty image', () => {
    expect(detailScore({ data: new Uint8ClampedArray(), width: 0, height: 0 })).toBe(0);
  });
});

describe('colourCount', () => {
  it('counts one colour in a flat image', () => {
    expect(colourCount(image([[WHITE, WHITE], [WHITE, WHITE]]))).toBe(1);
  });

  it('counts the distinct ones', () => {
    expect(colourCount(image([[BLACK, WHITE], [WHITE, BLACK]]))).toBe(2);
    expect(colourCount(image([[BLACK, WHITE, [255, 0, 0]]]))).toBe(3);
  });

  // Five bits a channel: shades a viewer cannot tell apart must not read as
  // separate colours, or every photograph would saturate the count.
  it('folds together shades within the same five-bit bin', () => {
    expect(colourCount(image([[[100, 100, 100], [103, 100, 100]]]))).toBe(1);
    expect(colourCount(image([[[100, 100, 100], [110, 100, 100]]]))).toBe(2);
  });

  it('has nothing to count in an empty image', () => {
    expect(colourCount({ data: new Uint8ClampedArray(), width: 0, height: 0 })).toBe(0);
  });
});

describe('detailProfile and detailAtWidth', () => {
  // Measured on every test image: shrinking concentrates the edges, so the
  // thumbnail always reads busier than the full-size picture.
  it('reads the slope off two thumbnails and follows it outwards', () => {
    const profile = detailProfile({ width: 160, detail: 12 }, { width: 320, detail: 9 });
    expect(profile.falloff).toBeCloseTo(Math.log2(0.75), 5);
    expect(detailAtWidth(profile, 160)).toBeCloseTo(12, 5);
    expect(detailAtWidth(profile, 320)).toBeCloseTo(9, 5);
    expect(detailAtWidth(profile, 640)).toBeCloseTo(6.75, 5); // one more doubling
  });

  it('refuses a slope steeper than anything measured', () => {
    const profile = detailProfile({ width: 160, detail: 12 }, { width: 320, detail: 1 });
    expect(profile.falloff).toBe(-0.8);
  });

  it('falls back to a typical slope when the second reading says nothing', () => {
    const flat = detailProfile({ width: 160, detail: 5 }, { width: 320, detail: 0 });
    expect(flat.falloff).toBeLessThan(0);
    expect(detailAtWidth(flat, 1600)).toBeLessThan(5);
  });

  it('will not extrapolate below the thumbnail it measured', () => {
    const profile = detailProfile({ width: 160, detail: 12 }, { width: 320, detail: 6 });
    expect(detailAtWidth(profile, 40)).toBeCloseTo(12, 5);
  });

  it('keeps the reading inside the range the model was fitted over', () => {
    const steep = detailProfile({ width: 160, detail: 40 }, { width: 320, detail: 60 });
    expect(detailAtWidth(steep, 2560)).toBeLessThanOrEqual(40);
    const vanishing = detailProfile({ width: 160, detail: 1 }, { width: 320, detail: 0.4 });
    expect(detailAtWidth(vanishing, 2560)).toBeGreaterThanOrEqual(0.5);
  });
});

describe('estimateEncodedBytes', () => {
  const base = { pixels: 1600 * 1200, mimeType: 'image/webp', quality: 72, detail: 6 };

  it('grows with the quality dial, on every format', () => {
    for (const mimeType of ['image/jpeg', 'image/webp', 'image/avif', 'image/png']) {
      const low = estimateEncodedBytes({ ...base, mimeType, quality: 40 });
      const mid = estimateEncodedBytes({ ...base, mimeType, quality: 70 });
      const high = estimateEncodedBytes({ ...base, mimeType, quality: 95 });
      expect(low, mimeType).toBeLessThan(mid);
      expect(mid, mimeType).toBeLessThan(high);
    }
  });

  it('grows with the pixel count', () => {
    expect(estimateEncodedBytes({ ...base, pixels: 640 * 480 }))
      .toBeLessThan(estimateEncodedBytes({ ...base, pixels: 2560 * 1920 }));
  });

  it('grows with how busy the image is', () => {
    expect(estimateEncodedBytes({ ...base, detail: 2 }))
      .toBeLessThan(estimateEncodedBytes({ ...base, detail: 12 }));
  });

  it('keeps WebP under JPEG at the same setting, at every quality', () => {
    for (let quality = 35; quality <= 95; quality += 5) {
      const of = (mimeType) => estimateEncodedBytes({ ...base, mimeType, quality });
      expect(of('image/webp'), `quality ${quality}`).toBeLessThan(of('image/jpeg'));
    }
  });

  // Measured, against the assumption: at the same number on the dial these
  // encoders are close, and AVIF passes WebP near the top. The estimate has to
  // report that rather than the ranking the format's reputation implies.
  it('does not pretend AVIF is smaller than WebP at the same dial position', () => {
    const of = (mimeType, quality) => estimateEncodedBytes({ ...base, mimeType, quality });
    expect(of('image/avif', 95)).toBeGreaterThan(of('image/webp', 95));
  });

  // Fitted against real encodes: a 2 MP photograph of ordinary busyness lands
  // near 200 KB as WebP and near 300 KB as JPEG at the balanced preset.
  it('lands where the encoders actually land for a two-megapixel photograph', () => {
    const photo = { pixels: 2e6, quality: 72, detail: 5 };
    const webp = estimateEncodedBytes({ ...photo, mimeType: 'image/webp' });
    const jpeg = estimateEncodedBytes({ ...photo, mimeType: 'image/jpeg' });
    expect(webp).toBeGreaterThan(80 * 1024);
    expect(webp).toBeLessThan(250 * 1024);
    expect(jpeg).toBeGreaterThan(webp);
    expect(jpeg).toBeLessThan(400 * 1024);
  });

  // Below 80 the dial is nearly flat and the last few points cost the most:
  // a straight exponential put the low end 150 % out.
  it('spends more on the top ten points of quality than on the bottom forty', () => {
    const at = (quality) => estimateEncodedBytes({ ...base, quality });
    expect(at(85) - at(45)).toBeLessThan(at(95) - at(85));
  });

  // The reading that rescued flat artwork: a gradient exported as PNG was being
  // predicted at twenty times its real size before the colour count went in.
  it('charges PNG for the colours it has to keep, and only PNG', () => {
    const png = (colours) => estimateEncodedBytes({ ...base, mimeType: 'image/png', colours });
    expect(png(40)).toBeLessThan(png(900) / 3);

    const webp = (colours) => estimateEncodedBytes({ ...base, mimeType: 'image/webp', colours });
    expect(webp(40)).toBe(webp(900));
  });

  it('applies what the last real run measured', () => {
    const plain = estimateEncodedBytes(base);
    expect(estimateEncodedBytes({ ...base, calibration: 2 })).toBeCloseTo(plain * 2, -1);
  });

  it('falls back to a known model rather than returning nothing for an odd type', () => {
    expect(estimateEncodedBytes({ ...base, mimeType: 'image/gif' })).toBeGreaterThan(0);
  });
});

describe('calibrationFor', () => {
  it('is the ratio between what happened and what was predicted', () => {
    expect(calibrationFor(200, 100)).toBe(2);
    expect(calibrationFor(50, 100)).toBe(0.5);
  });

  it('will not let one freak result run away with the model', () => {
    expect(calibrationFor(1e9, 100)).toBe(5);
    expect(calibrationFor(1, 1e9)).toBe(0.2);
  });

  it('stays out of the way when there is nothing to learn from', () => {
    expect(calibrationFor(0, 100)).toBe(1);
    expect(calibrationFor(100, 0)).toBe(1);
  });
});

describe('pngColorCount', () => {
  it('spans a palette from 32 to 256 colours', () => {
    expect(pngColorCount(35)).toBe(32);
    expect(pngColorCount(95)).toBe(256);
  });

  it('clamps a dial that somehow left its range', () => {
    expect(pngColorCount(0)).toBe(32);
    expect(pngColorCount(200)).toBe(256);
  });
});

describe('sizeDeltaPercent and formatDelta', () => {
  it('reads a smaller file as a negative delta', () => {
    expect(sizeDeltaPercent(300, 1000)).toBe(-70);
    expect(formatDelta(-70)).toBe('-70%');
  });

  it('signs a file that got bigger', () => {
    expect(formatDelta(sizeDeltaPercent(1200, 1000))).toBe('+20%');
  });

  it('calls a difference too small to matter zero, in either direction', () => {
    expect(formatDelta(0.2)).toBe('0%');
    expect(formatDelta(-0.2)).toBe('0%');
  });

  it('has nothing to divide by when the original is empty', () => {
    expect(sizeDeltaPercent(100, 0)).toBe(0);
  });
});

describe('formatLabel and formatBytes', () => {
  it('shows the format the way a person writes it', () => {
    expect(formatLabel('image/jpeg')).toBe('JPG');
    expect(formatLabel('image/webp')).toBe('WEBP');
  });

  it('changes unit at each threshold, not around it', () => {
    expect(formatBytes(1023)).toBe('1023 B');
    expect(formatBytes(1024)).toBe('1.0 KB');
    expect(formatBytes(1024 * 1024 - 1)).toBe('1024.0 KB');
    expect(formatBytes(1024 * 1024)).toBe('1.00 MB');
  });
});

describe('clamp', () => {
  it('holds a value inside its bounds', () => {
    expect(clamp(5, 1, 10)).toBe(5);
    expect(clamp(-5, 1, 10)).toBe(1);
    expect(clamp(50, 1, 10)).toBe(10);
  });
});
