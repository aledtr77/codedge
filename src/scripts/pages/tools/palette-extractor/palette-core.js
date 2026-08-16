// The extractor's engine: colour quantisation, role assignment, conversions.
//
// It sits outside estrattore-palette.js because nothing here touches the DOM —
// numbers in, numbers out. That is what makes it checkable without a browser,
// which tests/palette-core.test.js does.

const D65 = { x: 0.95047, y: 1, z: 1.08883 };
export const DOMINANT_COLOR_COUNT = 5;

export function extractPalette(buckets, size) {
  if (!buckets.length) return [];

  const k = Math.min(size + 2, buckets.length);
  const centers = seedCenters(buckets, k);

  for (let iteration = 0; iteration < 18; iteration += 1) {
    const groups = centers.map(() => ({ r: 0, g: 0, b: 0, count: 0, weight: 0, members: 0 }));

    for (const bucket of buckets) {
      const index = nearestCenter(bucket, centers);
      const group = groups[index];
      group.r += bucket.r * bucket.weight;
      group.g += bucket.g * bucket.weight;
      group.b += bucket.b * bucket.weight;
      group.count += bucket.count;
      group.weight += bucket.weight;
      group.members += 1;
    }

    groups.forEach((group, index) => {
      if (!group.weight) return;
      const rgb = {
        r: Math.round(group.r / group.weight),
        g: Math.round(group.g / group.weight),
        b: Math.round(group.b / group.weight),
      };
      centers[index] = {
        ...rgb,
        lab: rgbToLab(rgb),
        hsl: rgbToHsl(rgb.r, rgb.g, rgb.b),
        count: group.count,
        weight: group.weight,
        members: group.members,
      };
    });
  }

  const totalPixelCount = buckets.reduce((sum, bucket) => sum + bucket.count, 0);
  const merged = mergeNearbyColors(centers)
    .map((color) => decorateColor(color, totalPixelCount))
    .filter((color) => color.coverage >= 0.005)
    .sort((a, b) => b.coverage - a.coverage);

  return merged.slice(0, size);
}

export function seedCenters(buckets, size) {
  const centers = [buckets[0]];

  while (centers.length < size) {
    let best = null;
    let bestScore = -Infinity;

    for (const bucket of buckets) {
      const minDistance = Math.min(...centers.map((center) => labDistance(bucket.lab, center.lab)));
      const score = Math.sqrt(bucket.weight) * minDistance;
      if (score > bestScore) {
        best = bucket;
        bestScore = score;
      }
    }

    centers.push(best);
  }

  return centers.map((center) => ({ ...center }));
}

export function nearestCenter(bucket, centers) {
  let bestIndex = 0;
  let bestDistance = Infinity;

  centers.forEach((center, index) => {
    const distance = labDistance(bucket.lab, center.lab);
    if (distance < bestDistance) {
      bestIndex = index;
      bestDistance = distance;
    }
  });

  return bestIndex;
}

export function mergeNearbyColors(colors) {
  const sorted = [...colors].sort((a, b) => b.weight - a.weight);
  const merged = [];

  for (const color of sorted) {
    const similar = merged.find((item) => labDistance(item.lab, color.lab) < 8);

    if (!similar) {
      merged.push({ ...color });
      continue;
    }

    const totalWeight = similar.weight + color.weight;
    const rgb = {
      r: Math.round((similar.r * similar.weight + color.r * color.weight) / totalWeight),
      g: Math.round((similar.g * similar.weight + color.g * color.weight) / totalWeight),
      b: Math.round((similar.b * similar.weight + color.b * color.weight) / totalWeight),
    };

    Object.assign(similar, {
      ...rgb,
      lab: rgbToLab(rgb),
      hsl: rgbToHsl(rgb.r, rgb.g, rgb.b),
      count: similar.count + color.count,
      weight: totalWeight,
    });
  }

  return merged;
}

export function decorateColor(color, total) {
  const hsl = rgbToHsl(color.r, color.g, color.b);
  const hex = rgbToHex(color);
  const text = readableTextColor(color);

  return {
    r: color.r,
    g: color.g,
    b: color.b,
    hsl,
    lab: color.lab,
    hex,
    text,
    count: color.count,
    coverage: color.count / Math.max(1, total),
  };
}

export function pickRoles(palette) {
  if (!palette.length) return null;

  const darkCandidates = palette.filter((color) => color.hsl.l <= 46);
  const background =
    darkCandidates.sort((a, b) => {
      const aScore = a.coverage * 1.8 + (100 - a.hsl.s) / 150 + (50 - a.hsl.l) / 120;
      const bScore = b.coverage * 1.8 + (100 - b.hsl.s) / 150 + (50 - b.hsl.l) / 120;
      return bScore - aScore;
    })[0] ?? palette[0];

  const primary =
    palette
      .filter((color) => color.hex !== background.hex)
      .sort((a, b) => roleColorScore(b, background) - roleColorScore(a, background))[0] ?? palette[0];

  const accent =
    palette
      .filter((color) => color.hex !== background.hex && color.hex !== primary.hex)
      .sort((a, b) => {
        const aScore =
          roleColorScore(a, background) +
          hueDistance(a.hsl.h, primary.hsl.h) / 120 +
          Math.abs(a.hsl.l - primary.hsl.l) / 80;
        const bScore =
          roleColorScore(b, background) +
          hueDistance(b.hsl.h, primary.hsl.h) / 120 +
          Math.abs(b.hsl.l - primary.hsl.l) / 80;
        return bScore - aScore;
      })[0] ?? primary;

  return {
    background,
    primary,
    accent,
    text: readableTextColor(background),
  };
}

