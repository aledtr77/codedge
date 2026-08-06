// The extractor's colour maths. Everything here is checked against values that
// can be worked out by hand or come from the WCAG definition, not against what
// the code happens to return today — a test that only records current output
// cannot fail for a good reason.

import { describe, expect, it } from 'vitest';
import {
  clamp,
  contrastRatio,
  extractPalette,
  hueDistance,
  labDistance,
  mergeNearbyColors,
  normalizePaletteSize,
  paletteToCss,
  paletteToJson,
  pickRoles,
  readableTextColor,
  relativeLuminance,
  rgbToHex,
  rgbToHsl,
  rgbToLab,
} from '@/scripts/pages/tools/palette-extractor/palette-core.js';

/** A bucket in the shape sampleImage() hands to extractPalette(). */
function bucket(r, g, b, count) {
  const hsl = rgbToHsl(r, g, b);
  return {
    r,
    g,
    b,
    hsl,
    lab: rgbToLab({ r, g, b }),
    count,
    weight: count * (0.76 + hsl.s / 180),
  };
}

describe('rgbToHsl', () => {
  it('places the primaries on their hue', () => {
    expect(rgbToHsl(255, 0, 0)).toEqual({ h: 0, s: 100, l: 50 });
    expect(rgbToHsl(0, 255, 0)).toEqual({ h: 120, s: 100, l: 50 });
    expect(rgbToHsl(0, 0, 255)).toEqual({ h: 240, s: 100, l: 50 });
  });

  it('reports greys as unsaturated', () => {
    expect(rgbToHsl(0, 0, 0)).toEqual({ h: 0, s: 0, l: 0 });
    expect(rgbToHsl(128, 128, 128)).toEqual({ h: 0, s: 0, l: 50 });
    expect(rgbToHsl(255, 255, 255)).toEqual({ h: 0, s: 0, l: 100 });
  });

  // Red sits on the seam: a hue computed as a small negative number and left
  // that way would sort and compare as if it were the far end of the wheel.
  it('never returns a negative hue just below red', () => {
    const { h } = rgbToHsl(255, 0, 1);
    expect(h).toBeGreaterThan(300);
    expect(h).toBeLessThanOrEqual(360);
  });
});

describe('rgbToHex', () => {
  it('pads single-digit channels', () => {
    expect(rgbToHex({ r: 0, g: 0, b: 0 })).toBe('#000000');
    expect(rgbToHex({ r: 1, g: 2, b: 3 })).toBe('#010203');
    expect(rgbToHex({ r: 255, g: 255, b: 255 })).toBe('#ffffff');
  });

  // The averaging in mergeNearbyColors can land a channel just outside the
  // range; a hex of seven or nine characters would reach the CSS export.
  it('clamps and rounds out-of-range channels', () => {
    expect(rgbToHex({ r: 300, g: -20, b: 12.6 })).toBe('#ff000d');
  });
});

describe('clamp', () => {
  it('bounds on both sides and passes the middle through', () => {
    expect(clamp(-5, 0, 255)).toBe(0);
    expect(clamp(999, 0, 255)).toBe(255);
    expect(clamp(42, 0, 255)).toBe(42);
  });
});

describe('relativeLuminance and contrastRatio', () => {
  it('anchors the two ends of the WCAG scale', () => {
    expect(relativeLuminance({ r: 255, g: 255, b: 255 })).toBeCloseTo(1, 5);
    expect(relativeLuminance({ r: 0, g: 0, b: 0 })).toBeCloseTo(0, 5);
    expect(contrastRatio({ r: 255, g: 255, b: 255 }, { r: 0, g: 0, b: 0 })).toBeCloseTo(21, 5);
  });

  it('gives 1 for a colour against itself', () => {
    expect(contrastRatio({ r: 90, g: 120, b: 200 }, { r: 90, g: 120, b: 200 })).toBeCloseTo(1, 6);
  });

  // #767676 on white is the canonical "just passes AA for body text" pair.
  it('matches the known ratio for #767676 on white', () => {
    const ratio = contrastRatio({ r: 118, g: 118, b: 118 }, { r: 255, g: 255, b: 255 });
    expect(ratio).toBeGreaterThan(4.5);
    expect(ratio).toBeLessThan(4.6);
  });

  it('does not care which colour comes first', () => {
    const a = { r: 20, g: 40, b: 60 };
    const b = { r: 200, g: 210, b: 220 };
    expect(contrastRatio(a, b)).toBeCloseTo(contrastRatio(b, a), 10);
  });
});

