// Contextual "report a problem with this page" box for guide/tutorial pages.
// Self-initializing: it only acts when the guide article is present, so it can
// be safely imported by any page entry. The GitHub issue link is prefilled with
// the current page so reports arrive with context already attached.
import "@/styles/components/guide-report.css";

const REPO_ISSUES_URL = "https://github.com/aledtr77/01-codedge/issues/new";

function buildIssueUrl() {
  // Page titles look like "Titolo pagina | Sottotitolo | Codedge": keep the
  // first, most specific segment for a readable issue title.
  const rawTitle = document.title || "Codedge";
  const pageName = rawTitle.split("|")[0].trim() || rawTitle;

  const params = new URLSearchParams({
    template: "bug_report.yml",
    title: `[Bug]: ${pageName}`,
    page_url: window.location.href
  });

  return `${REPO_ISSUES_URL}?${params.toString()}`;
}

function initGuideReport() {
  const article = document.querySelector("main article.guide-content");
  if (!article) return;
  if (article.querySelector(".guide-report")) return;

  const box = document.createElement("aside");
  box.className = "guide-report";
  box.setAttribute("aria-label", "Segnala un problema in questa pagina");
  box.innerHTML = `
    <p class="guide-report-text">
      <i class="fa-regular fa-flag" aria-hidden="true"></i>
      Hai trovato un errore, un refuso o qualcosa che non funziona in questa pagina?
    </p>
    <a
      class="guide-report-link button-simple"
      href="${buildIssueUrl()}"
      target="_blank"
      rel="noopener noreferrer"
    >
      Segnalalo su GitHub <i class="fa-brands fa-github" aria-hidden="true"></i>
    </a>
  `;

  article.appendChild(box);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initGuideReport);
} else {
  initGuideReport();
}