export function roleColorScore(color, background) {
  const contrast = contrastRatio(color, background);
  const contrastScore = contrast >= 3 ? 1.3 : contrast / 3;
  return color.coverage * 1.2 + color.hsl.s / 62 + contrastScore + color.hsl.l / 180;
}

export function paletteToCss(palette, roles) {
  const lines = [":root {"];
  palette.forEach((color, index) => {
    lines.push(`  --color-${index + 1}: ${color.hex};`);
  });

  if (roles) {
    lines.push(
      `  --bg: ${roles.background.hex};`,
      `  --primary: ${roles.primary.hex};`,
      `  --accent: ${roles.accent.hex};`,
      `  --text: ${roles.text.hex};`,
    );
  }

  lines.push("}");
  return lines.join("\n");
}

export function paletteToJson(palette, roles, meta) {
  return JSON.stringify(
    {
      image: meta,
      palette: palette.map((color) => ({
        hex: color.hex,
        rgb: { r: color.r, g: color.g, b: color.b },
        hsl: color.hsl,
        coverage: Number(color.coverage.toFixed(4)),
      })),
      roles: roles
        ? {
            background: roles.background.hex,
            primary: roles.primary.hex,
            accent: roles.accent.hex,
            text: roles.text.hex,
          }
        : null,
    },
    null,
    2,
  );
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function toHex(value) {
  return clamp(Math.round(value), 0, 255).toString(16).padStart(2, "0");
}

export function rgbToHex(color) {
  return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;
}

export function rgbToHsl(r, g, b) {
  const nr = r / 255;
  const ng = g / 255;
  const nb = b / 255;
  const max = Math.max(nr, ng, nb);
  const min = Math.min(nr, ng, nb);
  const lightness = (max + min) / 2;

  if (max === min) {
    return { h: 0, s: 0, l: Math.round(lightness * 100) };
  }

  const delta = max - min;
  const saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);

  let hue;
  if (max === nr) hue = (ng - nb) / delta + (ng < nb ? 6 : 0);
  else if (max === ng) hue = (nb - nr) / delta + 2;
  else hue = (nr - ng) / delta + 4;

  return {
    h: Math.round((hue / 6) * 360),
    s: Math.round(saturation * 100),
    l: Math.round(lightness * 100),
  };
}

export function relativeLuminance({ r, g, b }) {
  const [rs, gs, bs] = [r, g, b].map((value) => {
    const channel = value / 255;
    return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function contrastRatio(first, second) {
  const l1 = relativeLuminance(first);
  const l2 = relativeLuminance(second);
  const light = Math.max(l1, l2);
  const dark = Math.min(l1, l2);
  return (light + 0.05) / (dark + 0.05);
}

export function wcagLevel(ratio) {
  if (ratio >= 7) return "aaa";
  if (ratio >= 4.5) return "aa";
  if (ratio >= 3) return "aaLarge";
  return "fail";
}

const WHITE = { r: 255, g: 255, b: 255 };
// Softened black: against a coloured background it reads as part of the
// palette in a way #000 does not.
const SOFT_BLACK = { r: 10, g: 12, b: 16 };
const PURE_BLACK = { r: 0, g: 0, b: 0 };
const AA_NORMAL_TEXT = 4.5;

function betterOn(background, dark) {
  const whiteRatio = contrastRatio(WHITE, background);
  const darkRatio = contrastRatio(dark, background);
  const rgb = whiteRatio >= darkRatio ? WHITE : dark;

  return {
    ...rgb,
    hex: rgbToHex(rgb),
    ratio: Math.max(whiteRatio, darkRatio),
  };
}

/**
 * Text that can actually be read on the given background.
 *
 * Two colours cannot cover every background: around L*50 white and black are
 * equally far away, and the lift that softens SOFT_BLACK is enough to land the
 * worst case at 4.42 — under what AA asks for normal text. Backgrounds near
 * #518175 hit it. Pure black buys the difference back (its own worst case
 * against white is 4.58), so it steps in exactly where the softened black
 * falls short and nowhere else: the palette keeps its softer black on every
 * background where that one already reads.
 */
export function readableTextColor(background) {
  const softened = betterOn(background, SOFT_BLACK);
  return softened.ratio >= AA_NORMAL_TEXT ? softened : betterOn(background, PURE_BLACK);
}

export function rgbToLab({ r, g, b }) {
  const [lr, lg, lb] = [r, g, b].map((value) => {
    const channel = value / 255;
    return channel <= 0.04045 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
  });

  const x = lr * 0.4124564 + lg * 0.3575761 + lb * 0.1804375;
  const y = lr * 0.2126729 + lg * 0.7151522 + lb * 0.072175;
  const z = lr * 0.0193339 + lg * 0.119192 + lb * 0.9503041;

  const fx = xyzToLabPivot(x / D65.x);
  const fy = xyzToLabPivot(y / D65.y);
  const fz = xyzToLabPivot(z / D65.z);

  return {
    l: 116 * fy - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz),
  };
}

export function xyzToLabPivot(value) {
  return value > 0.008856 ? Math.cbrt(value) : 7.787 * value + 16 / 116;
}

export function labDistance(first, second) {
  return Math.sqrt((first.l - second.l) ** 2 + (first.a - second.a) ** 2 + (first.b - second.b) ** 2);
}

export function hueDistance(first, second) {
  const distance = Math.abs(first - second);
  return Math.min(distance, 360 - distance);
}
