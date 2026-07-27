// Tracks which English pages have fallen behind their Italian source.
//
// Tutorials get corrected often, and a fix applied only to the Italian page is
// invisible until someone reads the English one. This script hashes the *text*
// of every Italian chapter (markup and formatting changes are ignored) and
// compares it with what was recorded the last time that chapter was translated.
//
// A tutorial's quiz is not in the page — it lives in src/scripts/data/
// quizzes-db.js and its English twin — so it is tracked here as one more unit
// of the route: the page names its quiz through data-quiz-id, and the
// questions behind that id are hashed alongside the chapters.
//
//   node scripts/i18n-drift.mjs            report drift, exit 1 if any
//   node scripts/i18n-drift.mjs --update   record the current state as translated
//   node scripts/i18n-drift.mjs --update tutorial/css-fondamentali
//                                          record just one route
//
// The recorded state lives in src/i18n/translation-state.json.

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { routePairs, sourceDirForRoute } from '../src/i18n/routes.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const pagesRoot = path.join(projectRoot, 'pages');
const statePath = path.join(projectRoot, 'src/i18n/translation-state.json');

const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const DIM = '\x1b[2m';
const RESET = '\x1b[0m';

function fileForRoute(route) {
  return path.join(pagesRoot, sourceDirForRoute(route), 'index.html');
}

// The two question banks are ES modules living under a .js extension, in a
// package that declares no "type": so importing them by path makes Node parse
// them as CommonJS first, fail, and warn on every run. Handing it the source
// through a data: URL skips the guess. Both files are self-contained — a single
// export, no imports — which is what makes that safe.
async function loadQuizBank(file) {
  const source = fs.readFileSync(file, 'utf8');
  const { quizzesData } = await import(
    `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`
  );
  return quizzesData;
}

const quizBank = {
  it: await loadQuizBank(path.join(projectRoot, 'src/scripts/data/quizzes-db.js')),
  en: await loadQuizBank(path.join(projectRoot, 'src/scripts/data/quizzes-db.en.js'))
};

const quizIdOf = (html) => html.match(/data-quiz-id=["']([^"']+)["']/i)?.[1] || null;

// Field boundaries survive into the hash: a word moved from the end of one
// option to the start of the next is a content change, and flattening the whole
// quiz into a single string would hide it.
const FIELD_SEP = '\u0000';

// No textOf() here — these are plain strings, not markup, and stripping what
// looks like a tag would drop the literal `<button>` a couple of feedback
// messages deliberately show the reader. The index of the right answer is part
// of the content: if it moves in Italian, the English quiz has to follow.
function quizTextOf(questions) {
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
function textOf(html) {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const hash = (value) => crypto.createHash('sha1').update(value, 'utf8').digest('hex').slice(0, 12);

// Splits a page into the units we track: one entry per chapter section on
// tutorials, plus head metadata and the quiz the page points at; a single
// "page" unit everywhere else.
function unitsOf(html) {
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
function quizProblemOf(html) {
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

function loadState() {
  try {
    return JSON.parse(fs.readFileSync(statePath, 'utf8'));
  } catch {
    return { version: 1, routes: {} };
  }
}

const args = process.argv.slice(2);
const isUpdate = args.includes('--update');
const onlyRoute = args.find((a) => !a.startsWith('--'));

const state = loadState();
const report = { missing: [], drifted: [], ok: [], untracked: [], quizzes: [] };

for (const [itRoute, enRoute] of routePairs()) {
  if (onlyRoute && !itRoute.includes(onlyRoute) && !enRoute.includes(onlyRoute)) continue;

  const itFile = fileForRoute(itRoute);
  if (!fs.existsSync(itFile)) continue;

  const enFile = fileForRoute(enRoute);
  const itHtml = fs.readFileSync(itFile, 'utf8');
  const itUnits = unitsOf(itHtml);

  if (!fs.existsSync(enFile)) {
    report.missing.push(itRoute);
    continue;
  }

  // A scaffold carries the noindex marker until it is translated. Recording it
  // as in-sync would hide the fact that the page is still Italian.
  if (/<meta\b[^>]*name\s*=\s*["']robots["'][^>]*noindex/i.test(fs.readFileSync(enFile, 'utf8'))) {
    report.missing.push(itRoute);
    continue;
  }

  const quizProblem = quizProblemOf(itHtml);
  if (quizProblem) {
    report.quizzes.push({ route: itRoute, enRoute, ...quizProblem });
    delete itUnits.quiz;
  }

  if (isUpdate) {
    state.routes[itRoute] = { translatedAt: new Date().toISOString().slice(0, 10), units: itUnits };
    report.ok.push(itRoute);
    continue;
  }

  const recorded = state.routes[itRoute];
  if (!recorded) {
    report.untracked.push(itRoute);
    continue;
  }

  const changed = Object.entries(itUnits)
    .filter(([id, h]) => recorded.units[id] !== h)
    .map(([id]) => id);
  // A unit held back above is already reported on its own line; listing it as
  // removed as well would read as if the page had lost it.
  const removed = Object.keys(recorded.units)
    .filter((id) => !(id in itUnits) && !(quizProblem && id === 'quiz'));

  if (changed.length || removed.length) {
    report.drifted.push({ route: itRoute, enRoute, changed, removed });
  } else if (!quizProblem) {
    report.ok.push(itRoute);
  }
}

const printQuizIssues = () => {
  for (const { route, quizId, problem } of report.quizzes) {
    console.log(`${RED}⚠${RESET} ${route} ${DIM}—${RESET} quiz "${quizId}": ${problem}`);
  }
};

if (isUpdate) {
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2) + '\n', 'utf8');
  console.log(`${GREEN}✓${RESET} Recorded ${report.ok.length} route(s) as translated in ${path.relative(projectRoot, statePath)}`);
  // Recorded without their quiz, so the gap stays visible on the next run.
  printQuizIssues();
  process.exit(0);
}

for (const route of report.missing) {
  console.log(`${DIM}·${RESET} ${route} ${DIM}— no English page yet${RESET}`);
}
for (const route of report.untracked) {
  console.log(`${YELLOW}?${RESET} ${route} ${DIM}— translated but never recorded (run --update)${RESET}`);
}
for (const { route, enRoute, changed, removed } of report.drifted) {
  console.log(`${RED}⚠${RESET} ${route} ${DIM}→${RESET} ${enRoute}`);
  if (changed.length) console.log(`    changed: ${changed.join(', ')}`);
  if (removed.length) console.log(`    removed: ${removed.join(', ')}`);
}
printQuizIssues();
for (const route of report.ok) {
  console.log(`${GREEN}✓${RESET} ${route} ${DIM}— in sync${RESET}`);
}

const problems = report.drifted.length + report.untracked.length + report.quizzes.length;
console.log(
  `\n${report.ok.length} in sync · ${report.drifted.length} drifted · ` +
  `${report.untracked.length} unrecorded · ${report.quizzes.length} quiz not in sync · ` +
  `${report.missing.length} not translated yet`
);
process.exit(problems > 0 ? 1 : 0);
