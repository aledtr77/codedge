// The Italian detector runs on every English page in CI and blocks the deploy.
// That makes both of its failure modes expensive: a miss ships Italian text to
// an English reader, and a false positive stops a build over correct prose.
// The tests below hold it against both.

import { describe, expect, it } from 'vitest';
import { italianHits, ITALIAN_MARKERS, STRONG, visibleSnippets } from '../scripts/lib/italian-markers.mjs';

describe('visibleSnippets', () => {
  it('picks up the text a reader sees', () => {
    const snippets = visibleSnippets('<p>The first paragraph</p><h2>A heading here</h2>');
    expect(snippets).toContain('The first paragraph');
    expect(snippets).toContain('A heading here');
  });

  // Developer notes stay in Italian on purpose, and a code sample may show
  // Italian strings the prose around it is explaining.
  it('skips comments, scripts, styles, and code samples', () => {
    const html = `
      <!-- questo commento resta in italiano -->
      <script>const messaggio = "ciao a tutti quanti";</script>
      <style>/* questo stile non conta nulla */</style>
      <pre><code>const nome = "esempio di codice";</code></pre>
      <p>The only visible sentence</p>`;
    expect(visibleSnippets(html)).toEqual(['The only visible sentence']);
  });

  it('reads the attributes that reach a reader or a crawler', () => {
    const html = '<img src="a.png" alt="A photo of the studio"><a title="Go to the resources">x</a>';
    const snippets = visibleSnippets(html);
    expect(snippets).toContain('A photo of the studio');
    expect(snippets).toContain('Go to the resources');
  });

  it('ignores machine-readable attribute values', () => {
    const html =
      '<meta content="https://codedge.it/some page"><meta content="1200"><meta content="en_GB">';
    expect(visibleSnippets(html)).toEqual([]);
  });

  it('drops fragments too short to judge', () => {
    expect(visibleSnippets('<p>ok</p><span>·</span>')).toEqual([]);
  });

  // The attribute regex is module-level and carries lastIndex between calls.
  it('gives the same answer when called twice in a row', () => {
    const html = '<img alt="A photo of the studio"><p>The only visible sentence</p>';
    expect(visibleSnippets(html)).toEqual(visibleSnippets(html));
  });
});

describe('italianHits', () => {
  it('reports plain Italian prose', () => {
    expect(italianHits('Questo è il modo più semplice di scrivere una regola')).not.toEqual([]);
    expect(italianHits('Trovi il codice nella pagina degli strumenti')).not.toEqual([]);
  });

  it('stays quiet on English prose written for this site', () => {
    const english = [
      'Open the file in your editor and save it',
      'The guide walks through the whole deployment step by step',
      'Compress an image and the file never leaves your computer',
      'Every component ships with its ARIA attributes already in place',
      'Read the code, reuse it, and come back when something breaks',
      'This page lists the tools that run entirely in the browser',
    ];
    for (const sentence of english) {
      expect(italianHits(sentence), sentence).toEqual([]);
    }
  });

  // 'file', 'come' and 'guide' are English words too, and this site uses all
  // three constantly. Neither one repeating nor two of them together is
  // evidence of anything.
  it('does not report words that are English as well', () => {
    expect(italianHits('Open the file and read the file again')).toEqual([]);
    expect(italianHits('Come back to this guide later')).toEqual([]);
    expect(italianHits('The guide explains how to come back to a file')).toEqual([]);
  });

  it('still reports them once something decisive turns up alongside', () => {
    expect(italianHits('apri il file')).toContain('file');
    expect(italianHits('pagina codice come')).toContain('come');
  });

  it('reports a single strong marker', () => {
    expect(italianHits('Click on il button')).not.toEqual([]);
  });

  it('reports two distinct weak markers together', () => {
    expect(italianHits('pagina codice')).not.toEqual([]);
  });

  it('returns each marker once, however often it appears', () => {
    const hits = italianHits('il codice, il codice, il codice');
    expect(hits).toEqual([...new Set(hits)]);
  });

  it('has nothing to say about an empty or symbol-only snippet', () => {
    expect(italianHits('')).toEqual([]);
    expect(italianHits('— · —')).toEqual([]);
  });

  it('matches accented markers as written', () => {
    expect(italianHits('perché no')).not.toEqual([]);
  });
});

describe('the marker lists themselves', () => {
  it('keeps every strong marker in the full list', () => {
    for (const word of STRONG) expect(ITALIAN_MARKERS).toContain(word);
  });

  it('has no duplicates', () => {
    expect(new Set(ITALIAN_MARKERS).size).toBe(ITALIAN_MARKERS.length);
  });

  it('holds only lowercase single words', () => {
    for (const word of ITALIAN_MARKERS) {
      expect(word, word).toBe(word.toLowerCase());
      expect(word, word).not.toContain(' ');
    }
  });

  // The tokenizer splits on anything outside this class, so a marker built
  // from other characters could never be matched.
  it('holds only words the tokenizer can produce', () => {
    for (const word of ITALIAN_MARKERS) {
      expect(word.match(/[a-zàèéìòù]+/g)?.[0], word).toBe(word);
    }
  });
});
