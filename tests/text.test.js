// The folding the glossary search runs on both sides of every comparison: on
// what the reader typed and on the terms it is matched against. If the two
// stop agreeing, the search silently finds nothing.

import { describe, expect, it } from 'vitest';
import { normalizeForSearch } from '@/scripts/utils/text.js';

describe('normalizeForSearch', () => {
  it('folds case and trims the edges', () => {
    expect(normalizeForSearch('  Flexbox  ')).toBe('flexbox');
    expect(normalizeForSearch('GRID')).toBe('grid');
  });

  it('strips the accents an Italian reader will not type', () => {
    expect(normalizeForSearch('però')).toBe('pero');
    expect(normalizeForSearch('proprietà')).toBe('proprieta');
    expect(normalizeForSearch('È Così')).toBe('e cosi');
  });

  // A query and an entry title must fold to the same thing whichever way each
  // of them happens to be encoded: 'à' can arrive as one code point or two.
  it('agrees on both Unicode spellings of the same letter', () => {
    const nfc = 'propriet' + String.fromCharCode(0xe0);
    const nfd = 'proprieta' + String.fromCharCode(0x300);
    expect(nfc).not.toBe(nfd);
    expect(normalizeForSearch(nfd)).toBe(normalizeForSearch(nfc));
  });

  it('leaves the punctuation the glossary titles actually use', () => {
    expect(normalizeForSearch(':hover')).toBe(':hover');
    expect(normalizeForSearch('grid-template-areas')).toBe('grid-template-areas');
    expect(normalizeForSearch('Array.prototype.map()')).toBe('array.prototype.map()');
  });

  it('does not collapse the spaces inside a phrase', () => {
    expect(normalizeForSearch('  box  model ')).toBe('box  model');
  });

  it('turns nothing into an empty string rather than throwing', () => {
    expect(normalizeForSearch(null)).toBe('');
    expect(normalizeForSearch(undefined)).toBe('');
    expect(normalizeForSearch('')).toBe('');
  });

  it('accepts whatever textContent hands it', () => {
    expect(normalizeForSearch(42)).toBe('42');
  });

  it('is idempotent', () => {
    const once = normalizeForSearch('  Perché È Così  ');
    expect(normalizeForSearch(once)).toBe(once);
  });
});
