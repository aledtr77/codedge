import Prism from "prismjs";

// Prism marks CSS properties but leaves simple values uncolored by default.
Prism.languages.insertBefore("css", "punctuation", {
  value: { pattern: /(:\s*)[^;{}\n]+(?=\s*[;}])/, lookbehind: true },
});

export default Prism;
