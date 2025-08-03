
document.addEventListener('click', (event) => {
    if (!navMenu.contains(event.target) && !menuIcon.contains(event.target) && navMenu.classList.contains('active')) {
        navMenu.classList.remove('active'); // Chiude il menu
        menuIcon.classList.remove('active'); // Ripristina l'icona del menu
    }
});

/* navbar js effectcs */
const menuIcon = document.querySelector('.menu-icon');
const navMenu = document.querySelector('.nav-menu');

menuIcon.addEventListener('click', () => {
    menuIcon.classList.toggle('active');
    navMenu.classList.toggle('active');
});

/* --- LOGO + H1 PER QUALSIASI NAVBAR --- */
const logos = document.querySelectorAll('.logo'); // può esserci più di un logo
const headings = document.querySelectorAll('.invisible-text, .resize-text'); // prende entrambe le classi

function handleResize() {
    if (window.innerWidth < 860) {
        logos.forEach(logo => logo.style.display = 'none');
        headings.forEach(h1 => h1.style.display = 'none');
    } else {
        logos.forEach(logo => logo.style.display = '');
        headings.forEach(h1 => h1.style.display = '');
    }
}

window.addEventListener('resize', handleResize);
handleResize();