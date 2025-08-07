// smooth-scroll.js
document.addEventListener('DOMContentLoaded', function () {
    const links = document.querySelectorAll('.nav-link');
    const offset = 160; // Altezza della navbar più un piccolo spazio extra

    links.forEach(link => {
        link.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            // AGGIORNATO: Ora controlla se siamo nella root
            const isHomePage = window.location.pathname.endsWith('/') || 
                              window.location.pathname.endsWith('/index.html') ||
                              window.location.pathname === '/';

            // Gestisci il link Home
            if (href === './index.html' || href === '/' || href === '#') {
                if (isHomePage) {
                    e.preventDefault();
                    window.scrollTo({
                        top: 0,
                        behavior: 'smooth'
                    });
                }
                return;
            }

            // Gestisci i link interni e quelli che puntano alla homepage con anchor
            if (href.includes('#')) {
                const [path, anchor] = href.split('#');
                
                if (isHomePage) {
                    e.preventDefault();
                    const targetElement = document.getElementById(anchor);
                    if (targetElement) {
                        const targetPosition = targetElement.offsetTop - offset;
                        window.scrollTo({
                            top: targetPosition,
                            behavior: 'smooth'
                        });
                    }
                } else if (path === '' || path === './' || path === './index.html') {
                    // AGGIORNATO: Se non siamo nella homepage, ma il link punta alla root con anchor
                    // Lascia che il link funzioni normalmente
                    return;
                }
            }

            // Per tutti gli altri link, lascia che funzionino normalmente
        });
    });

    // Gestisci lo scroll se c'è un anchor nell'URL
    if (window.location.hash) {
        setTimeout(() => {
            const targetElement = document.getElementById(window.location.hash.substring(1));
            if (targetElement) {
                const targetPosition = targetElement.offsetTop - offset;
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        }, 0);
    }
});