// How a page is cut into the units i18n-drift.mjs hashes, and how each unit's
// text is reduced to something that only changes when the *content* does.
//
// It lives apart from the script that uses it because the script reads the
// pages directory and exits with a status: none of that is needed to decide
// what "the text of this chapter" is, and tests/page-units.test.js checks the
// decision against markup it writes itself.

import crypto from 'crypto';

export const quizIdOf = (html) => html.match(/data-quiz-id=["']([^"']+)["']/i)?.[1] || null;

// Field boundaries survive into the hash: a word moved from the end of one
// option to the start of the next is a content change, and flattening the whole
// quiz into a single string would hide it.
export const FIELD_SEP = '\u0000';

// No textOf() here — these are plain strings, not markup, and stripping what
// looks like a tag would drop the literal `<button>` a couple of feedback
// messages deliberately show the reader. The index of the right answer is part
// of the content: if it moves in Italian, the English quiz has to follow.
export function quizTextOf(questions) {
  return questions
    .flatMap((question) => [
      question.q,
      ...(question.options || []),
      String(question.correct),
      question.feedback?.correct,
      question.feedback?.wrong
    ])
    .map((field) => String(field ?? '').replace(/\s+/g, ' ').trim())
    .join(FIELD_SEP);
}

// Text only: reformatting the markup or renaming a class must not read as a
// content change, but editing a sentence or a code sample must.
export function textOf(html) {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export const hash = (value) => crypto.createHash('sha1').update(value, 'utf8').digest('hex').slice(0, 12);

// Splits a page into the units we track: one entry per chapter section on
// tutorials, plus head metadata and the quiz the page points at; a single
// "page" unit everywhere else.
export function unitsOf(html, quizBank) {
  const units = {};

  const title = html.match(/<title>([\s\S]*?)<\/title>/i);
  const description = html.match(/<meta\b[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i);
  units['meta'] = hash(textOf((title?.[1] || '') + ' ' + (description?.[1] || '')));

  const chapterRegex = /<section\b[^>]*id=["'](chapter-[^"']+)["'][\s\S]*?(?=<section\b[^>]*id=["']chapter-|<\/article>)/gi;
  let match;
  let found = false;
  while ((match = chapterRegex.exec(html)) !== null) {
    found = true;
    units[match[1]] = hash(textOf(match[0]));
  }

  if (!found) {
    const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i);
    units['page'] = hash(textOf(main?.[1] || html));
  }

  const quizId = quizIdOf(html);
  if (quizId && quizBank.it[quizId]) {
    units['quiz'] = hash(quizTextOf(quizBank.it[quizId]));
  }

  return units;
}

/**
 * Why a route's quiz cannot be compared at all, or null when it can.
 *
 * A quiz only counts as in sync when the English bank answers to the same id
 * with the same number of questions. Until it does, the unit is left out of the
 * comparison *and* out of what --update records: adding a question in Italian
 * must not become invisible just because the prose around it was re-recorded.
 */
export function quizProblemOf(html, quizBank) {
  const quizId = quizIdOf(html);
  if (!quizId) return null;

  const itQuiz = quizBank.it[quizId];
  const enQuiz = quizBank.en[quizId];

  if (!itQuiz) return { quizId, problem: 'the page points at a quiz the Italian bank does not have' };
  if (!enQuiz) return { quizId, problem: 'not translated in the English bank yet' };
  if (itQuiz.length !== enQuiz.length) {
    return {
      quizId,
      problem: `${itQuiz.length} questions in Italian, ${enQuiz.length} in English`
    };
  }
  return null;
}
