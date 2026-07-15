// src/scripts/components/guide-playground.js
// Componente dinamico per iniettare playground interattivi (Editor + Iframe)
// nei blocchi di codice HTML e CSS di Codedge.it.

export default function initGuidePlayground() {
  const codeBlocks = Array.from(document.querySelectorAll("pre code"));

  // Template HTML predefinito per testare il CSS in modo visivo
  const cssDefaultHtml = (userCss) => `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 16px;
      padding: 0;
      background-color: #f3f6fa;
      color: #1e293b;
    }
    
    /* Contenitore di prova */
    .parent, .container, .griglia, .flex-container, .card, .card-container {
      background: #ffffff;
      padding: 16px;
      border-radius: 8px;
      border: 1px dashed #cbd5e1;
      min-height: 100px;
      box-sizing: border-box;
    }
    
    /* Box figli di prova */
    .box, .item, .badge {
      padding: 20px;
      background: #00A8FF;
      color: white;
      border-radius: 6px;
      font-weight: bold;
      font-size: 1rem;
      text-align: center;
      box-sizing: border-box;
      box-shadow: 0 4px 6px rgba(0,0,0,0.05);
    }
    .box:nth-child(2) { background: #FF4757; }
    .box:nth-child(3) { background: #2ED573; }

    /* CSS digitato dall'utente */
    ${userCss}
  </style>
</head>
<body>
  <div class="parent container griglia flex-container card card-container">
    <div class="box item badge">Box 1</div>
    <div class="box item badge">Box 2</div>
    <div class="box item badge">Box 3</div>
  </div>
</body>
</html>
  `.trim();

  const htmlDefaultTemplate = (userHtml) => {
    // Se l'HTML ha già i tag strutturali (html, body), lo lasciamo così.
    if (userHtml.includes("<html") || userHtml.includes("<body")) {
      return userHtml;
    }
    // Altrimenti creiamo un wrapper base pulito per consentire un rendering ordinato
    return `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 16px;
      background-color: #ffffff;
      color: #1e293b;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  ${userHtml}
</body>
</html>
    `.trim();
  };

  codeBlocks.forEach((codeEl) => {
    const preEl = codeEl.parentElement;
    if (!preEl || preEl.tagName !== "PRE") return;

    // Rileva il linguaggio del blocco di codice
    let lang = "";
    if (codeEl.classList.contains("language-html") || codeEl.classList.contains("lang-html")) {
      lang = "html";
    } else if (codeEl.classList.contains("language-css") || codeEl.classList.contains("lang-css")) {
      lang = "css";
    }

    // Creiamo il wrapper attorno a <pre>
    const wrapper = document.createElement("div");
    wrapper.className = "code-wrapper";
    preEl.parentNode.insertBefore(wrapper, preEl);
    wrapper.appendChild(preEl);

    // Creiamo la toolbar fluttuante
    const toolbar = document.createElement("div");
    toolbar.className = "code-toolbar";

    // Bottone Copia Codice
    const copyBtn = document.createElement("button");
    copyBtn.type = "button";
    copyBtn.className = "code-btn";
    copyBtn.innerHTML = `<i class="fas fa-copy"></i> Copia`;
    copyBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(codeEl.textContent.trim()).then(() => {
        copyBtn.innerHTML = `<i class="fas fa-check" style="color: #2ed573"></i> Copiato`;
        setTimeout(() => {
          copyBtn.innerHTML = `<i class="fas fa-copy"></i> Copia`;
        }, 2000);
      });
    });
    toolbar.appendChild(copyBtn);

    // Bottone Modifica Live (disponibile solo per HTML e CSS)
    if (lang === "html" || lang === "css") {
      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.className = "code-btn";
      editBtn.innerHTML = `<i class="fas fa-play"></i> Prova Live`;
      editBtn.addEventListener("click", () => {
        openPlayground(wrapper, codeEl.textContent.trim(), lang);
      });
      toolbar.appendChild(editBtn);
    }

    wrapper.appendChild(toolbar);
  });

  const openPlayground = (wrapper, initialCode, lang) => {
    // Nascondiamo il wrapper statico del codice
    wrapper.style.display = "none";

    const playground = document.createElement("div");
    playground.className = "code-playground";

    playground.innerHTML = `
      <div class="playground-header">
        <div class="playground-title">
          <i class="fas fa-terminal"></i> Playground Live (${lang.toUpperCase()})
        </div>
        <div class="playground-actions">
          <button type="button" class="playground-btn btn-reset"><i class="fas fa-undo"></i> Ripristina</button>
          <button type="button" class="playground-btn btn-copy"><i class="fas fa-copy"></i> Copia Codice</button>
          <button type="button" class="playground-btn btn-close"><i class="fas fa-times"></i> Chiudi</button>
        </div>
      </div>
      <div class="playground-body">
        <div class="playground-editor-pane">
          <textarea class="playground-editor" spellcheck="false" aria-label="Editor di codice"></textarea>
          <div class="playground-lang-tag">${lang}</div>
        </div>
        <div class="playground-preview-pane">
          <iframe class="playground-iframe" sandbox="allow-scripts allow-same-origin" title="Anteprima playground"></iframe>
        </div>
      </div>
    `;

    // Inseriamo il playground subito sotto il wrapper nascosto
    wrapper.parentNode.insertBefore(playground, wrapper.nextSibling);

    const textarea = playground.querySelector(".playground-editor");
    const iframe = playground.querySelector(".playground-iframe");
    const btnReset = playground.querySelector(".btn-reset");
    const btnCopy = playground.querySelector(".btn-copy");
    const btnClose = playground.querySelector(".btn-close");

    // Imposta il codice iniziale
    textarea.value = initialCode;

    const updatePreview = () => {
      const code = textarea.value;
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      iframeDoc.open();
      if (lang === "css") {
        iframeDoc.write(cssDefaultHtml(code));
      } else {
        iframeDoc.write(htmlDefaultTemplate(code));
      }
      iframeDoc.close();
    };

    // Aggiornamento su digitazione
    textarea.addEventListener("input", updatePreview);

    // Azione Ripristina
    btnReset.addEventListener("click", () => {
      textarea.value = initialCode;
      updatePreview();
    });

    // Azione Copia Codice Modificato
    btnCopy.addEventListener("click", () => {
      navigator.clipboard.writeText(textarea.value).then(() => {
        btnCopy.innerHTML = `<i class="fas fa-check" style="color: #2ed573"></i> Copiato!`;
        setTimeout(() => {
          btnCopy.innerHTML = `<i class="fas fa-copy"></i> Copia Codice`;
        }, 1500);
      });
    });

    // Azione Chiudi Playground
    btnClose.addEventListener("click", () => {
      playground.remove();
      wrapper.style.display = "block";
    });

    // Inizializza l'anteprima subito all'avvio
    updatePreview();
  };
}