describe('readableTextColor', () => {
  it('picks the side that is actually readable', () => {
    expect(readableTextColor({ r: 255, g: 255, b: 255 }).hex).toBe('#0a0c10');
    expect(readableTextColor({ r: 0, g: 0, b: 0 }).hex).toBe('#ffffff');
  });

  // The one result that would simply be wrong: text nobody can read on the
  // background it was chosen for.
  it('clears AA on every background there is', () => {
    let worst = Infinity;
    let worstBackground = null;

    for (let r = 0; r <= 255; r += 3) {
      for (let g = 0; g <= 255; g += 3) {
        for (let b = 0; b <= 255; b += 3) {
          const ratio = readableTextColor({ r, g, b }).ratio;
          if (ratio < worst) {
            worst = ratio;
            worstBackground = `rgb(${r}, ${g}, ${b})`;
          }
        }
      }
    }

    expect(worst, `worst background: ${worstBackground}`).toBeGreaterThanOrEqual(4.5);
  });

  it('reports the ratio it actually achieves', () => {
    for (let r = 0; r <= 255; r += 17) {
      for (let g = 0; g <= 255; g += 17) {
        for (let b = 0; b <= 255; b += 17) {
          const background = { r, g, b };
          const chosen = readableTextColor(background);
          expect(chosen.ratio).toBeCloseTo(contrastRatio(chosen, background), 10);
        }
      }
    }
  });

  // Pure black is the fallback, not the default: it costs the palette its
  // softer black, so it may only appear where the softened one cannot reach AA.
  it('keeps the softened black wherever it already reads', () => {
    const softBlack = { r: 10, g: 12, b: 16 };

    for (let r = 0; r <= 255; r += 5) {
      for (let g = 0; g <= 255; g += 5) {
        for (let b = 0; b <= 255; b += 5) {
          const background = { r, g, b };
          const chosen = readableTextColor(background);
          if (chosen.hex !== '#000000') continue;
          // It fell back, so the softened black really was short of AA here.
          const softRatio = Math.max(
            contrastRatio(softBlack, background),
            contrastRatio({ r: 255, g: 255, b: 255 }, background),
          );
          expect(softRatio, `rgb(${r}, ${g}, ${b})`).toBeLessThan(4.5);
        }
      }
    }
  });

  it('clears AA comfortably on the light and dark ends', () => {
    expect(readableTextColor({ r: 255, g: 255, b: 255 }).ratio).toBeGreaterThan(15);
    expect(readableTextColor({ r: 18, g: 22, b: 30 }).ratio).toBeGreaterThan(14);
  });
});

describe('rgbToLab and labDistance', () => {
  it('puts white at L*100 with no chroma', () => {
    const lab = rgbToLab({ r: 255, g: 255, b: 255 });
    expect(lab.l).toBeCloseTo(100, 1);
    expect(lab.a).toBeCloseTo(0, 1);
    expect(lab.b).toBeCloseTo(0, 1);
  });

  it('puts black at L*0', () => {
    expect(rgbToLab({ r: 0, g: 0, b: 0 }).l).toBeCloseTo(0, 3);
  });

  it('is zero for a colour against itself and symmetric otherwise', () => {
    const red = rgbToLab({ r: 255, g: 0, b: 0 });
    const blue = rgbToLab({ r: 0, g: 0, b: 255 });
    expect(labDistance(red, red)).toBe(0);
    expect(labDistance(red, blue)).toBeCloseTo(labDistance(blue, red), 10);
    expect(labDistance(red, blue)).toBeGreaterThan(50);
  });

  // Lab is used to decide whether two colours are the same one. If a step in
  // sRGB moved a different amount depending on where it started, the merge
  // threshold would mean something different in every part of the space.
  it('separates two colours the eye can tell apart by more than the merge threshold', () => {
    const near = labDistance(rgbToLab({ r: 200, g: 30, b: 30 }), rgbToLab({ r: 202, g: 32, b: 31 }));
    const far = labDistance(rgbToLab({ r: 200, g: 30, b: 30 }), rgbToLab({ r: 30, g: 30, b: 200 }));
    expect(near).toBeLessThan(8);
    expect(far).toBeGreaterThan(8);
  });
});

