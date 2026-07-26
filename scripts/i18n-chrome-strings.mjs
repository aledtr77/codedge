// Translates the boilerplate that repeats identically across every English
// tutorial page: the navbar title wrapper, the back link, the challenge-box
// labels and the closing template call-to-action.
//
// These live outside the units i18n-extract.mjs captures (they sit inside
// <span>/<strong>/<a> shells rather than leaf content elements), so handling
// them once here keeps them consistent instead of retyped per page.
//
//   node scripts/i18n-chrome-strings.mjs            all English pages
//   node scripts/i18n-chrome-strings.mjs tutorials  a subset

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { routePairs, sourceDirForRoute } from '../src/i18n/routes.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const pagesRoot = path.join(projectRoot, 'pages');

const REPLACEMENTS = [
  ['<i class="fas fa-chevron-left"></i> Tutti i tutorial', '<i class="fas fa-chevron-left"></i> All tutorials'],
  ['<i class="fas fa-chevron-left"></i> Tutti gli strumenti', '<i class="fas fa-chevron-left"></i> All tools'],
  ['<i class="fas fa-chevron-left"></i> Tutti i componenti', '<i class="fas fa-chevron-left"></i> All components'],
  ['<i class="fas fa-chevron-left"></i> Tutte le risorse', '<i class="fas fa-chevron-left"></i> All resources'],
  ['<strong>Obiettivo della sfida:</strong>', '<strong>Challenge goal:</strong>'],
  ['<strong>Istruzioni passo-passo:</strong>', '<strong>Step-by-step instructions:</strong>'],
  ['>Esplora i template</a>', '>Explore the templates</a>'],
  ['<h2>Indice guida</h2>', '<h2>Guide contents</h2>'],
  ['aria-label="Navigazione principale"', 'aria-label="Main navigation"'],
  ['content="Anteprima CODEDGE"', 'content="CODEDGE preview"'],
  // Stale plugin reference inherited from the Italian source comments
  ['(staticNavbarHtmlPlugin, vite.config.js)', '(chromeI18nPlugin, scripts/i18n-plugin.mjs)']
];

const filter = process.argv.slice(2).find((a) => !a.startsWith('--'));
let touched = 0;

for (const [, enRoute] of routePairs()) {
  if (filter && !enRoute.includes(filter)) continue;

  const file = path.join(pagesRoot, sourceDirForRoute(enRoute), 'index.html');
  if (!fs.existsSync(file)) continue;

  const html = fs.readFileSync(file, 'utf8');
  let updated = html;
  for (const [from, to] of REPLACEMENTS) updated = updated.split(from).join(to);

  if (updated !== html) {
    fs.writeFileSync(file, updated, 'utf8');
    console.log(`  ${enRoute}`);
    touched += 1;
  }
}

console.log(`${touched} page(s) updated`);
