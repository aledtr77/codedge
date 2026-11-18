// Rebuild the tutorial's example screenshots with: node scripts/render-indie-marketing-images.mjs
import { existsSync } from 'node:fs';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import sharp from 'sharp';
import { chromePath } from './lib/serve-dist.mjs';

const output = fileURLToPath(new URL('../public/images/tutorials/indie-marketing/', import.meta.url));
const font = (await readFile(new URL('../public/fonts/inter-v20-latin.woff2', import.meta.url))).toString('base64');
const copy = {
  it: {
    example: 'ESEMPIO SIMULATO',
    research: {
      label: 'APPUNTI DI RICERCA', title: 'Studio web · appunti della conversazione',
      rows: [
        ['Episodio recente', '“Venerdì ho cercato una conferma fra email e chat.”'],
        ['Soluzione attuale', 'Email, chat e un foglio condiviso.'],
        ['Conseguenza', '45 minuti per ricostruire le approvazioni.'],
      ],
      note: 'Ipotesi da verificare', result: 'Raccogliere consegne e conferme nello stesso posto.',
    },
    offer: {
      label: 'CONFRONTO DI OFFERTE', title: 'La stessa idea, resa valutabile',
      before: 'Informazioni insufficienti', after: 'Una proposta verificabile',
      vague: 'Il futuro del tuo workflow', vagueBody: 'Una piattaforma innovativa per migliorare la produttività del tuo team.', vagueAction: 'Scopri di più',
      audience: 'PER PICCOLI STUDI WEB', clear: 'Le approvazioni dei clienti, in un solo link.',
      clearBody: 'Condividi una consegna e raccogli commenti e conferma nello stesso progetto.',
      price: 'Pilota: 1 progetto · 30 €', terms: 'Impostazione iniziale inclusa. Nessuna integrazione in questa versione.', action: 'Richiedi il pilota',
    },
    activation: {
      label: 'PRIMO UTILIZZO', title: 'Un account non è ancora un risultato',
      time: 'Tempo', event: 'Evento osservato', meaning: 'Cosa significa',
      rows: [['00:00', 'account_created', 'Iscrizione completata'], ['00:32', 'sample_loaded', 'Esempio aperto'], ['01:10', 'approval_sent', 'Richiesta inviata'], ['02:45', 'approval_received', 'Prima conferma ricevuta']],
      note: 'Evento di attivazione scelto', result: 'Il risultato promesso è una conferma ricevuta, non il solo invio.',
    },
    channels: {
      label: 'REPORT DI ACQUISIZIONE', title: 'Segui il canale fino ai clienti',
      headers: ['Canale', 'Visite', 'Account', 'Risultati', 'Clienti', 'Spesa'],
      rows: [['Community A', '80', '12', '6', '2', '30 €'], ['Newsletter B', '120', '8', '2', '0', '30 €']],
      total: 'Totale', totals: ['200', '20', '8', '2', '60 €'],
      note: 'Stessa coorte e stessa finestra', result: 'La newsletter porta più visite. La community porta i due clienti di questo esempio.',
    },
  },
  en: {
    example: 'SIMULATED EXAMPLE',
    research: {
      label: 'RESEARCH NOTES', title: 'Web studio · conversation notes',
      rows: [
        ['Recent incident', '“On Friday I searched email and chat for an approval.”'],
        ['Current workaround', 'Email, chat and a shared spreadsheet.'],
        ['Consequence', '45 minutes spent reconstructing approvals.'],
      ],
      note: 'A hypothesis to test', result: 'Keep deliveries and approvals in the same place.',
    },
    offer: {
      label: 'OFFER COMPARISON', title: 'The same idea, made easier to evaluate',
      before: 'Insufficient information', after: 'An offer you can evaluate',
      vague: 'The future of your workflow', vagueBody: 'An innovative platform to improve your team’s productivity.', vagueAction: 'Learn more',
      audience: 'FOR SMALL WEB STUDIOS', clear: 'Client approvals, through one link.',
      clearBody: 'Share a delivery and collect comments and approval in the same project.',
      price: 'Pilot: 1 project · €30', terms: 'Initial setup included. Integrations are outside this version.', action: 'Request the pilot',
    },
    activation: {
      label: 'FIRST USE', title: 'An account is not yet a result',
      time: 'Time', event: 'Observed event', meaning: 'What it means',
      rows: [['00:00', 'account_created', 'Signup completed'], ['00:32', 'sample_loaded', 'Example opened'], ['01:10', 'approval_sent', 'Request sent'], ['02:45', 'approval_received', 'First approval received']],
      note: 'The chosen activation event', result: 'The promised result is an approval received, beyond merely sending a request.',
    },
    channels: {
      label: 'ACQUISITION REPORT', title: 'Follow the channel through to customers',
      headers: ['Channel', 'Visits', 'Accounts', 'Results', 'Customers', 'Spending'],
      rows: [['Community A', '80', '12', '6', '2', '€30'], ['Newsletter B', '120', '8', '2', '0', '€30']],
      total: 'Total', totals: ['200', '20', '8', '2', '€60'],
      note: 'Same cohort and observation window', result: 'The newsletter brings more visits. The community brings both customers in this example.',
    },
  },
};

