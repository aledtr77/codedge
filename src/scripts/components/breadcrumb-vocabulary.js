// Slug vocabulary and formatting, shared between the runtime breadcrumb
// (breadcrumb.js) and the build-time structured data (seo-jsonld-plugin.mjs):
// the visible labels and the BreadcrumbList JSON-LD must stay identical.

export const BREADCRUMB_VOCABULARY = {
  // Parent categories
  "risorse": "Risorse",
  "strumenti": "Strumenti",
  "componenti-ui": "Componenti UI",
  "tutorial": "Tutorial",
  "template": "Template",
  "percorsi-apprendimento": "Percorsi di Apprendimento",

  // Page-specific overrides
  "privacy-policy": "Privacy Policy",
  "termini-servizio": "Termini di Servizio",
  "chi-sono": "Chi Sono",
  "contatti": "Contatti",

  // Acronyms and casing fixes
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

  // Slug words that lose their accent in the URL
  "accessibilita": "Accessibilità",

  // Prepositions kept lowercase mid-title
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

  if (BREADCRUMB_VOCABULARY[segment.toLowerCase()]) {
    return BREADCRUMB_VOCABULARY[segment.toLowerCase()];
  }

  return segment
    .split(/[-_]+/)
    .map((word, index) => {
      const lowerWord = word.toLowerCase();

      if (BREADCRUMB_VOCABULARY[lowerWord]) {
        // The first word is always capitalized, even when it is a preposition
        if (index === 0 && LOWERCASE_WORDS.includes(lowerWord)) {
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        }
        return BREADCRUMB_VOCABULARY[lowerWord];
      }

      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}