describe('hueDistance', () => {
  it('goes the short way round the wheel', () => {
    expect(hueDistance(350, 10)).toBe(20);
    expect(hueDistance(10, 350)).toBe(20);
    expect(hueDistance(0, 180)).toBe(180);
    expect(hueDistance(90, 90)).toBe(0);
  });
});

describe('normalizePaletteSize', () => {
  it('keeps the slider inside 4–10', () => {
    expect(normalizePaletteSize(2)).toBe(4);
    expect(normalizePaletteSize(99)).toBe(10);
    expect(normalizePaletteSize('7')).toBe(7);
    expect(normalizePaletteSize(7.6)).toBe(8);
  });

  it('falls back to 8 when there is no number at all', () => {
    expect(normalizePaletteSize('abc')).toBe(8);
    expect(normalizePaletteSize(undefined)).toBe(8);
    expect(normalizePaletteSize(NaN)).toBe(8);
  });
});

describe('mergeNearbyColors', () => {
  it('folds two colours the eye would not tell apart', () => {
    const merged = mergeNearbyColors([bucket(200, 30, 30, 100), bucket(202, 32, 31, 40)]);
    expect(merged).toHaveLength(1);
    // Counts and weights add up: the merged entry stands for both.
    expect(merged[0].count).toBe(140);
  });

  it('leaves colours that are genuinely different alone', () => {
    const merged = mergeNearbyColors([bucket(200, 30, 30, 100), bucket(30, 30, 200, 40)]);
    expect(merged).toHaveLength(2);
  });

  it('does not mutate the array it was given', () => {
    const input = [bucket(200, 30, 30, 100), bucket(202, 32, 31, 40)];
    const before = input.map((c) => `${c.r},${c.g},${c.b},${c.count}`);
    mergeNearbyColors(input);
    expect(input.map((c) => `${c.r},${c.g},${c.b},${c.count}`)).toEqual(before);
  });
});

