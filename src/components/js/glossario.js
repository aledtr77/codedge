// glossario.js (updated) - includes single authoritative hamburger handler

document.addEventListener("DOMContentLoaded", function () {
  const e = document.getElementById("search"),
    t = document.querySelectorAll(".clickable-item"),
    n = document.getElementsByTagName("details"),
    o = document.querySelector("header"),
    i = document.querySelector(".menu-icon"),
    a = document.querySelector(".nav-menu"),
    s = document.querySelector(".sidebar-toggle"),
    c = document.querySelector("aside"),
    r = document.querySelector(".main-content");
  let d = o ? o.offsetHeight : 0;
  function updateHeaderHeight() {
    d = o ? o.offsetHeight : 0;
  }
  window.addEventListener("resize", updateHeaderHeight);
  const l = new IntersectionObserver(
    (e) => {
      e.forEach((e) => {
        if (e.isIntersecting) {
          const t = e.target;
          t.hasAttribute("data-loaded") ||
            (t.setAttribute("data-loaded", "true"), l.unobserve(t));
        }
      });
    },
    { rootMargin: "200px" },
  );
  function handleSearch() {
    const t = e.value.toLowerCase().trim();
    let o = null,
      i = null;
    Array.from(n).forEach((e) => {
      const n = e.querySelector("summary"),
        a = n.textContent || n.innerText;
      ("" === t
        ? (e.open = !1)
        : e.hasAttribute("data-priority") && a.toLowerCase().startsWith(t)
          ? ((e.open = !0), i || (i = e))
          : a.toLowerCase().startsWith(t)
            ? ((e.open = !0), o || (o = e))
            : (e.open = !1),
        e.open &&
          !e.hasAttribute("data-loaded") &&
          e.setAttribute("data-loaded", "true"));
    });
    const a = i || o;
    a &&
      setTimeout(() => {
        updateHeaderHeight();
        const e = -d - 0,
          t = a.getBoundingClientRect().top + window.pageYOffset + e;
        window.scrollTo({ top: t, behavior: "smooth" });
      }, 100);
  }
  function closeMenu() {
    i && i.classList.remove("active");
    a && a.classList.remove("active");
    document.body.classList.remove("menu-open");
  }
  Array.from(n).forEach((e) => l.observe(e));
  if (e) e.addEventListener("input", handleSearch);
  if (t && t.forEach) {
    t.forEach((item) => {
      item.addEventListener("click", function () {
        const text = this.textContent.trim();
        if (e) {
          e.value = text;
          setTimeout(() => {
            handleSearch();
            const ev = new Event("input", { bubbles: true, cancelable: true });
            e.dispatchEvent(ev);
          }, 0);
        }
        if (window.innerWidth <= 768 && c && s) {
          c.classList.remove("active");
          s.classList.remove("active");
        }
      });
    });
  }

  window.copyCode = function (btn) {
    const codeEl = btn.closest(".code-container").querySelector("code");
    const ta = document.createElement("textarea");
    ta.value = codeEl.innerText;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);

    const original = btn.innerHTML;
    const iconHTML = btn.querySelector("i") ? btn.querySelector("i").outerHTML : "";
    btn.innerHTML = iconHTML + " Copiato!";
    setTimeout(() => {
      btn.innerHTML = original;
    }, 2000);
  };

  // Sidebar
  if (s && c && r) {
    s.addEventListener("click", function () {
      this.classList.toggle("active");
      c.classList.toggle("active");
      r.classList.toggle("aside-open");
    });

    document.addEventListener("click", function (ev) {
      if (!c.contains(ev.target) && !s.contains(ev.target) && c.classList.contains("active") && window.innerWidth <= 768) {
        s.classList.remove("active");
        c.classList.remove("active");
        r.classList.remove("aside-open");
      }
    });
  }

  let u = [];
  window.addEventListener("blur", function () {
    u = Array.from(n).map((e) => e.open);
  });
  window.addEventListener("focus", function () {
    updateHeaderHeight();
    Array.from(n).forEach((e, t) => {
      e.open = u[t] || false;
    });
  });
  window.addEventListener("beforeunload", function () {
    if (e) e.value = "";
  });
  setTimeout(handleSearch, 300);
});

const logos = document.querySelectorAll(".logo"),
  headings = document.querySelectorAll(".invisible-text, .resize-text");
