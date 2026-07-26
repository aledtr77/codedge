// Slug vocabulary and formatting, shared between the runtime breadcrumb
// (breadcrumb.js) and the build-time structured data (seo-jsonld-plugin.mjs):
// the visible labels and the BreadcrumbList JSON-LD must stay identical.
//
// Two vocabularies, one per language. The `/en` prefix is a language marker,
// not a navigation level, so it never becomes a breadcrumb entry.

// Terms shared by both languages: acronyms and casing fixes.
const ACRONYMS = {
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
  "devtools": "DevTools"
};

const IT_VOCABULARY = {
  ...ACRONYMS,

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

const EN_VOCABULARY = {
  ...ACRONYMS,

  // Parent categories
  "resources": "Resources",
  "tools": "Tools",
  "ui-components": "UI Components",
  "tutorials": "Tutorials",
  "templates": "Templates",

  // Page-specific overrides
  "privacy-policy": "Privacy Policy",
  "terms-of-service": "Terms of Service",
  "about": "About",
  "contact": "Contact",

  // Articles and prepositions kept lowercase mid-title
  "a": "a",
  "an": "an",
  "the": "the",
  "and": "and",
  "or": "or",
  "of": "of",
  "for": "for",
  "in": "in",
  "on": "on",
  "to": "to",
  "with": "with",
  "without": "without"
};

const VOCABULARIES = { it: IT_VOCABULARY, en: EN_VOCABULARY };

const LOWERCASE_WORDS = {
  it: ["di", "a", "da", "in", "con", "su", "per", "tra", "fra", "senza", "e"],
  en: ["a", "an", "the", "and", "or", "of", "for", "in", "on", "to", "with", "without"]
};

export const LANG_PREFIX_SEGMENTS = new Set(["en"]);

// Kept as the Italian vocabulary so existing importers keep working.
export const BREADCRUMB_VOCABULARY = IT_VOCABULARY;

export function formatSegment(segment, lang = "it") {
  if (!segment) return "";

  const vocabulary = VOCABULARIES[lang] || IT_VOCABULARY;
  const lowercaseWords = LOWERCASE_WORDS[lang] || LOWERCASE_WORDS.it;

  if (vocabulary[segment.toLowerCase()]) {
    return vocabulary[segment.toLowerCase()];
  }

  return segment
    .split(/[-_]+/)
    .map((word, index) => {
      const lowerWord = word.toLowerCase();

      if (vocabulary[lowerWord]) {
        // The first word is always capitalized, even when it is a preposition
        if (index === 0 && lowercaseWords.includes(lowerWord)) {
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        }
        return vocabulary[lowerWord];
      }

      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}
