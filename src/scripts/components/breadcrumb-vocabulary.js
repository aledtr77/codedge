// src/scripts/components/breadcrumb-vocabulary.js
// Vocabolario e formattazione degli slug, condivisi tra la breadcrumb runtime
// (breadcrumb.js) e la generazione build-time dei dati strutturati
// (scripts/seo-jsonld-plugin.mjs): le etichette visibili e quelle nei
// BreadcrumbList JSON-LD devono coincidere.

export const BREADCRUMB_VOCABULARY = {
  // Categorie principali (parenti)
  "risorse": "Risorse",
  "strumenti": "Strumenti",
  "componenti-ui": "Componenti UI",
  "tutorial": "Tutorial",
  "template": "Template",
  "percorsi-apprendimento": "Percorsi di Apprendimento",

  // Specifiche eccezioni di pagine per le quali non vogliamo dipendere dal DOM o come fallback
  "privacy-policy": "Privacy Policy",
  "termini-servizio": "Termini di Servizio",
  "chi-sono": "Chi Sono",
  "contatti": "Contatti",

  // Acronimi e abbreviazioni comuni
  "ui": "UI",
  "html": "HTML",
  "css": "CSS",
  "js": "JavaScript",
  "javascript": "JavaScript",
  "vscode": "VSCode",
  "vs-code": "VS Code",
  "pwa": "PWA",
  "ai": "AI",
  "npm": "NPM",
  "seo": "SEO",
  "git": "Git",
  "github": "GitHub",
  "devtools": "DevTools",

  // Parole degli slug che perdono l'accento nell'URL
  "accessibilita": "Accessibilità",

  // Congiunzioni/Preposizioni in minuscolo (per la formattazione automatica)
  "di": "di",
  "a": "a",
  "da": "da",
  "in": "in",
  "con": "con",
  "su": "su",
  "per": "per",
  "tra": "tra",
  "fra": "fra",
  "senza": "senza",
  "e": "e"
};

const LOWERCASE_WORDS = ["di", "a", "da", "in", "con", "su", "per", "tra", "fra", "senza", "e"];

export function formatSegment(segment) {
  if (!segment) return "";

  // Se l'intero segmento è mappato direttamente nel vocabolario, usalo subito
  if (BREADCRUMB_VOCABULARY[segment.toLowerCase()]) {
    return BREADCRUMB_VOCABULARY[segment.toLowerCase()];
  }

  // Altrimenti spezza per trattino, capitalizza e applica sostituzioni
  return segment
    .split(/[-_]+/)
    .map((word, index) => {
      const lowerWord = word.toLowerCase();

      // Controlla se la parola fa parte del vocabolario (es. "ui" -> "UI", "di" -> "di")
      if (BREADCRUMB_VOCABULARY[lowerWord]) {
        // La prima parola del segmento deve essere sempre capitalizzata, anche se è una congiunzione
        if (index === 0 && LOWERCASE_WORDS.includes(lowerWord)) {
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        }
        return BREADCRUMB_VOCABULARY[lowerWord];
      }

      // Capitalizzazione standard
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}
