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
import { fileURLToPath } from 'url';
import { routePairs, sourceDirForRoute } from '../src/i18n/routes.mjs';
import { quizProblemOf, unitsOf } from './lib/page-units.mjs';

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
  const itUnits = unitsOf(itHtml, quizBank);

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

  const quizProblem = quizProblemOf(itHtml, quizBank);
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
