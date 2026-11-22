// Classic script, loaded as an asset inside the opaque preview sandbox.
(() => {
  const message = document.currentScript.dataset.externalLinksOff;
  function reportHeight() {
    const body = document.body;
    const style = getComputedStyle(body);
    const height = Math.ceil(body.getBoundingClientRect().height + parseFloat(style.marginTop) + parseFloat(style.marginBottom));
    parent.postMessage({ type: 'playground:height', height }, '*');
  }
  if ('ResizeObserver' in window) new ResizeObserver(reportHeight).observe(document.body);
  window.addEventListener('load', reportHeight);

  let toastTimer;
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a');
    const href = link?.getAttribute('href');
    if (!href || href.startsWith('#')) return;
    event.preventDefault();
    let toast = document.getElementById('sandbox-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'sandbox-toast';
      toast.className = 'sandbox-toast';
      toast.setAttribute('role', 'status');
      toast.textContent = message;
      document.body.append(toast);
    }
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2500);
  }, true);

  // Let the parent know the preview is ready only after its click handler is
  // installed; browser checks and fast users can act as soon as this arrives.
  reportHeight();
  parent.postMessage({ type: 'playground:ready' }, '*');
})();
