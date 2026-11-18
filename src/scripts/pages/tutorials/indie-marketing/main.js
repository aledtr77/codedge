import '@/styles/components/main.css';
import '@/styles/components/navbar.css';
import '@/styles/components/footer.css';
import '@/styles/components/button.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import '@/styles/pages/tutorials/git-without-panic/index.css';
import '@/styles/pages/tutorials/indie-marketing/index.css';
import '@/scripts/components/navbar.js';
import '@/scripts/components/navbar-loader.js';
import '@/scripts/components/button.js';
import '@/scripts/components/footer.js';
import initGuideToc from '@/scripts/components/guide-toc.js';
import initGuideQuiz from '@/scripts/components/guide-quiz.js';
import { calculateFunnel } from './funnel.js';

function initFunnelCalculator() {
  const calculator = document.querySelector('[data-funnel-calculator]');
  if (!calculator) return;
  const inputs = [...calculator.querySelectorAll('input')];
  const outputs = [...calculator.querySelectorAll('[data-funnel-output]')];
  const error = calculator.querySelector('#funnel-error');
  const translations = { it: {
    count: 'Inserisci conteggi interi, non negativi, in tutti i campi del percorso.',
    spend: 'Inserisci una spesa valida, pari o superiore a zero.',
    sequence: 'Ogni passaggio deve contenere al massimo le persone del precedente. Usa la stessa coorte e la stessa finestra.',
    undefined: 'Non calcolabile',
  }, en: {
    count: 'Enter a non-negative whole number for every stage of the journey.',
    spend: 'Enter a valid spending amount of zero or more.',
    sequence: 'Each stage can contain at most as many people as the previous one. Use the same cohort and time window.',
    undefined: 'Not calculable',
  } };

  const update = () => {
    const language = document.documentElement.lang === 'it' ? 'it' : 'en';
    const locale = language === 'it' ? 'it-IT' : 'en-GB';
    const messages = translations[language];
    const percentages = new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 2 });
    const euros = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 });
    inputs.forEach((input) => {
      input.removeAttribute('aria-invalid');
      input.removeAttribute('aria-describedby');
    });
    const values = Object.fromEntries(inputs.map((input) => [input.name, input.valueAsNumber]));
    const result = calculateFunnel(values);
    error.hidden = !result.error;
    error.textContent = result.error ? messages[result.error] : '';
    if (result.error) {
      const invalidInput = inputs.find((input) => input.name === result.field);
      invalidInput.setAttribute('aria-invalid', 'true');
      invalidInput.setAttribute('aria-describedby', 'funnel-error');
    }
    outputs.forEach((output) => {
      const key = output.dataset.funnelOutput;
      const value = result[key];
      output.textContent = result.error ? '—' : value === null ? messages.undefined :
        key === 'cost' ? euros.format(value) : percentages.format(value);
    });
  };
  calculator.querySelector('form').addEventListener('submit', (event) => event.preventDefault());
  inputs.forEach((input) => input.addEventListener('input', update));
  window.addEventListener('codedge:lang-changed', update);
  update();
}

function syncDiagramLanguage() {
  document.querySelectorAll('.indie-visual').forEach((visual) => {
    const image = visual.querySelector('img');
    const source = visual.querySelector('a[href]').getAttribute('href');
    if (image.getAttribute('src') !== source) image.setAttribute('src', source);
  });
}

window.addEventListener('codedge:lang-changed', syncDiagramLanguage);

document.addEventListener('DOMContentLoaded', () => {
  initGuideToc();
  initGuideQuiz();
  initFunnelCalculator();
});