function handleResize() {
  if (window.innerWidth < 1200) {
    logos.forEach((e) => (e.style.display = "none"));
    headings.forEach((e) => (e.style.display = "none"));
  } else {
    logos.forEach((e) => (e.style.display = ""));
    headings.forEach((e) => (e.style.display = ""));
  }
}
window.addEventListener("resize", handleResize);
handleResize();

/* --------------------------
   Replace hamburger handler - VERSIONE COMPLETAMENTE RIVISTA
   (risolve problemi di sincronizzazione e conflitti)
   -------------------------- */
(function replaceHamburgerHandler() {
  const toggleSelectors = ['.menu-icon', '.menu-toggle', '.menu-btn', '.nav-toggle', '.hamburger', '.menu-button', '#menuBtn'];
  const navSelectors = ['.nav-menu', '.navbar .nav-menu', '.navbar', 'nav', '#mainNav', '.main-nav'];

  const qFirst = (list) => list.map(s => document.querySelector(s)).find(Boolean) || null;
  const oldBtn = qFirst(toggleSelectors);
  const nav = qFirst(navSelectors);
  const header = document.querySelector('header');

  if (!oldBtn || !nav) {
    console.warn('replaceHamburgerHandler: bottone o nav non trovati', oldBtn, nav);
    return;
  }

  // CLONE per rimuovere tutti i listener esistenti sul bottone
  const newBtn = oldBtn.cloneNode(true);
  oldBtn.parentNode.replaceChild(newBtn, oldBtn);
  console.log('replaceHamburgerHandler: bottone clonato – listeners precedenti rimossi.');

  // helper visibility - versione più accurata
  function isNavVisible(el) {
    if (!el) return false;
    const cs = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    
    // Controlla se è effettivamente visibile (non solo display/visibility)
    const isDisplayed = cs.display !== 'none' && cs.visibility !== 'hidden';
    const hasOpacity = parseFloat(cs.opacity || '1') > 0;
    const hasSize = rect.height > 2 && rect.width > 2;
    const isInViewport = rect.top < window.innerHeight && rect.bottom > 0;
    
    return isDisplayed && hasOpacity && hasSize && isInViewport;
  }

  // store/restore inline
  function storeInline(el){
    if(!el) return {};
    const props = ['position','top','left','right','zIndex','display','maxHeight','overflowY','background','visibility','opacity','transform'];
    const out = {};
    props.forEach(p => out[p] = el.style[p] || '');
    return out;
  }
  function restoreInline(el, stored){
    if(!el || !stored) return;
    Object.keys(stored).forEach(k => el.style[k] = stored[k] || '');
  }

  const headerHeight = (header && header.offsetHeight) ? header.offsetHeight : 56;
  const mobileQuery = window.matchMedia('(max-width: 1180px)');
  let savedInline = null;

  function applyInlineFallbackShow() {
    if (!mobileQuery.matches) return;
    if (!savedInline) savedInline = storeInline(nav);
    nav.style.display = 'flex';
    nav.style.position = 'fixed';
    nav.style.top = headerHeight + 'px';
    nav.style.left = '0';
    nav.style.right = '0';
    nav.style.zIndex = '2200';
    nav.style.background = getComputedStyle(nav).backgroundColor || 'white';
    nav.style.maxHeight = 'calc(100vh - ' + headerHeight + 'px)';
    nav.style.overflowY = 'auto';
  }
  function clearInlineFallback() {
    if (savedInline) {
      restoreInline(nav, savedInline);
      savedInline = null;
    }
  }

  // Funzione per verificare lo stato REALE del menu (basata su visibilità, non solo classi)
  function getMenuRealState() {
    const hasActiveClass = nav.classList.contains('active') || nav.classList.contains('open') || nav.classList.contains('show');
    const isActuallyVisible = isNavVisible(nav);
    const btnActive = newBtn.classList.contains('active');
    
    console.log('Stato menu - Classi attive:', hasActiveClass, 'Visivamente visibile:', isActuallyVisible, 'Bottone attivo:', btnActive);
    
    return {
      hasActiveClass,
      isActuallyVisible,
      btnActive,
      shouldBeOpen: hasActiveClass && isActuallyVisible
    };
  }

  // Funzione di sincronizzazione completa
  function syncMenuState() {
    const state = getMenuRealState();
    
    // Se c'è una discrepanza, forza la sincronizzazione
    if (state.hasActiveClass !== state.btnActive || state.hasActiveClass !== state.isActuallyVisible) {
      console.warn('Discrepanza negli stati del menu - forzando sincronizzazione');
      
      // Determina lo stato corretto basandosi sulla visibilità effettiva
      const shouldBeOpen = state.isActuallyVisible;
      
      if (shouldBeOpen) {
        newBtn.classList.add('active');
        nav.classList.add('active','open','show');
        document.body.classList.add('menu-open');
        newBtn.setAttribute('aria-expanded','true');
      } else {
        newBtn.classList.remove('active');
        nav.classList.remove('active','open','show');
        document.body.classList.remove('menu-open');
        newBtn.setAttribute('aria-expanded','false');
        clearInlineFallback();
      }
      
      console.log('Stati sincronizzati - Menu:', shouldBeOpen ? 'aperto' : 'chiuso');
    }
  }

  // funzione di toggle unificata con controllo di sincronizzazione
  function doToggle(forceClose = false) {
    // Prima sincronizza lo stato attuale
    syncMenuState();
    
    const currentState = getMenuRealState();
    const willBeActive = forceClose ? false : !currentState.shouldBeOpen;
    
    console.log('doToggle chiamato - forceClose:', forceClose, 'stato attuale:', currentState.shouldBeOpen, 'sarà attivo:', willBeActive);
    
    // Applica lo stato una sola volta a TUTTI gli elementi
    if (willBeActive) {
      newBtn.classList.add('active');
      nav.classList.add('active','open','show');
      document.body.classList.add('menu-open');
      newBtn.setAttribute('aria-expanded','true');
      console.log('Menu aperto tramite doToggle');
    } else {
      newBtn.classList.remove('active');
      nav.classList.remove('active','open','show');
      document.body.classList.remove('menu-open');
      newBtn.setAttribute('aria-expanded','false');
      console.log('Menu chiuso tramite doToggle');
    }

    // Delay per lasciare finire eventuali transition
    setTimeout(() => {
      syncMenuState(); // Ri-sincronizza dopo le transizioni
      
      const finalState = getMenuRealState();
      if (finalState.shouldBeOpen) {
        if (!finalState.isActuallyVisible) {
          applyInlineFallbackShow();
          console.info('Fallback inline applicato (mobile).');
        } else {
          clearInlineFallback();
        }
      } else {
        clearInlineFallback();
        if (mobileQuery.matches && finalState.isActuallyVisible) {
          nav.style.display = 'none';
        }
      }
    }, 100);
  }

  // Attach single, authoritative handler
  newBtn.addEventListener('click', function(ev){
    ev.preventDefault();
    ev.stopPropagation();
    console.log('Click su hamburger - chiamando doToggle');
    doToggle();
  }, { passive: false });

  // chiudi nav se clicchi su un link dentro
  nav.addEventListener('click', function(ev){
    const a = ev.target.closest('a');
    if (a) {
      console.log('Click su link nel menu - chiudendo');
      doToggle(true);
    }
  });

  // Click fuori per chiudere - con controllo più robusto
  document.addEventListener('click', function(ev){
    // Aspetta un frame per permettere ad altri handler di eseguire
    setTimeout(() => {
      const state = getMenuRealState();
      
      if (state.hasActiveClass || state.isActuallyVisible) {
        // Verifica se il click è effettivamente fuori da menu e bottone
        if (!nav.contains(ev.target) && !newBtn.contains(ev.target)) {
          console.log('Click esterno rilevato - chiudendo menu');
          doToggle(true);
        }
      }
    }, 10);
  });

  // Observer per monitorare cambiamenti di visibilità del nav (per intercettare modifiche CSS esterne)
  const navObserver = new MutationObserver(function(mutations) {
    let shouldCheck = false;
    mutations.forEach(function(mutation) {
      if (mutation.type === 'attributes' && (mutation.attributeName === 'class' || mutation.attributeName === 'style')) {
        shouldCheck = true;
      }
    });
    
    if (shouldCheck) {
      setTimeout(syncMenuState, 50); // Delay per permettere alle transizioni CSS di completarsi
    }
  });
  
  // Osserva cambiamenti di classe e stile sul nav
  navObserver.observe(nav, {
    attributes: true,
    attributeFilter: ['class', 'style']
  });

  // Controllo periodico per sicurezza (ogni 2 secondi) - solo in development
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    setInterval(syncMenuState, 2000);
  }

  // garantiamo che l'hamburger resti visibile sopra il nav
  newBtn.style.zIndex = newBtn.style.zIndex || '2600';
  
  // Sincronizzazione iniziale
  setTimeout(syncMenuState, 100);
  
  console.log('replaceHamburgerHandler: nuovo handler con sincronizzazione avanzata installato.');
})();