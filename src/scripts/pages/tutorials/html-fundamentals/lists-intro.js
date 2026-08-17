// Interactive Widget for Lists Introduction

export default function initListsIntro() {
  const container = document.getElementById("lists-explorer");
  if (!container) return;

  const buttons = container.querySelectorAll(".scenario-btn");
  const previewContent = container.querySelector("#lists-preview-content");
  const codeContent = container.querySelector("#lists-code-content");
  const infoBox = container.querySelector("#lists-info-box");

  const scenarios = {
    menu: {
      preview: `
        <nav class="lists-preview-navbar">
          <div class="navbar-demo-logo"><i class="fa-solid fa-code"></i> DevSpace</div>
          <ul class="lists-preview-navbar-list">
            <li><a href="#" class="lists-preview-navbar-link is-active" data-tab="home">Home</a></li>
            <li><a href="#" class="lists-preview-navbar-link" data-tab="blog">Blog</a></li>
            <li><a href="#" class="lists-preview-navbar-link" data-tab="contact">Contatti</a></li>
          </ul>
        </nav>
      `,
      code: `
<div class="code-line"><span class="code-tag">&lt;nav&gt;</span></div>
<div class="code-line">  <span class="code-tag">&lt;ul&gt;</span> <span class="code-comment">&lt;!-- Il contenitore della lista --&gt;</span></div>
<div class="code-line">    <span class="code-tag">&lt;li&gt;</span><span class="code-tag">&lt;a</span> <span class="code-attr-name">href</span>=<span class="code-attr-val">"/"</span><span class="code-tag">&gt;</span><span class="code-text">Home</span><span class="code-tag">&lt;/a&gt;</span><span class="code-tag">&lt;/li&gt;</span></div>
<div class="code-line">    <span class="code-tag">&lt;li&gt;</span><span class="code-tag">&lt;a</span> <span class="code-attr-name">href</span>=<span class="code-attr-val">"/blog"</span><span class="code-tag">&gt;</span><span class="code-text">Blog</span><span class="code-tag">&lt;/a&gt;</span><span class="code-tag">&lt;/li&gt;</span></div>
<div class="code-line">    <span class="code-tag">&lt;li&gt;</span><span class="code-tag">&lt;a</span> <span class="code-attr-name">href</span>=<span class="code-attr-val">"/contatti"</span><span class="code-tag">&gt;</span><span class="code-text">Contatti</span><span class="code-tag">&lt;/a&gt;</span><span class="code-tag">&lt;/li&gt;</span></div>
<div class="code-line">  <span class="code-tag">&lt;/ul&gt;</span></div>
<div class="code-line"><span class="code-tag">&lt;/nav&gt;</span></div>
      `,
      info: `
        <div class="info-box-icon"><i class="fa-solid fa-circle-info"></i></div>
        <div class="info-box-text">
          <strong>Menu di Navigazione:</strong> Un menu è semanticamente una lista di link. Gli screen reader leggono questo blocco dicendo <em>"Navigazione, lista di 3 elementi"</em>, aiutando l'utente a capire la struttura e permettendo di saltarla se desidera. Con il CSS togliamo i pallini e allineiamo i link in orizzontale.
        </div>
      `,
      initEvents: (previewEl) => {
        const links = previewEl.querySelectorAll(".lists-preview-navbar-link");
        links.forEach(link => {
          link.addEventListener("click", (e) => {
            e.preventDefault();
            links.forEach(l => l.classList.remove("is-active"));
            link.classList.add("is-active");
          });
        });
      }
    },
    products: {
      preview: `
        <ul class="lists-preview-gallery">
          <li class="gallery-demo-item">
            <div class="gallery-demo-img-placeholder"><i class="fa-solid fa-laptop"></i></div>
            <div class="gallery-demo-info">
              <span class="gallery-demo-title">Laptop Pro 16</span>
              <span class="gallery-demo-price">€ 1.299</span>
            </div>
          </li>
          <li class="gallery-demo-item">
            <div class="gallery-demo-img-placeholder"><i class="fa-solid fa-mobile-screen-button"></i></div>
            <div class="gallery-demo-info">
              <span class="gallery-demo-title">Smartphone X</span>
              <span class="gallery-demo-price">€ 799</span>
            </div>
          </li>
        </ul>
      `,
      code: `
<div class="code-line"><span class="code-tag">&lt;ul</span> <span class="code-attr-name">class</span>=<span class="code-attr-val">"product-grid"</span><span class="code-tag">&gt;</span> <span class="code-comment">&lt;!-- Griglia di prodotti --&gt;</span></div>
<div class="code-line">  <span class="code-tag">&lt;li</span> <span class="code-attr-name">class</span>=<span class="code-attr-val">"product-card"</span><span class="code-tag">&gt;</span></div>
<div class="code-line">    <span class="code-tag">&lt;div</span> <span class="code-attr-name">class</span>=<span class="code-attr-val">"image"</span><span class="code-tag">&gt;</span><span class="code-text">...</span><span class="code-tag">&lt;/div&gt;</span></div>
<div class="code-line">    <span class="code-tag">&lt;h3&gt;</span><span class="code-text">Laptop Pro 16</span><span class="code-tag">&lt;/h3&gt;</span></div>
<div class="code-line">    <span class="code-tag">&lt;span&gt;</span><span class="code-text">€ 1.299</span><span class="code-tag">&lt;/span&gt;</span></div>
<div class="code-line">  <span class="code-tag">&lt;/li&gt;</span></div>
<div class="code-line">  <span class="code-tag">&lt;li</span> <span class="code-attr-name">class</span>=<span class="code-attr-val">"product-card"</span><span class="code-tag">&gt;</span></div>
<div class="code-line">    <span class="code-tag">&lt;div</span> <span class="code-attr-name">class</span>=<span class="code-attr-val">"image"</span><span class="code-tag">&gt;</span><span class="code-text">...</span><span class="code-tag">&lt;/div&gt;</span></div>
<div class="code-line">    <span class="code-tag">&lt;h3&gt;</span><span class="code-text">Smartphone X</span><span class="code-tag">&lt;/h3&gt;</span></div>
<div class="code-line">    <span class="code-tag">&lt;span&gt;</span><span class="code-text">€ 799</span><span class="code-tag">&lt;/span&gt;</span></div>
<div class="code-line">  <span class="code-tag">&lt;/li&gt;</span></div>
<div class="code-line"><span class="code-tag">&lt;/ul&gt;</span></div>
      `,
      info: `
        <div class="info-box-icon"><i class="fa-solid fa-circle-info"></i></div>
        <div class="info-box-text">
          <strong>Galleria Prodotti:</strong> Una lista non deve sembrare per forza un elenco puntato. Ogni prodotto in un e-commerce fa parte di una collezione omogenea di elementi, ed è quindi strutturato come una lista HTML. Usando CSS Grid, gli elementi si dispongono in una griglia moderna e accattivante.
        </div>
      `,
      initEvents: null
    },
    recipe: {
      preview: `
        <div class="lists-preview-classic">
          <div class="classic-demo-title">Ingredienti Torta</div>
          <ul class="classic-demo-list">
            <li class="classic-demo-item" data-item="1">
              <span class="classic-demo-checkbox"><i class="fa-solid fa-check"></i></span>
              <span>200g di Farina 00</span>
            </li>
            <li class="classic-demo-item" data-item="2">
              <span class="classic-demo-checkbox"><i class="fa-solid fa-check"></i></span>
              <span>150g di Zucchero</span>
            </li>
            <li class="classic-demo-item" data-item="3">
              <span class="classic-demo-checkbox"><i class="fa-solid fa-check"></i></span>
              <span>3 Uova fresche</span>
            </li>
          </ul>
        </div>
      `,
      code: `
<div class="code-line"><span class="code-tag">&lt;ul&gt;</span> <span class="code-comment">&lt;!-- Lista classica non ordinata --&gt;</span></div>
<div class="code-line">  <span class="code-tag">&lt;li&gt;</span><span class="code-text">200g di Farina 00</span><span class="code-tag">&lt;/li&gt;</span></div>
<div class="code-line">  <span class="code-tag">&lt;li&gt;</span><span class="code-text">150g di Zucchero</span><span class="code-tag">&lt;/li&gt;</span></div>
<div class="code-line">  <span class="code-tag">&lt;li&gt;</span><span class="code-text">3 Uova fresche</span><span class="code-tag">&lt;/li&gt;</span></div>
<div class="code-line"><span class="code-tag">&lt;/ul&gt;</span></div>
      `,
      info: `
        <div class="info-box-icon"><i class="fa-solid fa-circle-info"></i></div>
        <div class="info-box-text">
          <strong>Lista Classica:</strong> Il modo più comune in cui siamo abituati a pensare alle liste. L'HTML serve a definire che Farina, Zucchero e Uova sono elementi di un elenco. Qui l'interattività consente all'utente di depennare gli ingredienti pronti, simulando una vera check-list.
        </div>
      `,
      initEvents: (previewEl) => {
        const items = previewEl.querySelectorAll(".classic-demo-item");
        items.forEach(item => {
          item.addEventListener("click", () => {
            item.classList.toggle("is-checked");
          });
        });
      }
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

    // Load content
    previewContent.innerHTML = scenario.preview;
    codeContent.innerHTML = scenario.code.trim();
    infoBox.innerHTML = scenario.info.trim();

    // Init custom preview interactivity if present
    if (scenario.initEvents) {
      scenario.initEvents(previewContent);
    }
  }

  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      const name = btn.getAttribute("data-scenario");
      selectScenario(name);
    });
  });

  // Load default scenario
  selectScenario("menu");
}
