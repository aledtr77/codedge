// Interactive Widget for Alt Text Comparison

export default function initAltComparator() {
  const container = document.getElementById("alt-comparator");
  if (!container) return;

  const buttons = container.querySelectorAll(".alt-scenario-btn");
  const visualContainer = container.querySelector(".alt-visual-content");
  const codeContent = container.querySelector(".alt-code-content");
  const infoBox = container.querySelector(".alt-info-content");

  const scenarios = {
    bad: {
      altText: "",
      description: "Nessun attributo alt",
      altMissing: true,
      visual: `
        <div class="alt-visual-placeholder">
          <img src="/images/percorsi-apprendimento/html-fondamentali/dom-tree.svg" alt="" class="placeholder-img" loading="lazy">
          <p class="placeholder-label">Immagine senza testo alternativo</p>
        </div>
      `,
      code: `
<span class="alt-tag">&lt;img</span>
  <span class="alt-attr-name">src</span>=<span class="alt-attr-value">"/immagini/gatto.jpg"</span>
  <span class="alt-attr-name">alt</span>=<span class="alt-attr-value">""</span>
  <span class="alt-attr-name">width</span>=<span class="alt-attr-value">"800"</span>
  <span class="alt-attr-name">height</span>=<span class="alt-attr-value">"600"</span>
<span class="alt-tag">&gt;</span>
      `,
      info: `
        <div class="alt-info-icon"><i class="fa-solid fa-circle-exclamation"></i></div>
        <div class="alt-info-text">
          <strong>Cosa legge uno screen reader?</strong><br>
          "Immagine". Senza un testo alternativo, l'utente sa solo che c'è un'immagine, ma non sa <em>cosa</em> rappresenta. Per un'immagine che porta informazione (come un grafico o una fotografia), questo è un grave problema di accessibilità.
        </div>
      `
    },
    good: {
      altText: "Gatto rosso addormentato su un divano grigio",
      description: "Testo alternativo descrittivo",
      altMissing: false,
      visual: `
        <div class="alt-visual-placeholder">
          <img src="/images/percorsi-apprendimento/html-fondamentali/dom-tree.svg" alt="Gatto rosso addormentato su un divano grigio" class="placeholder-img" loading="lazy">
          <p class="placeholder-label">Immagine con alt descrittivo</p>
        </div>
      `,
      code: `
<span class="alt-tag">&lt;img</span>
  <span class="alt-attr-name">src</span>=<span class="alt-attr-value">"/immagini/gatto.jpg"</span>
  <span class="alt-attr-name">alt</span>=<span class="alt-attr-value">"Gatto rosso addormentato su un divano grigio"</span>
  <span class="alt-attr-name">width</span>=<span class="alt-attr-value">"800"</span>
  <span class="alt-attr-name">height</span>=<span class="alt-attr-value">"600"</span>
<span class="alt-tag">&gt;</span>
      `,
      info: `
        <div class="alt-info-icon"><i class="fa-solid fa-circle-check"></i></div>
        <div class="alt-info-text">
          <strong>Cosa legge uno screen reader?</strong><br>
          "Gatto rosso addormentato su un divano grigio". L'utente sa esattamente cosa rappresenta l'immagine, anche se non può vederla. Questo è un esempio di <strong>alt perfetto</strong> per un'immagine che porta informazione.
        </div>
      `
    },
    decorative: {
      altText: "(vuoto)",
      description: "Immagine decorativa",
      altMissing: false,
      visual: `
        <div class="alt-visual-placeholder">
          <img src="/icons/codedge-logo.svg" alt="" class="placeholder-img" loading="lazy">
          <p class="placeholder-label">Logo decorativo (alt vuoto)</p>
        </div>
      `,
      code: `
<span class="alt-tag">&lt;img</span>
  <span class="alt-attr-name">src</span>=<span class="alt-attr-value">"/icons/logo.svg"</span>
  <span class="alt-attr-name">alt</span>=<span class="alt-attr-value">""</span>
<span class="alt-tag">&gt;</span>
      `,
      info: `
        <div class="alt-info-icon"><i class="fa-solid fa-star"></i></div>
        <div class="alt-info-text">
          <strong>Cosa legge uno screen reader?</strong><br>
          Niente. L'immagine viene completamente saltata perché <code>alt=""</code> dichiara che è <strong>decorativa</strong>, non informativa. Questo è corretto per loghi, ornamenti o immagini che servono solo a completare il design.
        </div>
      `
    }
  };

  function selectScenario(name) {
    const scenario = scenarios[name];
    if (!scenario) return;

    // Update buttons state
    buttons.forEach(btn => {
      if (btn.getAttribute("data-scenario") === name) {
        btn.classList.add("is-active");
      } else {
        btn.classList.remove("is-active");
      }
    });

    // Update visual content
    visualContainer.innerHTML = scenario.visual;

    // Update code content
    codeContent.innerHTML = `<pre><code>${scenario.code.trim()}</code></pre>`;

    // Update info box
    infoBox.innerHTML = scenario.info;
  }

  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      const name = btn.getAttribute("data-scenario");
      selectScenario(name);
    });
  });

  // Load default scenario (bad) on load
  selectScenario("bad");
}
