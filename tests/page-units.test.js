// What i18n-drift compares. The rule it exists to enforce is narrow and easy
// to break in either direction: touching the markup must stay silent, touching
// the words must not.

import { describe, expect, it } from 'vitest';
import {
  hash,
  quizIdOf,
  quizProblemOf,
  quizTextOf,
  textOf,
  unitsOf,
} from '../scripts/lib/page-units.mjs';

const page = (body, { title = 'Title', description = 'Description' } = {}) => `
<!doctype html>
<html lang="it"><head>
  <title>${title}</title>
  <meta name="description" content="${description}">
</head><body><main>${body}</main></body></html>`;

const chapter = (id, body) => `<section id="${id}">${body}</section>`;

describe('textOf', () => {
  it('keeps the words and drops the markup', () => {
    expect(textOf('<p class="lead">Hello <strong>there</strong></p>')).toBe('Hello there');
  });

  it('throws away scripts, styles and comments with their contents', () => {
    expect(textOf('<p>Keep</p><script>const drop = 1;</script>')).toBe('Keep');
    expect(textOf('<p>Keep</p><style>.drop { color: red }</style>')).toBe('Keep');
    expect(textOf('<p>Keep</p><!-- nota per me stesso -->')).toBe('Keep');
  });

  it('collapses whitespace and decodes the one entity that changes it', () => {
    expect(textOf('<p>a\n\n   b</p>')).toBe('a b');
    expect(textOf('<p>a&nbsp;b</p>')).toBe('a b');
  });

  it('returns an empty string for markup with no text in it', () => {
    expect(textOf('<div><span></span></div>')).toBe('');
    expect(textOf('')).toBe('');
  });

  // The whole reason the script hashes text instead of the file.
  it('is blind to reformatting and renaming', () => {
    const before = '<p class="lead">The same sentence.</p>';
    const after = '<p\n  class="intro is-large"\n  data-x="1"\n>The same sentence.</p>';
    expect(textOf(after)).toBe(textOf(before));
  });

  it('is not blind to an edited sentence', () => {
    expect(textOf('<p>The same sentence.</p>')).not.toBe(textOf('<p>The same sentences.</p>'));
  });

  // Code samples are content: a changed command has to be translated too.
  it('sees a changed code sample', () => {
    const before = textOf('<pre><code>npm run build</code></pre>');
    const after = textOf('<pre><code>npm run preview</code></pre>');
    expect(before).not.toBe(after);
  });
});

describe('quizIdOf', () => {
  it('reads the id off the page, whatever quotes it uses', () => {
    expect(quizIdOf('<div data-quiz-id="css-basics"></div>')).toBe('css-basics');
    expect(quizIdOf("<div data-quiz-id='css-basics'></div>")).toBe('css-basics');
  });

  it('returns null when the page has no quiz', () => {
    expect(quizIdOf('<div></div>')).toBeNull();
  });
});

describe('quizTextOf', () => {
  const base = [
    {
      q: 'What does the box model describe?',
      options: ['Layout', 'Colour', 'Fonts'],
      correct: 0,
      feedback: { correct: 'Right.', wrong: 'Not quite.' },
    },
  ];

  it('ignores whitespace-only edits', () => {
    const reformatted = [{ ...base[0], q: '  What does the box   model describe?  ' }];
    expect(quizTextOf(reformatted)).toBe(quizTextOf(base));
  });

  // The separator is why: joined without one, moving a word across the
  // boundary between two options leaves the string identical.
  it('notices a word moved from one option into the next', () => {
    const moved = [{ ...base[0], options: ['Layout Colour', '', 'Fonts'] }];
    expect(quizTextOf(moved)).not.toBe(quizTextOf(base));
  });

  it('notices a different right answer', () => {
    expect(quizTextOf([{ ...base[0], correct: 1 }])).not.toBe(quizTextOf(base));
  });

  it('notices edited feedback', () => {
    const edited = [{ ...base[0], feedback: { correct: 'Right.', wrong: 'Have another look.' } }];
    expect(quizTextOf(edited)).not.toBe(quizTextOf(base));
  });

  it('survives a question with no options and no feedback', () => {
    expect(() => quizTextOf([{ q: 'Open question', correct: 0 }])).not.toThrow();
  });
});

