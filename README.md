# CODEDGE

Source of **[codedge.it](https://codedge.it)** — a bilingual front-end reference site,
written by hand. No framework, no CMS, no bought theme underneath.

[![The codedge.it home page](.github/preview.jpg)](https://codedge.it)

## What's on it

- **Glossaries** — 418 entries across HTML, CSS and JavaScript, to open when a property
  or a method won't come back to you
- **Tutorials** — 12 practical guides: Git and GitHub, browser DevTools, accessibility,
  deployment, technical SEO, and the fundamentals of the three languages
- **Tools** — four utilities that run entirely in the browser: colour and gradient
  generators, an image compressor, a palette extractor
- **UI components** — four components with the full commented source, plus a snippet
  library ready to paste
- **Templates** — live demos of the portfolio projects, with a link to the Etsy shop

## How it's built

Plain HTML, CSS and JavaScript, assembled with Vite into a multi-page static site.
Built on GitHub Actions, deployed to Cloudflare Pages.

A few things worth pointing at, because they're the parts that took the work:

- **The tools never upload anything.** Compress an image and the file stays on your
  machine — there is no request that could carry it anywhere.
- **Accessibility is written in, not bolted on.** Components ship with their ARIA
  attributes and keyboard focus handling from the start.
- **The two languages are kept in sync by a script**, not by memory. It flags a page
  when it changes on one side only. English lives at the root, Italian under `/it/`.

## Run it locally

```bash
npm install
npm run dev      # dev server
npm run build    # static output in dist/
npm run preview  # serve the build
```

## Licence

Split, and the split matters — see [LICENSE](LICENSE).

**The code is MIT.** Take it, read it, reuse it.

**The content is not.** Glossary entries, tutorials, article text, images and the
Codedge brand are all rights reserved. Quote a passage with attribution and a link if
it's useful to you; don't republish the material in bulk somewhere else.

## Contact

**contatti.codedge@gmail.com** · [codedge.it/contact](https://codedge.it/contact/)
