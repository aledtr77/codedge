// Search-time text folding, shared by the components that match what the user
// typed against what is on the page.
//
// Accents are stripped rather than compared: someone looking for "però" types
// "pero" as often as not, and a glossary that only answers to the accented
// spelling looks broken. NFD splits a letter from its diacritic so the
// combining marks can be dropped on their own.

export function normalizeForSearch(value) {
  return (value || "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}
