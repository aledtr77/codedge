// smooth-scroll.js
document.addEventListener('DOMContentLoaded', function () {
    const links = document.querySelectorAll('.nav-link');
    const offset = 160; // Altezza della navbar più un piccolo spazio extra

    links.forEach(link => {
        link.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            const isHomePage = window.location.pathname.endsWith('html/home/index.html') || window.location.pathname.endsWith('html/home/');

            // Gestisci il link Home
            if (href === 'html/home/index.html' || href === 'html/home/' || href === '#') {
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
                } else if (path === 'html/home/' || path === 'html/home/index.html') {
                    // Se non siamo nella homepage, lascia che il link funzioni normalmente
                    // Il browser gestirà lo scroll alla sezione dopo il caricamento della pagina
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
