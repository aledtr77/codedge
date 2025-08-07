// button-simple-effects.js
document.addEventListener('DOMContentLoaded', () => {
    const buttons = document.querySelectorAll('.button-simple');

    buttons.forEach(button => {
        button.addEventListener('mousedown', () => {
            button.classList.add('clicked');
        });

        button.addEventListener('mouseup', () => {
            button.classList.remove('clicked');
        });

        button.addEventListener('mouseleave', () => {
            button.classList.remove('clicked');
        });
    });
});