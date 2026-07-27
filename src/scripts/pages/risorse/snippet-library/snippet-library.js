// initSnippets() - class-only sidebar + robust copy feedback & event delegation
import { scrollBehavior } from "@/scripts/utils/motion.js";
import { t } from "@/i18n/ui.js";

export function initSnippets() {
  // Copy-to-clipboard with visual and screen-reader feedback
  function findCodeElementFromButton(btn) {
    if (!btn) return null;

    const ancestorPriority = ['.snippet-box', '.code-container', '.code'];
    for (const sel of ancestorPriority) {
      const anc = btn.closest(sel);
      if (anc) {
        const c = anc.querySelector('pre code, code');
        if (c) return c;
      }
    }

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
        live.textContent = ok ? t('code.copied') : t('code.copyFailed');

        if (!btn.dataset._origHtml) btn.dataset._origHtml = btn.innerHTML;
        const iconHTML = btn.querySelector('i') ? btn.querySelector('i').outerHTML : '';
        btn.innerHTML = iconHTML + ' ' + t('code.copiedBang');
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

  // Keep --snippet-header-offset in sync with the real header height
  const header = document.querySelector('header');
  function syncHeaderOffset() {
    if (!header) return;
    const h = Math.ceil(header.getBoundingClientRect().height);
    document.body.style.setProperty('--snippet-header-offset', `${h}px`);
  }
  syncHeaderOffset();
  if ('ResizeObserver' in window && header) {
    new ResizeObserver(syncHeaderOffset).observe(header);
  }
  window.addEventListener('resize', syncHeaderOffset);

  // Category pills, code toggles, sidebar scrolling
  const pills = document.querySelectorAll('.category-pill');
  const sections = document.querySelectorAll('.snippet-section');
  const boxes = document.querySelectorAll('.snippet-box');
  const snippetMain = document.querySelector('.snippet-main');
  const mobileQuery = window.matchMedia('(max-width: 980px)');

  boxes.forEach(box => {
    const titleBox = box.querySelector('.title-box');
    if (!titleBox) return;

    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'toggle-code-btn';
    toggleBtn.setAttribute('aria-expanded', 'false');
    toggleBtn.innerHTML = `<i class="fas fa-code"></i> ${t('code.showCode')}`;
    // Before "Prova Live" when present: on mobile the row order stays
    // [Copia] [Vedi Codice] with the "Prova Live" bar last.
    const playBtn = titleBox.querySelector('.play-btn');
    if (playBtn) {
      titleBox.insertBefore(toggleBtn, playBtn);
    } else {
      titleBox.appendChild(toggleBtn);
    }
  });

  document.addEventListener('click', (ev) => {
    const copyBtn = ev.target.closest('.copy-btn');
    if (copyBtn) {
      ev.preventDefault();
      copyCode(copyBtn);
      return;
    }

    const pill = ev.target.closest('.category-pill');
    if (pill) {
      ev.preventDefault();
      pills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');

      const target = pill.dataset.target;
      sections.forEach(sec => {
        sec.style.display = sec.id === target ? '' : 'none';
      });
      return;
    }

    const toggleBtn = ev.target.closest('.toggle-code-btn');
    if (toggleBtn) {
      ev.preventDefault();
      const box = toggleBtn.closest('.snippet-box');
      if (box) {
        // An open playground hides the code wrapper: close it first so the toggle
        // does not fire on an invisible block. Closing goes through the title-box
        // "Chiudi Live" - snippet-box playgrounds have no close button of their own.
        const playground = box.querySelector('.code-playground');
        if (playground) {
          const playBtn = box.querySelector('.play-btn');
          if (playBtn) playBtn.click();
        }

        const isExpanded = box.classList.toggle('code-expanded');
        toggleBtn.setAttribute('aria-expanded', String(isExpanded));
        toggleBtn.classList.toggle('active', isExpanded);

        if (isExpanded) {
          toggleBtn.innerHTML = `<i class="fas fa-eye-slash"></i> ${t('code.hideCode')}`;
        } else {
          toggleBtn.innerHTML = `<i class="fas fa-code"></i> ${t('code.showCode')}`;
        }
      }
      return;
    }

    const it = ev.target.closest('.clickable-item');
    if (it) {
      const href = it.getAttribute('href') || it.dataset.target;
      if (href && href.startsWith('#')) {
        ev.preventDefault();
        const el = document.querySelector(href);
        if (el) {
          const isDesktop = window.innerWidth > 980;
          if (isDesktop && snippetMain) {
            const containerRect = snippetMain.getBoundingClientRect();
            const elRect = el.getBoundingClientRect();
            const gap = 16;
            snippetMain.scrollTo({
              top: snippetMain.scrollTop + (elRect.top - containerRect.top) - gap,
              behavior: scrollBehavior()
            });

            const items = document.querySelectorAll('.clickable-item');
            items.forEach(item => item.classList.remove('is-active'));
            it.classList.add('is-active');
          } else {
            el.scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
          }
        }
      }
      return;
    }
  });

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
          btn.innerHTML = `<i class="fas fa-code"></i> ${t('code.showCode')}`;
        }
      });
    } else {
      const activePill = Array.from(pills).find(p => p.classList.contains('active')) || pills[0];
      if (activePill) {
        pills.forEach(p => p.classList.remove('active'));
        activePill.classList.add('active');
        const target = activePill.dataset.target;
        sections.forEach(sec => {
          sec.style.display = sec.id === target ? '' : 'none';
        });
      }
    }
  }

  // These buttons are built here, so the language switch has no markup to copy
  // them from: they re-label themselves, each according to its own state.
  window.addEventListener('codedge:lang-changed', () => {
    document.querySelectorAll('.toggle-code-btn').forEach(btn => {
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.innerHTML = expanded
        ? `<i class="fas fa-eye-slash"></i> ${t('code.hideCode')}`
        : `<i class="fas fa-code"></i> ${t('code.showCode')}`;
    });
  });

  if (pills.length || boxes.length) {
    if (typeof mobileQuery.addEventListener === 'function') {
      mobileQuery.addEventListener('change', handleQueryChange);
    } else if (typeof mobileQuery.addListener === 'function') {
      mobileQuery.addListener(handleQueryChange);
    }
    
    if (mobileQuery.matches) {
      handleQueryChange();
    }
  }

  console.log('initSnippets: initialized');
}

export default initSnippets;
