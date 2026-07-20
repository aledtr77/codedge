// Injects interactive playgrounds (editor + sandboxed iframe preview) into
// HTML and CSS code blocks. Inside .snippet-box the single "Prova Live"
// button lives in the title-box; outside, a per-block toolbar is built.

const injectHelperScript = (html) => {
  const helperStyle = `
  <style>
    .sandbox-toast {
      position: fixed;
      bottom: 16px;
      left: 50%;
      transform: translateX(-50%) translateY(100px);
      background-color: #0f172a;
      color: #f8fafc;
      padding: 10px 16px;
      border-radius: 8px;
      font-size: 0.85rem;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s;
      opacity: 0;
      z-index: 99999;
      pointer-events: none;
      white-space: nowrap;
      border: 1px solid #334155;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .sandbox-toast.show {
      transform: translateX(-50%) translateY(0);
      opacity: 1;
    }
    .sandbox-toast svg {
      width: 16px;
      height: 16px;
      fill: #0ea5e9;
      flex-shrink: 0;
    }
  </style>
  `;

  const helperScript = `
  <script>
    document.addEventListener('click', function(e) {
      const link = e.target.closest('a');
      if (!link) return;
      
      const href = link.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('javascript:')) {
        return;
      }
      
      e.preventDefault();
      
      let toast = document.getElementById('sandbox-toast');
      if (!toast) {
        toast = document.createElement('div');
        toast.id = 'sandbox-toast';
        toast.className = 'sandbox-toast';
        toast.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg><span>I collegamenti esterni sono disattivati nell\\'anteprima.</span>';
        document.body.appendChild(toast);
      }
      
      toast.classList.add('show');
      
      clearTimeout(window.sandboxToastTimeout);
      window.sandboxToastTimeout = setTimeout(function() {
        toast.classList.remove('show');
      }, 2500);
    });
  </script>
  `;

  if (html.includes("</body>")) {
    return html.replace("</body>", `${helperStyle}${helperScript}</body>`);
  } else if (html.includes("</html>")) {
    return html.replace("</html>", `${helperStyle}${helperScript}</html>`);
  } else {
    return `${html}${helperStyle}${helperScript}`;
  }
};


