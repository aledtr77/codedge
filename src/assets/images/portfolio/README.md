# Mirror Time portfolio artwork

`mirror-time-preview.svg` is an editable portrait adaptation of Mirror Time's
`store-assets/mirror-time-feature-graphic.svg`. It retains the app's vector mark
and Blue & Coral colours and embeds the unaltered
`store-assets/mirror-time-phone-timer.png` screenshot with illustrative data.
The source assets came from the sibling `01-mirror-time` project.

The site uses `public/images/portfolio/mirror-time-preview.webp` (960 × 1200).
Keep test status and release information in the translated HTML, not in the artwork.

Regenerate the WebP from the repository root with the installed Sharp dependency:

```bash
node --input-type=module <<'JS'
import sharp from 'sharp';
await sharp('src/assets/images/portfolio/mirror-time-preview.svg')
  .webp({ quality: 88 })
  .toFile('public/images/portfolio/mirror-time-preview.webp');
JS
```
