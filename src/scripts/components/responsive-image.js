// Wraps <img> tags in <picture> and attaches AVIF/WebP srcsets.

export function setResponsiveImage(imgElement, { avifSrcset, webpSrcset, fallbackSrc }) {
  if (!imgElement) return;

  let picture = imgElement.parentElement;
  if (!picture || picture.tagName !== 'PICTURE') {
    picture = document.createElement('picture');
    imgElement.parentNode.insertBefore(picture, imgElement);
    picture.appendChild(imgElement);
  }

  picture.querySelectorAll('source').forEach(el => el.remove());

  if (avifSrcset) {
    const avifSource = document.createElement('source');
    avifSource.type = 'image/avif';
    avifSource.srcset = typeof avifSrcset === 'object' ? avifSrcset.srcset : avifSrcset;
    picture.insertBefore(avifSource, imgElement);
  }

  if (webpSrcset) {
    const webpSource = document.createElement('source');
    webpSource.type = 'image/webp';
    webpSource.srcset = typeof webpSrcset === 'object' ? webpSrcset.srcset : webpSrcset;
    picture.insertBefore(webpSource, imgElement);
  }

  imgElement.src = typeof fallbackSrc === 'object' ? fallbackSrc.src : fallbackSrc;
}
