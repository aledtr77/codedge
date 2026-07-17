// Boots the static footer and applies the sticky-bottom adjust for pages
// shorter than the viewport.

(function () {
  'use strict';

  const READY_EVENT = 'codedge:footer-ready';
  function markReady() {
    if (window.__footerReady) return;
    window.__footerReady = true;
    window.dispatchEvent(new Event(READY_EVENT));
  }

  function initFooterLinks(container) {
    if (!container) return;
    container.querySelectorAll('a').forEach(a => {
      if (!a.getAttribute('href') && a.dataset && a.dataset.href) {
        a.setAttribute('href', a.dataset.href);
        delete a.dataset.href;
      }
      a.addEventListener('click', function (ev) {
        if (!this.getAttribute('href') && this.dataset && this.dataset.href) {
          ev.preventDefault();
          window.location.href = this.dataset.href;
        }
      });
    });
  }

  function initFooterAdjustment(footerEl) {
    if (!footerEl) return;

    let fixed = false;
    let oldPadding = '';
    let raf = null;

    function adjust() {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const winH = window.innerHeight || document.documentElement.clientHeight;
        const docH = Math.max(
          document.documentElement.scrollHeight,
          document.body.scrollHeight,
          document.documentElement.offsetHeight,
          document.body.offsetHeight
        );
        const footerH = footerEl.offsetHeight || 0;
        const shouldFix = docH <= winH;
        if (shouldFix && !fixed) {
          Object.assign(footerEl.style, {
            position: 'fixed',
            left: '0',
            bottom: '0',
            width: '100%',
            zIndex: '1000'
          });
          oldPadding = document.body.style.paddingBottom || '';
          document.body.style.paddingBottom = footerH + 'px';
          fixed = true;
        } else if (!shouldFix && fixed) {
          footerEl.style.position = '';
          footerEl.style.left = '';
          footerEl.style.bottom = '';
          footerEl.style.width = '';
          footerEl.style.zIndex = '';
          document.body.style.paddingBottom = oldPadding || '';
          fixed = false;
        }
      });
    }

    // Run immediately and again on load: delayed timeouts caused a visible
    // layout jump after first paint.
    setTimeout(adjust, 0);
    window.addEventListener('resize', adjust, { passive: true });
    window.addEventListener('orientationchange', adjust, { passive: true });
    window.addEventListener('load', adjust);
  }

  function loadFooter() {
    const footerEl = document.querySelector('footer');
    if (!footerEl) {
      markReady();
      return;
    }

    initFooterLinks(footerEl);
    initFooterAdjustment(footerEl);
    markReady();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadFooter);
  } else {
    loadFooter();
  }

})();
