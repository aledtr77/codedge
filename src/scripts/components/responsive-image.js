// src/scripts/components/responsive-image.js
// Utility to dynamically wrap <img> tags in a <picture> element and attach AVIF/WebP srcsets.

export function setResponsiveImage(imgElement, { avifSrcset, webpSrcset, fallbackSrc }) {
  if (!imgElement) return;

  // Se l'elemento è già avvolto in un tag picture, lo usiamo, altrimenti lo creiamo
  let picture = imgElement.parentElement;
  if (!picture || picture.tagName !== 'PICTURE') {
    picture = document.createElement('picture');
    imgElement.parentNode.insertBefore(picture, imgElement);
    picture.appendChild(imgElement);
  }

  // Rimuoviamo eventuali source preesistenti per evitare duplicati
  picture.querySelectorAll('source').forEach(el => el.remove());

  // Crea la sorgente AVIF se fornita
  if (avifSrcset) {
    const avifSource = document.createElement('source');
    avifSource.type = 'image/avif';
    avifSource.srcset = typeof avifSrcset === 'object' ? avifSrcset.srcset : avifSrcset;
    picture.insertBefore(avifSource, imgElement);
  }

  // Crea la sorgente WebP se fornita
  if (webpSrcset) {
    const webpSource = document.createElement('source');
    webpSource.type = 'image/webp';
    webpSource.srcset = typeof webpSrcset === 'object' ? webpSrcset.srcset : webpSrcset;
    picture.insertBefore(webpSource, imgElement);
  }

  // Imposta la sorgente di fallback sull'immagine originale
  imgElement.src = typeof fallbackSrc === 'object' ? fallbackSrc.src : fallbackSrc;
}