export default function initGuidePlayground() {
  const codeBlocks = Array.from(document.querySelectorAll("pre code"));

  const cssDefaultHtml = (userCss) => `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <style>
    /* Stili di base per rendere gradevole la sandbox di prova */
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 12px;
      padding: 0;
      background-color: #f8fafc;
      color: #0f172a;
    }
    h4 {
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
      margin: 16px 0 6px 0;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
    }
    .sandbox-section {
      margin-bottom: 20px;
    }

    /* Box figli di prova di base per Flexbox/Grid */
    .box, .item {
      padding: 16px;
      background: #0ea5e9;
      color: white;
      border-radius: 6px;
      font-weight: 600;
      text-align: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    .box:nth-child(2), .item:nth-child(2) { background: #f43f5e; }
    .box:nth-child(3), .item:nth-child(3) { background: #10b981; }

    /* CSS scritto dal programmatore */
    ${userCss}
  </style>
</head>
<body>

  <div class="sandbox-section">
    <h4>1. Layout (Flexbox / Grid / Columns)</h4>
    <!-- Contenitori di prova generici -->
    <div class="flex-row auto-grid layout-grid carousel-snap flex-container parent container">
      <div class="box item carousel-item card">Box 1</div>
      <div class="box item carousel-item card">Box 2</div>
      <div class="box item carousel-item card">Box 3</div>
    </div>
  </div>

  <div class="sandbox-section">
    <h4>2. Effetti UI e Pulsanti</h4>
    <button class="btn-interactive button btn" type="button">Pulsante Interattivo</button>
  </div>

  <div class="sandbox-section">
    <h4>3. Troncamento e Gestione Testo</h4>
    <div style="max-width: 320px; padding: 10px; background: #fff; border: 1px solid #e2e8f0; border-radius: 6px;">
      <p class="truncate-lines-3" style="margin: 0 0 8px 0; font-size: 0.85rem; color: #334155;">
        Questo è un paragrafo molto lungo di prova. Contiene molto testo per testare l'ellissi su più righe. Se la regola CSS funziona correttamente, dovresti vedere il testo troncato con i tre puntini sospensivi alla fine della riga impostata.
      </p>
      <p class="single-line-ellipsis" style="margin: 0; font-size: 0.85rem; font-weight: 600; color: #0f172a;">
        Questo è un titolo molto lungo per testare l'ellissi su singola riga.
      </p>
    </div>
  </div>

</body>
</html>
  `.trim();

  const htmlDefaultTemplate = (userHtml) => {
    // User HTML that already brings <html>/<body> is used as-is
    if (userHtml.includes("<html") || userHtml.includes("<body")) {
      return userHtml;
    }
    return `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 16px;
      background-color: #f8fafc;
      color: #1e293b;
      line-height: 1.5;
    }

    /* Layout Semantico visualizer */
    header, footer {
      background: #1e293b;
      color: #ffffff;
      padding: 12px;
      text-align: center;
      border-radius: 6px;
      margin-bottom: 8px;
    }
    nav ul {
      list-style: none;
      padding: 0;
      display: flex;
      gap: 12px;
      justify-content: center;
    }
    nav a {
      color: #38bdf8;
      text-decoration: none;
    }
    main {
      display: grid;
      grid-template-columns: 1fr;
      gap: 12px;
      margin: 12px 0;
    }
    @media (min-width: 600px) {
      main {
        grid-template-columns: 3fr 1fr;
      }
    }
    article {
      background: #ffffff;
      padding: 16px;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }
    aside {
      background: #f1f5f9;
      padding: 16px;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }

    /* Form di Contatto */
    .form-container {
      background: #ffffff;
      padding: 20px;
      border-radius: 10px;
      border: 1px solid #e2e8f0;
      max-width: 450px;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
    }
    .form-group {
      margin-bottom: 12px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .form-group label {
      font-weight: 600;
      font-size: 0.85rem;
      color: #475569;
    }
    .form-group input, .form-group textarea {
      padding: 8px 12px;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      font-family: inherit;
      outline: none;
      transition: border-color 0.2s;
    }
    .form-group input:focus, .form-group textarea:focus {
      border-color: #0ea5e9;
    }
    .submit-btn {
      background: #0ea5e9;
      color: white;
      border: none;
      padding: 10px 16px;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
      width: 100%;
      font-family: inherit;
      transition: background 0.2s;
    }
    .submit-btn:hover {
      background: #0284c7;
    }
    picture, img {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      display: block;
    }
  </style>
</head>
<body>
  ${userHtml}
</body>
</html>
    `.trim();
  };

  const playButtonLabel = (open) => open
    ? `<i class="fas fa-times"></i> Chiudi Live`
    : `<i class="fas fa-play"></i> Prova Live`;

  // Sync the box "Prova Live" button with the playground state
  const syncPlayButtons = (scope, open) => {
    scope.querySelectorAll(".play-btn").forEach((btn) => {
      btn.innerHTML = playButtonLabel(open);
      btn.classList.toggle("active", open);
      btn.setAttribute("aria-expanded", String(open));
    });
  };

  codeBlocks.forEach((codeEl) => {
    const preEl = codeEl.parentElement;
    if (!preEl || preEl.tagName !== "PRE") return;

    let lang = "";
    if (codeEl.classList.contains("language-html") || codeEl.classList.contains("lang-html")) {
      lang = "html";
    } else if (codeEl.classList.contains("language-css") || codeEl.classList.contains("lang-css")) {
      lang = "css";
    }

    const wrapper = document.createElement("div");
    wrapper.className = "code-wrapper";
    preEl.parentNode.insertBefore(wrapper, preEl);
    wrapper.appendChild(preEl);

    const snippetBox = preEl.closest('.snippet-box');

    if (!snippetBox) {
      const toolbar = document.createElement("div");
      toolbar.className = "code-toolbar";

      const copyBtn = document.createElement("button");
      copyBtn.type = "button";
      copyBtn.className = "code-btn";
      copyBtn.innerHTML = `<i class="fas fa-copy"></i> Copia`;
      toolbar.appendChild(copyBtn);

      if (lang === "html" || lang === "css") {
        const editBtn = document.createElement("button");
        editBtn.type = "button";
        editBtn.className = "code-btn";
        editBtn.innerHTML = `<i class="fas fa-play"></i> Prova Live`;
        toolbar.appendChild(editBtn);
      }

      wrapper.appendChild(toolbar);
    } else if (lang === "html" || lang === "css") {
      // snippet-box: one "Prova Live" in the title-box, next to the other box
      // actions (desktop and mobile share the same placement)
      const titleBox = snippetBox.querySelector('.title-box');
      if (titleBox) {
        const editBtn = document.createElement("button");
        editBtn.type = "button";
        editBtn.className = "play-btn";
        editBtn.setAttribute("aria-expanded", "false");
        editBtn.innerHTML = playButtonLabel(false);
        titleBox.appendChild(editBtn);
      }
    }
  });

  const openPlayground = (wrapper, initialCode, lang) => {
    wrapper.style.display = "none";

    // Inside .snippet-box closing goes through the always-visible "Chiudi Live"
    // in the title-box, so no duplicate close in the header. Outside (guides)
    // the toolbar disappears with the wrapper: this close is the only one.
    const inSnippetBox = Boolean(wrapper.closest(".snippet-box"));
    const closeBtnHtml = inSnippetBox
      ? ""
      : `<button type="button" class="playground-btn btn-close" title="Chiudi playground"><i class="fas fa-times"></i> <span>Chiudi</span></button>`;

    const playground = document.createElement("div");
    // Mobile starts on the preview tab; on desktop both panels stay stacked
    // and the tabs are hidden via CSS.
    playground.className = "code-playground pane-preview";
    playground.dataset.initialCode = initialCode;

    playground.innerHTML = `
      <div class="playground-header">
        <div class="playground-title">
          <i class="fas fa-terminal"></i> Playground Live (${lang.toUpperCase()})
        </div>
        <div class="playground-actions">
          <button type="button" class="playground-btn btn-reset" title="Ripristina codice iniziale"><i class="fas fa-undo"></i> <span>Ripristina</span></button>
          <button type="button" class="playground-btn btn-copy" title="Copia codice"><i class="fas fa-copy"></i> <span class="btn-text">Copia Codice</span></button>
          ${closeBtnHtml}
        </div>
      </div>
      <div class="playground-tabs" role="tablist" aria-label="Vista playground">
        <button type="button" class="playground-tab active" data-pane="preview" role="tab" aria-selected="true">Anteprima</button>
        <button type="button" class="playground-tab" data-pane="editor" role="tab" aria-selected="false">Editor</button>
      </div>
      <div class="playground-body">
        <div class="playground-editor-pane">
          <textarea class="playground-editor" spellcheck="false" aria-label="Editor di codice"></textarea>
          <div class="playground-lang-tag">${lang}</div>
        </div>
        <div class="playground-preview-pane">
          <iframe class="playground-iframe" sandbox="allow-scripts" title="Anteprima playground"></iframe>
        </div>
      </div>
    `;

    wrapper.parentNode.insertBefore(playground, wrapper.nextSibling);

    const textarea = playground.querySelector(".playground-editor");
    const iframe = playground.querySelector(".playground-iframe");

    textarea.value = initialCode;

    // srcdoc + sandbox="allow-scripts": the preview runs in an opaque origin
    // with no access to the hosting page.
    const updatePreview = () => {
      const code = textarea.value;
      const rawHtml = lang === "css" ? cssDefaultHtml(code) : htmlDefaultTemplate(code);
      iframe.srcdoc = injectHelperScript(rawHtml);
    };

    // Debounced live preview: avoid rewriting the iframe on every keystroke
    let previewTimer = null;
    textarea.addEventListener("input", () => {
      clearTimeout(previewTimer);
      previewTimer = setTimeout(updatePreview, 150);
    });
    updatePreview();
  };

  const closePlayground = (playground) => {
    const wrapper = playground.previousElementSibling;
    playground.remove();
    if (wrapper && wrapper.classList.contains("code-wrapper")) {
      wrapper.style.display = "";
      const snippetBox = wrapper.closest(".snippet-box");
      if (snippetBox) syncPlayButtons(snippetBox, false);
    }
  };

  // Single delegated click handler for every playground control
  document.addEventListener("click", (ev) => {
    const playBtn = ev.target.closest(".play-btn");
    if (playBtn) {
      ev.preventDefault();
      const snippetBox = playBtn.closest(".snippet-box");
      if (snippetBox) {
        const wrapper = snippetBox.querySelector(".code-wrapper");
        const codeEl = snippetBox.querySelector("pre code");
        if (wrapper && codeEl) {
          const playground = wrapper.nextElementSibling;
          if (playground && playground.classList.contains("code-playground")) {
            closePlayground(playground);
          } else {
            const lang = (codeEl.classList.contains("language-html") || codeEl.classList.contains("lang-html")) ? "html" : "css";
            openPlayground(wrapper, codeEl.textContent.trim(), lang);
            syncPlayButtons(snippetBox, true);
          }
        }
      }
      return;
    }

    const codeBtn = ev.target.closest(".code-btn");
    if (codeBtn) {
      ev.preventDefault();
      const wrapper = codeBtn.closest(".code-wrapper");
      if (wrapper) {
        const codeEl = wrapper.querySelector("pre code");
        if (codeEl) {
          const isCopy = codeBtn.innerHTML.includes("Copia");
          const lang = (codeEl.classList.contains("language-html") || codeEl.classList.contains("lang-html")) ? "html" : "css";
          if (isCopy) {
            navigator.clipboard.writeText(codeEl.textContent.trim()).then(() => {
              codeBtn.innerHTML = `<i class="fas fa-check" style="color: #2ed573"></i> Copiato`;
              setTimeout(() => {
                codeBtn.innerHTML = `<i class="fas fa-copy"></i> Copia`;
              }, 2000);
            });
          } else {
            openPlayground(wrapper, codeEl.textContent.trim(), lang);
          }
        }
      }
      return;
    }

    const btnClose = ev.target.closest(".btn-close");
    if (btnClose) {
      ev.preventDefault();
      const playground = btnClose.closest(".code-playground");
      if (playground) closePlayground(playground);
      return;
    }

    const tabBtn = ev.target.closest(".playground-tab");
    if (tabBtn) {
      ev.preventDefault();
      const playground = tabBtn.closest(".code-playground");
      if (playground) {
        const pane = tabBtn.dataset.pane;
        playground.classList.toggle("pane-preview", pane === "preview");
        playground.classList.toggle("pane-editor", pane === "editor");
        playground.querySelectorAll(".playground-tab").forEach((tab) => {
          const selected = tab === tabBtn;
          tab.classList.toggle("active", selected);
          tab.setAttribute("aria-selected", String(selected));
        });
      }
      return;
    }

    const btnReset = ev.target.closest(".btn-reset");
    if (btnReset) {
      ev.preventDefault();
      const playground = btnReset.closest(".code-playground");
      if (playground) {
        const textarea = playground.querySelector(".playground-editor");
        const initialCode = playground.dataset.initialCode;
        if (textarea && initialCode !== undefined) {
          textarea.value = initialCode;
          textarea.dispatchEvent(new Event("input"));
        }
      }
      return;
    }

    const btnCopy = ev.target.closest(".btn-copy");
    if (btnCopy) {
      ev.preventDefault();
      const playground = btnCopy.closest(".code-playground");
      if (playground) {
        const textarea = playground.querySelector(".playground-editor");
        if (textarea) {
          navigator.clipboard.writeText(textarea.value).then(() => {
            const textSpan = btnCopy.querySelector(".btn-text");
            const iconEl = btnCopy.querySelector("i");

            if (iconEl) {
              iconEl.className = "fas fa-check";
              iconEl.style.color = "#2ed573";
            }
            if (textSpan) {
              textSpan.textContent = "Copiato!";
            }

            setTimeout(() => {
              if (iconEl) {
                iconEl.className = "fas fa-copy";
                iconEl.style.color = "";
              }
              if (textSpan) {
                textSpan.textContent = "Copia Codice";
              }
            }, 1500);
          });
        }
      }
      return;
    }
  });
}
