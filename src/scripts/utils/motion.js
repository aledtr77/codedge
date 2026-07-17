// Programmatic scrolls must honor the OS "reduce motion" preference:
// an explicit behavior:"smooth" ignores it (unlike CSS scroll-behavior,
// already handled in the stylesheets).

export function scrollBehavior() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? "auto"
    : "smooth";
}
