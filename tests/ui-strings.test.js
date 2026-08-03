// The runtime strings — the ones components build markup from, which no i18n
// script can reach because they never appear in a page file. i18n-lint reads
// the HTML; nothing reads this table. These tests are the only thing standing
// between a forgotten key and an English page showing an Italian label.

import { describe, expect, it } from 'vitest';
import { STRINGS, t } from '@/i18n/ui.js';

const placeholdersOf = (value) => new Set((value.match(/\{(\w+)\}/g) || []).sort());

describe('the string table', () => {
  it('answers to the same keys in both languages', () => {
    const it_ = Object.keys(STRINGS.it);
    const en = Object.keys(STRINGS.en);
    expect(en.filter((k) => !it_.includes(k))).toEqual([]);
    expect(it_.filter((k) => !en.includes(k))).toEqual([]);
  });

  it('has no empty or whitespace-only string', () => {
    for (const [lang, table] of Object.entries(STRINGS)) {
      for (const [key, value] of Object.entries(table)) {
        expect(typeof value, `${lang}.${key}`).toBe('string');
        expect(value.trim(), `${lang}.${key}`).not.toBe('');
      }
    }
  });

  // A placeholder that exists in one language and not the other renders as a
  // literal `{count}` to half the visitors.
  it('uses the same placeholders in both languages', () => {
    for (const key of Object.keys(STRINGS.it)) {
      expect(placeholdersOf(STRINGS.en[key]), key).toEqual(placeholdersOf(STRINGS.it[key]));
    }
  });

  // Untranslated is not the same as missing, and only one of the two is
  // caught by the key comparison above.
  it('does not leave an English string identical to its Italian source', () => {
    // Proper nouns, symbols and shared technical words are legitimately equal.
    const shared = new Set(['Home', 'GitHub', 'Font Awesome', 'CSS', 'HTML', 'JavaScript']);
    const suspects = Object.keys(STRINGS.it).filter((key) => {
      const value = STRINGS.it[key];
      return (
        STRINGS.en[key] === value &&
        !shared.has(value) &&
        // Several words long and made of letters: that is prose, not a label.
        value.split(/\s+/).length > 2 &&
        /[a-zà-ù]{4,}/i.test(value)
      );
    });
    expect(suspects).toEqual([]);
  });
});

describe('t', () => {
  it('falls back to Italian when there is no document to read the language off', () => {
    expect(t('nav.home')).toBe(STRINGS.it['nav.home']);
  });

  it('hands back the key itself when nothing answers to it', () => {
    expect(t('does.not.exist')).toBe('does.not.exist');
  });

  it('fills the placeholders it is given', () => {
    const key = Object.keys(STRINGS.it).find((k) => /\{\w+\}/.test(STRINGS.it[k]));
    expect(key, 'no string in the table uses a placeholder').toBeDefined();

    const name = STRINGS.it[key].match(/\{(\w+)\}/)[1];
    const filled = t(key, { [name]: 'XYZZY' });
    expect(filled).toContain('XYZZY');
    expect(filled).not.toContain(`{${name}}`);
  });

  it('leaves a placeholder alone when no value is given for it', () => {
    const key = Object.keys(STRINGS.it).find((k) => /\{\w+\}/.test(STRINGS.it[k]));
    const name = STRINGS.it[key].match(/\{(\w+)\}/)[1];
    expect(t(key, { somethingElse: 1 })).toContain(`{${name}}`);
  });

  it('does not touch a string that has no placeholders', () => {
    expect(t('nav.home', { count: 3 })).toBe(STRINGS.it['nav.home']);
  });
});
