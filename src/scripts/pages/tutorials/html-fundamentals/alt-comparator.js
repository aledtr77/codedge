const CAT_IMAGE_PATH = "/images/gatto-rosso.webp";

export default function initAltComparator() {
  const container = document.getElementById("alt-comparator");
  if (!container) return;

  const buttons = container.querySelectorAll(".alt-scenario-btn");
  const visualContainer = container.querySelector(".alt-visual-content");
  const codeContent = container.querySelector(".alt-code-content");
  const infoBox = container.querySelector(".alt-info-content");

  const scenarios = {
    missing: {
      visual: `
        <figure class="alt-example-figure">
          <img src="${CAT_IMAGE_PATH}" width="800" height="600">
          <figcaption>Un gatto rosso dorme su un divano grigio.</figcaption>
        </figure>
      `,
      code: `
<span class="alt-tag">&lt;img</span>
  <span class="alt-attr-name">src</span>=<span class="alt-attr-value">"${CAT_IMAGE_PATH}"</span>
  <span class="alt-attr-name">width</span>=<span class="alt-attr-value">"800"</span>
  <span class="alt-attr-name">height</span>=<span class="alt-attr-value">"600"</span>
<span class="alt-tag">&gt;</span>
      `,
      info: `
        <div class="alt-info-icon" aria-hidden="true"><i class="fa-solid fa-circle-exclamation"></i></div>
        <div class="alt-info-text">
          <strong>Visivamente c'è un gatto, ma nel codice manca <code>alt</code>.</strong>
          <p>Chi usa uno screen reader non riceve una descrizione affidabile: a seconda del software può sentire soltanto “immagine” oppure parte del nome del file. Per una fotografia informativa è un errore.</p>
        </div>
      `
    },
    descriptive: {
      visual: `
        <figure class="alt-example-figure">
          <img src="${CAT_IMAGE_PATH}" alt="Gatto rosso addormentato su un divano grigio" width="800" height="600">
          <figcaption>Un gatto rosso dorme su un divano grigio.</figcaption>
        </figure>
      `,
      code: `
<span class="alt-tag">&lt;img</span>
  <span class="alt-attr-name">src</span>=<span class="alt-attr-value">"${CAT_IMAGE_PATH}"</span>
  <span class="alt-attr-name">alt</span>=<span class="alt-attr-value">"Gatto rosso addormentato su un divano grigio"</span>
  <span class="alt-attr-name">width</span>=<span class="alt-attr-value">"800"</span>
  <span class="alt-attr-name">height</span>=<span class="alt-attr-value">"600"</span>
<span class="alt-tag">&gt;</span>
      `,
      info: `
        <div class="alt-info-icon" aria-hidden="true"><i class="fa-solid fa-circle-check"></i></div>
        <div class="alt-info-text">
          <strong>Lo screen reader legge: “Gatto rosso addormentato su un divano grigio”.</strong>
          <p>Il testo comunica l'informazione essenziale senza iniziare con “immagine di”, perché il lettore di schermo annuncia già che si tratta di un'immagine.</p>
        </div>
      `
    },
    functional: {
      visual: `
        <div class="alt-logo-example">
          <img src="/icons/codedge-logo.svg" alt="Codege — torna alla home" width="180" height="80">
          <span>Il logo è anche un link alla home</span>
        </div>
      `,
      code: `
<span class="alt-tag">&lt;a</span> <span class="alt-attr-name">href</span>=<span class="alt-attr-value">"/"</span><span class="alt-tag">&gt;</span>
  <span class="alt-tag">&lt;img</span>
    <span class="alt-attr-name">src</span>=<span class="alt-attr-value">"/icons/codedge-logo.svg"</span>
    <span class="alt-attr-name">alt</span>=<span class="alt-attr-value">"Codege — torna alla home"</span>
    <span class="alt-attr-name">width</span>=<span class="alt-attr-value">"180"</span> <span class="alt-attr-name">height</span>=<span class="alt-attr-value">"80"</span>
  <span class="alt-tag">&gt;</span>
<span class="alt-tag">&lt;/a&gt;</span>
      `,
      info: `
        <div class="alt-info-icon" aria-hidden="true"><i class="fa-solid fa-arrow-pointer"></i></div>
        <div class="alt-info-text">
          <strong>Per un'immagine cliccabile, l'<code>alt</code> descrive la funzione.</strong>
          <p>“Codege — torna alla home” chiarisce sia l'identità del logo sia la destinazione del link. Scrivere soltanto <code>alt="logo"</code> non direbbe dove porta.</p>
        </div>
      `
    }
  };

  function selectScenario(name) {
    const scenario = scenarios[name];
    if (!scenario) return;

    buttons.forEach((button) => {
      const isSelected = button.dataset.scenario === name;
      button.classList.toggle("is-active", isSelected);
      button.setAttribute("aria-pressed", String(isSelected));
    });

    visualContainer.innerHTML = scenario.visual.trim();
    codeContent.innerHTML = `<pre><code>${scenario.code.trim()}</code></pre>`;
    infoBox.innerHTML = scenario.info.trim();
  }

  buttons.forEach((button) => {
    button.addEventListener("click", () => selectScenario(button.dataset.scenario));
  });

  selectScenario("missing");
}