describe('unitsOf', () => {
  const emptyBank = { it: {}, en: {} };

  it('tracks a tutorial one chapter at a time', () => {
    const html = page(
      `<article>${chapter('chapter-1', '<p>First.</p>')}${chapter('chapter-2', '<p>Second.</p>')}</article>`,
    );
    expect(Object.keys(unitsOf(html, emptyBank)).sort()).toEqual(['chapter-1', 'chapter-2', 'meta']);
  });

  it('tracks anything without chapters as a single page', () => {
    expect(Object.keys(unitsOf(page('<p>Just a page.</p>'), emptyBank)).sort()).toEqual([
      'meta',
      'page',
    ]);
  });

  it('leaves the other chapters untouched when one of them changes', () => {
    const before = unitsOf(
      page(`<article>${chapter('chapter-1', '<p>First.</p>')}${chapter('chapter-2', '<p>Second.</p>')}</article>`),
      emptyBank,
    );
    const after = unitsOf(
      page(`<article>${chapter('chapter-1', '<p>First.</p>')}${chapter('chapter-2', '<p>Second, revised.</p>')}</article>`),
      emptyBank,
    );
    expect(after['chapter-1']).toBe(before['chapter-1']);
    expect(after['chapter-2']).not.toBe(before['chapter-2']);
    expect(after.meta).toBe(before.meta);
  });

  it('follows the title and the description', () => {
    const before = unitsOf(page('<p>Body.</p>'), emptyBank);
    expect(unitsOf(page('<p>Body.</p>', { title: 'Other' }), emptyBank).meta).not.toBe(before.meta);
    expect(unitsOf(page('<p>Body.</p>', { description: 'Other' }), emptyBank).meta).not.toBe(
      before.meta,
    );
  });

  it('adds the quiz as one more unit when the bank answers to the id', () => {
    const html = page('<p>Body.</p><div data-quiz-id="css-basics"></div>');
    const bank = { it: { 'css-basics': [{ q: 'Q', options: ['a'], correct: 0 }] }, en: {} };
    expect(unitsOf(html, bank).quiz).toBeDefined();
  });

  it('leaves the quiz unit out when the bank does not know the id', () => {
    const html = page('<p>Body.</p><div data-quiz-id="ghost"></div>');
    expect(unitsOf(html, emptyBank).quiz).toBeUndefined();
  });

  it('re-hashes the page when the quiz behind it changes', () => {
    const html = page('<p>Body.</p><div data-quiz-id="css-basics"></div>');
    const before = unitsOf(html, {
      it: { 'css-basics': [{ q: 'Q', options: ['a', 'b'], correct: 0 }] },
      en: {},
    });
    const after = unitsOf(html, {
      it: { 'css-basics': [{ q: 'Q', options: ['a', 'b'], correct: 1 }] },
      en: {},
    });
    expect(after.quiz).not.toBe(before.quiz);
  });
});

describe('quizProblemOf', () => {
  const html = page('<p>Body.</p><div data-quiz-id="css-basics"></div>');
  const question = { q: 'Q', options: ['a'], correct: 0 };

  it('has nothing to say about a page without a quiz', () => {
    expect(quizProblemOf(page('<p>Body.</p>'), { it: {}, en: {} })).toBeNull();
  });

  it('is quiet when both banks answer with the same number of questions', () => {
    expect(
      quizProblemOf(html, { it: { 'css-basics': [question] }, en: { 'css-basics': [question] } }),
    ).toBeNull();
  });

  it('reports a quiz the Italian bank does not have', () => {
    expect(quizProblemOf(html, { it: {}, en: {} })).toMatchObject({ quizId: 'css-basics' });
  });

  it('reports a quiz not translated yet', () => {
    const problem = quizProblemOf(html, { it: { 'css-basics': [question] }, en: {} });
    expect(problem.problem).toMatch(/not translated/);
  });

  // A question added on one side only: the counts diverge and the quiz has to
  // drop out of the comparison rather than be recorded as in sync.
  it('reports a different number of questions', () => {
    const problem = quizProblemOf(html, {
      it: { 'css-basics': [question, question] },
      en: { 'css-basics': [question] },
    });
    expect(problem.problem).toBe('2 questions in Italian, 1 in English');
  });
});

describe('hash', () => {
  it('is stable, short, and different for different text', () => {
    expect(hash('abc')).toBe(hash('abc'));
    expect(hash('abc')).toHaveLength(12);
    expect(hash('abc')).not.toBe(hash('abd'));
  });
});
