import { describe, expect, it } from 'vitest';
import { pageStructure } from '../scripts/page-structure-plugin.mjs';

const page = (body) => `<html><head><title>Title</title></head><body>${body}</body></html>`;

describe('language-switch structure contract', () => {
  it('allows translated prose and inline markup to move within the same blocks', () => {
    expect(pageStructure(page('<main><h1>Titolo</h1><p>Una <strong>prova</strong>.</p></main>')))
      .toBe(pageStructure(page('<main><h1>Title</h1><p><code>A test</code> in English.</p></main>')));
  });

  it('detects an added lesson or a changed block type', () => {
    const original = pageStructure(page('<main><section id="one"><p>Text</p></section></main>'));
    expect(pageStructure(page('<main><section id="one"><p>Text</p></section><section id="two"></section></main>'))).not.toBe(original);
    expect(pageStructure(page('<main><section id="one"><h3>Text</h3></section></main>'))).not.toBe(original);
  });

  it('detects reordered chapter targets', () => {
    expect(pageStructure(page('<main><section id="one"></section><section id="two"></section></main>')))
      .not.toBe(pageStructure(page('<main><section id="two"></section><section id="one"></section></main>')));
  });

  it('ignores comments, scripts, styles and escaped example code', () => {
    expect(pageStructure(page('<main><!-- <aside></aside> --><script>"<section>"</script><style>p{color:red}</style><pre><code>&lt;div&gt;</code></pre></main>')))
      .toBe(pageStructure(page('<main><pre><code>&lt;h1&gt;A different example&lt;/h1&gt;</code></pre></main>')));
  });
});
