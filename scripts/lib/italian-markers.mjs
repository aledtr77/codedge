// What counts as "visible text" on an English page, and what counts as enough
// Italian in it to be worth reporting.
//
// Split out of i18n-lint.mjs so the two decisions can be exercised on snippets
// written for the purpose: the marker list is a judgement call, and the only
// way to keep it honest is to hold real English prose against it and check it
// stays quiet. tests/italian-markers.test.js does exactly that.

// Words that are unambiguously Italian: none of them is an English word, a
// programming keyword, or a proper noun used on this site.
export const ITALIAN_MARKERS = [
  'il', 'lo', 'gli', 'della', 'dello', 'degli', 'delle', 'dei', 'nel', 'nella',
  'sul', 'sulla', 'dal', 'dalla', 'agli', 'alle', 'allo', 'una', 'uno', 'che',
  'perché', 'perche', 'quando', 'come', 'anche', 'più', 'piu', 'molto', 'ogni',
  'questo', 'questa', 'questi', 'queste', 'quello', 'quella', 'sono', 'essere',
  'avere', 'fare', 'puoi', 'devi', 'vuoi', 'trovi', 'serve', 'servono', 'senza',
  'sempre', 'ancora', 'quindi', 'però', 'pero', 'oppure', 'invece', 'mentre',
  'dove', 'tutti', 'tutte', 'tutto', 'tutta', 'niente', 'nulla', 'adesso',
  'prima', 'dopo', 'sopra', 'sotto', 'dentro', 'fuori', 'verso', 'tra', 'fra',
  'pagina', 'pagine', 'codice', 'esempio', 'esempi', 'guida', 'guide',
  'strumenti', 'risorse', 'sviluppo', 'progetto', 'progetti', 'lavoro',
  'capitolo', 'domanda', 'risposta', 'sezione', 'immagine', 'immagini',
  'colore', 'colori', 'testo', 'file', 'nome', 'passo', 'punto'
];

// `file`, `nome`, `punto` and friends are risky on their own; require them to
// sit next to another marker before reporting, by scoring the whole snippet.
export const STRONG = new Set([
  'il', 'lo', 'gli', 'della', 'dello', 'degli', 'delle', 'dei', 'nel', 'nella',
  'perché', 'perche', 'questo', 'questa', 'questi', 'queste', 'quello', 'quella',
  'puoi', 'devi', 'vuoi', 'trovi', 'però', 'pero', 'oppure', 'invece', 'senza',
  'sono', 'anche', 'più', 'piu', 'quindi', 'mentre', 'sempre'
]);

// Markers that are also ordinary English words. They earn their place in the
// list — Italian prose does use them — but on their own they prove nothing,
// and two of them together used to be enough to report a page: "Come back to
// this guide later" is correct English and met the two-marker threshold. They
// now only count once a marker that is not English has already turned up.
const AMBIGUOUS = new Set(['come', 'file', 'guide']);

const MARKER_SET = new Set(ITALIAN_MARKERS);

const ATTR_REGEX = /\b(?:alt|title|aria-label|placeholder|content)\s*=\s*"([^"]{4,})"/gi;

export function visibleSnippets(html) {
  const stripped = html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<pre\b[\s\S]*?<\/pre>/gi, ' ')
    .replace(/<code\b[\s\S]*?<\/code>/gi, ' ');

  const snippets = [];

  for (const raw of stripped.split(/<[^>]+>/)) {
    const text = raw.replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
    if (text.length > 3) snippets.push(text);
  }

  // The regex is module-level and carries lastIndex between calls. The loop
  // below runs to exhaustion, which resets it — but only if nothing breaks out
  // of it first. Resetting up front costs nothing and removes the trap.
  ATTR_REGEX.lastIndex = 0;
  let m;
  while ((m = ATTR_REGEX.exec(stripped)) !== null) {
    const text = m[1].replace(/\s+/g, ' ').trim();
    // Skip machine-readable content: URLs, dimensions, locale codes.
    if (/^(https?:|\/|#|\d+$|[a-z]{2}_[A-Z]{2}$)/.test(text)) continue;
    if (text.includes(' ')) snippets.push(text);
  }

  return snippets;
}

export function italianHits(snippet) {
  const words = snippet.toLowerCase().match(/[a-zàèéìòùA-Z]+/g) || [];
  const hits = [...new Set(words.filter((w) => MARKER_SET.has(w)))];
  const strong = hits.filter((w) => STRONG.has(w));
  // Count *distinct* markers, not occurrences, and leave the words that are
  // English too out of the count: neither one of them repeating nor two of
  // them side by side says anything about the language of the sentence. Real
  // Italian prose trips this anyway, because it brings several different
  // markers at once — and the ambiguous ones are still reported alongside the
  // rest once something decisive has shown up.
  const decisive = hits.filter((w) => !AMBIGUOUS.has(w));
  return strong.length > 0 || decisive.length >= 2 ? hits : [];
}
