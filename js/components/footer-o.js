document.addEventListener('DOMContentLoaded', function () {
    fetch('../../html/footer/footer.html')
        .then(response => response.text())
        .then(data => {
            document.body.insertAdjacentHTML('beforeend', data);
            const footer = document.querySelector('footer');
            if (footer) {
                console.log('Footer caricato con successo');
                adjustFooterPosition();
                window.addEventListener('resize', adjustFooterPosition);
                window.addEventListener('scroll', adjustFooterPosition);
                handleFooterLinks(footer);
            } else {
                console.error('Footer non trovato dopo il caricamento');
            }
        })
        .catch(error => console.error('Error loading footer:', error));
});

function adjustFooterPosition() {
    const footer = document.querySelector('footer');
    if (!footer) {
        console.error('Footer non trovato durante l\'aggiustamento');
        return;
    }

    const windowHeight = window.innerHeight;
    const bodyHeight = document.body.offsetHeight;
    const footerHeight = footer.offsetHeight;
    const marginBottom = windowHeight - (bodyHeight - footerHeight);

    console.log('Altezza finestra:', windowHeight);
    console.log('Altezza body:', bodyHeight);
    console.log('Altezza footer:', footerHeight);
    console.log('Margine inferiore calcolato:', marginBottom);

    if (marginBottom <= 0) {
        footer.style.position = 'static';
        footer.style.marginTop = '2rem';
        footer.style.marginBottom = '0';
        console.log('Footer impostato con margine superiore');
    } else {
        footer.style.position = 'fixed';
        footer.style.bottom = '0';
        footer.style.left = '0';
        footer.style.width = '100%';
        footer.style.marginTop = '0';
        footer.style.marginBottom = '0';
        console.log('Footer fissato in fondo alla pagina');
    }
}

function handleFooterLinks(footer) {
    const links = footer.querySelectorAll('a');
    links.forEach(link => {
        link.addEventListener('mouseover', function () {
            const href = this.getAttribute('href');
            if (href) {
                this.dataset.href = href;
                this.removeAttribute('href');
            }
        });

        link.addEventListener('mouseout', function () {
            const href = this.dataset.href;
            if (href) {
                this.setAttribute('href', href);
                delete this.dataset.href;
            }
        });

        link.addEventListener('click', function () {
            if (this.dataset.href) {
                window.location.href = this.dataset.href;
            }
        });
    });
}