const escape = (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const cell = (value, tag = 'td') => `<${tag}>${escape(value)}</${tag}>`;
const note = (label, value) => `<div class="note"><strong>${escape(label)}</strong><p>${escape(value)}</p></div>`;

function exampleMarkup(kind, language) {
  const text = copy[language][kind];
  let body;
  if (kind === 'research') {
    body = `<div class="research">${text.rows.map(([label, value]) => `<div class="research-row"><div><strong>${escape(label)}</strong><p>${escape(value)}</p></div></div>`).join('')}</div>${note(text.note, text.result)}`;
  } else if (kind === 'offer') {
    body = `<div class="comparison"><section class="offer offer--vague"><p class="offer-label">${escape(text.before)}</p><div class="offer-content"><h2>${escape(text.vague)}</h2><p>${escape(text.vagueBody)}</p><span class="example-action">${escape(text.vagueAction)}</span><div class="missing"><span>?</span><span>?</span><span>?</span></div></div></section><section class="offer"><p class="offer-label offer-label--clear">${escape(text.after)}</p><div class="offer-content"><p class="audience">${escape(text.audience)}</p><h2>${escape(text.clear)}</h2><p>${escape(text.clearBody)}</p><strong class="price">${escape(text.price)}</strong><p class="terms">${escape(text.terms)}</p><span class="example-action example-action--clear">${escape(text.action)}</span></div></section></div>`;
  } else if (kind === 'activation') {
    body = `<div class="event-log"><div class="event-heading"><span>${escape(text.time)}</span><span>${escape(text.event)}</span><span>${escape(text.meaning)}</span></div>${text.rows.map(([time, event, meaning], index) => `<div class="event-row${index === 3 ? ' event-row--value' : ''}"><time>${time}</time><code>${event}</code><span>${escape(meaning)}</span></div>`).join('')}</div>${note(text.note, text.result)}`;
  } else {
    body = `<table class="channel-table"><thead><tr>${text.headers.map((header) => cell(header, 'th')).join('')}</tr></thead><tbody>${text.rows.map((row) => `<tr>${row.map((value) => cell(value)).join('')}</tr>`).join('')}<tr class="total">${[text.total, ...text.totals].map((value) => cell(value)).join('')}</tr></tbody></table><div class="channel-mobile">${text.rows.map((row) => `<section><h2>${escape(row[0])}</h2><dl>${row.slice(1).map((value, index) => `<div><dt>${escape(text.headers[index + 1])}</dt><dd>${escape(value)}</dd></div>`).join('')}</dl></section>`).join('')}</div>${note(text.note, text.result)}`;
  }
  return `<div class="canvas canvas--${kind}"><header><span>${escape(text.label)}</span><span>${copy[language].example}</span></header><h1>${escape(text.title)}</h1>${body}</div>`;
}

const styles = `
@font-face{font-family:Inter;src:url(data:font/woff2;base64,${font}) format('woff2');font-weight:100 900;font-display:block}
*{box-sizing:border-box}body{margin:0;background:#f4f6f8;color:#1b2936;font-family:Inter,Arial,sans-serif;font-size:15px;line-height:1.5}
.canvas{padding:24px;width:760px}header{display:flex;justify-content:space-between;gap:12px;padding-bottom:12px;border-bottom:1px solid #cbd4dc;color:#536574;font-size:10px;font-weight:650;letter-spacing:.055em}
h1{margin:16px 0 20px;font-size:19px;line-height:1.35;letter-spacing:-.02em;font-weight:650}h2{margin:0;font-size:20px;line-height:1.35;font-weight:650;letter-spacing:-.02em}p{margin:0}strong{font-weight:650}
.research{background:#fff;border:1px solid #cbd4dc;border-radius:6px}.research-row{padding:14px 16px}.research-row+.research-row{border-top:1px solid #dce2e8}.research-row strong{display:block;font-size:12px;color:#536574;margin-bottom:3px}
.note{margin-top:16px;padding:10px 12px;border-left:3px solid #387b9b;background:#e9f1f6}.note strong{display:block;color:#1f5a74;font-size:11px;margin-bottom:4px}.note p{font-size:14px}
.comparison{display:grid;grid-template-columns:1fr 1fr;gap:16px;align-items:stretch}.offer{background:#fff;border:1px solid #b9cbd6;border-radius:6px;overflow:hidden}.offer-label{padding:10px 14px;border-bottom:1px solid #d6dfe6;color:#5d6874;font-size:11px;font-weight:650}.offer-label--clear{background:#eaf3f9;color:#235f7d}.offer-content{padding:16px}.offer-content>p{margin-top:12px;font-size:14px;color:#4b5e6d}.offer-content .audience{margin:0 0 8px;color:#26627d;font-size:10px;font-weight:650;letter-spacing:.045em}.example-action{display:inline-block;margin-top:16px;padding:8px 12px;border:1px solid #9aacba;border-radius:4px;font-size:12px;font-weight:600;color:#465a6a}.example-action--clear{border-color:#256383;background:#256383;color:#fff}.price{display:block;margin-top:16px;font-size:14px}.offer-content .terms{margin-top:4px;font-size:12px}.missing{display:flex;gap:12px;margin-top:28px;color:#738494}.missing span{width:40px;height:24px;border-bottom:1px dashed #b7c3cc;text-align:center}
.event-log{border:1px solid #cbd4dc;border-radius:6px;overflow:hidden;background:#fff}.event-heading,.event-row{display:grid;grid-template-columns:58px 200px 1fr;gap:16px;padding:12px 16px;align-items:center}.event-heading{background:#eaf0f4;font-size:11px;color:#536574}.event-row+.event-row{border-top:1px solid #dce2e8}.event-row time{font-variant-numeric:tabular-nums;color:#5b6b78;font-size:12px}.event-row code{font-size:13px;color:#2c4e65}.event-row>span{font-size:14px}.event-row--value{background:#edf7f0;border-top:1px solid #bbd9c4}.event-row--value code{color:#176444;font-weight:600}
.channel-table{width:100%;border-collapse:collapse;background:#fff;border:1px solid #cbd4dc;font-size:13px;font-variant-numeric:tabular-nums}.channel-table :is(td,th){padding:13px 12px;text-align:left;border-bottom:1px solid #d6dfe6}.channel-table th{background:#eaf0f4;font-weight:500;font-size:11px;color:#526373}.channel-table .total{font-weight:650;background:#f6f8fa}.channel-mobile{display:none}
@media(max-width:600px){body{font-size:15px}.canvas{width:320px;padding:16px}header{font-size:8px;gap:8px;letter-spacing:.02em}h1{font-size:17px;margin:14px 0 16px}.research-row{padding:13px 12px}.research-row p{font-size:15px}.note{margin-top:14px;padding:10px}.note p{font-size:14px}.comparison{grid-template-columns:1fr;gap:14px}.offer-content{padding:14px}.offer-content h2{font-size:19px}.offer-label{padding:9px 14px}.missing{margin-top:14px}.event-heading{display:none}.event-row{grid-template-columns:40px minmax(0,1fr);gap:3px 10px;padding:13px 12px}.event-row code{font-size:13px}.event-row>span{grid-column:2;font-size:14px}.channel-table{display:none}.channel-mobile{display:grid;gap:12px}.channel-mobile section{padding:12px;border:1px solid #cbd4dc;border-radius:6px;background:#fff}.channel-mobile h2{font-size:15px;margin-bottom:10px}.channel-mobile dl{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:0}.channel-mobile dt{font-size:11px;color:#536574}.channel-mobile dd{margin:2px 0 0;font-size:15px;font-variant-numeric:tabular-nums}.channel-mobile dl>div:nth-child(4) dd{color:#176444;font-weight:650}}
`;

await mkdir(output, { recursive: true });
const executablePath = process.env.CHROME_PATH || (existsSync(chromium.executablePath()) ? chromium.executablePath() : chromePath());
const browser = await chromium.launch({ executablePath, headless: true });
const dimensions = {};
try {
  const page = await browser.newPage({ deviceScaleFactor: 2 });
  for (const language of ['it', 'en']) {
    for (const kind of ['research', 'offer', 'activation', 'channels']) {
      for (const mobile of [false, true]) {
        await page.setViewportSize({ width: mobile ? 320 : 760, height: 1000 });
        await page.setContent(`<!doctype html><html lang="${language}"><head><meta charset="UTF-8"><style>${styles}</style></head><body>${exampleMarkup(kind, language)}</body></html>`);
        await page.evaluate(() => document.fonts.ready);
        const bounds = await page.locator('.canvas').boundingBox();
        const filename = `${kind}-${language}${mobile ? '-mobile' : ''}.webp`;
        const screenshot = await page.locator('.canvas').screenshot();
        await sharp(screenshot).webp({ quality: 88 }).toFile(`${output}${filename}`);
        dimensions[filename] = { width: bounds.width, height: Math.ceil(bounds.height) };
        console.log(`${filename}: ${bounds.width} × ${Math.ceil(bounds.height)} CSS px`);
      }
    }
  }
} finally {
  await browser.close();
}
await writeFile(`${output}image-dimensions.json`, JSON.stringify(dimensions, null, 2) + '\n');
