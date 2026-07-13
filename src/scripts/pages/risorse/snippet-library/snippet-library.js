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

  document.addEventListener('click', (ev) => {
    const copyBtn = ev.target.closest('.copy-btn');
    if (!copyBtn) return;
    ev.preventDefault();
    copyCode(copyBtn);
  });

  /* ----------------------
     Mobile category pills filter & collapsible code blocks
     ---------------------- */
  (function setupMobileRedesign() {
    const pills = document.querySelectorAll('.category-pill');
    const sections = document.querySelectorAll('.snippet-section');
    const boxes = document.querySelectorAll('.snippet-box');
    const mobileQuery = window.matchMedia('(max-width: 980px)');

    if (!pills.length && !boxes.length) return;

    // 1) Category Pills Filter Logic
    pills.forEach(pill => {
      pill.addEventListener('click', () => {
        pills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');

        const target = pill.dataset.target;
        if (target === 'all') {
          sections.forEach(sec => {
            sec.style.display = '';
          });
        } else {
          sections.forEach(sec => {
            if (sec.id === target) {
              sec.style.display = '';
            } else {
              sec.style.display = 'none';
            }
          });
        }
      });
    });

    // 2) Collapsible Code Blocks Logic
    boxes.forEach(box => {
      const titleBox = box.querySelector('.title-box');
      if (!titleBox) return;

      const toggleBtn = document.createElement('button');
      toggleBtn.className = 'toggle-code-btn';
      toggleBtn.setAttribute('aria-expanded', 'false');
      toggleBtn.innerHTML = '<i class="fas fa-code"></i> Vedi Codice';

      toggleBtn.addEventListener('click', (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        
        const isExpanded = box.classList.toggle('code-expanded');
        toggleBtn.setAttribute('aria-expanded', String(isExpanded));
        toggleBtn.classList.toggle('active', isExpanded);
        
        if (isExpanded) {
          toggleBtn.innerHTML = '<i class="fas fa-eye-slash"></i> Nascondi';
        } else {
          toggleBtn.innerHTML = '<i class="fas fa-code"></i> Vedi Codice';
        }
      });

      titleBox.appendChild(toggleBtn);
    });

    // 3) Sync layout on query match
    function handleQueryChange() {
      if (!mobileQuery.matches) {
        sections.forEach(sec => {
          sec.style.display = '';
        });
        boxes.forEach(box => {
          box.classList.remove('code-expanded');
          const btn = box.querySelector('.toggle-code-btn');
          if (btn) {
            btn.classList.remove('active');
            btn.innerHTML = '<i class="fas fa-code"></i> Vedi Codice';
          }
        });
      } else {
        const allPill = Array.from(pills).find(p => p.dataset.target === 'all');
        if (allPill && !allPill.classList.contains('active')) {
          allPill.click();
        }
      }
    }

    if (typeof mobileQuery.addEventListener === 'function') {
      mobileQuery.addEventListener('change', handleQueryChange);
    } else if (typeof mobileQuery.addListener === 'function') {
      mobileQuery.addListener(handleQueryChange);
    }
    
    if (mobileQuery.matches) {
      handleQueryChange();
    }
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
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      });
    });
  })();

  console.log('initSnippets: initialized');
}

// default export as function (keeps compatibility with existing imports)
export default initSnippets;
