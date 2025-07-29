
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