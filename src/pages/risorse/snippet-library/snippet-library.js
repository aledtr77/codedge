// snippet-library.js (stable final)
// initSnippets(options) - stable class-only sidebar + robust copy feedback
export function initSnippets(options = {}) {
  const scrollOffset = options.scrollOffset || 0;

  /* ----------------------
     Robust copy-to-clipboard with feedback ("Copiato!")
     - finds code in .snippet-box / pre > code or nearby
     - uses navigator.clipboard when available, fallback textarea
     - preserves original button HTML & icon
     - accessible aria-live region
     ---------------------- */
  function findCodeElementFromButton(btn) {
    if (!btn) return null;

    // 1) If inside .snippet-box or .code-container, prefer that
    const ancestorPriority = ['.snippet-box', '.code-container', '.code'];
    for (const sel of ancestorPriority) {
      const anc = btn.closest(sel);
      if (anc) {
        const c = anc.querySelector('pre code, code');
        if (c) return c;
      }
    }

    // 2) Search siblings/nearby: look for nextElementSibling chain
    let el = btn;
    while (el && el.parentElement) {
      let sib = el.nextElementSibling;
      while (sib) {
        const c = (sib.querySelector && (sib.querySelector('pre code') || sib.querySelector('code')));
        if (c) return c;
        sib = sib.nextElementSibling;
      }
      el = el.parentElement;
    }

    // 3) last resort: search within parent
    if (btn.parentElement) {
      const fallback = btn.parentElement.querySelector('pre code, code');
      if (fallback) return fallback;
    }

    return null;
  }

  async function copyTextToClipboard(text) {
    if (!text) return false;
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (e) {
        // fall through to fallback
      }
    }
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      return true;
    } catch (e) {
      console.warn('copy fallback failed', e);
      return false;
    }
  }

  function copyCode(btnEl) {
    try {
      if (!btnEl) return;
      const btn = (btnEl && btnEl.closest) ? (btnEl.closest('.copy-btn') || btnEl.closest('button') || btnEl) : btnEl;
      if (!btn) return;
      const codeEl = findCodeElementFromButton(btn);
      if (!codeEl) {
        console.warn('copyCode: code element not found for button', btn);
        return;
      }
      const text = codeEl.innerText || codeEl.textContent || '';
      copyTextToClipboard(text).then((ok) => {
        // accessible live region
        let live = document.getElementById('__copy_live_region');
        if (!live) {
          live = document.createElement('div');
          live.id = '__copy_live_region';
          live.setAttribute('aria-live', 'polite');
          live.style.position = 'absolute';
          live.style.left = '-9999px';
          live.style.width = '1px';
          live.style.height = '1px';
          live.style.overflow = 'hidden';
          document.body.appendChild(live);
        }
        live.textContent = ok ? 'Copiato' : 'Copia fallita';

        // visual feedback (preserve original)
        if (!btn.dataset._origHtml) btn.dataset._origHtml = btn.innerHTML;
        const iconHTML = btn.querySelector('i') ? btn.querySelector('i').outerHTML : '';
        btn.innerHTML = iconHTML + ' Copiato!';
        btn.setAttribute('data-copied', 'true');

        setTimeout(() => {
          if (btn.dataset._origHtml) {
            btn.innerHTML = btn.dataset._origHtml;
            delete btn.dataset._origHtml;
          }
          btn.removeAttribute('data-copied');
          live.textContent = '';
        }, 1500);
      }).catch((err) => {
        console.warn('copyCode error', err);
      });
    } catch (err) {
      console.error('copyCode failed', err);
    }
  }
  // expose for inline onclick usage
  window.copyCode = copyCode;

  /* ----------------------
     Sidebar handler (CLASS-ONLY, the version that worked in console)
     - clones the toggle button to remove existing listeners
     - toggles classes only: button.active, container.show-sidebar, sidebar.active
     - saves scrollTop before close and restores after open
     - closes on link click / click outside
     ---------------------- */
  (function setupSidebarHandlerClassOnly() {
    const toggleSelector = '.sidebar-toggle';
    const containerSelector = '.snippet-container';
    const sidebarSelector = '.snippet-sidebar';

    const oldBtn = document.querySelector(toggleSelector);
    const container = document.querySelector(containerSelector);
    const sidebar = document.querySelector(sidebarSelector);

    if (!oldBtn || !container || !sidebar) {
      return; // nothing to do on pages without these
    }

    // clone to remove previous listeners
    const newBtn = oldBtn.cloneNode(true);
    oldBtn.parentNode.replaceChild(newBtn, oldBtn);

    let savedScrollTop = 0;

    function openSidebar() {
      newBtn.classList.add('active');
      container.classList.add('show-sidebar');
      sidebar.classList.add('active');
      setTimeout(() => {
        try { sidebar.scrollTop = savedScrollTop || 0; } catch (e) {}
      }, 40);
    }

    function closeSidebar() {
      try { savedScrollTop = sidebar.scrollTop || 0; } catch (e) {}
      newBtn.classList.remove('active');
      container.classList.remove('show-sidebar');
      sidebar.classList.remove('active');
    }

    newBtn.addEventListener('click', function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      if (newBtn.classList.contains('active')) closeSidebar();
      else openSidebar();
    }, { passive: false });

    // close when clicking a link or button inside sidebar
    sidebar.addEventListener('click', function (ev) {
      const t = ev.target.closest('a, button, .clickable-item');
      if (!t) return;
      closeSidebar();
    });

    // click outside closes
    document.addEventListener('click', function (ev) {
      if (!sidebar.contains(ev.target) && !newBtn.contains(ev.target) && container.classList.contains('show-sidebar')) {
        closeSidebar();
      }
    });

    // ensure toggle above everything
    newBtn.style.zIndex = newBtn.style.zIndex || '2600';

    // debug handle
    window.__snippetSidebarHandler = {
      remove() {
        try { newBtn.parentNode.replaceChild(oldBtn, newBtn); } catch (e) {}
        delete window.__snippetSidebarHandler;
        console.log('snippetSidebarHandler removed');
      }
    };

    console.log('snippet-library: class-only sidebar handler installed.');
  })();

  /* ----------------------
     Smooth anchor scrolling for clickable items
     ---------------------- */
  (function attachClickableItems() {
    const items = Array.from(document.querySelectorAll('.clickable-item'));
    if (!items.length) return;
    items.forEach(it => {
      it.addEventListener('click', (ev) => {
        const href = it.getAttribute('href') || it.dataset.target;
        if (!href) return;
        if (href.startsWith('#')) {
          ev.preventDefault();
          const el = document.querySelector(href);
          if (el) {
            const top = el.getBoundingClientRect().top + window.pageYOffset - (scrollOffset || 110);
            window.scrollTo({ top, behavior: 'smooth' });
          }
        }
      });
    });
  })();

  console.log('initSnippets: initialized');
}

// default export as function (keeps compatibility with existing imports)
export default initSnippets;