describe('extractPalette', () => {
  it('returns nothing for an image with nothing in it', () => {
    expect(extractPalette([], 6)).toEqual([]);
  });

  it('finds the colours that are actually in the picture', () => {
    const palette = extractPalette(
      [
        bucket(220, 40, 40, 4000),
        bucket(40, 90, 220, 3000),
        bucket(30, 160, 90, 2000),
        bucket(240, 200, 60, 1000),
      ],
      4,
    );

    expect(palette.length).toBeGreaterThan(0);
    expect(palette.length).toBeLessThanOrEqual(4);

    // Every entry the UI renders needs these: a swatch, a readable label, and
    // a share of the image to show under it.
    for (const color of palette) {
      expect(color.hex).toMatch(/^#[0-9a-f]{6}$/);
      expect(color.text.hex).toMatch(/^#[0-9a-f]{6}$/);
      expect(color.coverage).toBeGreaterThan(0);
      expect(color.coverage).toBeLessThanOrEqual(1);
    }
  });

  it('sorts by score, strongest first', () => {
    const palette = extractPalette(
      [bucket(220, 40, 40, 4000), bucket(40, 90, 220, 3000), bucket(30, 160, 90, 500)],
      3,
    );
    const scores = palette.map((c) => c.score);
    expect([...scores].sort((a, b) => b - a)).toEqual(scores);
  });

  it('never asks for more centres than there are buckets', () => {
    expect(() => extractPalette([bucket(10, 20, 30, 5)], 10)).not.toThrow();
    expect(extractPalette([bucket(10, 20, 30, 5)], 10).length).toBeLessThanOrEqual(1);
  });

  // An image with four colours in it cannot yield ten, and the slider is
  // allowed to ask for ten. Returning fewer is the right answer, not a failure.
  it('never returns more than it was asked for', () => {
    const buckets = [
      bucket(220, 40, 40, 4000),
      bucket(40, 90, 220, 3000),
      bucket(30, 160, 90, 2000),
      bucket(240, 200, 60, 1000),
      bucket(150, 60, 200, 900),
      bucket(250, 140, 40, 700),
    ];

    for (const size of [4, 5, 6, 8, 10]) {
      expect(extractPalette(buckets, size).length).toBeLessThanOrEqual(size);
    }
  });

  it('gives the same palette for the same buckets', () => {
    const buckets = [bucket(220, 40, 40, 4000), bucket(40, 90, 220, 3000), bucket(30, 160, 90, 900)];
    const first = extractPalette(buckets, 3).map((c) => c.hex);
    const second = extractPalette(buckets, 3).map((c) => c.hex);
    expect(second).toEqual(first);
  });
});

describe('pickRoles', () => {
  const palette = extractPalette(
    [
      bucket(18, 22, 30, 6000),
      bucket(220, 60, 60, 2500),
      bucket(60, 190, 170, 1500),
      bucket(240, 220, 180, 800),
    ],
    4,
  );

  it('has nothing to assign when the palette is empty', () => {
    expect(pickRoles([])).toBeNull();
  });

  it('takes the background from the dark end', () => {
    expect(pickRoles(palette).background.hsl.l).toBeLessThanOrEqual(46);
  });

  // The roles are handed to the user as a ready-made scheme. Text that cannot
  // be read on its own background is the one result that is simply wrong.
  it('returns text that is readable on the background it chose', () => {
    const roles = pickRoles(palette);
    expect(roles.text.ratio).toBeGreaterThanOrEqual(4.5);
  });

  it('does not hand the same colour to background and primary', () => {
    const roles = pickRoles(palette);
    expect(roles.primary.hex).not.toBe(roles.background.hex);
  });

  it('fills all four roles even when the palette is only two colours long', () => {
    const roles = pickRoles(extractPalette([bucket(18, 22, 30, 6000), bucket(220, 60, 60, 2500)], 2));
    for (const role of ['background', 'primary', 'accent', 'text']) {
      expect(roles[role].hex).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
});

describe('exports', () => {
  const palette = extractPalette([bucket(18, 22, 30, 6000), bucket(220, 60, 60, 2500)], 2);
  const roles = pickRoles(palette);

  it('writes CSS custom properties for the palette and the roles', () => {
    const css = paletteToCss(palette, roles);
    expect(css.startsWith(':root {')).toBe(true);
    expect(css.trimEnd().endsWith('}')).toBe(true);
    expect(css).toContain(`--color-1: ${palette[0].hex};`);
    expect(css).toContain(`--bg: ${roles.background.hex};`);
    expect(css).toContain(`--text: ${roles.text.hex};`);
  });

  it('leaves the role block out when there are no roles', () => {
    const css = paletteToCss(palette, null);
    expect(css).not.toContain('--bg:');
    expect(css).toContain('--color-1:');
  });

  it('produces JSON that parses, with coverage cut to four decimals', () => {
    const parsed = JSON.parse(paletteToJson(palette, roles, { name: 'demo.png' }));
    expect(parsed.image).toEqual({ name: 'demo.png' });
    expect(parsed.palette).toHaveLength(palette.length);
    expect(parsed.roles.background).toBe(roles.background.hex);
    for (const color of parsed.palette) {
      expect(String(color.coverage).split('.')[1]?.length ?? 0).toBeLessThanOrEqual(4);
    }
  });

  it('says roles are null rather than omitting the key', () => {
    expect(JSON.parse(paletteToJson(palette, null, {})).roles).toBeNull();
  });
});
