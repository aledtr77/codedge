function showTooltip(element, message, duration = 2000) {
    let tooltip = element.querySelector('.tooltiptext');
    
    if (!tooltip) {
        tooltip = document.createElement('span');
        tooltip.className = 'tooltiptext';
        element.appendChild(tooltip);
        element.classList.add('tooltip'); // Aggiungi la classe tooltip se non presente
    }

    tooltip.textContent = message;

    // Mostra il tooltip
    tooltip.style.visibility = 'visible';
    tooltip.style.opacity = '1';

    // Nascondi il tooltip dopo la durata specificata
    setTimeout(() => {
        tooltip.style.visibility = 'hidden';
        tooltip.style.opacity = '0';
    }, duration);
}
